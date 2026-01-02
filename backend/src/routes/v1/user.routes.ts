import { Router } from 'express';
import {
  addUser,
  changeUserRole,
  listUsers,
  removeUser,
} from '@/modules/users/user.controller';
import { requireRole } from '@/middleware/role.middleware';
import { requireTenant } from '@/middleware/tenant.middleware';
import { ANALYST_AND_OWNER, OWNER_ONLY } from '@/types/roles';

const router = Router();

router.use(requireTenant);

router.get('/', requireRole(ANALYST_AND_OWNER), listUsers);
router.post('/', requireRole(OWNER_ONLY), addUser);
router.patch('/:userId/role', requireRole(OWNER_ONLY), changeUserRole);
router.delete('/:userId', requireRole(OWNER_ONLY), removeUser);

export default router;
