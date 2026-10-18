import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  const profileImage =
    activeProfile === 'Savero'
      ? '/characters/expressions/savero/bahagia.png'
      : '/characters/expressions/soffie/gemas-sayang.png';

  const handleAction = (callback?: () => void) => {
    soundManager.playTap();
    callback?.();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-rose-200/50 bg-[#fffaf5]/92 shadow-[0_2px_10px_rgba(140,30,60,0.06)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#1e0f15]/92 dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-1.5 px-2.5 sm:h-16 sm:gap-3 sm:px-5">
        {/* Brand / Logo Area */}
        <button
          onClick={() => handleAction(onGoHome)}
          className="flex min-w-0 shrink-0 items-center gap-1.5 text-left transition hover:opacity-90 sm:gap-2.5"
          title="Ke Beranda"
          aria-label="Savero dan Soffie, ke beranda"
        >
          <motion.img
            src="/logo/logo%20couple%203d.png"
            alt="Logo Savero dan Soffie"
            className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_5px_rgba(140,30,60,0.18)] sm:h-10 sm:w-10"
            whileHover={{ rotate: 4, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 320 }}
          />
          <div className="flex flex-col justify-center">
            <span className="block truncate font-black tracking-wide text-[#43121b] dark:text-rose-100 text-[12px] min-[360px]:text-[13px] sm:text-[15px] leading-tight">
              SAVERO &amp; SOFFIE
            </span>
            <span className="block truncate text-[8.5px] font-bold text-[#8c4053] dark:text-rose-300/80 leading-none sm:text-[9.5px]">
              {sectionNames[activeSection] || 'Ruang cerita kita'}
            </span>
          </div>
        </button>

        {/* Right Controls Area: 3D Clay Action Dock */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {/* Profile Switcher Capsule */}
          <div className="relative">
            <button
              onClick={() => {
                if (!profileLocked) {
                  soundManager.playTap();
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
              <span className="grid h-6.5 w-6.5 sm:h-7 sm:w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-white/80 bg-rose-100 shadow-2xs dark:bg-white/10">
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
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-white/90 bg-gradient-to-b from-[#ffffff] to-[#fff6f8] p-2 text-[#4a1624] shadow-[0_16px_36px_rgba(120,25,50,0.22),inset_0_1px_2px_#fff] backdrop-blur-xl dark:border-white/10 dark:from-[#2e131d] dark:to-[#1f0b13] dark:text-rose-100 dark:shadow-[0_18px_40px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-150">
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
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white bg-rose-100 shadow-2xs dark:bg-white/10">
                      <img
                        src={
                          profile === 'Savero'
                            ? '/characters/expressions/savero/bahagia.png'
                            : '/characters/expressions/soffie/gemas-sayang.png'
                        }
                        alt=""
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

          {/* Pengaturan (Settings) */}
          <button
            onClick={() => handleAction(onOpenSettings)}
            className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/90 bg-gradient-to-b from-white to-[#fff0f4] text-[#8c2840] shadow-[0_2px_5px_rgba(140,30,60,0.08),inset_0_1px_1px_#fff] transition hover:scale-105 active:scale-95 dark:border-white/10 dark:from-[#351824] dark:to-[#220d16] dark:text-rose-200"
            title="Pengaturan"
            aria-label="Buka pengaturan"
          >
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          {/* Keluar dari Akun (Logout) */}
          {onSignOut && (
            <button
              onClick={() => handleAction(onSignOut)}
              className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/90 bg-gradient-to-b from-white to-[#fff0f4] text-rose-600 shadow-[0_2px_5px_rgba(140,30,60,0.08),inset_0_1px_1px_#fff] transition hover:scale-105 active:scale-95 dark:border-white/10 dark:from-[#351824] dark:to-[#220d16] dark:text-rose-300"
              title="Keluar dari akun"
              aria-label="Keluar dari akun"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}

          {/* Mode Tamu (Guest Mode, layar sedang ke atas) */}
          <div className="hidden items-center min-[600px]:flex">
            <button
              onClick={() => handleAction(onToggleGuestMode)}
              className={`flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/90 bg-gradient-to-b from-white to-[#fff0f4] shadow-[0_2px_5px_rgba(140,30,60,0.08),inset_0_1px_1px_#fff] transition hover:scale-105 active:scale-95 dark:border-white/10 dark:from-[#351824] dark:to-[#220d16] ${
                settings.isGuestMode
                  ? 'text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-400/50'
                  : 'text-[#8c2840] dark:text-rose-200'
              }`}
              title={settings.isGuestMode ? 'Mode tamu aktif' : 'Aktifkan mode tamu'}
              aria-label={settings.isGuestMode ? 'Nonaktifkan mode tamu' : 'Aktifkan mode tamu'}
            >
              {settings.isGuestMode ? (
                <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
