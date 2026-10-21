import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  MapPin,
  Camera,
  Heart,
  MessageCircle,
  Flame,
  BookOpen,
  Film,
  Hammer,
  HeartHandshake,
  Bell,
  Check
} from 'lucide-react';
import {
  InAppToast,
  subscribeToToasts,
  requestWebPushPermission,
  PERMISSION_STORAGE_KEY
} from '../../utils/notifications';

export const InAppToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<InAppToast[]>([]);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    // Check if permission prompt should be shown
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const isDefault = Notification.permission === 'default';
      let isDismissed = false;
      try {
        isDismissed = localStorage.getItem('cerita_kita_push_prompt_dismissed') === 'true';
      } catch {}

      if (isDefault && !isDismissed) {
        // Delay prompt slightly so user sees page smoothly first
        const promptTimer = window.setTimeout(() => {
          setShowPermissionPrompt(true);
        }, 1800);
        return () => window.clearTimeout(promptTimer);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((current) => [toast, ...current.slice(0, 2)]); // Keep up to 3 active toasts
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 5000);
    });
    return unsubscribe;
  }, []);

  const handleGrantPermission = async () => {
    setShowPermissionPrompt(false);
    const perm = await requestWebPushPermission();
    if (perm === 'granted') {
      try {
        localStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
      } catch {}
      // Show confirmation toast
      const confirmToast: InAppToast = {
        id: `toast-perm-${Date.now()}`,
        category: 'streak',
        title: 'Notifikasi HP Aktif Selamanya! 💖',
        message: 'Kini setiap kabar cinta, temu, dan foto baru akan langsung muncul di notification bar HP kamu.',
        timestamp: new Date().toISOString()
      };
      setToasts((current) => [confirmToast, ...current]);
    }
  };

  const handleDismissPermission = () => {
    setShowPermissionPrompt(false);
    try {
      localStorage.setItem('cerita_kita_push_prompt_dismissed', 'true');
    } catch {}
  };

  const getCategoryIcon = (category: InAppToast['category']) => {
    switch (category) {
      case 'pin':
        return <MapPin className="h-4 w-4 text-emerald-500" />;
      case 'photo':
        return <Camera className="h-4 w-4 text-rose-500" />;
      case 'wishlist':
        return <Heart className="h-4 w-4 text-pink-500 fill-pink-500/20" />;
      case 'reply':
        return <MessageCircle className="h-4 w-4 text-amber-500" />;
      case 'streak':
        return <Flame className="h-4 w-4 text-orange-500 fill-orange-500/20" />;
      case 'notes':
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case 'movie':
        return <Film className="h-4 w-4 text-indigo-500" />;
      case 'meeting':
        return <HeartHandshake className="h-4 w-4 text-rose-500" />;
      case 'hammer':
        return <Hammer className="h-4 w-4 text-amber-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-rose-400" />;
    }
  };

  return (
    <aside
      aria-label="Pemberitahuan Sistem"
      className="pointer-events-none fixed top-3 inset-x-0 z-[9999] flex flex-col items-center gap-2 px-3 sm:top-5 sm:px-4"
    >
      <AnimatePresence>
        {/* Soft One-Time Push Permission Prompt */}
        {showPermissionPrompt && (
          <motion.div
            key="permission-prompt-pill"
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-2.5 rounded-2xl border border-rose-400/50 bg-gradient-to-r from-rose-900/95 via-rose-950/95 to-[#240810]/95 p-3 text-rose-50 shadow-[0_16px_36px_rgba(244,63,94,0.32)] backdrop-blur-xl sm:rounded-3xl sm:p-3.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/25 ring-1 ring-rose-400/40">
              <Bell className="h-4 w-4 text-rose-200 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                  Notifikasi Layar HP
                </span>
              </div>
              <p className="text-[11px] font-bold leading-tight text-white/95">
                Aktifkan sekali saja untuk selalu menerima update cinta di HP
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void handleGrantPermission()}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 text-[11px] font-black text-white shadow-md transition hover:scale-105 active:scale-95"
              >
                <Check className="h-3 w-3" />
                <span>Izinkan</span>
              </button>
              <button
                type="button"
                onClick={handleDismissPermission}
                className="rounded-lg p-1 text-rose-300/80 hover:bg-white/10 hover:text-white"
                aria-label="Tutup notifikasi perizinan"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Realtime Push Notifications / Dynamic Island Toasts */}
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-rose-300/70 bg-gradient-to-r from-white/95 via-rose-50/95 to-pink-50/95 p-3 text-[#501522] shadow-[0_16px_36px_rgba(244,63,94,0.22),0_4px_12px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-rose-500/35 dark:from-[#2e0f18]/95 dark:via-[#1e070d]/95 dark:to-[#2b0c16]/95 dark:text-rose-100 sm:rounded-3xl sm:p-3.5"
          >
            {/* Glowing Icon Orb */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-[0_2px_8px_rgba(244,63,94,0.15)] ring-1 ring-rose-200/60 dark:bg-white/10 dark:ring-rose-400/20">
              {getCategoryIcon(toast.category)}
              {/* Pulsing Live Dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            </div>

            {/* Notification Body */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-300">
                  Savero & Soffie
                </span>
                <span className="text-[9px] font-semibold text-[#8c4857] dark:text-rose-300/60">
                  baru saja
                </span>
              </div>
              <h5 className="truncate text-xs font-black tracking-tight text-[#6b1527] dark:text-rose-100">
                {toast.title}
              </h5>
              <p className="line-clamp-2 text-[11px] leading-snug font-medium text-[#5c2a36] dark:text-rose-200/90 mt-0.5">
                {toast.message}
              </p>
            </div>

            {/* Optional Action or Close */}
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  setToasts((current) => current.filter((item) => item.id !== toast.id));
                }}
                className="shrink-0 rounded-xl bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95"
              >
                {toast.actionLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="shrink-0 rounded-lg p-1.5 text-[#a9576b] hover:bg-rose-100/60 dark:text-rose-300 dark:hover:bg-white/10 transition-colors"
                aria-label="Tutup notifikasi"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </aside>
  );
};
