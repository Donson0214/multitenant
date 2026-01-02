import { Request, Response } from 'express';
import { issueInternalToken } from '@/modules/auth/auth.service';

export async function createSession(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }

  const token = issueInternalToken({
    userId: req.user.id,
    tenantId: req.tenantId,
    role: req.role,
    isPlatformAdmin: req.isPlatformAdmin,
  });

  res.json({
    token,
    expiresIn: 3600,
  });
}
