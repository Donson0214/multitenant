import { Request, Response } from 'express';
import {
  provisionTenant,
  getCurrentTenant,
} from './tenant.service';
import { logAudit } from '@/modules/audit-logs/auditLog.service';
import { tenantCreateSchema, validateSchema } from '@/utils/validation';
import { scheduleAutomationForTenant } from '@/queues/scheduler';

/**
 * Create a new tenant (onboarding)
 */
export async function createTenant(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }

  const parsed = validateSchema(tenantCreateSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const tenant = await provisionTenant({
    tenantName: parsed.data.name,
    userId: req.user.id,
  });

  await logAudit({
    tenantId: tenant.id,
    actorUserId: req.user.id,
    action: 'TENANT_CREATED',
    entityType: 'Tenant',
    entityId: tenant.id,
  });

  await scheduleAutomationForTenant(tenant.id);

  res.status(201).json(tenant);
}

/**
 * Get current authenticated user + tenant context
 */
export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }

  if (!req.tenantId || !req.role) {
    return res.status(200).json({
      needsOnboarding: true,
      message: 'User has no tenant yet',
    });
  }

  const tenant = await getCurrentTenant(req.tenantId);

  if (!tenant) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.role,
    },
    tenant,
  });
}
