import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Flame,
  Image as ImageIcon,
  RotateCcw,
  Heart,
  Play,
  Pause
} from 'lucide-react';
import { CoupleProfile, DailyCheckin, MoodExpression } from '../../types';
import { moodImage } from '../../utils/mood';
import { soundManager } from '../../utils/audio';

interface PhotoMemoriesModalProps {
  checkins: DailyCheckin[];
  streak: number;
  onSelectPhoto: (photo: {
    id?: string;
    photoUrl: string;
    photoPath?: string | null;
    caption?: string | null;
    profile: CoupleProfile;
    date: string;
    expression: MoodExpression;
    rating?: number | null;
    checkin?: DailyCheckin;
  }) => void;
  onClose: () => void;
}

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const PhotoMemoriesModal: React.FC<PhotoMemoriesModalProps> = ({
  checkins,
  streak,
  onSelectPhoto,
  onClose
}) => {
  const [profileFilter, setProfileFilter] = useState<'all' | 'Savero' | 'Soffie'>('all');
  const [rewindMonth, setRewindMonth] = useState<string | null>(null);
  const [rewindIndex, setRewindIndex] = useState<number>(0);

  // Semua entri yang punya foto
  const photoEntries = useMemo(() => {
    return checkins
      .filter((entry) => Boolean(entry.photo_url))
      .filter((entry) => profileFilter === 'all' || entry.profile === profileFilter)
      .sort((a, b) => b.log_date.localeCompare(a.log_date));
  }, [checkins, profileFilter]);

  // Kelompokkan per YYYY-MM
  const groupedByMonth = useMemo(() => {
    const map = new Map<string, DailyCheckin[]>();
    for (const entry of photoEntries) {
      const yearMonth = entry.log_date.slice(0, 7);
      const list = map.get(yearMonth) ?? [];
      list.push(entry);
      map.set(yearMonth, list);
    }
    return Array.from(map.entries());
  }, [photoEntries]);

  // Daftar foto untuk fitur Rewind (Slideshow ala Locket)
  const activeRewindPhotos = useMemo(() => {
    if (!rewindMonth) return [];
    const found = groupedByMonth.find(([ym]) => ym === rewindMonth);
    return found ? [...found[1]].reverse() : [];
  }, [rewindMonth, groupedByMonth]);

  useEffect(() => {
    if (!rewindMonth || activeRewindPhotos.length === 0) return;
    const timer = window.setInterval(() => {
      setRewindIndex((prev) => {
        if (prev + 1 >= activeRewindPhotos.length) {
          setRewindMonth(null);
          return 0;
        }
        return prev + 1;
      });
    }, 1400);
    return () => window.clearInterval(timer);
  }, [rewindMonth, activeRewindPhotos.length]);

  const formatMonthTitle = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
  };

  // Membangun struktur kalender 7-kolom ala Locket App
  const buildCalendarDays = (yearMonth: string, items: DailyCheckin[]) => {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr); // 1..12

    const daysInMonth = new Date(year, month, 0).getDate();
    // Hari pertama bulan (0=Minggu .. 6=Sabtu) -> konversi ke Senin=0 .. Minggu=6
    const firstDayJs = new Date(year, month - 1, 1).getDay();
    const leadingEmpty = (firstDayJs + 6) % 7;

    // Map tanggal (1..31) ke foto pada tanggal tersebut
    const dayMap = new Map<number, DailyCheckin[]>();
    for (const item of items) {
      const dayNum = Number(item.log_date.slice(8, 10));
      const list = dayMap.get(dayNum) ?? [];
      list.push(item);
      dayMap.set(dayNum, list);
    }

    const cells: Array<
      | { type: 'empty'; key: string }
      | { type: 'day'; key: string; day: number; entries: DailyCheckin[] }
    > = [];

    for (let i = 0; i < leadingEmpty; i++) {
      cells.push({ type: 'empty', key: `empty-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        type: 'day',
        key: `${yearMonth}-${d}`,
        day: d,
        entries: dayMap.get(d) ?? []
      });
    }
    return cells;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-md sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Container Utama 3D Clay Ala Locket */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 340 }}
        className="relative my-auto flex max-h-[88vh] w-full max-w-[400px] flex-col overflow-hidden rounded-[2.6rem] border border-white/95 bg-gradient-to-b from-[#fffdfd] via-[#fff5f8] to-[#ffe8f0] text-[#4a1623] shadow-[0_25px_65px_rgba(80,15,35,0.35),inset_0_4px_8px_#ffffff,inset_0_-6px_14px_rgba(230,140,170,0.35)] dark:border-white/15 dark:from-[#2b131d] dark:via-[#210d15] dark:to-[#16080e] dark:text-rose-50"
      >
        {/* Top Locket-Style Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2.5">
          <div className="flex items-center gap-2">
            {/* Avatar Couple Mini */}
            <div className="flex -space-x-2">
              <img
                src={moodImage('Soffie', 'bahagia')}
                alt="Soffie"
                className="h-7 w-7 rounded-full border-2 border-white bg-rose-100 object-cover object-top shadow-xs dark:border-[#2b131d]"
              />
              <img
                src={moodImage('Savero', 'bahagia')}
                alt="Savero"
                className="h-7 w-7 rounded-full border-2 border-white bg-amber-100 object-cover object-top shadow-xs dark:border-[#2b131d]"
              />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black tracking-tight text-[#5a1829] dark:text-rose-100">
                Memories
              </h3>
              <p className="text-[9.5px] font-bold text-[#9e475d] dark:text-rose-300/75">
                Kalender Locket Savero & Soffie
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/90 bg-white/90 text-[#6e2236] shadow-[0_2px_6px_rgba(140,30,60,0.1),inset_0_1px_2px_#fff] transition hover:bg-rose-500 hover:text-white active:scale-90 dark:border-white/10 dark:bg-white/10 dark:text-rose-200"
            aria-label="Tutup"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Filter Pill Compact (3D Clay Segmented Control) */}
        <div className="mx-5 mb-3 flex items-center gap-1 rounded-full border border-white/80 bg-rose-200/45 p-1 shadow-inner dark:border-white/10 dark:bg-black/30">
          {(['all', 'Soffie', 'Savero'] as const).map((tab) => {
            const active = profileFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setProfileFilter(tab);
                }}
                className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1 text-[10.5px] font-extrabold transition-all ${
                  active
                    ? 'bg-gradient-to-b from-white to-[#fff0f5] text-[#8c2840] shadow-[0_2px_6px_rgba(150,30,60,0.12),inset_0_1px_1px_#fff] dark:from-rose-600 dark:to-rose-700 dark:text-white'
                    : 'text-[#844556] hover:text-[#501522] dark:text-rose-300/70'
                }`}
              >
                {tab === 'all' ? (
                  <span>Semua</span>
                ) : (
                  <>
                    <img
                      src={moodImage(tab, 'bahagia')}
                      alt={tab}
                      className="h-3.5 w-3.5 rounded-full object-cover object-top"
                    />
                    <span>{tab}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Overlay Rewind Slideshow (Jika Tombol Rewind Diklik) */}
        <AnimatePresence>
          {rewindMonth && activeRewindPhotos[rewindIndex] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-5 backdrop-blur-xl"
            >
              <div className="mb-3 flex w-full max-w-[280px] items-center justify-between text-white">
                <span className="flex items-center gap-1.5 text-xs font-black text-rose-300">
                  <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                  Rewind {formatMonthTitle(rewindMonth)}
                </span>
                <button
                  type="button"
                  onClick={() => setRewindMonth(null)}
                  className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-white/25"
                >
                  Selesai
                </button>
              </div>

              <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-[22%] border-2 border-white/80 shadow-2xl">
                <img
                  src={activeRewindPhotos[rewindIndex].photo_url!}
                  alt="Rewind"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
                  <span>{activeRewindPhotos[rewindIndex].profile}</span>
                  <span>{activeRewindPhotos[rewindIndex].log_date}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 flex w-full max-w-[240px] gap-1">
                {activeRewindPhotos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      idx <= rewindIndex ? 'bg-rose-400' : 'bg-white/25'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Monthly Calendar Cards (Ala Locket Reference) */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-none">
          {groupedByMonth.length === 0 ? (
            <div className="my-6 flex flex-col items-center justify-center rounded-[2rem] border border-white/80 bg-white/60 py-12 px-4 text-center shadow-inner dark:border-white/10 dark:bg-white/5">
              <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-400 dark:bg-rose-950/60">
                <ImageIcon className="h-6 w-6" />
              </div>
              <p className="text-xs font-black text-[#682436] dark:text-rose-200">
                Belum Ada Locket Instant
              </p>
              <p className="mt-0.5 text-[10.5px] font-medium text-[#9e586a] dark:text-rose-300/70">
                Jepret momen harianmu agar kalender kenangan ini terisi penuh!
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {groupedByMonth.map(([yearMonth, items], groupIndex) => {
                const cells = buildCalendarDays(yearMonth, items);

                return (
                  <React.Fragment key={yearMonth}>
                    {/* Konektor Garis Putus-Putus Melengkung Ala Locket Antar Bulan */}
                    {groupIndex > 0 && (
                      <svg
                        width="36"
                        height="26"
                        viewBox="0 0 36 26"
                        className="my-1 text-rose-300 dark:text-rose-700/60"
                        aria-hidden="true"
                      >
                        <path
                          d="M 18 2 C 8 9, 28 17, 18 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}

                    {/* Kartu Kalender Bulanan 3D Clay */}
                    <div className="w-full rounded-[2rem] border border-white/95 bg-gradient-to-b from-white/95 via-[#fff9fb]/95 to-[#ffeef4]/90 p-3.5 shadow-[0_10px_24px_rgba(140,30,65,0.08),inset_0_3px_6px_#ffffff,inset_0_-3px_6px_rgba(235,150,175,0.2)] dark:border-white/10 dark:from-[#361723] dark:via-[#2a111b] dark:to-[#210c14] dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)]">
                      {/* Header Kartu Bulan + Tombol Rewind */}
                      <div className="mb-2.5 flex items-center justify-between px-1">
                        <div>
                          <h4 className="text-[13px] font-black capitalize tracking-tight text-[#521625] dark:text-rose-100">
                            {formatMonthTitle(yearMonth)}
                          </h4>
                          <span className="text-[9.5px] font-bold text-[#a65369] dark:text-rose-300/70">
                            {items.length} momen tersimpan
                          </span>
                        </div>

                        {/* Tombol Rewind Ala Locket App */}
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playTap();
                            setRewindIndex(0);
                            setRewindMonth(yearMonth);
                          }}
                          className="flex items-center gap-1 rounded-full border border-white/90 bg-gradient-to-b from-rose-100 to-pink-200/80 px-2.5 py-1 text-[10px] font-extrabold text-[#85223c] shadow-[0_2px_6px_rgba(160,30,65,0.12),inset_0_1px_1px_#fff] transition hover:scale-105 active:scale-95 dark:border-white/15 dark:from-rose-900/80 dark:to-rose-950 dark:text-rose-100"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Rewind</span>
                        </button>
                      </div>

                      {/* Header Hari (Sen - Min) */}
                      <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center">
                        {WEEKDAYS.map((day) => (
                          <span
                            key={day}
                            className="text-[8.5px] font-extrabold uppercase tracking-wider text-[#b36a7d] dark:text-rose-300/50"
                          >
                            {day}
                          </span>
                        ))}
                      </div>

                      {/* Grid 7-Kolom Kalender Locket (Squircle Photo atau Soft Dot) */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {cells.map((cell) => {
                          if (cell.type === 'empty') {
                            return <div key={cell.key} className="aspect-square" />;
                          }

                          const primaryEntry = cell.entries[0];
                          const hasBothProfiles = cell.entries.length >= 2;

                          if (!primaryEntry) {
                            // Hari tanpa foto -> Titik Halus (Dot) persis seperti Locket App
                            return (
                              <div
                                key={cell.key}
                                className="flex aspect-square items-center justify-center"
                                title={`Tanggal ${cell.day}`}
                              >
                                <span className="h-2 w-2 rounded-full bg-rose-300/55 shadow-inner dark:bg-rose-200/15" />
                              </div>
                            );
                          }

                          return (
                            <motion.button
                              key={cell.key}
                              type="button"
                              whileHover={{ scale: 1.08, zIndex: 10 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                soundManager.playTap();
                                onSelectPhoto({
                                  id: primaryEntry.id,
                                  photoUrl: primaryEntry.photo_url!,
                                  photoPath: primaryEntry.photo_path,
                                  caption: primaryEntry.diary_text,
                                  profile: primaryEntry.profile,
                                  date: primaryEntry.log_date,
                                  expression: primaryEntry.expression,
                                  rating: primaryEntry.rating,
                                  checkin: primaryEntry
                                });
                              }}
                              className={`group relative aspect-square overflow-hidden rounded-[26%] border-[1.5px] bg-rose-100 shadow-[0_3px_8px_rgba(140,30,60,0.16)] transition ${
                                hasBothProfiles
                                  ? 'border-amber-400 ring-1 ring-amber-300/60'
                                  : 'border-white dark:border-rose-200/30'
                              }`}
                              title={`${cell.day} ${formatMonthTitle(yearMonth)} · ${primaryEntry.profile}`}
                            >
                              <img
                                src={primaryEntry.photo_url!}
                                alt={primaryEntry.diary_text || `Tanggal ${cell.day}`}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                                loading="lazy"
                              />

                              {/* Nomor Tanggal Kecil di Sudut Kanan Bawah */}
                              <span className="absolute bottom-0.5 right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-black/55 px-1 text-[7.5px] font-black text-white backdrop-blur-xs">
                                {cell.day}
                              </span>

                              {/* Badge Couple Heart jika keduanya upload di hari yang sama */}
                              {hasBothProfiles ? (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-white shadow-xs">
                                  <Heart className="h-2 w-2 fill-white" />
                                </span>
                              ) : (
                                <span
                                  className={`absolute top-0.5 left-0.5 h-2 w-2 rounded-full border border-white shadow-2xs ${
                                    primaryEntry.profile === 'Soffie'
                                      ? 'bg-pink-400'
                                      : 'bg-amber-400'
                                  }`}
                                />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Floating Stats Pill Ala Locket App Reference */}
        <div className="border-t border-rose-200/40 bg-white/60 px-5 py-3 backdrop-blur-md dark:border-white/10 dark:bg-black/30">
          <div className="mx-auto flex max-w-[270px] items-center justify-center gap-3 rounded-full border border-white/95 bg-gradient-to-b from-white to-[#ffeef4] px-4 py-1.5 text-[11px] font-black text-[#5c192b] shadow-[0_4px_12px_rgba(140,30,60,0.1),inset_0_2px_3px_#ffffff] dark:border-white/15 dark:from-[#381824] dark:to-[#260e17] dark:text-rose-100">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow-2xs" />
              <span>{photoEntries.length} Instant</span>
            </span>
            <span className="h-3 w-[1.5px] rounded-full bg-rose-200 dark:bg-white/15" />
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
              <span>{streak}d streak</span>
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};