import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Eye,
  EyeOff,
  Settings,
  Moon,
  Sun,
  Award,
  LogOut,
  ChevronDown,
  Check
} from 'lucide-react';
import { AppSettings } from '../../types';
import { soundManager } from '../../utils/audio';

interface HeaderProps {
  settings: AppSettings;
  activeProfile: 'Savero' | 'Soffie';
  onSelectProfile: (profile: 'Savero' | 'Soffie') => void;
  activeSection: string;
  onToggleGuestMode: () => void;
  onLockApp: () => void;
  onOpenSettings: () => void;
  onToggleDarkMode: () => void;
  onGoHome?: () => void;
  onOpenBadges?: () => void;
  onSignOut?: () => void;
  profileLocked?: boolean;
}

const sectionNames: Record<string, string> = {
  beranda: 'Beranda',
  peta: 'Peta kenangan',
  timeline: 'Linimasa',
  siklus: 'Siklus',
  film: 'Film & serial',
  wishlist: 'Wishlist',
  piala: 'Medali',
  romantis: 'Romantis'
};

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeSection,
  activeProfile,
  onSelectProfile,
  onToggleGuestMode,
  onLockApp,
  onOpenSettings,
  onToggleDarkMode,
  onGoHome,
  onOpenBadges,
  onSignOut,
  profileLocked = false
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const profileImage =
    activeProfile === 'Savero'
      ? '/characters/expressions/savero/bahagia.webp'
      : '/characters/expressions/soffie/gemas-sayang.webp';

  const handleAction = (callback?: () => void) => {
    soundManager.playTap();
    callback?.();
  };

  // Close menus when clicking outside
  useEffect(() => {
    if (!menuOpen && !profileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, profileMenuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-rose-200/50 bg-[#fffaf5]/92 shadow-[0_2px_10px_rgba(140,30,60,0.06)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#1e0f15]/92 dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-1.5 px-2 min-[360px]:px-2.5 sm:h-16 sm:gap-3 sm:px-5">
        {/* Brand / Logo Area */}
        <button
          onClick={() => handleAction(onGoHome)}
          className="flex min-w-0 shrink-0 items-center gap-1.5 text-left transition hover:opacity-90 min-[360px]:gap-2 sm:gap-2.5"
          title="Ke Beranda"
          aria-label="Savero dan Soffie, ke beranda"
        >
          <motion.img
            src="/logo/logo%20couple%203d.webp"
            alt="Logo Savero dan Soffie"
            loading="eager"
            decoding="async"
            className="h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 shrink-0 object-contain drop-shadow-[0_2px_5px_rgba(140,30,60,0.18)] sm:h-10 sm:w-10"
            whileHover={{ rotate: 4, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 320 }}
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="block truncate font-black tracking-wide text-[#43121b] dark:text-rose-100 text-[11px] min-[360px]:text-[13px] sm:text-[15px] leading-tight">
              SAVERO &amp; SOFFIE
            </span>
            <span className="block truncate text-[8px] min-[360px]:text-[8.5px] font-bold text-[#8c4053] dark:text-rose-300/80 leading-none sm:text-[9.5px]">
              {sectionNames[activeSection] || 'Ruang cerita kita'}
            </span>
          </div>
        </button>

        {/* Right Controls Area: Profile Capsule + Action Controls */}
        <div
          ref={menuContainerRef}
          className="relative flex shrink-0 items-center gap-1 sm:gap-1.5"
        >
          {/* Profile Switcher Capsule */}
          <div className="relative">
            <button
              onClick={() => {
                if (!profileLocked) {
                  soundManager.playTap();
                  setMenuOpen(false);
                  setProfileMenuOpen((open) => !open);
                }
              }}
              aria-expanded={!profileLocked && profileMenuOpen}
              aria-label={
                profileLocked
                  ? `Akun ${activeProfile}`
                  : `Profil aktif ${activeProfile}, ganti profil`
              }
              className="flex items-center gap-1 rounded-full border border-white/90 bg-gradient-to-b from-white to-[#fff0f4] p-0.5 pr-1.5 shadow-[0_2px_5px_rgba(140,30,60,0.08),inset_0_1px_1px_#fff] transition hover:scale-105 active:scale-95 dark:border-white/10 dark:from-[#351824] dark:to-[#220d16] dark:shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
            >
              <span className="grid h-6 w-6 min-[360px]:h-6.5 min-[360px]:w-6.5 sm:h-7 sm:w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-white/80 bg-rose-100 shadow-2xs dark:bg-white/10">
                <img
                  src={profileImage}
                  alt=""
                  className="h-full w-full object-cover object-top"
                />
              </span>
              <span className="hidden text-[10.5px] font-extrabold text-[#57202c] dark:text-rose-100 min-[480px]:inline">
                {activeProfile}
              </span>
              {!profileLocked && (
                <ChevronDown className="h-3 w-3 text-[#8c4053] dark:text-rose-300" />
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {!profileLocked && profileMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 min-[360px]:w-52 rounded-2xl border border-white/90 bg-gradient-to-b from-[#ffffff] to-[#fff6f8] p-2 text-[#4a1624] shadow-[0_16px_36px_rgba(120,25,50,0.22),inset_0_1px_2px_#fff] backdrop-blur-xl dark:border-white/10 dark:from-[#2e131d] dark:to-[#1f0b13] dark:text-rose-100 dark:shadow-[0_18px_40px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-150">
                <p className="px-2 pb-1.5 pt-1 text-[9.5px] font-black uppercase tracking-wider text-[#9a4b5d] dark:text-rose-300/80">
                  Pilih Profil
                </p>
                {(['Savero', 'Soffie'] as const).map((profile) => (
                  <button
                    key={profile}
                    onClick={() => {
                      soundManager.playTap();
                      onSelectProfile(profile);
                      setProfileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition ${
                      activeProfile === profile
                        ? 'bg-rose-100/80 font-black text-rose-900 shadow-2xs dark:bg-white/10 dark:text-rose-100'
                        : 'hover:bg-rose-50/80 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white bg-rose-100 shadow-2xs dark:bg-white/10">
                      <img
                        src={
                          profile === 'Savero'
                            ? '/characters/expressions/savero/bahagia.webp'
                            : '/characters/expressions/soffie/gemas-sayang.webp'
                        }
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover object-top"
                      />
                    </span>
                    <span className="flex-1">
                      <span className="block text-xs font-black leading-tight text-[#4e1824] dark:text-rose-50">
                        {profile}
                      </span>
                      <span className="text-[9.5px] font-semibold text-[#8c4053] dark:text-rose-300/70">
                        {profile === 'Savero' ? 'Ruang Savero' : 'Ruang Soffie'}
                      </span>
                    </span>
                    {activeProfile === profile && (
                      <Check className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts on Larger Screens (>= 640px) */}
          <div className="hidden min-[640px]:flex items-center gap-1 sm:gap-1.5">
            {/* Medali / Badges Button */}
            {onOpenBadges && (
              <button
                onClick={() => handleAction(onOpenBadges)}
                className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/90 bg-gradient-to-b from-white to-[#fff0f4] text-amber-500 shadow-[0_2px_5px_rgba(140,30,60,0.08),inset_0_1px_1px_#fff] transition hover:scale-105 active:scale-95 dark:border-white/10 dark:from-[#351824] dark:to-[#220d16] dark:text-amber-300"
                title="Medali Pencapaian"
                aria-label="Buka medali pencapaian"
              >
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            )}

            {/* Kunci Aplikasi (Lock) */}
            <button
              onClick={() => handleAction(onLockApp)}
              className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/90 bg-gradient-to-b from-white to-[#fff0f4] text-[#8c2840] shadow-[0_2px_5px_rgba(140,30,60,0.08),inset_0_1px_1px_#fff] transition hover:scale-105 active:scale-95 dark:border-white/10 dark:from-[#351824] dark:to-[#220d16] dark:text-rose-200"
              title="Kunci Aplikasi"
              aria-label="Kunci aplikasi"
            >
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {/* Mode Terang / Gelap (Theme Toggle) */}
            <button
              onClick={() => handleAction(onToggleDarkMode)}
              className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/90 bg-gradient-to-b from-white to-[#fff0f4] text-amber-500 shadow-[0_2px_5px_rgba(140,30,60,0.08),inset_0_1px_1px_#fff] transition hover:scale-105 active:scale-95 dark:border-white/10 dark:from-[#351824] dark:to-[#220d16] dark:text-amber-300"
              title={settings.darkMode ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap'}
              aria-label={settings.darkMode ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap'}
            >
              {settings.darkMode ? (
                <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
          </div>

          {/* ANIMATED BURGER BUTTON (Accessible on all screens, compact on mobile/iPhone 5) */}
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setProfileMenuOpen(false);
              setMenuOpen((prev) => !prev);
            }}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Tutup menu aksi' : 'Buka menu aksi & navigasi'}
            title="Menu Navigasi & Pengaturan"
            className={`relative flex h-7.5 w-7.5 min-[360px]:h-8 min-[360px]:w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full border transition hover:scale-105 active:scale-95 ${
              menuOpen
                ? 'border-rose-400/80 bg-rose-100/90 shadow-[0_0_12px_rgba(244,63,94,0.35)] dark:border-rose-500/60 dark:bg-rose-950/60'
                : 'border-white/90 bg-gradient-to-b from-white to-[#fff0f4] shadow-[0_2px_5px_rgba(140,30,60,0.08),inset_0_1px_1px_#fff] dark:border-white/10 dark:from-[#351824] dark:to-[#220d16] dark:shadow-[0_2px_6px_rgba(0,0,0,0.4)]'
            }`}
          >
            <div className="relative flex h-3.5 w-3.5 min-[360px]:w-4 flex-col justify-between items-center pointer-events-none">
              {/* Top Bar -> Cross Down 45 deg */}
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                className="block h-[2px] w-full rounded-full bg-[#8c2840] dark:bg-rose-200 origin-center"
              />
              {/* Middle Bar -> Shrink & Fade */}
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.15 }}
                className="block h-[2px] w-full rounded-full bg-[#8c2840] dark:bg-rose-200 origin-center"
              />
              {/* Bottom Bar -> Cross Up -45 deg */}
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                className="block h-[2px] w-full rounded-full bg-[#8c2840] dark:bg-rose-200 origin-center"
              />
            </div>
          </button>

          {/* COMPACT FLOATING BURGER ACTION MENU */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: -8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-1rem)] rounded-3xl border border-rose-300/60 bg-gradient-to-b from-white/98 via-[#fff7f9]/98 to-[#ffedf2]/98 p-2.5 text-[#4a1624] shadow-[0_20px_45px_rgba(120,25,50,0.22),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_2px_#fff] backdrop-blur-2xl dark:border-white/10 dark:from-[#2e131d]/98 dark:via-[#220d16]/98 dark:to-[#1a0810]/98 dark:text-rose-100 dark:shadow-[0_22px_50px_rgba(0,0,0,0.8)]"
              >
                {/* Header Info inside Menu */}
                <div className="flex items-center justify-between border-b border-rose-200/50 pb-2 px-2 dark:border-white/10 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                      Menu Aksi Cepat
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-[#8c4053] dark:text-rose-400/80">
                    Savero &amp; Soffie
                  </span>
                </div>

                <div className="space-y-1">
                  {/* 1. Medali / Badges */}
                  {onOpenBadges && (
                    <button
                      type="button"
                      onClick={() => {
                        handleAction(onOpenBadges);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition hover:bg-rose-100/70 active:scale-[0.98] dark:hover:bg-white/10"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-2xs dark:bg-amber-950/40 dark:text-amber-300">
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-black text-[#57202c] dark:text-rose-100 leading-tight">
                          Medali &amp; Pencapaian
                        </span>
                        <span className="block truncate text-[9.5px] font-medium text-[#8c4053] dark:text-rose-300/80">
                          Lihat trofi &amp; lencana cinta
                        </span>
                      </div>
                    </button>
                  )}

                  {/* 2. Kunci Aplikasi */}
                  <button
                    type="button"
                    onClick={() => {
                      handleAction(onLockApp);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition hover:bg-rose-100/70 active:scale-[0.98] dark:hover:bg-white/10"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-[#8c2840] shadow-2xs dark:bg-rose-950/40 dark:text-rose-300">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-black text-[#57202c] dark:text-rose-100 leading-tight">
                        Kunci Aplikasi
                      </span>
                      <span className="block truncate text-[9.5px] font-medium text-[#8c4053] dark:text-rose-300/80">
                        Kunci layar dengan PIN 4-digit
                      </span>
                    </div>
                  </button>

                  {/* 3. Mode Terang / Gelap */}
                  <button
                    type="button"
                    onClick={() => {
                      handleAction(onToggleDarkMode);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-2xl px-2.5 py-2 text-left transition hover:bg-rose-100/70 active:scale-[0.98] dark:hover:bg-white/10"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-2xs dark:bg-amber-950/40 dark:text-amber-300">
                        {settings.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-black text-[#57202c] dark:text-rose-100 leading-tight">
                          Mode Tampilan
                        </span>
                        <span className="block truncate text-[9.5px] font-medium text-[#8c4053] dark:text-rose-300/80">
                          {settings.darkMode ? 'Tampilan Gelap' : 'Tampilan Terang'}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-rose-200/60 px-2 py-0.5 text-[9.5px] font-extrabold text-[#7a1018] dark:bg-white/15 dark:text-rose-200">
                      {settings.darkMode ? '🌙 Gelap' : '☀️ Terang'}
                    </span>
                  </button>

                  {/* 4. Mode Tamu (Guest Mode) */}
                  <button
                    type="button"
                    onClick={() => {
                      handleAction(onToggleGuestMode);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-2xl px-2.5 py-2 text-left transition hover:bg-rose-100/70 active:scale-[0.98] dark:hover:bg-white/10"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
                          settings.isGuestMode
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-[#8c2840] dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {settings.isGuestMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-black text-[#57202c] dark:text-rose-100 leading-tight">
                          Mode Tamu (Privasi)
                        </span>
                        <span className="block truncate text-[9.5px] font-medium text-[#8c4053] dark:text-rose-300/80">
                          Sembunyikan pin &amp; log intim
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${
                        settings.isGuestMode
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-rose-200/60 text-[#7a1018] dark:bg-white/15 dark:text-rose-200'
                      }`}
                    >
                      {settings.isGuestMode ? '🛡️ Aktif' : 'Nonaktif'}
                    </span>
                  </button>

                  {/* 5. Pengaturan Aplikasi */}
                  <button
                    type="button"
                    onClick={() => {
                      handleAction(onOpenSettings);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition hover:bg-rose-100/70 active:scale-[0.98] dark:hover:bg-white/10"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shadow-2xs dark:bg-purple-950/40 dark:text-purple-300">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-black text-[#57202c] dark:text-rose-100 leading-tight">
                        Pengaturan Aplikasi
                      </span>
                      <span className="block truncate text-[9.5px] font-medium text-[#8c4053] dark:text-rose-300/80">
                        Notifikasi, tanggal jadian, cadangan
                      </span>
                    </div>
                  </button>

                  {/* 6. Keluar dari Akun */}
                  {onSignOut && (
                    <div className="pt-1 mt-1 border-t border-rose-200/50 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          handleAction(onSignOut);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition hover:bg-red-100/80 active:scale-[0.98] dark:hover:bg-red-950/40"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 shadow-2xs dark:bg-red-950/50 dark:text-red-400">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-black text-red-700 dark:text-red-300 leading-tight">
                            Keluar dari Akun
                          </span>
                          <span className="block truncate text-[9.5px] font-medium text-red-600/80 dark:text-red-400/80">
                            Keluar dari sesi login saat ini
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
