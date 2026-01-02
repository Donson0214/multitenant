import { Router } from 'express';
import {
  createTenant,
  getMe,
} from '@/modules/tenants/tenant.controller';

const router = Router();

/**
 * First-time onboarding
 * - User is authenticated (Firebase)
 * - User exists in DB
 * - User does NOT have a tenant yet
 */
router.post('/', createTenant);

/**
 * Bootstrap endpoint
 * - User is authenticated
 * - User HAS a tenant
 * - Returns user + tenant context
 */
router.get('/me', getMe);

export default router;
