import { prisma } from '@/lib/prisma';
import { AutomationAction, AutomationCondition } from '@/modules/automations/automation.types';
import { AutomationRunStatus, AutomationStatus, NotificationType, Prisma } from '@prisma/client';
import { evaluateCondition } from '@/modules/automations/automation.evaluator';
import { evaluateMetricValue } from '@/modules/metrics/metric.service';
import { AppError } from '@/lib/errors';
import { createNotification } from '@/modules/notifications/notification.service';
import { env } from '@/config/env';

export async function createAutomationRule(params: {
  tenantId: string;
  name: string;
  metricId: string;
  condition: AutomationCondition;
  action: AutomationAction;
  status?: AutomationStatus;
}) {
  return prisma.automationRule.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      metricId: params.metricId,
      condition: params.condition,
      action: params.action,
      status: params.status ?? AutomationStatus.ENABLED,
    },
  });
}

export async function listAutomationRules(tenantId: string) {
  return prisma.automationRule.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAutomationRule(params: { tenantId: string; id: string }) {
  return prisma.automationRule.findFirst({
    where: { tenantId: params.tenantId, id: params.id },
  });
}

async function notifyTenantUsers(params: {
  tenantId: string;
  type: NotificationType;
  title: string;
  body: string;
}) {
  const memberships = await prisma.membership.findMany({
    where: { tenantId: params.tenantId },
  });

  await Promise.all(
    memberships.map((membership) =>
      createNotification({
        tenantId: params.tenantId,
        userId: membership.userId,
        type: params.type,
        title: params.title,
        body: params.body,
      })
    )
  );
}

export async function runAutomationRule(params: {
  tenantId: string;
  ruleId: string;
}) {
  const rule = await getAutomationRule({
    tenantId: params.tenantId,
    id: params.ruleId,
  });

  if (!rule) {
    throw new AppError('Automation rule not found', 404);
  }

  const condition = rule.condition as AutomationCondition;
  const action = rule.action as AutomationAction;

  const intervalMs = env.AUTOMATION_EVAL_INTERVAL_MS;
  const windowStart = new Date(Math.floor(Date.now() / intervalMs) * intervalMs);
  const windowEnd = new Date(windowStart.getTime() + intervalMs);

  const existingRun = await prisma.automationRun.findFirst({
    where: {
      tenantId: params.tenantId,
      ruleId: rule.id,
      windowStart,
    },
  });
  if (existingRun) {
    const triggered =
      typeof existingRun.result === 'object' &&
      existingRun.result !== null &&
      'triggered' in existingRun.result
        ? Boolean((existingRun.result as { triggered?: boolean }).triggered)
        : false;
    return { run: existingRun, triggered, skipped: true };
  }

  const metricResult = await evaluateMetricValue({
    tenantId: params.tenantId,
    metricId: rule.metricId,
    range: condition.range,
    start: condition.start,
    end: condition.end,
  });

  const triggered = evaluateCondition(metricResult.value, condition);
  let runStatus: AutomationRunStatus = AutomationRunStatus.SUCCESS;
  let errorMessage: string | undefined;

  let run;
  try {
    run = await prisma.automationRun.create({
      data: {
        tenantId: params.tenantId,
        ruleId: rule.id,
        status: AutomationRunStatus.SUCCESS,
        windowStart,
        windowEnd,
        result: {
          triggered,
          value: metricResult.value,
          operator: condition.operator,
          threshold: condition.threshold,
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.automationRun.findFirst({
        where: {
          tenantId: params.tenantId,
          ruleId: rule.id,
          windowStart,
        },
      });
      if (existing) {
        return { run: existing, triggered, skipped: true };
      }
    }
    throw error;
  }

  if (triggered) {
    if (action.type === 'IN_APP') {
      await notifyTenantUsers({
        tenantId: params.tenantId,
        type: NotificationType.IN_APP,
        title: action.title ?? rule.name,
        body: action.message ?? `Rule triggered with value ${metricResult.value}`,
      });
    } else if (action.type === 'EMAIL') {
      await notifyTenantUsers({
        tenantId: params.tenantId,
        type: NotificationType.EMAIL,
        title: action.title ?? rule.name,
        body: action.message ?? `Email alert for value ${metricResult.value}`,
      });
    } else if (action.type === 'WEBHOOK') {
      if (!action.target) {
        runStatus = AutomationRunStatus.FAILED;
        errorMessage = 'Webhook target missing';
      } else {
        try {
          await fetch(action.target, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              ruleId: rule.id,
              metricValue: metricResult.value,
              triggered,
            }),
          });
        } catch (error) {
          runStatus = AutomationRunStatus.FAILED;
          errorMessage = error instanceof Error ? error.message : String(error);
        }
      }
    }
  }

  if (runStatus === AutomationRunStatus.FAILED) {
    await prisma.automationRun.updateMany({
      where: { id: run.id, tenantId: params.tenantId },
      data: {
        status: runStatus,
        error: errorMessage,
      },
    });
    run = { ...run, status: runStatus, error: errorMessage };
  }

  return { run, triggered };
}

export async function runAutomationRulesForTenant(tenantId: string) {
  const rules = await prisma.automationRule.findMany({
    where: { tenantId, status: AutomationStatus.ENABLED },
  });

  const results = [];
  for (const rule of rules) {
    const result = await runAutomationRule({ tenantId, ruleId: rule.id });
    results.push(result);
  }

  return results;
}

export async function listAutomationRuns(params: {
  tenantId: string;
  skip: number;
  take: number;
  ruleId?: string;
}) {
  return prisma.automationRun.findMany({
    where: {
      tenantId: params.tenantId,
      ruleId: params.ruleId,
    },
    orderBy: { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}
