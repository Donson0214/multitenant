import { prisma } from '@/lib/prisma';
import { DataSourceType, IngestionStatus } from '@prisma/client';
import { DataSourceConfig } from '@/modules/data-sources/ingestion.types';
import { AppError } from '@/lib/errors';

export async function createDataSource(params: {
  tenantId: string;
  name: string;
  type: DataSourceType;
  config: DataSourceConfig;
}) {
  return prisma.dataSource.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      type: params.type,
      config: params.config,
    },
  });
}

export async function listDataSources(tenantId: string) {
  return prisma.dataSource.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDataSource(params: { tenantId: string; id: string }) {
  return prisma.dataSource.findFirst({
    where: { tenantId: params.tenantId, id: params.id },
  });
}

export async function getDataSourceById(id: string) {
  return prisma.dataSource.findUnique({
    where: { id },
  });
}

export async function updateDataSource(params: {
  tenantId: string;
  id: string;
  name?: string;
  config?: DataSourceConfig;
}) {
  const dataSource = await getDataSource({
    tenantId: params.tenantId,
    id: params.id,
  });
  if (!dataSource) {
    throw new AppError('Data source not found', 404);
  }

  await prisma.dataSource.updateMany({
    where: { id: dataSource.id, tenantId: params.tenantId },
    data: {
      name: params.name ?? dataSource.name,
      config: params.config ?? (dataSource.config as DataSourceConfig),
    },
  });

  return getDataSource({ tenantId: params.tenantId, id: dataSource.id });
}

export async function deleteDataSource(params: {
  tenantId: string;
  id: string;
}) {
  const dataSource = await getDataSource({
    tenantId: params.tenantId,
    id: params.id,
  });
  if (!dataSource) {
    throw new AppError('Data source not found', 404);
  }

  const result = await prisma.dataSource.deleteMany({
    where: { id: dataSource.id, tenantId: params.tenantId },
  });
  if (!result.count) {
    throw new AppError('Data source not found', 404);
  }
}

export async function createIngestionLog(params: {
  tenantId: string;
  dataSourceId: string;
  status: IngestionStatus;
  message?: string;
  rawPayload?: Record<string, unknown>;
}) {
  return prisma.ingestionLog.create({
    data: {
      tenantId: params.tenantId,
      dataSourceId: params.dataSourceId,
      status: params.status,
      message: params.message,
      rawPayload: params.rawPayload,
    },
  });
}

export async function listIngestionLogs(params: {
  tenantId: string;
  dataSourceId?: string;
  status?: IngestionStatus;
  skip: number;
  take: number;
}) {
  return prisma.ingestionLog.findMany({
    where: {
      tenantId: params.tenantId,
      dataSourceId: params.dataSourceId,
      status: params.status,
    },
    orderBy: { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}

export async function storeDatasetRecords(params: {
  tenantId: string;
  datasetId: string;
  records: Array<{ eventTime: Date; data: Record<string, unknown> }>;
}) {
  if (!params.records.length) {
    return { count: 0 };
  }

  return prisma.datasetRecord.createMany({
    data: params.records.map((record) => ({
      tenantId: params.tenantId,
      datasetId: params.datasetId,
      eventTime: record.eventTime,
      data: record.data,
    })),
  });
}
