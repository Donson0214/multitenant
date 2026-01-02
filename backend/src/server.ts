import { app } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import { registerRepeatableJobs } from '@/queues/scheduler';

app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});

registerRepeatableJobs().catch((error) => {
  logger.error('Failed to register repeatable jobs', {
    error: error instanceof Error ? error.message : String(error),
  });
});
