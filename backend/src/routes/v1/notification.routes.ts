import { Router } from 'express';
import {
  listNotificationsHandler,
  markNotificationReadHandler,
} from '@/modules/notifications/notification.controller';
import { requireRole } from '@/middleware/role.middleware';
import { requireTenant } from '@/middleware/tenant.middleware';
import { ANY_TENANT_ROLE } from '@/types/roles';

const router = Router();

router.use(requireTenant);

router.get('/', requireRole(ANY_TENANT_ROLE), listNotificationsHandler);
router.post('/:id/read', requireRole(ANY_TENANT_ROLE), markNotificationReadHandler);

export default router;
