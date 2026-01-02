import { Request, Response } from 'express';
import {
  listNotifications,
  markNotificationRead,
} from '@/modules/notifications/notification.service';
import { getPagination } from '@/lib/pagination';

export async function listNotificationsHandler(req: Request, res: Response) {
  if (!req.tenantId || !req.user) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const { skip, take, page, pageSize } = getPagination({
    page: req.query.page as string,
    pageSize: req.query.pageSize as string,
  });

  const notifications = await listNotifications({
    tenantId: req.tenantId,
    userId: req.user.id,
    skip,
    take,
  });

  res.json({ data: notifications, page, pageSize });
}

export async function markNotificationReadHandler(
  req: Request,
  res: Response
) {
  if (!req.tenantId || !req.user) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const notification = await markNotificationRead({
    tenantId: req.tenantId,
    userId: req.user.id,
    id: req.params.id,
  });

  res.json(notification);
}
