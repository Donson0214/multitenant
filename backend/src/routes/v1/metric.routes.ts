import { Router } from 'express';
import {
  createMetricHandler,
  getMetricHandler,
  getMetricValueHandler,
  listMetricsHandler,
} from '@/modules/metrics/metric.controller';
import { requireRole } from '@/middleware/role.middleware';
import { requireTenant } from '@/middleware/tenant.middleware';
import { ANALYST_AND_OWNER, ANY_TENANT_ROLE } from '@/types/roles';

const router = Router();

router.use(requireTenant);

router.get('/', requireRole(ANY_TENANT_ROLE), listMetricsHandler);
router.get('/:id', requireRole(ANY_TENANT_ROLE), getMetricHandler);
router.get('/:id/value', requireRole(ANY_TENANT_ROLE), getMetricValueHandler);
router.post('/', requireRole(ANALYST_AND_OWNER), createMetricHandler);

export default router;
