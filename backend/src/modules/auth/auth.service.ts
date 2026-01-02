import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { UserRole } from '@prisma/client';

type InternalTokenPayload = {
  userId: string;
  tenantId?: string;
  role?: UserRole;
  isPlatformAdmin?: boolean;
};

export function issueInternalToken(payload: InternalTokenPayload) {
  return jwt.sign(payload, env.INTERNAL_JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'multi-tenant-api',
    audience: 'internal',
  });
}
