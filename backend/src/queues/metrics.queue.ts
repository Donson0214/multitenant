import { Queue, QueueScheduler } from 'bullmq';
import { bullmqConnection } from '@/config/bullmq';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 500 },
};

export const metricsQueue = new Queue('metrics', {
  ...bullmqConnection,
  defaultJobOptions,
});

export const metricsScheduler = new QueueScheduler('metrics', bullmqConnection);

export function enqueueMetricJob(params: { tenantId: string; metricId: string }) {
  return metricsQueue.add('evaluate', params);
}
