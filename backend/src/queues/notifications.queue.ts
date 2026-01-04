import { Queue } from 'bullmq';
import { bullmqConnection } from '@/config/bullmq';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 500 },
};

export const notificationsQueue = new Queue('notifications', {
  ...bullmqConnection,
  defaultJobOptions,
});

export function enqueueNotificationJob(params: {
  tenantId: string;
  userId: string;
  title: string;
  body: string;
}) {
  return notificationsQueue.add('notify', params);
}
