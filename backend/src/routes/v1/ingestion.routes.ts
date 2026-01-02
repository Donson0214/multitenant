import { Router } from 'express';
import { listIngestionLogsHandler } from '@/modules/data-sources/ingestion.controller';
import { requireRole } from '@/middleware/role.middleware';
import { requireTenant } from '@/middleware/tenant.middleware';
import { ANALYST_AND_OWNER } from '@/types/roles';

const router = Router();

router.use(requireTenant);
router.get('/', requireRole(ANALYST_AND_OWNER), listIngestionLogsHandler);

export default router;
