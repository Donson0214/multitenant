import { prisma } from '@/lib/prisma';
import { MetricDefinition, evaluateMetric } from '@/utils/metrics';
import { resolveDateRange } from '@/lib/time';
import { AppError } from '@/lib/errors';

export async function createMetric(params: {
  tenantId: string;
  name: string;
  datasetId: string;
  definition: MetricDefinition;
}) {
  return prisma.metric.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      datasetId: params.datasetId,
      definition: params.definition,
    },
  });
}

export async function listMetrics(tenantId: string) {
  return prisma.metric.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMetric(params: { tenantId: string; id: string }) {
  return prisma.metric.findFirst({
    where: { tenantId: params.tenantId, id: params.id },
  });
}

export async function evaluateMetricValue(params: {
  tenantId: string;
  metricId: string;
  range?: string;
  start?: string;
  end?: string;
}) {
  const metric = await getMetric({
    tenantId: params.tenantId,
    id: params.metricId,
  });

  if (!metric) {
    throw new AppError('Metric not found', 404);
  }

  const { start, end } = resolveDateRange({
    range: params.range,
    start: params.start,
    end: params.end,
  });

  const records = await prisma.datasetRecord.findMany({
    where: {
      tenantId: params.tenantId,
      datasetId: metric.datasetId,
      eventTime: {
        gte: start,
        lte: end,
      },
    },
    select: {
      data: true,
      eventTime: true,
    },
  });

  const value = evaluateMetric(metric.definition as MetricDefinition, records);

  return { metric, value, start, end };
}
