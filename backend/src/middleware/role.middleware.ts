import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export function requireRole(allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !allowed.includes(req.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

export function requirePlatformAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isPlatformAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}
