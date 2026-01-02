import { Router } from 'express';
import {
  createDashboardHandler,
  getDashboardHandler,
  listDashboardsHandler,
  shareDashboardHandler,
  updateDashboardHandler,
} from '@/modules/dashboards/dashboard.controller';
import { requireRole } from '@/middleware/role.middleware';
import { requireTenant } from '@/middleware/tenant.middleware';
import { ANALYST_AND_OWNER, ANY_TENANT_ROLE } from '@/types/roles';

const router = Router();

router.use(requireTenant);

router.get('/', requireRole(ANY_TENANT_ROLE), listDashboardsHandler);
router.get('/:id', requireRole(ANY_TENANT_ROLE), getDashboardHandler);
router.post('/', requireRole(ANALYST_AND_OWNER), createDashboardHandler);
router.patch('/:id', requireRole(ANY_TENANT_ROLE), updateDashboardHandler);
router.post('/:id/share', requireRole(ANALYST_AND_OWNER), shareDashboardHandler);

export default router;
