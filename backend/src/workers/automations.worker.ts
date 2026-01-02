import { Worker } from 'bullmq';
import { bullmqConnection } from '@/config/bullmq';
import {
  runAutomationRule,
  runAutomationRulesForTenant,
} from '@/modules/automations/automation.service';
import { logger } from '@/lib/logger';
import { runWithRequestContext } from '@/lib/requestContext';

export const automationsWorker = new Worker(
  'automations',
  async (job) => {
    const { tenantId, ruleId } = job.data as {
      tenantId: string;
      ruleId?: string;
    };

    await runWithRequestContext(
      { requestId: `automations:${job.id}`, tenantId },
      async () => {
        if (ruleId) {
          await runAutomationRule({ tenantId, ruleId });
          return;
        }

        await runAutomationRulesForTenant(tenantId);
      }
    );
  },
  { ...bullmqConnection, concurrency: 5 }
);

automationsWorker.on('failed', (job, err) => {
  logger.error('Automation job failed', { jobId: job?.id, error: err.message });
});
