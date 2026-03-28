/**
 * Notification delivery system — email, Slack, WhatsApp.
 * Phase 17 will implement full delivery pipeline.
 */

export type NotificationChannel = 'email' | 'slack' | 'whatsapp' | 'in_app';

export interface Notification {
  id: string;
  userId: string;
  hotelId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

// TODO (Phase 17): sendNotification(notification) → void
// TODO (Phase 17): markAsRead(notificationId) → void
