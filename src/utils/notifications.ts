import { NotificationSettings } from '../types';

export type NotificationCategory = 'pin' | 'photo' | 'wishlist' | 'reply' | 'streak' | 'notes';

export interface InAppToast {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  icon?: string;
  avatar?: string;
  timestamp: string;
}

type ToastListener = (toast: InAppToast) => void;
const listeners = new Set<ToastListener>();

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function requestWebPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function isCategoryEnabled(settings?: NotificationSettings, category?: NotificationCategory): boolean {
  if (!settings || settings.enabled === false) return false;
  if (!category) return true;
  switch (category) {
    case 'pin': return settings.notifyOnPin !== false;
    case 'photo': return settings.notifyOnPhoto !== false;
    case 'wishlist': return settings.notifyOnWishlist !== false;
    case 'reply': return settings.notifyOnReply !== false;
    case 'streak': return settings.notifyOnStreak !== false;
    case 'notes': return settings.notifyOnNotes !== false;
    default: return true;
  }
}

export function triggerNotification(params: {
  category: NotificationCategory;
  title: string;
  message: string;
  icon?: string;
  avatar?: string;
  settings?: NotificationSettings;
}) {
  const { category, title, message, icon, avatar, settings } = params;

  if (!isCategoryEnabled(settings, category)) {
    return;
  }

  // 1. In-App Toast
  if (settings?.inAppToast !== false) {
    const toast: InAppToast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      title,
      message,
      icon,
      avatar,
      timestamp: new Date().toISOString()
    };
    for (const listener of listeners) {
      try {
        listener(toast);
      } catch (err) {
        console.error('Error invoking toast listener:', err);
      }
    }
  }

  // 2. Browser / OS Web Push Notification
  if (settings?.webPush !== false && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: message,
          icon: avatar || '/apple-touch-icon.png',
          badge: '/favicon.ico',
          tag: `ss-notif-${category}-${Date.now()}`
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('Could not show web push notification:', err);
      }
    }
  }
}
