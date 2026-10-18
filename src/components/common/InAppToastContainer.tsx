import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, MapPin, Camera, Heart, MessageCircle, Flame, BookOpen } from 'lucide-react';
import { InAppToast, subscribeToToasts } from '../../utils/notifications';

export const InAppToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<InAppToast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((current) => [toast, ...current.slice(0, 3)]); // Keep up to 3 toasts
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4500);
    });
    return unsubscribe;
  }, []);

  const getCategoryIcon = (category: InAppToast['category']) => {
    switch (category) {
      case 'pin': return <MapPin className="h-4 w-4 text-emerald-500" />;
      case 'photo': return <Camera className="h-4 w-4 text-rose-500" />;
      case 'wishlist': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'reply': return <MessageCircle className="h-4 w-4 text-amber-500" />;
      case 'streak': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'notes': return <BookOpen className="h-4 w-4 text-purple-500" />;
      default: return <Sparkles className="h-4 w-4 text-rose-400" />;
    }
  };

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed top-4 inset-x-0 z-[9999] flex flex-col items-center gap-2 px-4 sm:top-6">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto flex max-w-sm w-full items-center gap-3 rounded-2xl border border-rose-300/40 bg-gradient-to-r from-white/95 via-rose-50/95 to-pink-50/95 p-3 text-[#501522] shadow-[0_10px_25px_rgba(169,43,73,0.18)] backdrop-blur-md dark:border-rose-500/25 dark:from-[#35151e]/95 dark:via-[#2a0f16]/95 dark:to-[#3b1723]/95 dark:text-rose-100"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-white/10">
              {getCategoryIcon(toast.category)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-black tracking-tight text-[#8c2840] dark:text-rose-200">
                  {toast.title}
                </span>
              </div>
              <p className="line-clamp-2 text-[11px] leading-snug font-medium text-[#65333f] dark:text-rose-300/90">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="shrink-0 rounded-lg p-1 text-[#a9576b] hover:bg-rose-100/60 dark:text-rose-300 dark:hover:bg-white/10"
              aria-label="Tutup notifikasi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
