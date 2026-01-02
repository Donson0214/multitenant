import { Queue, QueueScheduler } from 'bullmq';
import { bullmqConnection } from '@/config/bullmq';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 500 },
};

export const etlQueue = new Queue('etl', {
  ...bullmqConnection,
  defaultJobOptions,
});

export const etlScheduler = new QueueScheduler('etl', bullmqConnection);

export function enqueueEtlJob(params: { tenantId: string; dataSourceId: string }) {
  return etlQueue.add('poll', params);
}
