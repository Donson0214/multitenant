import { Request, Response } from 'express';
import {
  createMetric,
  evaluateMetricValue,
  getMetric,
  listMetrics,
} from '@/modules/metrics/metric.service';
import { MetricDefinition } from '@/utils/metrics';
import { getDataset } from '@/modules/datasets/dataset.service';
import { metricCreateSchema, validateSchema } from '@/utils/validation';
import { logAudit } from '@/modules/audit-logs/auditLog.service';

export async function createMetricHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const parsed = validateSchema(metricCreateSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const dataset = await getDataset({
    tenantId: req.tenantId,
    id: parsed.data.datasetId,
  });
  if (!dataset) {
    return res.status(400).json({ message: 'Dataset not found' });
  }

  const metric = await createMetric({
    tenantId: req.tenantId,
    name: parsed.data.name,
    datasetId: parsed.data.datasetId,
    definition: parsed.data.definition as MetricDefinition,
  });

  if (req.user) {
    await logAudit({
      tenantId: req.tenantId,
      actorUserId: req.user.id,
      action: 'METRIC_CREATED',
      entityType: 'Metric',
      entityId: metric.id,
    });
  }

  res.status(201).json(metric);
}

export async function listMetricsHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const metrics = await listMetrics(req.tenantId);
  res.json(metrics);
}

export async function getMetricHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const metric = await getMetric({
    tenantId: req.tenantId,
    id: req.params.id,
  });

  if (!metric) {
    return res.status(404).json({ message: 'Metric not found' });
  }

  res.json(metric);
}

export async function getMetricValueHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const result = await evaluateMetricValue({
    tenantId: req.tenantId,
    metricId: req.params.id,
    range: req.query.range as string | undefined,
    start: req.query.start as string | undefined,
    end: req.query.end as string | undefined,
  });

  res.json({
    id: result.metric.id,
    name: result.metric.name,
    value: result.value,
    range: {
      start: result.start,
      end: result.end,
    },
  });
}
