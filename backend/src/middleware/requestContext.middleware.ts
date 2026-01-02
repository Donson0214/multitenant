import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { runWithRequestContext } from '@/lib/requestContext';

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const context = {
    requestId: randomUUID(),
  };

  req.requestId = context.requestId;
  req.context = context;
  res.setHeader('x-request-id', context.requestId);

  runWithRequestContext(context, () => {
    next();
  });
}
