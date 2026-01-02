import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin } from '@/config/firebase';
import { findOrCreateUser } from '@/modules/users/user.service';
import { env } from '@/config/env';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    const email = decoded.email ?? '';

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await findOrCreateUser({
      firebaseUid: decoded.uid,
      email,
      name: decoded.name,
    });

    req.user = user;
    if (req.context) {
      req.context.userId = user.id;
    }
    const adminEmails = (env.PLATFORM_ADMIN_EMAILS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    req.isPlatformAdmin = adminEmails.includes(email);
    if (req.context) {
      req.context.isPlatformAdmin = req.isPlatformAdmin;
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
