import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  INTERNAL_JWT_SECRET: z.string().default('dev-internal-secret'),
  PLATFORM_ADMIN_EMAILS: z.string().optional(),
  WEBHOOK_RATE_LIMIT_PER_MINUTE: z.coerce.number().optional(),
  WEBHOOK_REPLAY_TTL_SECONDS: z.coerce.number().default(300),
  WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS: z.coerce.number().default(300),
  ETL_POLL_INTERVAL_MS: z.coerce.number().default(300000),
  AUTOMATION_EVAL_INTERVAL_MS: z.coerce.number().default(300000),
  REST_POLL_TIMEOUT_MS: z.coerce.number().default(10000),
});

export const env = envSchema.parse(process.env);
