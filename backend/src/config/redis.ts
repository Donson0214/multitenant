import IORedis from 'ioredis';
import { env } from '@/config/env';

export const redis = env.REDIS_URL
  ? new IORedis(env.REDIS_URL)
  : new IORedis({
      host: env.REDIS_HOST ?? '127.0.0.1',
      port: env.REDIS_PORT ?? 6379,
    });
