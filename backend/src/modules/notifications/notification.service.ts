import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { AppError } from '@/lib/errors';

export async function createNotification(params: {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
}) {
  return prisma.notification.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
    },
  });
}

export async function listNotifications(params: {
  tenantId: string;
  userId: string;
  skip: number;
  take: number;
}) {
  return prisma.notification.findMany({
    where: {
      tenantId: params.tenantId,
      userId: params.userId,
    },
    orderBy: { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}

export async function markNotificationRead(params: {
  tenantId: string;
  userId: string;
  id: string;
}) {
  const notification = await prisma.notification.findFirst({
    where: {
      tenantId: params.tenantId,
      userId: params.userId,
      id: params.id,
    },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  await prisma.notification.updateMany({
    where: { id: notification.id, tenantId: params.tenantId },
    data: { readAt: new Date() },
  });

  return prisma.notification.findFirst({
    where: { id: notification.id, tenantId: params.tenantId },
  });
}
