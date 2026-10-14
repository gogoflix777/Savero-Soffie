import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, Settings, Moon, Sun, Heart, Sparkles } from 'lucide-react';
import { AppSettings } from '../../types';

interface HeaderProps {
  settings: AppSettings;
  activeSection: string;
  onToggleGuestMode: () => void;
  onLockApp: () => void;
  onOpenSettings: () => void;
  onToggleDarkMode: () => void;
  onGoHome?: () => void;
}

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  beranda: { title: 'SAVERO & SOFFIE', subtitle: 'Ruang Cinta Semarang • Est. 2026' },
  peta: { title: 'PETA KENANGAN', subtitle: 'Titik Jejak Kencan di Semarang & Sekitarnya' },
  timeline: { title: 'LINIMASA CINTA', subtitle: 'Kilas Balik Hari Bersejarah Berdua' },
  siklus: { title: 'SIKLUS & INTIM', subtitle: 'Kalender Flo & Kesehatan Reproduksi Privat' },
  film: { title: 'BIOSKOP & AKTOR', subtitle: 'Daftar Tontonan & Rating Kencan' },
  wishlist: { title: 'WISHLIST IMPIAN', subtitle: 'Matcha Soffie vs Kopi Savero & Destinasi' },
  piala: { title: 'LEMARI PIALA 3D', subtitle: 'Pencapaian Interaktif & Medali Cinta' },
  romantis: { title: 'SURAT & REKAP', subtitle: 'Kapsul Waktu, Lagu Kita & Love Wrapped' }
};

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeSection,
  onToggleGuestMode,
  onLockApp,
  onOpenSettings,
  onToggleDarkMode,
  onGoHome
}) => {
  const currentMeta = SECTION_TITLES[activeSection] || SECTION_TITLES.beranda;

  return (
    <header className="sticky top-0 z-30 bg-[#EFE6DA]/95 dark:bg-[#1a0507]/95 backdrop-blur-md border-b border-[#7A1018]/15 shadow-sm transition-colors duration-300">
      {/* Top Thin Status Bar */}
      <div className="bg-[#7A1018] text-[#EFE6DA] px-3 py-1.5 text-[11px] font-sans-clean font-semibold tracking-[0.2em] uppercase flex items-center justify-between">
        <button
          onClick={onGoHome}
          className="flex items-center space-x-2 text-left focus:outline-hidden group"
          title="Kembali ke Beranda"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-[#F4B6C2] animate-pulse" />
          <span className="hidden sm:inline group-hover:text-[#F4B6C2] transition-colors">RUANG PRIVAT CINTA</span>
          <span className="sm:hidden font-bold group-hover:text-[#F4B6C2] transition-colors">SAVERO & SOFFIE</span>
          <span className="opacity-60 hidden md:inline">• EST. 2026 SEMARANG</span>
        </button>

        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          {/* Guest Mode Indicator / Button */}
          <button
            onClick={onToggleGuestMode}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 py-0.5 rounded-lg transition-all min-h-[30px] ${
              settings.isGuestMode
                ? 'bg-[#BFD8B8] text-[#3B0A0F] font-bold shadow-xs'
                : 'hover:bg-white/15 text-[#EFE6DA]'
            }`}
            title={
              settings.isGuestMode
                ? 'Mode Tamu aktif: Data intim, siklus & pin rahasia disembunyikan'
                : 'Beralih ke Mode Tamu (Aman dari intipan)'
            }
          >
            {settings.isGuestMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="text-[10px] tracking-wider font-sans-clean font-bold">
              {settings.isGuestMode ? 'TAMU' : 'PRIVAT'}
            </span>
          </button>

          {/* Quick Lock Button */}
          <button
            onClick={onLockApp}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-white/15 transition text-[#EFE6DA] min-h-[30px]"
            title="Kunci Aplikasi dengan PIN"
          >
            <Lock className="w-3.5 h-3.5 text-[#F4B6C2]" />
            <span className="hidden sm:inline text-[10px] tracking-wider">KUNCI</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg hover:bg-white/15 transition text-[#EFE6DA] min-h-[30px] min-w-[30px] flex items-center justify-center"
            title={settings.darkMode ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap'}
          >
            {settings.darkMode ? (
              <Sun className="w-3.5 h-3.5 text-[#D9B26F]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#F4B6C2]" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg hover:bg-white/15 transition text-[#EFE6DA] min-h-[30px] min-w-[30px] flex items-center justify-center"
            title="Pengaturan Aplikasi"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile-Friendly App Title Bar (No Top Navigation Tabs) */}
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between">
        <button
          onClick={onGoHome}
          className="flex items-center space-x-2.5 text-left focus:outline-hidden"
          title="Ke Beranda"
        >
          {/* Emblem: Heart Monogram */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#7A1018] text-[#EFE6DA] shadow-md flex-shrink-0">
            <Heart className="w-4 h-4 fill-[#F4B6C2] text-[#F4B6C2]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3B0A0F]" />
            </div>
          </div>

          <div>
            <div className="font-serif-title text-base sm:text-lg font-bold tracking-[0.14em] text-[#7A1018] dark:text-[#F4B6C2] uppercase leading-tight">
              SAVERO & SOFFIE
            </div>
            <div className="text-[10px] font-sans-clean font-medium tracking-wider text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 uppercase">
              {settings.saveroCollege} • {settings.soffieCollege}
            </div>
          </div>
        </button>

        {/* Dynamic Current Page Badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="text-right pl-2"
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#7A1018]/10 dark:bg-white/10 text-[#7A1018] dark:text-[#F4B6C2] text-[10px] sm:text-xs font-sans-clean font-bold tracking-wider uppercase">
              {currentMeta.title}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </header>
  );
};
