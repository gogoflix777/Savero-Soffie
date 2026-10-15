import React from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, Settings, Moon, Sun, Award, LogOut } from 'lucide-react';
import { AppSettings } from '../../types';

interface HeaderProps {
  settings: AppSettings;
  activeSection: string;
  onToggleGuestMode: () => void;
  onLockApp: () => void;
  onOpenSettings: () => void;
  onToggleDarkMode: () => void;
  onGoHome?: () => void;
  onOpenBadges?: () => void;
  onSignOut?: () => void;
}

const sectionNames: Record<string, string> = {
  beranda: 'Beranda', peta: 'Peta kenangan', timeline: 'Linimasa', siklus: 'Siklus',
  film: 'Film & serial', wishlist: 'Wishlist', piala: 'Medali', romantis: 'Romantis'
};

export const Header: React.FC<HeaderProps> = ({ settings, activeSection, onToggleGuestMode, onLockApp, onOpenSettings, onToggleDarkMode, onGoHome, onOpenBadges, onSignOut }) => (
  <header className="sticky top-0 z-30 border-b border-rose-100 bg-[#fffaf0]/95 shadow-[0_3px_12px_rgba(105,35,49,.04)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#21151a]/95">
    <div className="mx-auto flex min-h-[104px] max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:min-h-[78px] sm:px-6">
      <button onClick={onGoHome} className="flex min-w-0 items-center gap-2.5 text-left" title="Ke Beranda" aria-label="Savero dan Soffie, ke beranda">
        <motion.img src="/logo/logo%20couple%203d.png" alt="Logo Savero dan Soffie" className="h-[78px] w-[78px] shrink-0 object-contain max-[400px]:h-[62px] max-[400px]:w-[62px] sm:h-[66px] sm:w-[66px]" whileHover={{ rotate: 5, scale: 1.06 }} transition={{ type: 'spring', stiffness: 300 }} />
        <span className="min-w-0">
          <span className="block truncate font-sans-clean text-[22px] font-extrabold tracking-wide text-[#43121b] dark:text-rose-100 max-[400px]:text-[12px] sm:text-xl">SAVERO &amp; SOFFIE</span>
          <span className={`${activeSection === 'beranda' ? 'hidden sm:block' : 'block'} truncate text-[10px] text-[#9a6870] dark:text-rose-200/60 sm:text-[11px]`}>{sectionNames[activeSection] || 'Ruang cerita kita'}</span>
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
        <button onClick={onOpenBadges} className="header-icon-button text-[#43121b] dark:text-rose-200" title="Medali pencapaian" aria-label="Buka medali pencapaian"><Award className="h-6 w-6" /></button>
        <button onClick={onLockApp} className="header-icon-button text-[#43121b] dark:text-rose-200" title="Kunci aplikasi" aria-label="Kunci aplikasi"><Lock className="h-6 w-6" /></button>
        <button onClick={onToggleDarkMode} className="header-icon-button text-[#43121b] dark:text-rose-200" title={settings.darkMode ? 'Ubah ke mode terang' : 'Ubah ke mode gelap'} aria-label={settings.darkMode ? 'Ubah ke mode terang' : 'Ubah ke mode gelap'}>{settings.darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
        <button onClick={onOpenSettings} className="header-icon-button text-[#43121b] dark:text-rose-200" title="Pengaturan" aria-label="Pengaturan"><Settings className="h-6 w-6" /></button>
        {onSignOut && <button onClick={onSignOut} className="header-icon-button text-[#43121b] dark:text-rose-200" title="Keluar dari akun" aria-label="Keluar dari akun"><LogOut className="h-5 w-5" /></button>}
        <div className="hidden items-center sm:flex">
          <button onClick={onToggleGuestMode} className={`header-icon-button ${settings.isGuestMode ? 'text-emerald-700 dark:text-emerald-300' : 'text-[#9a6870]'}`} title={settings.isGuestMode ? 'Mode tamu aktif' : 'Aktifkan mode tamu'} aria-label={settings.isGuestMode ? 'Nonaktifkan mode tamu' : 'Aktifkan mode tamu'}>{settings.isGuestMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
        </div>
      </div>
    </div>
  </header>
);
