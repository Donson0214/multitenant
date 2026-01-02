import { Request, Response } from 'express';
import {
  createDataset,
  getDataset,
  listDatasetRecords,
  listDatasets,
} from '@/modules/datasets/dataset.service';
import { DatasetSchema } from '@/modules/datasets/dataset.types';
import { getPagination } from '@/lib/pagination';
import { resolveDateRange } from '@/lib/time';
import { datasetCreateSchema, validateSchema } from '@/utils/validation';
import { logAudit } from '@/modules/audit-logs/auditLog.service';

export async function createDatasetHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const parsed = validateSchema(datasetCreateSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const dataset = await createDataset({
    tenantId: req.tenantId,
    name: parsed.data.name,
    schema: parsed.data.schema as DatasetSchema,
  });

  if (req.user) {
    await logAudit({
      tenantId: req.tenantId,
      actorUserId: req.user.id,
      action: 'DATASET_CREATED',
      entityType: 'Dataset',
      entityId: dataset.id,
    });
  }

  res.status(201).json(dataset);
}

export async function listDatasetsHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const datasets = await listDatasets(req.tenantId);
  res.json(datasets);
}

export async function getDatasetHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const dataset = await getDataset({ tenantId: req.tenantId, id: req.params.id });
  if (!dataset) {
    return res.status(404).json({ message: 'Dataset not found' });
  }

  res.json(dataset);
}

export async function listDatasetRecordsHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const { skip, take, page, pageSize } = getPagination({
    page: req.query.page as string,
    pageSize: req.query.pageSize as string,
  });

  const range = resolveDateRange({
    range: req.query.range as string | undefined,
    start: req.query.start as string | undefined,
    end: req.query.end as string | undefined,
  });

  const records = await listDatasetRecords({
    tenantId: req.tenantId,
    datasetId: req.params.id,
    skip,
    take,
    start: range.start,
    end: range.end,
  });

  res.json({ data: records, page, pageSize });
}
