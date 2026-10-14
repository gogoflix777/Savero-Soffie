import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Compass, Sparkles, Scale, Coffee, Stethoscope } from 'lucide-react';
import { Heart3DCanvas } from './Heart3DCanvas';
import { AppSettings } from '../../types';
import {
  AnimatedScales,
  AnimatedStethoscope,
  AnimatedCoffee,
  AnimatedHeart,
  AnimatedSparkles
} from '../common/AnimatedIcons';

interface HeroSectionProps {
  settings: AppSettings;
  onExploreClick: () => void;
  onAddMemoryClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  settings,
  onExploreClick,
  onAddMemoryClick
}) => {
  const [timeTogether, setTimeTogether] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const anniversary = new Date(settings.anniversaryDate + 'T00:00:00');
      const now = new Date();
      const diff = now.getTime() - anniversary.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeTogether({ days, hours, minutes, seconds });
      } else {
        // If anniversary is in the future relative to system clock
        const days = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));
        setTimeTogether({ days, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.anniversaryDate]);

  return (
    <section className="relative overflow-hidden bg-[#EFE6DA] dark:bg-[#250709] py-10 sm:py-16 px-4 border-b border-[#7A1018]/15 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* 3-Column Desktop / 1-Column Mobile Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Savero (Hukum UNNES - Palu Hakim & Kopi) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col items-center text-center p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-[#7A1018]/10 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A58B]/25 border border-[#C9A58B] flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <AnimatedScales className="w-8 h-8 text-[#7A1018] dark:text-[#D9B26F]" />
            </div>
            <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
              Savero
            </h3>
            <span className="text-[11px] font-sans-clean font-semibold tracking-wider text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 uppercase">
              Hukum UNNES
            </span>
            <p className="text-xs font-editorial italic text-[#3B0A0F]/80 dark:text-[#EFE6DA]/80 mt-3 leading-relaxed">
              "Keadilan di meja hijau, kesetiaan dan pelindung abadi untuk bidadari keperawatanku."
            </p>
            <div className="mt-4 flex items-center space-x-1.5 text-xs font-sans-clean text-[#7A1018] dark:text-[#F4B6C2] bg-[#C9A58B]/15 px-3 py-1 rounded-full border border-[#C9A58B]/30">
              <AnimatedCoffee className="w-3.5 h-3.5 text-[#C9A58B]" />
              <span>Kopi V60 & Palu Keadilan</span>
            </div>
          </div>

          {/* Center Column: 3D Heart, Romance Script & Day Counter */}
          <div className="lg:col-span-6 flex flex-col items-center text-center">
            {/* Script Calligraphy Accent */}
            <div className="font-script text-3xl sm:text-4xl md:text-5xl text-[#7A1018] dark:text-[#F4B6C2] mb-1">
              cerita kita
            </div>

            <p className="font-editorial text-sm sm:text-base text-[#3B0A0F]/80 dark:text-[#EFE6DA]/80 max-w-md mx-auto italic mb-3">
              "Dari malam pertama di Mie Gacoan hingga subuh berkabut di jalan baru Jangli–Undip, ini adalah ruang privat perjalanan cinta kita di Semarang."
            </p>

            {/* 3D Interactive Heart Canvas (Clay heart rotating to cursor/tilt) */}
            <div className="my-2 relative flex items-center justify-center">
              <Heart3DCanvas className="w-64 h-64 sm:w-72 sm:h-72" />
            </div>

            {/* Day Counter Display (Hitung Hari) */}
            <div className="mt-2 mb-6 bg-white/60 dark:bg-black/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#7A1018]/15 shadow-sm inline-flex items-center space-x-4">
              <div className="text-center">
                <span className="font-serif-title text-2xl sm:text-3xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                  {timeTogether.days}
                </span>
                <span className="block text-[9px] font-sans-clean font-semibold uppercase tracking-wider text-gray-500">
                  Hari
                </span>
              </div>
              <span className="text-[#7A1018] dark:text-[#F4B6C2] font-serif-title text-xl font-light">
                •
              </span>
              <div className="text-center">
                <span className="font-serif-title text-2xl sm:text-3xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                  {timeTogether.hours}
                </span>
                <span className="block text-[9px] font-sans-clean font-semibold uppercase tracking-wider text-gray-500">
                  Jam
                </span>
              </div>
              <span className="text-[#7A1018] dark:text-[#F4B6C2] font-serif-title text-xl font-light">
                •
              </span>
              <div className="text-center">
                <span className="font-serif-title text-2xl sm:text-3xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                  {timeTogether.minutes}
                </span>
                <span className="block text-[9px] font-sans-clean font-semibold uppercase tracking-wider text-gray-500">
                  Menit
                </span>
              </div>
              <span className="text-[#7A1018] dark:text-[#F4B6C2] font-serif-title text-xl font-light">
                •
              </span>
              <div className="text-center">
                <span className="font-serif-title text-2xl sm:text-3xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                  {timeTogether.seconds}
                </span>
                <span className="block text-[9px] font-sans-clean font-semibold uppercase tracking-wider text-gray-500">
                  Detik
                </span>
              </div>
            </div>

            {/* Square Maroon Buttons matching specification */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={onExploreClick}
                className="w-full sm:w-auto px-6 py-3 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] text-xs font-sans-clean font-bold tracking-[0.2em] uppercase rounded-none border border-[#7A1018] shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                <Compass className="w-4 h-4" />
                <span>JELAJAHI PETA KENANGAN</span>
              </button>

              <button
                type="button"
                onClick={onAddMemoryClick}
                className="w-full sm:w-auto px-5 py-3 bg-transparent hover:bg-[#7A1018]/10 text-[#7A1018] dark:text-[#F4B6C2] text-xs font-sans-clean font-bold tracking-[0.2em] uppercase rounded-none border border-[#7A1018] transition-all flex items-center justify-center space-x-2"
              >
                <AnimatedHeart className="w-4 h-4 text-[#7A1018]" />
                <span>TAMBAH KENANGAN BARU</span>
              </button>
            </div>
          </div>

          {/* Right Column: Soffie (Keperawatan UNDIP - Stetoskop & Matcha) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col items-center text-center p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-[#7A1018]/10 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-16 h-16 rounded-2xl bg-[#BFD8B8]/30 border border-[#BFD8B8] flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <AnimatedStethoscope className="w-8 h-8 text-emerald-800 dark:text-[#BFD8B8]" />
            </div>
            <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
              Soffie
            </h3>
            <span className="text-[11px] font-sans-clean font-semibold tracking-wider text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 uppercase">
              Keperawatan UNDIP
            </span>
            <p className="text-xs font-editorial italic text-[#3B0A0F]/80 dark:text-[#EFE6DA]/80 mt-3 leading-relaxed">
              "Merawat dengan penuh ketulusan, dan hatiku telah menemukan rumah ternyamannya di sisimu."
            </p>
            <div className="mt-4 flex items-center space-x-1.5 text-xs font-sans-clean text-[#3B0A0F] dark:text-[#BFD8B8] bg-[#BFD8B8]/20 px-3 py-1 rounded-full border border-[#BFD8B8]/40">
              <AnimatedSparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Iced Matcha & Stetoskop Kasih</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
