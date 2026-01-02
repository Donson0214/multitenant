import { Request, Response } from 'express';
import crypto from 'crypto';
import { DataSourceType, IngestionStatus } from '@prisma/client';
import {
  createIngestionLog,
  listIngestionLogs,
  storeDatasetRecords,
} from '@/modules/data-sources/dataSource.service';
import {
  fetchRestData,
  mapRecords,
  resolveDataSourceContext,
  RawRecord,
} from '@/modules/data-sources/ingestion.service';
import { DatasetSchema } from '@/modules/datasets/dataset.types';
import { getPagination } from '@/lib/pagination';
import { env } from '@/config/env';
import { redis } from '@/config/redis';

function parseCsv(content: string): RawRecord[] {
  const lines = content.trim().split(/\r?\n/);
  if (!lines.length) {
    return [];
  }

  const headers = lines[0].split(',').map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    const record: RawRecord = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    return record;
  });
}

function getHeader(req: Request, name: string) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function timingSafeEqualString(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function resolveTimestampMs(rawValue: string | undefined) {
  if (!rawValue) {
    return null;
  }
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (numeric > 1e12) {
    return numeric;
  }
  return numeric * 1000;
}


export async function ingestDataSource(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const { dataSource, config, dataset } = await resolveDataSourceContext({
    tenantId: req.tenantId,
    dataSourceId: req.params.id,
  });

  if (dataSource.type !== DataSourceType.CSV) {
    return res.status(400).json({ message: 'Not a CSV data source' });
  }

  let rawRecords: RawRecord[] = [];

  if (req.is('text/csv') && typeof req.body === 'string') {
    rawRecords = parseCsv(req.body);
  } else if (Array.isArray(req.body?.records)) {
    rawRecords = req.body.records as RawRecord[];
  } else if (typeof req.body?.csv === 'string') {
    rawRecords = parseCsv(req.body.csv);
  }

  if (!rawRecords.length) {
    return res.status(400).json({ message: 'No records provided' });
  }

  const mappingResult = mapRecords({
    rawRecords,
    mapping: config.fieldMapping ?? {},
    schema: dataset.schema as DatasetSchema,
    dateFieldOverride: config.dateField,
  });

  const writeResult = await storeDatasetRecords({
    tenantId: req.tenantId,
    datasetId: dataset.id,
    records: mappingResult.records,
  });

  const status =
    mappingResult.records.length > 0
      ? IngestionStatus.SUCCESS
      : IngestionStatus.FAILED;

  await createIngestionLog({
    tenantId: req.tenantId,
    dataSourceId: dataSource.id,
    status,
    message: mappingResult.errors.length
      ? 'Partial ingestion with errors'
      : 'Ingestion complete',
    rawPayload: {
      total: rawRecords.length,
      ingested: writeResult.count,
      errors: mappingResult.errors,
    },
  });

  res.json({
    ingested: writeResult.count,
    errors: mappingResult.errors,
  });
}

export async function ingestWebhook(req: Request, res: Response) {
  const { dataSource, config, dataset } = await resolveDataSourceContext({
    dataSourceId: req.params.id,
  });
  if (req.context) {
    req.context.tenantId = dataSource.tenantId;
  }

  if (dataSource.type !== DataSourceType.WEBHOOK) {
    return res.status(400).json({ message: 'Not a webhook data source' });
  }

  const webhookId = getHeader(req, 'x-webhook-id');
  if (!webhookId) {
    return res.status(400).json({ message: 'Missing webhook id' });
  }

  const timestampRaw = getHeader(req, 'x-webhook-timestamp');
  const timestampMs = resolveTimestampMs(timestampRaw);
  if (!timestampMs) {
    return res.status(400).json({ message: 'Missing webhook timestamp' });
  }

  const toleranceMs = env.WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS * 1000;
  if (Math.abs(Date.now() - timestampMs) > toleranceMs) {
    return res.status(401).json({ message: 'Stale webhook request' });
  }

  const replayKey = `webhook:${dataSource.id}:${webhookId}`;
  const setResult = await redis.set(
    replayKey,
    '1',
    'NX',
    'EX',
    env.WEBHOOK_REPLAY_TTL_SECONDS
  );
  if (!setResult) {
    return res.status(409).json({ message: 'Duplicate webhook request' });
  }

  if (config.webhookSecret) {
    const signature = getHeader(req, 'x-webhook-signature');
    if (!signature) {
      return res.status(401).json({ message: 'Missing webhook signature' });
    }
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body ?? {});
    const payload = `${timestampRaw}.${rawBody}`;
    const expected = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(payload)
      .digest('hex');
    if (!timingSafeEqualString(expected, signature)) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }
  }

  const rawRecords = Array.isArray(req.body?.records)
    ? (req.body.records as RawRecord[])
    : [req.body as RawRecord];

  const mappingResult = mapRecords({
    rawRecords,
    mapping: config.fieldMapping ?? {},
    schema: dataset.schema as DatasetSchema,
    dateFieldOverride: config.dateField,
  });

  const writeResult = await storeDatasetRecords({
    tenantId: dataSource.tenantId,
    datasetId: dataset.id,
    records: mappingResult.records,
  });

  const status =
    mappingResult.records.length > 0
      ? IngestionStatus.SUCCESS
      : IngestionStatus.FAILED;

  await createIngestionLog({
    tenantId: dataSource.tenantId,
    dataSourceId: dataSource.id,
    status,
    message: mappingResult.errors.length
      ? 'Webhook ingestion with errors'
      : 'Webhook ingestion complete',
    rawPayload: {
      total: rawRecords.length,
      ingested: writeResult.count,
      errors: mappingResult.errors,
    },
  });

  res.json({ ingested: writeResult.count, errors: mappingResult.errors });
}

export async function listIngestionLogsHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const { skip, take, page, pageSize } = getPagination({
    page: req.query.page as string,
    pageSize: req.query.pageSize as string,
  });

  const status = req.query.status as IngestionStatus | undefined;
  const dataSourceId = req.query.dataSourceId as string | undefined;

  const logs = await listIngestionLogs({
    tenantId: req.tenantId,
    dataSourceId,
    status,
    skip,
    take,
  });

  res.json({ data: logs, page, pageSize });
}

export async function pollDataSource(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const { dataSource, config, dataset } = await resolveDataSourceContext({
    tenantId: req.tenantId,
    dataSourceId: req.params.id,
  });

  if (dataSource.type !== DataSourceType.REST_POLL) {
    return res.status(400).json({ message: 'Not a REST polling data source' });
  }

  const rawRecords = await fetchRestData(config.restEndpoint);
  const mappingResult = mapRecords({
    rawRecords,
    mapping: config.fieldMapping ?? {},
    schema: dataset.schema as DatasetSchema,
    dateFieldOverride: config.dateField,
  });

  const writeResult = await storeDatasetRecords({
    tenantId: dataSource.tenantId,
    datasetId: dataset.id,
    records: mappingResult.records,
  });

  const status =
    mappingResult.records.length > 0
      ? IngestionStatus.SUCCESS
      : IngestionStatus.FAILED;

  await createIngestionLog({
    tenantId: dataSource.tenantId,
    dataSourceId: dataSource.id,
    status,
    message: mappingResult.errors.length
      ? 'REST poll with errors'
      : 'REST poll complete',
    rawPayload: {
      total: rawRecords.length,
      ingested: writeResult.count,
      errors: mappingResult.errors,
    },
  });

  res.json({ ingested: writeResult.count, errors: mappingResult.errors });
}
