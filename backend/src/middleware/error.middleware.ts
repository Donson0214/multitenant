import { Request, Response, NextFunction } from 'express';
import { isAppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (isAppError(err)) {
    res.status(err.status).json({
      message: err.message,
      code: err.code,
      details: err.details,
      requestId: req.requestId,
    });
    return;
  }

  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: err instanceof Error ? err.message : String(err),
  });

  res.status(500).json({
    message: 'Internal server error',
    requestId: req.requestId,
  });
}
