import { Router } from 'express';
import {
  createAutomationHandler,
  getAutomationHandler,
  listAutomationsHandler,
  listAutomationRunsHandler,
  runAutomationHandler,
} from '@/modules/automations/automation.controller';
import { requireRole } from '@/middleware/role.middleware';
import { requireTenant } from '@/middleware/tenant.middleware';
import { ANALYST_AND_OWNER, ANY_TENANT_ROLE } from '@/types/roles';

const router = Router();

router.use(requireTenant);

router.get('/', requireRole(ANALYST_AND_OWNER), listAutomationsHandler);
router.post('/', requireRole(ANALYST_AND_OWNER), createAutomationHandler);
router.get('/runs', requireRole(ANY_TENANT_ROLE), listAutomationRunsHandler);
router.get('/:id', requireRole(ANALYST_AND_OWNER), getAutomationHandler);
router.post('/:id/run', requireRole(ANALYST_AND_OWNER), runAutomationHandler);

export default router;
