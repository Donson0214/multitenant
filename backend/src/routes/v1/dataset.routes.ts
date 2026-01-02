import { Router } from 'express';
import {
  createDatasetHandler,
  getDatasetHandler,
  listDatasetRecordsHandler,
  listDatasetsHandler,
} from '@/modules/datasets/dataset.controller';
import { requireRole } from '@/middleware/role.middleware';
import { requireTenant } from '@/middleware/tenant.middleware';
import { ANALYST_AND_OWNER } from '@/types/roles';

const router = Router();

router.use(requireTenant);

router.get('/', requireRole(ANALYST_AND_OWNER), listDatasetsHandler);
router.post('/', requireRole(ANALYST_AND_OWNER), createDatasetHandler);
router.get('/:id', requireRole(ANALYST_AND_OWNER), getDatasetHandler);
router.get('/:id/records', requireRole(ANALYST_AND_OWNER), listDatasetRecordsHandler);

export default router;
