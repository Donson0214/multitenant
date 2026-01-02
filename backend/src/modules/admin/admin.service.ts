import { prisma } from '@/lib/prisma';

export async function listTenants(params: { skip: number; take: number }) {
  return prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}

export async function listUsers(params: { skip: number; take: number }) {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}
