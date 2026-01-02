import { AppError } from '@/lib/errors';
import { DataSourceConfig } from '@/modules/data-sources/ingestion.types';
import { getDataSource, getDataSourceById } from '@/modules/data-sources/dataSource.service';
import { getDataset } from '@/modules/datasets/dataset.service';
import { DatasetSchema } from '@/modules/datasets/dataset.types';
import { env } from '@/config/env';
import { getRequestContext } from '@/lib/requestContext';

export type RawRecord = Record<string, unknown>;

export function coerceValue(value: unknown, type: string) {
  if (value === null || value === undefined) {
    return value;
  }

  if (type === 'number') {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }

  if (type === 'boolean') {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }

  if (type === 'date') {
    const parsed = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }

  return value;
}

export function mapRecords(params: {
  rawRecords: RawRecord[];
  mapping: Record<string, string>;
  schema: DatasetSchema;
  dateFieldOverride?: string;
}) {
  const errors: string[] = [];
  const records: Array<{ eventTime: Date; data: Record<string, unknown> }> = [];
  const dateField = params.dateFieldOverride ?? params.schema.dateField;

  params.rawRecords.forEach((raw, index) => {
    const mapped: Record<string, unknown> = {};
    Object.entries(params.mapping).forEach(([sourceField, targetField]) => {
      mapped[targetField] = raw[sourceField];
    });

    Object.keys(params.schema.fields).forEach((fieldName) => {
      if (mapped[fieldName] === undefined && raw[fieldName] !== undefined) {
        mapped[fieldName] = raw[fieldName];
      }
    });

    Object.entries(params.schema.fields).forEach(([fieldName, fieldType]) => {
      mapped[fieldName] = coerceValue(mapped[fieldName], fieldType);
    });

    const dateValue = mapped[dateField];
    const eventTime =
      dateValue instanceof Date ? dateValue : new Date(String(dateValue));
    if (!dateValue || Number.isNaN(eventTime.getTime())) {
      errors.push(`Row ${index + 1}: invalid date field`);
      return;
    }

    records.push({ eventTime, data: mapped });
  });

  return { records, errors };
}

export async function fetchRestData(endpoint?: string) {
  if (!endpoint) {
    return [
      {
        date: new Date().toISOString(),
        value: Math.floor(Math.random() * 1000),
        category: 'simulated',
      },
    ];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.REST_POLL_TIMEOUT_MS);
  const response = await fetch(endpoint, { signal: controller.signal });
  clearTimeout(timeout);
  if (!response.ok) {
    throw new AppError('Failed to fetch REST data', 502);
  }

  const payload = await response.json();
  if (Array.isArray(payload)) {
    return payload as RawRecord[];
  }
  if (Array.isArray(payload?.records)) {
    return payload.records as RawRecord[];
  }

  return [payload as RawRecord];
}

export async function resolveDataSourceContext(params: {
  tenantId?: string;
  dataSourceId: string;
}) {
  const dataSource = params.tenantId
    ? await getDataSource({
        tenantId: params.tenantId,
        id: params.dataSourceId,
      })
    : await getDataSourceById(params.dataSourceId);
  if (!dataSource) {
    throw new AppError('Data source not found', 404);
  }

  const context = getRequestContext();
  if (context && !context.tenantId) {
    context.tenantId = dataSource.tenantId;
  }

  const config = dataSource.config as DataSourceConfig;
  const dataset = await getDataset({
    tenantId: dataSource.tenantId,
    id: config.datasetId,
  });
  if (!dataset) {
    throw new AppError('Dataset not found', 404);
  }

  return { dataSource, config, dataset };
}
