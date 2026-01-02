import { Router } from 'express';
import { createSession } from '@/modules/auth/auth.controller';
import { rateLimit } from '@/middleware/rateLimit.middleware';

const router = Router();

router.post(
  '/session',
  rateLimit({ windowMs: 60_000, max: 30, message: 'Too many auth requests' }),
  createSession
);

export default router;
