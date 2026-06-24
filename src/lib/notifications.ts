import Notification from '@/models/Notification';

export interface NotificationPayload {
  _id: string;
  userId: string;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export async function createNotification(
  userId: string,
  type: string,
  message: string,
  link: string
): Promise<NotificationPayload> {
  const doc = await Notification.create({ userId, type, message, link });
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    message: doc.message,
    link: doc.link,
    isRead: doc.isRead,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function createNotifications(
  userIds: string[],
  type: string,
  message: string,
  link: string
): Promise<NotificationPayload[]> {
  if (userIds.length === 0) return [];
  const docs = await Notification.insertMany(
    userIds.map(userId => ({ userId, type, message, link }))
  );
  return docs.map(doc => ({
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    message: doc.message,
    link: doc.link,
    isRead: doc.isRead,
    createdAt: doc.createdAt.toISOString(),
  }));
}
