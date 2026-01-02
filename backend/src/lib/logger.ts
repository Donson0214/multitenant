import { env } from '@/config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? { ...meta } : undefined;
  const timestamp = new Date().toISOString();
  if (payload) {
    console[level](`[${timestamp}] ${message}`, payload);
    return;
  }
  console[level](`[${timestamp}] ${message}`);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (env.NODE_ENV !== 'production') {
      log('debug', message, meta);
    }
  },
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
