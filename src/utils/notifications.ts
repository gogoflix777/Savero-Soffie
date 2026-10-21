import { NotificationSettings } from '../types';

export type NotificationCategory =
  | 'pin'
  | 'photo'
  | 'wishlist'
  | 'reply'
  | 'streak'
  | 'notes'
  | 'movie'
  | 'meeting'
  | 'hammer';

export interface InAppToast {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  icon?: string;
  avatar?: string;
  timestamp: string;
  actionLabel?: string;
  onAction?: () => void;
}

type ToastListener = (toast: InAppToast) => void;
const listeners = new Set<ToastListener>();

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const PERMISSION_STORAGE_KEY = 'cerita_kita_push_permission';

/**
 * Checks whether browser notification permission has already been permanently granted.
 */
export function isPushPermissionGranted(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Requests web push notification permission from the user once.
 * If user chooses "Always Allow", it stays granted permanently in browser and localStorage.
 */
export async function requestWebPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    try {
      localStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
    } catch {}
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        localStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
      } catch {}
    }
    return permission;
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
    case 'meeting':
    case 'hammer': return settings.notifyOnStreak !== false;
    default: return true;
  }
}

/**
 * Shows native Mobile OS (Android notification bar / iOS PWA) or Desktop push notification.
 * Uses ServiceWorkerRegistration.showNotification first to ensure full mobile background compatibility.
 */
export async function showSystemNotification(params: {
  title: string;
  message: string;
  icon?: string;
  avatar?: string;
  category?: NotificationCategory;
  tag?: string;
  url?: string;
}): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const { title, message, avatar, category = 'streak', tag, url = '/' } = params;
  const icon = avatar || '/logo/logo%20couple%203d.png';
  const notifTag = tag || `ss-notif-${category}-${Date.now()}`;

  const options = {
    body: message,
    icon,
    badge: '/favicon.ico',
    tag: notifTag,
    renotify: true,
    // Heartbeat double-thump vibration pattern for mobile phones [thump, pause, thump-thump]
    vibrate: [200, 100, 200, 100, 300],
    data: { url }
  } as unknown as NotificationOptions;

  // 1. Service Worker Notification: The ONLY method that reliably works on mobile Android & iOS PWA
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return;
      }
    } catch (swErr) {
      console.warn('[Push] ServiceWorker showNotification failed, trying fallback:', swErr);
    }
  }

  // 2. Window Notification fallback for desktop browsers when SW is not yet active
  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (winErr) {
    console.warn('[Push] Window Notification constructor failed:', winErr);
  }
}

export function triggerNotification(params: {
  category: NotificationCategory;
  title: string;
  message: string;
  icon?: string;
  avatar?: string;
  settings?: NotificationSettings;
  actionLabel?: string;
  onAction?: () => void;
  url?: string;
}) {
  const { category, title, message, icon, avatar, settings, actionLabel, onAction, url } = params;

  if (!isCategoryEnabled(settings, category)) {
    return;
  }

  // 1. In-App Floating Toast (Dynamic Island style at top of viewport)
  if (settings?.inAppToast !== false) {
    const toast: InAppToast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      title,
      message,
      icon,
      avatar,
      timestamp: new Date().toISOString(),
      actionLabel,
      onAction
    };
    for (const listener of listeners) {
      try {
        listener(toast);
      } catch (err) {
        console.error('Error invoking toast listener:', err);
      }
    }
  }

  // 2. Native Mobile OS / Desktop Web Push Notification
  if (settings?.webPush !== false) {
    void showSystemNotification({
      title,
      message,
      icon,
      avatar,
      category,
      url
    });
  }
}
