import { prisma } from '@/lib/prisma';
import { UserRole, Prisma } from '@prisma/client';
import { AppError } from '@/lib/errors';

/**
 * Creates a new tenant and assigns the user as OWNER
 * Must be atomic (transaction)
 */
export async function provisionTenant(params: {
  tenantName: string;
  userId: string;
}) {
  const { tenantName, userId } = params;

  try {
    return await prisma.$transaction(async (tx) => {
      const existingMembership = await tx.membership.findFirst({
        where: { userId },
      });

      if (existingMembership) {
        throw new AppError('User already has a tenant', 409);
      }

      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      });

      await tx.membership.create({
        data: {
          tenantId: tenant.id,
          userId,
          role: UserRole.OWNER,
        },
      });

      return tenant;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError('User already has a tenant', 409);
    }
    throw error;
  }
}

/**
 * Returns the current tenant (safe fields only)
 */
export async function getCurrentTenant(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });
}
