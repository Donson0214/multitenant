import { Worker } from 'bullmq';
import { bullmqConnection } from '@/config/bullmq';
import { evaluateMetricValue } from '@/modules/metrics/metric.service';
import { logger } from '@/lib/logger';
import { runWithRequestContext } from '@/lib/requestContext';

export const metricsWorker = new Worker(
  'metrics',
  async (job) => {
    const { tenantId, metricId } = job.data as {
      tenantId: string;
      metricId: string;
    };

    await runWithRequestContext(
      { requestId: `metrics:${job.id}`, tenantId },
      async () => {
        const result = await evaluateMetricValue({
          tenantId,
          metricId,
        });

        logger.info('Metric evaluated', {
          metricId,
          value: result.value,
          tenantId,
        });
      }
    );
  },
  { ...bullmqConnection, concurrency: 5 }
);

metricsWorker.on('failed', (job, err) => {
  logger.error('Metric job failed', { jobId: job?.id, error: err.message });
});
