import { Request, Response } from 'express';
import {
  createAutomationRule,
  getAutomationRule,
  listAutomationRules,
  listAutomationRuns,
  runAutomationRule,
} from '@/modules/automations/automation.service';
import { AutomationAction, AutomationCondition } from '@/modules/automations/automation.types';
import { getMetric } from '@/modules/metrics/metric.service';
import { getPagination } from '@/lib/pagination';
import { logAudit } from '@/modules/audit-logs/auditLog.service';
import { automationCreateSchema, validateSchema } from '@/utils/validation';

export async function createAutomationHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const parsed = validateSchema(automationCreateSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const metric = await getMetric({
    tenantId: req.tenantId,
    id: parsed.data.metricId,
  });
  if (!metric) {
    return res.status(400).json({ message: 'Metric not found' });
  }

  const rule = await createAutomationRule({
    tenantId: req.tenantId,
    name: parsed.data.name,
    metricId: parsed.data.metricId,
    condition: parsed.data.condition as AutomationCondition,
    action: parsed.data.action as AutomationAction,
  });

  if (req.user) {
    await logAudit({
      tenantId: req.tenantId,
      actorUserId: req.user.id,
      action: 'AUTOMATION_CREATED',
      entityType: 'AutomationRule',
      entityId: rule.id,
    });
  }

  res.status(201).json(rule);
}

export async function listAutomationsHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const rules = await listAutomationRules(req.tenantId);
  res.json(rules);
}

export async function getAutomationHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const rule = await getAutomationRule({
    tenantId: req.tenantId,
    id: req.params.id,
  });
  if (!rule) {
    return res.status(404).json({ message: 'Automation rule not found' });
  }

  res.json(rule);
}

export async function runAutomationHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const result = await runAutomationRule({
    tenantId: req.tenantId,
    ruleId: req.params.id,
  });

  res.json(result);
}

export async function listAutomationRunsHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const { skip, take, page, pageSize } = getPagination({
    page: req.query.page as string,
    pageSize: req.query.pageSize as string,
  });

  const runs = await listAutomationRuns({
    tenantId: req.tenantId,
    skip,
    take,
    ruleId: req.query.ruleId as string | undefined,
  });

  res.json({ data: runs, page, pageSize });
}
