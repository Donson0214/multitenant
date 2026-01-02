import { User, Membership, UserRole } from '@prisma/client';
import { RequestContext } from '@/lib/requestContext';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenantId?: string;
      role?: UserRole;
      membership?: Membership;
      requestId?: string;
      isPlatformAdmin?: boolean;
      rawBody?: Buffer;
      context?: RequestContext;
    }
  }
}
