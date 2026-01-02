import { UserRole } from '@prisma/client';

export const OWNER_ONLY = [UserRole.OWNER];
export const ANALYST_AND_OWNER = [UserRole.OWNER, UserRole.ANALYST];
export const ANY_TENANT_ROLE = [
  UserRole.OWNER,
  UserRole.ANALYST,
  UserRole.VIEWER,
];
