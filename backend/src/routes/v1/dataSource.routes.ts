import { Router, text } from 'express';
import {
  createDataSourceHandler,
  deleteDataSourceHandler,
  getDataSourceHandler,
  listDataSourcesHandler,
  updateDataSourceHandler,
} from '@/modules/data-sources/dataSource.controller';
import {
  ingestDataSource,
  pollDataSource,
} from '@/modules/data-sources/ingestion.controller';
import { requireRole } from '@/middleware/role.middleware';
import { requireTenant } from '@/middleware/tenant.middleware';
import { ANALYST_AND_OWNER, OWNER_ONLY } from '@/types/roles';

const router = Router();

router.use(requireTenant);

router.get('/', requireRole(ANALYST_AND_OWNER), listDataSourcesHandler);
router.get('/:id', requireRole(ANALYST_AND_OWNER), getDataSourceHandler);
router.post('/', requireRole(ANALYST_AND_OWNER), createDataSourceHandler);
router.patch('/:id', requireRole(ANALYST_AND_OWNER), updateDataSourceHandler);
router.delete('/:id', requireRole(OWNER_ONLY), deleteDataSourceHandler);

router.post(
  '/:id/ingest',
  requireRole(ANALYST_AND_OWNER),
  text({ type: ['text/csv', 'text/plain'], limit: '5mb' }),
  ingestDataSource
);
router.post('/:id/poll', requireRole(ANALYST_AND_OWNER), pollDataSource);

export default router;
