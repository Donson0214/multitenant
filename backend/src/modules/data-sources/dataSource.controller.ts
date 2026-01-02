import { Request, Response } from 'express';
import { DataSourceType } from '@prisma/client';
import {
  createDataSource,
  deleteDataSource,
  getDataSource,
  listDataSources,
  updateDataSource,
} from '@/modules/data-sources/dataSource.service';
import { DataSourceConfig } from '@/modules/data-sources/ingestion.types';
import { getDataset } from '@/modules/datasets/dataset.service';
import {
  dataSourceCreateSchema,
  dataSourceUpdateSchema,
  validateSchema,
} from '@/utils/validation';
import { scheduleEtlForDataSource, removeEtlSchedule } from '@/queues/scheduler';
import { logAudit } from '@/modules/audit-logs/auditLog.service';

export async function createDataSourceHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const parsed = validateSchema(dataSourceCreateSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const dataset = await getDataset({
    tenantId: req.tenantId,
    id: parsed.data.config.datasetId,
  });
  if (!dataset) {
    return res.status(400).json({ message: 'Dataset not found' });
  }

  const dataSource = await createDataSource({
    tenantId: req.tenantId,
    name: parsed.data.name,
    type: parsed.data.type as DataSourceType,
    config: parsed.data.config as DataSourceConfig,
  });

  if (dataSource.type === DataSourceType.REST_POLL) {
    await scheduleEtlForDataSource({
      tenantId: dataSource.tenantId,
      dataSourceId: dataSource.id,
    });
  }

  if (req.user) {
    await logAudit({
      tenantId: req.tenantId,
      actorUserId: req.user.id,
      action: 'DATA_SOURCE_CREATED',
      entityType: 'DataSource',
      entityId: dataSource.id,
    });
  }

  res.status(201).json(dataSource);
}

export async function listDataSourcesHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const dataSources = await listDataSources(req.tenantId);
  res.json(dataSources);
}

export async function getDataSourceHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const dataSource = await getDataSource({
    tenantId: req.tenantId,
    id: req.params.id,
  });

  if (!dataSource) {
    return res.status(404).json({ message: 'Data source not found' });
  }

  res.json(dataSource);
}

export async function updateDataSourceHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const parsed = validateSchema(dataSourceUpdateSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }
  const nextConfig = parsed.data.config as DataSourceConfig | undefined;

  if (nextConfig?.datasetId) {
    const dataset = await getDataset({
      tenantId: req.tenantId,
      id: nextConfig.datasetId,
    });
    if (!dataset) {
      return res.status(400).json({ message: 'Dataset not found' });
    }
  }

  const dataSource = await updateDataSource({
    tenantId: req.tenantId,
    id: req.params.id,
    name: parsed.data.name,
    config: nextConfig,
  });

  if (dataSource.type === DataSourceType.REST_POLL) {
    await scheduleEtlForDataSource({
      tenantId: dataSource.tenantId,
      dataSourceId: dataSource.id,
    });
  }

  if (req.user) {
    await logAudit({
      tenantId: req.tenantId,
      actorUserId: req.user.id,
      action: 'DATA_SOURCE_UPDATED',
      entityType: 'DataSource',
      entityId: dataSource.id,
    });
  }

  res.json(dataSource);
}

export async function deleteDataSourceHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  await removeEtlSchedule(req.params.id);
  await deleteDataSource({ tenantId: req.tenantId, id: req.params.id });
  if (req.user) {
    await logAudit({
      tenantId: req.tenantId,
      actorUserId: req.user.id,
      action: 'DATA_SOURCE_DELETED',
      entityType: 'DataSource',
      entityId: req.params.id,
    });
  }
  res.json({ success: true });
}
