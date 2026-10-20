import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface AppSplashScreenProps {
  authReady: boolean;
  authenticated: boolean;
  profileReady: boolean;
  profileError: string | null;
  onFinish: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  authReady,
  authenticated,
  profileReady,
  profileError,
  onFinish
}) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Menghubungkan ke ruang kita…');
  const finishedRef = useRef(false);

  // Preload all critical assets & lazy loaded components
  useEffect(() => {
    let alive = true;

    const preloadImage = (src: string): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });

    const preloadAll = async () => {
      try {
        await Promise.allSettled([
          // 1. Critical visual images
          preloadImage('/logo/logo%20couple%203d.webp'),
          preloadImage("/characters/Savero's%20Chibi%20Character%20Sticker%20Sheet.webp"),
          preloadImage("/characters/Soffie's%20Chibi%20Character%20Sheet.webp"),

          // 2. All section chunks so sub-page navigation is 0ms instant
          import('../map/MemoryMapSection'),
          import('../cycle/FloCycleSection'),
          import('../movies/MoviesSection'),
          import('../wishlist/WishlistSection'),
          import('../badges/TrophyCabinetSection'),
          import('../romantic/RomanticExtrasSection'),
          import('../settings/SettingsModal'),

          // 3. Fonts ready
          document.fonts ? document.fonts.ready : Promise.resolve()
        ]);
      } catch (err) {
        console.warn('Splash preloader non-blocking error:', err);
      }
    };

    void preloadAll();

    return () => {
      alive = false;
    };
  }, []);

  // Orchestrate Progress smoothly based on application readiness
  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) => {
        let target = 30;

        if (profileError) {
          // If error, speed to 100% so user can see retry button
          target = 100;
        } else if (authReady && !authenticated) {
          // Unauthenticated -> direct to login gate
          target = 100;
        } else if (authReady && authenticated && profileReady) {
          // Fully ready!
          target = 100;
        } else if (authReady && authenticated) {
          // Profile is hydrating
          target = 75;
        } else if (authReady) {
          target = 50;
        }

        if (current >= target) {
          return current;
        }

        // Smooth step increment
        const diff = target - current;
        const step = Math.max(1, Math.ceil(diff * 0.2));
        return Math.min(target, current + step);
      });
    }, 45);

    return () => window.clearInterval(interval);
  }, [authReady, authenticated, profileReady, profileError]);

  // Update dynamic status text based on progress number
  useEffect(() => {
    if (progress >= 100) {
      setStatusText('Dunia kita siap dibuka ✨');
    } else if (progress >= 75) {
      setStatusText('Menyiapkan seluruh ruangan & kenangan…');
    } else if (progress >= 50) {
      setStatusText('Memuat catatan cinta & profil…');
    } else if (progress >= 30) {
      setStatusText('Memeriksa sesi privat…');
    } else {
      setStatusText('Menghubungkan ke ruang kita…');
    }
  }, [progress]);

  // Handle completion when progress hits 100%
  useEffect(() => {
    if (progress >= 100 && !finishedRef.current) {
      finishedRef.current = true;
      const timer = window.setTimeout(() => {
        try {
          soundManager.playPop();
        } catch {
          // audio context might be locked before user gesture
        }
        onFinish();
      }, 220);

      return () => window.clearTimeout(timer);
    }
  }, [progress, onFinish]);

  // Safety fallback: maximum 4.5s splash to never lock the user out on poor network
  useEffect(() => {
    const safetyTimer = window.setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        setProgress(100);
        onFinish();
      }
    }, 4500);

    return () => window.clearTimeout(safetyTimer);
  }, [onFinish]);

  return (
    <motion.div
      key="app-splash"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.02,
        transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
      }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between overflow-hidden bg-[#fffaf0] p-6 text-[#57202c] select-none transition-colors duration-300 dark:bg-[#21151a] dark:text-rose-50"
    >
      {/* Ambient background light orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-[#f4b6c2]/35 blur-3xl dark:bg-[#9e3b58]/25" />
        <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-[#f3d6c0]/50 blur-3xl dark:bg-[#7e5361]/25" />
      </div>

      {/* Top Header Stamp */}
      <div className="relative z-10 flex w-full items-center justify-center pt-3">
        <div className="flex items-center gap-1.5 rounded-full border border-rose-200/60 bg-white/70 px-3.5 py-1 text-[10px] font-black tracking-widest uppercase text-rose-500 shadow-sm backdrop-blur-md dark:border-rose-900/40 dark:bg-[#2d1b22]/70 dark:text-rose-300">
          <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Our Little World</span>
        </div>
      </div>

      {/* Central Emblem & Brand */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center">
        {/* Floating 3D Logo Emblem */}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mb-5"
        >
          {/* Pulsing Backlight Halo */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-rose-300/40 via-pink-400/30 to-amber-200/40 blur-xl animate-pulse dark:from-rose-600/30 dark:to-pink-900/30" />

          {/* Logo Container Card */}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-[2.2rem] border border-white/80 bg-gradient-to-b from-white to-[#fff2f4] p-3 shadow-[0_16px_36px_rgba(150,30,60,0.14),inset_0_2px_4px_white] dark:border-white/10 dark:from-[#3a202a] dark:to-[#2b141d] dark:shadow-[0_18px_40px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.06)]">
            <img
              src="/logo/logo%20couple%203d.webp"
              alt="Logo Savero & Soffie"
              className="h-full w-full object-contain drop-shadow-md"
            />
            {/* Heart Badge Accent */}
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-rose-500 to-pink-400 text-white shadow-md dark:border-[#2b141d]">
              <Heart className="h-4 w-4 fill-current animate-bounce" />
            </div>
          </div>
        </motion.div>

        {/* Title & Tagline */}
        <h1 className="font-script text-3xl sm:text-4xl text-[#a64e68] drop-shadow-sm dark:text-[#f0a8b7]">
          Savero &amp; Soffie
        </h1>
        <p className="mt-1 text-xs font-black tracking-[0.22em] uppercase text-[#80646a] dark:text-rose-200/70">
          Semarang <span className="opacity-50">•</span> Est. 2026
        </p>

        {/* Dynamic Progress Bar & Status */}
        <div className="mt-7 flex flex-col items-center">
          {/* Progress Bar Pill */}
          <div className="relative h-2 w-56 sm:w-64 overflow-hidden rounded-full border border-rose-200/70 bg-rose-100/80 p-0.5 shadow-inner dark:border-rose-900/50 dark:bg-rose-950/60">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 shadow-[0_0_10px_rgba(244,114,182,0.8)]"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            />
          </div>

          {/* Progress Counter & Context Status */}
          <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
            <span className="font-medium text-[#80646a] dark:text-rose-200/80">
              {statusText}
            </span>
            <span className="font-mono font-bold text-[#a64e68] dark:text-rose-300">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Romantic Footer Note */}
      <div className="relative z-10 pb-2 text-center">
        <p className="max-w-xs text-[11px] italic leading-relaxed text-[#8f6d74] dark:text-rose-300/70 sm:max-w-sm">
          “Keadilan hukum di meja hijau, ketulusan stetoskop di ruang rawat, dan satu cinta abadi di sudut Semarang.”
        </p>
      </div>
    </motion.div>
  );
};
