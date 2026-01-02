import { prisma } from '@/lib/prisma';

export async function logAudit(params: {
  tenantId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      meta: params.meta,
    },
  });
}

export async function listAuditLogs(params: {
  tenantId: string;
  skip: number;
  take: number;
  action?: string;
}) {
  return prisma.auditLog.findMany({
    where: {
      tenantId: params.tenantId,
      action: params.action,
    },
    orderBy: { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}
