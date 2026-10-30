// CropDiary AI — In-App Notification Center & Browser Notification Service
// Provides real-time notification tracking, read states, and user-permissioned browser notifications.

import { storageAdapter } from '@/services/storageAdapter';
import { UserNotification } from '@/types/weather';

export const notificationService = {
  async getNotifications(userId: string): Promise<UserNotification[]> {
    return storageAdapter.getNotifications(userId);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const list = await storageAdapter.getNotifications(userId);
    return list.filter((n) => !n.read_at && !n.is_dismissed).length;
  },

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    return storageAdapter.markNotificationRead(userId, notificationId);
  },

  async markAllAsRead(userId: string): Promise<void> {
    return storageAdapter.markAllNotificationsRead(userId);
  },

  async dismissNotification(userId: string, notificationId: string): Promise<void> {
    return storageAdapter.dismissNotification(userId, notificationId);
  },

  async sendInAppNotification(
    userId: string,
    params: {
      type: 'weather_alert' | 'reminder_due' | 'system';
      title: string;
      message: string;
      resourceType?: 'weather_alert' | 'reminder' | 'farm' | 'crop_plan';
      resourceId?: string;
    }
  ): Promise<UserNotification | null> {
    // Deduplication check: do not insert duplicate unread notification for the same resource
    if (params.resourceId) {
      const existing = await storageAdapter.getNotifications(userId);
      const isDuplicate = existing.some(
        (n) => n.resource_id === params.resourceId && !n.read_at && !n.is_dismissed
      );
      if (isDuplicate) return null;
    }

    const created = await storageAdapter.createNotification(userId, {
      notification_type: params.type,
      title: params.title,
      message: params.message,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      read_at: null,
      is_dismissed: false,
    });

    // If browser notifications are granted, trigger a safe visual notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(params.title, {
          body: params.message,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Browser notification trigger failed:', err);
      }
    }

    return created;
  },

  /**
   * Explicit User-Initiated Browser Push Permission Request
   */
  async requestBrowserNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  },

  isBrowserNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getBrowserNotificationPermission(): 'granted' | 'denied' | 'default' {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.permission;
  },
};
