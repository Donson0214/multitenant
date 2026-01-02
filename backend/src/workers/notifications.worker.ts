import { Worker } from 'bullmq';
import { bullmqConnection } from '@/config/bullmq';
import { createNotification } from '@/modules/notifications/notification.service';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { runWithRequestContext } from '@/lib/requestContext';

export const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    const { tenantId, userId, title, body } = job.data as {
      tenantId: string;
      userId: string;
      title: string;
      body: string;
    };

    await runWithRequestContext(
      { requestId: `notifications:${job.id}`, tenantId },
      async () => {
        await createNotification({
          tenantId,
          userId,
          type: NotificationType.IN_APP,
          title,
          body,
        });
      }
    );
  },
  { ...bullmqConnection, concurrency: 10 }
);

notificationsWorker.on('failed', (job, err) => {
  logger.error('Notification job failed', {
    jobId: job?.id,
    error: err.message,
  });
});
