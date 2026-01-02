import { Router } from 'express';
import { getTenants, getUsers } from '@/modules/admin/admin.controller';
import { requirePlatformAdmin } from '@/middleware/role.middleware';

const router = Router();

router.use(requirePlatformAdmin);
router.get('/tenants', getTenants);
router.get('/users', getUsers);

export default router;
