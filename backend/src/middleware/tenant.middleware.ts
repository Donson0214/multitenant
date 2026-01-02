import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';

export async function resolveTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'asc' },
  });

  if (membership) {
    req.tenantId = membership.tenantId;
    req.role = membership.role;
    req.membership = membership;
    if (req.context) {
      req.context.tenantId = membership.tenantId;
    }
  }

  next();
}

export function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }
  next();
}
