import { NotificationType } from '@prisma/client';

export type NotificationPayload = {
  title: string;
  body: string;
  type: NotificationType;
};
