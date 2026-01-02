import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import {
  addUserToTenant,
  listTenantUsers,
  removeUserFromTenant,
  updateUserRole,
} from '@/modules/users/user.service';
import { logAudit } from '@/modules/audit-logs/auditLog.service';
import { addUserSchema, changeRoleSchema, validateSchema } from '@/utils/validation';

export async function listUsers(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const memberships = await listTenantUsers(req.tenantId);
  res.json(
    memberships.map((membership) => ({
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      role: membership.role,
      createdAt: membership.user.createdAt,
    }))
  );
}

export async function addUser(req: Request, res: Response) {
  if (!req.tenantId || !req.user) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const parsed = validateSchema(addUserSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const membership = await addUserToTenant({
    tenantId: req.tenantId,
    email: parsed.data.email,
    role: parsed.data.role as UserRole,
  });

  await logAudit({
    tenantId: req.tenantId,
    actorUserId: req.user.id,
    action: 'USER_ADDED',
    entityType: 'Membership',
    entityId: membership.id,
    meta: { email: parsed.data.email, role: parsed.data.role },
  });

  res.status(201).json(membership);
}

export async function changeUserRole(req: Request, res: Response) {
  if (!req.tenantId || !req.user) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const parsed = validateSchema(changeRoleSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const membership = await updateUserRole({
    tenantId: req.tenantId,
    userId: req.params.userId,
    role: parsed.data.role as UserRole,
  });

  await logAudit({
    tenantId: req.tenantId,
    actorUserId: req.user.id,
    action: 'USER_ROLE_UPDATED',
    entityType: 'Membership',
    entityId: membership.id,
    meta: { role: parsed.data.role },
  });

  res.json(membership);
}

export async function removeUser(req: Request, res: Response) {
  if (!req.tenantId || !req.user) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const membership = await removeUserFromTenant({
    tenantId: req.tenantId,
    userId: req.params.userId,
  });

  await logAudit({
    tenantId: req.tenantId,
    actorUserId: req.user.id,
    action: 'USER_REMOVED',
    entityType: 'Membership',
    entityId: membership.id,
  });

  res.json({ success: true });
}
