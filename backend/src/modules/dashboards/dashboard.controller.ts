import { Request, Response } from 'express';
import {
  createDashboard,
  getDashboard,
  getDashboardPermission,
  listDashboards,
  listDashboardsForUser,
  updateDashboard,
  upsertDashboardPermission,
} from '@/modules/dashboards/dashboard.service';
import { UserRole } from '@prisma/client';
import {
  dashboardCreateSchema,
  dashboardShareSchema,
  dashboardUpdateSchema,
  validateSchema,
} from '@/utils/validation';
import { logAudit } from '@/modules/audit-logs/auditLog.service';

export async function createDashboardHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const parsed = validateSchema(dashboardCreateSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const dashboard = await createDashboard({
    tenantId: req.tenantId,
    name: parsed.data.name,
    layout: (parsed.data.layout ?? {}) as Record<string, unknown>,
  });

  if (req.user) {
    await logAudit({
      tenantId: req.tenantId,
      actorUserId: req.user.id,
      action: 'DASHBOARD_CREATED',
      entityType: 'Dashboard',
      entityId: dashboard.id,
    });
  }

  res.status(201).json(dashboard);
}

export async function listDashboardsHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  if (!req.user || !req.role) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const dashboards =
    req.role === UserRole.VIEWER
      ? await listDashboardsForUser({
          tenantId: req.tenantId,
          userId: req.user.id,
        })
      : await listDashboards(req.tenantId);
  res.json(dashboards);
}

export async function getDashboardHandler(req: Request, res: Response) {
  if (!req.tenantId || !req.user) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const dashboard = await getDashboard({
    tenantId: req.tenantId,
    id: req.params.id,
  });

  if (!dashboard) {
    return res.status(404).json({ message: 'Dashboard not found' });
  }

  if (req.role === UserRole.VIEWER) {
    const permission = await getDashboardPermission({
      tenantId: req.tenantId,
      dashboardId: dashboard.id,
      userId: req.user.id,
    });
    if (!permission) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  res.json(dashboard);
}

export async function updateDashboardHandler(req: Request, res: Response) {
  if (!req.tenantId || !req.user) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  if (req.role === UserRole.VIEWER) {
    const permission = await getDashboardPermission({
      tenantId: req.tenantId,
      dashboardId: req.params.id,
      userId: req.user.id,
    });
    if (!permission?.canEdit) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  const parsed = validateSchema(dashboardUpdateSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const dashboard = await updateDashboard({
    tenantId: req.tenantId,
    id: req.params.id,
    name: parsed.data.name,
    layout: parsed.data.layout as Record<string, unknown>,
  });

  if (req.user) {
    await logAudit({
      tenantId: req.tenantId,
      actorUserId: req.user.id,
      action: 'DASHBOARD_UPDATED',
      entityType: 'Dashboard',
      entityId: dashboard?.id ?? req.params.id,
    });
  }

  res.json(dashboard);
}

export async function shareDashboardHandler(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const dashboard = await getDashboard({
    tenantId: req.tenantId,
    id: req.params.id,
  });
  if (!dashboard) {
    return res.status(404).json({ message: 'Dashboard not found' });
  }

  const parsed = validateSchema(dashboardShareSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.issues,
    });
  }

  const permission = await upsertDashboardPermission({
    tenantId: req.tenantId,
    dashboardId: req.params.id,
    userId: parsed.data.userId,
    canEdit: Boolean(parsed.data.canEdit),
  });

  if (req.user) {
    await logAudit({
      tenantId: req.tenantId,
      actorUserId: req.user.id,
      action: 'DASHBOARD_SHARED',
      entityType: 'DashboardPermission',
      entityId: permission?.id ?? req.params.id,
      meta: { userId: parsed.data.userId, canEdit: Boolean(parsed.data.canEdit) },
    });
  }

  res.json(permission);
}
