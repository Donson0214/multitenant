import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { UserRole } from '@prisma/client';

/**
 * Finds or creates a user based on Firebase UID
 */
export async function findOrCreateUser(params: {
  firebaseUid: string;
  email: string;
  name?: string;
}) {
  const { firebaseUid, email, name } = params;

  return prisma.user.upsert({
    where: { firebaseUid },
    update: {
      email,
      name,
    },
    create: {
      firebaseUid,
      email,
      name,
    },
  });
}

export async function listTenantUsers(tenantId: string) {
  return prisma.membership.findMany({
    where: { tenantId },
    include: {
      user: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addUserToTenant(params: {
  tenantId: string;
  email: string;
  role: UserRole;
}) {
  const user = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const existing = await prisma.membership.findFirst({
    where: { tenantId: params.tenantId, userId: user.id },
  });

  if (existing) {
    throw new AppError('User already belongs to tenant', 409);
  }

  return prisma.membership.create({
    data: {
      tenantId: params.tenantId,
      userId: user.id,
      role: params.role,
    },
  });
}

export async function updateUserRole(params: {
  tenantId: string;
  userId: string;
  role: UserRole;
}) {
  const membership = await prisma.membership.findFirst({
    where: { tenantId: params.tenantId, userId: params.userId },
  });

  if (!membership) {
    throw new AppError('Membership not found', 404);
  }

  await prisma.membership.updateMany({
    where: { id: membership.id, tenantId: params.tenantId },
    data: { role: params.role },
  });

  return prisma.membership.findFirst({
    where: { id: membership.id, tenantId: params.tenantId },
  });
}

export async function removeUserFromTenant(params: {
  tenantId: string;
  userId: string;
}) {
  const membership = await prisma.membership.findFirst({
    where: { tenantId: params.tenantId, userId: params.userId },
  });

  if (!membership) {
    throw new AppError('Membership not found', 404);
  }

  await prisma.membership.deleteMany({
    where: { id: membership.id, tenantId: params.tenantId },
  });

  return membership;
}
