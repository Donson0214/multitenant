import { PrismaClient } from '@prisma/client';
import { getRequestContext } from '@/lib/requestContext';
import { AppError } from '@/lib/errors';

const TENANT_MODELS = new Set([
  'Membership',
  'DataSource',
  'Dataset',
  'DatasetRecord',
  'IngestionLog',
  'Metric',
  'Dashboard',
  'DashboardPermission',
  'AutomationRule',
  'AutomationRun',
  'Notification',
  'AuditLog',
]);

declare global {
  // Allow global `prisma` to avoid hot-reload issues in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

prisma.$use(async (params, next) => {
  const context = getRequestContext();
  const model = params.model;

  if (!model) {
    return next(params);
  }

  if (context?.isPlatformAdmin) {
    return next(params);
  }

  if (model === 'Tenant') {
    if (!context?.tenantId) {
      if (params.action === 'create') {
        return next(params);
      }
      throw new AppError('Tenant access requires context', 403);
    }
    const where = params.args?.where;
    if (where?.id && where.id === context.tenantId) {
      return next(params);
    }
    throw new AppError('Tenant access out of scope', 403);
  }

  if (!TENANT_MODELS.has(model)) {
    return next(params);
  }

  const tenantId = context?.tenantId;

  if (!tenantId) {
    if (
      model === 'Membership' &&
      context?.userId &&
      params.args?.where?.userId === context.userId
    ) {
      return next(params);
    }
    if (
      model === 'Membership' &&
      params.action === 'create' &&
      context?.userId &&
      params.args?.data?.userId === context.userId
    ) {
      return next(params);
    }
    if (
      model === 'DataSource' &&
      context?.allowDataSourceLookup &&
      params.action === 'findUnique'
    ) {
      return next(params);
    }
    throw new AppError('Tenant context missing', 403);
  }

  if (params.action === 'create') {
    params.args = params.args ?? {};
    params.args.data = params.args.data ?? {};
    if (params.args.data.tenantId && params.args.data.tenantId !== tenantId) {
      throw new AppError('Tenant mismatch', 403);
    }
    params.args.data.tenantId = tenantId;
    return next(params);
  }

  if (params.action === 'createMany') {
    const data = params.args?.data;
    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (item.tenantId && item.tenantId !== tenantId) {
          throw new AppError('Tenant mismatch', 403);
        }
        item.tenantId = tenantId;
      });
    }
    return next(params);
  }

  if (
    params.action === 'findMany' ||
    params.action === 'findFirst' ||
    params.action === 'updateMany' ||
    params.action === 'deleteMany'
  ) {
    params.args = params.args ?? {};
    params.args.where = {
      AND: [params.args.where ?? {}, { tenantId }],
    };
    return next(params);
  }

  if (params.action === 'findUnique') {
    throw new AppError('findUnique not allowed on tenant models', 403);
  }

  if (params.action === 'update' || params.action === 'delete' || params.action === 'upsert') {
    throw new AppError('Use scoped updateMany/deleteMany', 403);
  }

  return next(params);
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
