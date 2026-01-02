import { Router } from 'express';
import { ingestWebhook } from '@/modules/data-sources/ingestion.controller';
import { rateLimit } from '@/middleware/rateLimit.middleware';
import { env } from '@/config/env';

const router = Router();

const maxPerMinute = env.WEBHOOK_RATE_LIMIT_PER_MINUTE ?? 60;

router.use((req, _res, next) => {
  if (req.context) {
    req.context.allowDataSourceLookup = true;
    req.context.isWebhook = true;
  }
  next();
});

router.post(
  '/data-sources/:id',
  rateLimit({
    windowMs: 60_000,
    max: maxPerMinute,
    message: 'Too many webhook requests',
  }),
  ingestWebhook
);

export default router;
