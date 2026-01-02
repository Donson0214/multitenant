import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export async function createDashboard(params: {
  tenantId: string;
  name: string;
  layout: Record<string, unknown>;
}) {
  return prisma.dashboard.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      layout: params.layout,
    },
  });
}

export async function listDashboards(tenantId: string) {
  return prisma.dashboard.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listDashboardsForUser(params: {
  tenantId: string;
  userId: string;
}) {
  return prisma.dashboard.findMany({
    where: {
      tenantId: params.tenantId,
      permissions: {
        some: { userId: params.userId },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDashboard(params: { tenantId: string; id: string }) {
  return prisma.dashboard.findFirst({
    where: { tenantId: params.tenantId, id: params.id },
  });
}

export async function updateDashboard(params: {
  tenantId: string;
  id: string;
  layout?: Record<string, unknown>;
  name?: string;
}) {
  const dashboard = await getDashboard({
    tenantId: params.tenantId,
    id: params.id,
  });
  if (!dashboard) {
    throw new AppError('Dashboard not found', 404);
  }

  await prisma.dashboard.updateMany({
    where: { id: dashboard.id, tenantId: params.tenantId },
    data: {
      layout: params.layout ?? dashboard.layout,
      name: params.name ?? dashboard.name,
    },
  });

  return getDashboard({ tenantId: params.tenantId, id: dashboard.id });
}

export async function upsertDashboardPermission(params: {
  tenantId: string;
  dashboardId: string;
  userId: string;
  canEdit: boolean;
}) {
  const membership = await prisma.membership.findFirst({
    where: { tenantId: params.tenantId, userId: params.userId },
  });
  if (!membership) {
    throw new AppError('User is not in tenant', 404);
  }

  const existing = await prisma.dashboardPermission.findFirst({
    where: {
      tenantId: params.tenantId,
      dashboardId: params.dashboardId,
      userId: params.userId,
    },
  });

  if (existing) {
    await prisma.dashboardPermission.updateMany({
      where: { id: existing.id, tenantId: params.tenantId },
      data: { canEdit: params.canEdit },
    });
    return prisma.dashboardPermission.findFirst({
      where: { id: existing.id, tenantId: params.tenantId },
    });
  }

  return prisma.dashboardPermission.create({
    data: {
      tenantId: params.tenantId,
      dashboardId: params.dashboardId,
      userId: params.userId,
      canEdit: params.canEdit,
    },
  });
}

export async function getDashboardPermission(params: {
  tenantId: string;
  dashboardId: string;
  userId: string;
}) {
  return prisma.dashboardPermission.findFirst({
    where: {
      tenantId: params.tenantId,
      dashboardId: params.dashboardId,
      userId: params.userId,
    },
  });
}
