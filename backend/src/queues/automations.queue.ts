import { Queue, QueueScheduler } from 'bullmq';
import { bullmqConnection } from '@/config/bullmq';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 500 },
};

export const automationsQueue = new Queue('automations', {
  ...bullmqConnection,
  defaultJobOptions,
});

export const automationsScheduler = new QueueScheduler(
  'automations',
  bullmqConnection
);

export function enqueueAutomationJob(params: {
  tenantId: string;
  ruleId?: string;
}) {
  return automationsQueue.add('evaluate', params);
}
