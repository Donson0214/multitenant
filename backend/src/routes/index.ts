import { Router } from 'express';
import tenantRoutes from './v1/tenant.routes';
import authRoutes from './v1/auth.routes';
import userRoutes from './v1/user.routes';
import adminRoutes from './v1/admin.routes';
import auditLogRoutes from './v1/auditLog.routes';
import dataSourceRoutes from './v1/dataSource.routes';
import datasetRoutes from './v1/dataset.routes';
import metricRoutes from './v1/metric.routes';
import dashboardRoutes from './v1/dashboard.routes';
import ingestionRoutes from './v1/ingestion.routes';
import webhookRoutes from './v1/webhook.routes';
import automationRoutes from './v1/automation.routes';
import notificationRoutes from './v1/notification.routes';
import { authMiddleware } from '@/modules/auth/auth.middleware';
import { resolveTenant } from '@/middleware/tenant.middleware';

const router = Router();

router.use('/api/v1/webhooks', webhookRoutes);

router.use(authMiddleware);
router.use(resolveTenant);

router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/tenants', tenantRoutes);
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/audit-logs', auditLogRoutes);
router.use('/api/v1/admin', adminRoutes);
router.use('/api/v1/data-sources', dataSourceRoutes);
router.use('/api/v1/datasets', datasetRoutes);
router.use('/api/v1/metrics', metricRoutes);
router.use('/api/v1/dashboards', dashboardRoutes);
router.use('/api/v1/ingestion-logs', ingestionRoutes);
router.use('/api/v1/automations', automationRoutes);
router.use('/api/v1/notifications', notificationRoutes);

export default router;
