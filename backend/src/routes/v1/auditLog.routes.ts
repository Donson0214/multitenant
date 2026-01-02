import { Router } from 'express';
import { getAuditLogs } from '@/modules/audit-logs/auditLog.controller';
import { requireRole } from '@/middleware/role.middleware';
import { requireTenant } from '@/middleware/tenant.middleware';
import { OWNER_ONLY } from '@/types/roles';

const router = Router();

router.use(requireTenant);
router.get('/', requireRole(OWNER_ONLY), getAuditLogs);

export default router;
