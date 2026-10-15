import React from 'react';
import { motion } from 'motion/react';
import {
  HeartPulse,
  Sparkles,
  Film,
  Award,
  Heart,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface AppLauncherHubProps {
  onSelectSection: (sectionId: string) => void;
  isGuestMode: boolean;
}

export const AppLauncherHub: React.FC<AppLauncherHubProps> = ({
  onSelectSection,
  isGuestMode
}) => {
  const hubItems = [
    {
      id: 'siklus',
      title: 'Siklus Flo & Intim',
      subtitle: 'Zona Privat Sensitif',
      desc: 'Kalender ovulasi medis, reminder haid, dan log intim privat.',
      icon: HeartPulse,
      color: 'bg-[#f9dce1] text-[#9f4d63] dark:bg-[#70404e] dark:text-rose-100 border-rose-200 dark:border-white/10',
      sensitive: true
    },
    {
      id: 'wishlist',
      title: 'Wishlist Tempat',
      subtitle: 'Daftar Kunjungan Berdua',
      desc: 'Simpan tempat impian yang ingin dikunjungi bersama.',
      icon: Sparkles,
      color: 'bg-[#f9dce1] text-[#9f4d63] dark:bg-[#70404e] dark:text-rose-100 border-rose-200 dark:border-white/10'
    },
    {
      id: 'film',
      title: 'Bioskop & Aktor',
      subtitle: 'Kencan Movie Night',
      desc: 'Koleksi film ditonton berdua, watchlist, dan rating hati.',
      icon: Film,
      color: 'bg-[#f9dce1] text-[#9f4d63] dark:bg-[#70404e] dark:text-rose-100 border-rose-200 dark:border-white/10'
    },
    {
      id: 'piala',
      title: 'Lemari Piala 3D',
      subtitle: 'Achievement Medals',
      desc: 'Medali 3D interaktif yang berputar & bersinar atas milestone cinta.',
      icon: Award,
      color: 'bg-[#f9dce1] text-[#9f4d63] dark:bg-[#70404e] dark:text-rose-100 border-rose-200 dark:border-white/10'
    },
    {
      id: 'romantis',
      title: 'Surat & Rekap',
      subtitle: 'Kapsul Waktu & Lagu',
      desc: 'Surat terkunci di masa depan, soundtrack cinta, dan Love Wrapped.',
      icon: Heart,
      color: 'bg-[#f9dce1] text-[#9f4d63] dark:bg-[#70404e] dark:text-rose-100 border-rose-200 dark:border-white/10'
    }
  ];

  const visibleItems = hubItems.filter((item) => {
    if (isGuestMode && item.sensitive) return false;
    return true;
  });

  const handleLaunch = (id: string) => {
    soundManager.playTap();
    onSelectSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-8 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <span className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] block mb-1">
          NAVIGASI MENU UTAMA
        </span>
        <h3 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
          Ruang Eksplorasi Cinta
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 font-sans-clean mt-1">
          Ketuk salah satu bagian di bawah atau gunakan bilah navigasi di bawah layar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleLaunch(item.id)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-left p-4 rounded-2xl bg-white/70 dark:bg-black/30 border border-[#7A1018]/15 hover:border-[#7A1018]/40 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs flex-shrink-0 ${item.color} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-serif-title font-bold text-sm sm:text-base text-[#3B0A0F] dark:text-[#EFE6DA] group-hover:text-[#7A1018] dark:group-hover:text-[#F4B6C2] transition-colors">
                      {item.title}
                    </h4>
                    {item.sensitive && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        Privat
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-sans-clean text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#7A1018]/5 group-hover:bg-[#7A1018] group-hover:text-white dark:bg-white/5 dark:group-hover:bg-[#F4B6C2] dark:group-hover:text-[#3B0A0F] flex items-center justify-center transition-colors flex-shrink-0 ml-2">
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
