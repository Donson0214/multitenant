import { prisma } from '@/lib/prisma';
import { DatasetSchema } from '@/modules/datasets/dataset.types';

export async function createDataset(params: {
  tenantId: string;
  name: string;
  schema: DatasetSchema;
}) {
  return prisma.dataset.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      schema: params.schema,
    },
  });
}

export async function listDatasets(tenantId: string) {
  return prisma.dataset.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDataset(params: { tenantId: string; id: string }) {
  return prisma.dataset.findFirst({
    where: { tenantId: params.tenantId, id: params.id },
  });
}

export async function listDatasetRecords(params: {
  tenantId: string;
  datasetId: string;
  skip: number;
  take: number;
  start?: Date;
  end?: Date;
}) {
  return prisma.datasetRecord.findMany({
    where: {
      tenantId: params.tenantId,
      datasetId: params.datasetId,
      eventTime:
        params.start && params.end
          ? {
              gte: params.start,
              lte: params.end,
            }
          : undefined,
    },
    orderBy: { eventTime: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}
