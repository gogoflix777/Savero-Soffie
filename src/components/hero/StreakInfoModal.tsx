import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, CheckCircle2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { soundManager } from '../../utils/audio';

export interface StreakTierConfig {
  level: number;
  minDays: number;
  name: string;
  outerStart: string;
  outerEnd: string;
  innerColor: string;
  textColor: string;
  glowColor: string;
  speed: string;
  hasSparks: boolean;
  desc: string;
}

export const STREAK_TIERS: StreakTierConfig[] = [
  {
    level: 1,
    minDays: 1,
    name: 'Warm Spark (1d+)',
    outerStart: '#ffcf40',
    outerEnd: '#f59e0b',
    innerColor: '#fff8cc',
    textColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    speed: '2.1s',
    hasSparks: false,
    desc: 'Percikan awal api cinta yang hangat. Rawat setiap hari agar api terus menyala!'
  },
  {
    level: 2,
    minDays: 3,
    name: 'Blazing Orange (3d+)',
    outerStart: '#ffaa1d',
    outerEnd: '#f95700',
    innerColor: '#fff099',
    textColor: '#ff7700',
    glowColor: 'rgba(255, 119, 0, 0.4)',
    speed: '1.85s',
    hasSparks: false,
    desc: 'Kobaran oranye cerah! Tanda kebersamaan 3 hari berturut-turut mulai mengakar kuat.'
  },
  {
    level: 3,
    minDays: 10,
    name: 'Fiery Red-Orange (10d+)',
    outerStart: '#ff7b29',
    outerEnd: '#ea2a15',
    innerColor: '#ffe082',
    textColor: '#ff4d29',
    glowColor: 'rgba(255, 77, 41, 0.45)',
    speed: '1.65s',
    hasSparks: false,
    desc: 'Api merah membara 10 hari! Bukti komitmen dan kasih sayang yang semakin menyala.'
  },
  {
    level: 4,
    minDays: 30,
    name: 'Ruby Crimson (30d+)',
    outerStart: '#ff5c77',
    outerEnd: '#e11d48',
    innerColor: '#ffccd5',
    textColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.48)',
    speed: '1.45s',
    hasSparks: true,
    desc: 'Sebulan penuh cinta! Membuka bentuk lidah api 3 tingkat & percikan bara delima ruby.'
  },
  {
    level: 5,
    minDays: 100,
    name: 'Neon Magenta (100d+)',
    outerStart: '#ff66cc',
    outerEnd: '#db2777',
    innerColor: '#ffd6f0',
    textColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.52)',
    speed: '1.3s',
    hasSparks: true,
    desc: '100 hari luar biasa! Api neon magenta menyala kencang dengan partikel bara cinta.'
  },
  {
    level: 6,
    minDays: 200,
    name: 'Mythic Violet (200d+)',
    outerStart: '#c084fc',
    outerEnd: '#7e22ce',
    innerColor: '#f3e8ff',
    textColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    speed: '1.15s',
    hasSparks: true,
    desc: 'Tingkat mitis legendaris 200 hari! Api ungu abadi yang menjadi saksi cinta sejati kita.'
  }
];

export const getStreakTier = (days: number): StreakTierConfig => {
  if (days >= 200) return STREAK_TIERS[5];
  if (days >= 100) return STREAK_TIERS[4];
  if (days >= 30) return STREAK_TIERS[3];
  if (days >= 10) return STREAK_TIERS[2];
  if (days >= 3) return STREAK_TIERS[1];
  return STREAK_TIERS[0];
};

/**
 * Komponen SVG Flame Reusable
 * Menggunakan siluet dan gradient api sesuai tingkatan level streak
 */
export const StreakFlameSvg: React.FC<{
  tier: StreakTierConfig;
  isDead?: boolean;
  className?: string;
  idPrefix?: string;
}> = ({ tier, isDead = false, className = 'h-full w-full', idPrefix = 'flame' }) => {
  const gradId = `${idPrefix}-grad-${tier.level}-${isDead ? 'dead' : 'live'}`;

  return (
    <div
      className="relative flex h-full w-full items-center justify-center select-none"
      style={
        {
          '--flame-glow': isDead ? 'rgba(120, 120, 120, 0.2)' : tier.glowColor,
          '--flame-speed': tier.speed
        } as React.CSSProperties
      }
    >
      <svg
        viewBox="0 0 28 32"
        className={`streak-multi-flame-svg overflow-visible ${className} ${
          isDead ? 'streak-multi-flame-dead' : ''
        }`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDead ? '#9ca3af' : tier.outerStart} />
            <stop offset="100%" stopColor={isDead ? '#4b5563' : tier.outerEnd} />
          </linearGradient>
        </defs>

        {/* Siluet Lidah Api & Inti Api Berbeda untuk Setiap Tingkatan Level */}
        {tier.level === 1 && (
          /* Level 1: Warm Spark (1d) - Kuncup percikan api bulat mungil & anggun */
          <>
            <path
              d="M14 4 C14 4 20.5 11.5 20.5 18 C20.5 23.5 17.5 28 14 28 C10.5 28 7.5 23.5 7.5 18 C7.5 11.5 14 4 14 4 Z"
              fill={`url(#${gradId})`}
            />
            <path
              d="M14 16 C14 16 17 19.5 17 22.5 C17 25 15.6 26.5 14 26.5 C12.4 26.5 11 25 11 22.5 C11 19.5 14 16 14 16 Z"
              fill={isDead ? '#d1d5db' : tier.innerColor}
              opacity="0.92"
            />
          </>
        )}

        {tier.level === 2 && (
          /* Level 2: Blazing Orange (3d) - Api 2 lidah klasik membelah ke samping */
          <>
            <path
              d="M14.5 2.5 C14.5 2.5 21 8.5 20 14.5 C22 13 22.8 11 22.8 11 C25 15.5 24.2 22 20.5 26 C18.8 28 16.5 29 14 29 C11.2 29 8.8 27.5 7.2 25.5 C4 21 4.5 14.5 7.5 10 C7.5 10 8.2 12.5 10 13.5 C9.5 8 14.5 2.5 14.5 2.5 Z"
              fill={`url(#${gradId})`}
            />
            <path
              d="M14 15 C14 15 17.5 18.5 17.2 22 C17 25 15.8 26.8 14 26.8 C12.2 26.8 11 25 10.8 22 C10.5 18.5 14 15 14 15 Z"
              fill={isDead ? '#d1d5db' : tier.innerColor}
              opacity="0.92"
            />
          </>
        )}

        {tier.level === 3 && (
          /* Level 3: Fiery Red-Orange (10d) - Api 3 lidah tajam berkobar membara */
          <>
            <path
              d="M14 1.5 C14 1.5 18.5 7.5 18 12 C20.5 10 22.5 8 22.5 8 C25 13.5 24.5 20.5 21 25.5 C19 28 16.5 29.5 14 29.5 C11.5 29.5 9 28 7 25.5 C3.5 20.5 3 13.5 5.5 8 C5.5 8 7.5 10 10 12 C9.5 7.5 14 1.5 14 1.5 Z"
              fill={`url(#${gradId})`}
            />
            <path
              d="M14 13.5 C14 13.5 18 17.5 17.5 22 C17.2 25.5 15.8 27.2 14 27.2 C12.2 27.2 10.8 25.5 10.5 22 C10 17.5 14 13.5 14 13.5 Z"
              fill={isDead ? '#d1d5db' : tier.innerColor}
              opacity="0.92"
            />
          </>
        )}

        {tier.level === 4 && (
          /* Level 4: Ruby Crimson (30d) - Api 4 lidah delima bertingkat dengan sayap melengkung */
          <>
            <path
              d="M14 1 C14 1 18 6.5 17.5 10.5 C19.5 9 21.5 7.5 21.5 7.5 C23 11 23.5 14 22 16.5 C24.5 15.5 25.8 13.5 25.8 13.5 C27 18.5 25.5 24 21.5 27.5 C19.2 29.5 16.5 30.5 14 30.5 C11.5 30.5 8.8 29.5 6.5 27.5 C2.5 24 1 18.5 2.2 13.5 C2.2 13.5 3.5 15.5 6 16.5 C4.5 14 5 11 6.5 7.5 C6.5 7.5 8.5 9 10.5 10.5 C10 6.5 14 1 14 1 Z"
              fill={`url(#${gradId})`}
            />
            <path
              d="M14 13 C14 13 18.5 17 18 22.5 C17.6 26.5 16 28 14 28 C12 28 10.4 26.5 10 22.5 C9.5 17 14 13 14 13 Z"
              fill={isDead ? '#d1d5db' : tier.innerColor}
              opacity="0.92"
            />
          </>
        )}

        {tier.level === 5 && (
          /* Level 5: Neon Magenta (100d) - Mahkota api kerajaan 5 lidah berkobar (flaming crown) */
          <>
            <path
              d="M14 0.5 C14 0.5 17.5 5 17.2 9 C19 7.2 21 6 21 6 C22.8 9.5 22.5 12.8 21 15 C23.5 14 25.5 12 25.5 12 C27.5 16.5 26.8 22.5 23 26.8 C20.5 29.5 17.2 31 14 31 C10.8 31 7.5 29.5 5 26.8 C1.2 22.5 0.5 16.5 2.5 12 C2.5 12 4.5 14 7 15 C5.5 12.8 5.2 9.5 7 6 C7 6 9 7.2 10.8 9 C10.5 5 14 0.5 14 0.5 Z"
              fill={`url(#${gradId})`}
            />
            <path
              d="M14 11.5 C14 11.5 16.8 15.5 18.5 18 C18.2 23 16.5 27.5 14 27.5 C11.5 27.5 9.8 23 9.5 18 C11.2 15.5 14 11.5 14 11.5 Z"
              fill={isDead ? '#d1d5db' : tier.innerColor}
              opacity="0.92"
            />
          </>
        )}

        {tier.level >= 6 && (
          /* Level 6: Mythic Violet (200d+) - Api Mitis Phoenix bersayap megah & tanduk melengkung */
          <>
            <path
              d="M14 0.2 C14 0.2 16.8 4 16.5 7.5 C18.2 5.5 20.5 4.5 20.5 4.5 C21.8 7.8 21.5 10.5 20 12.5 C22.8 11 25.2 9 25.2 9 C27.5 13.5 26.5 17.5 24 19.5 C27.2 19 28.5 16.5 28.5 16.5 C29.5 22 26.5 27.5 22 30 C19.5 31.5 16.8 32 14 32 C11.2 32 8.5 31.5 6 30 C1.5 27.5 -1.5 22 -0.5 16.5 C-0.5 16.5 0.8 19 4 19.5 C1.5 17.5 0.5 13.5 2.8 9 C2.8 9 5.2 11 8 12.5 C6.5 10.5 6.2 7.8 7.5 4.5 C7.5 4.5 9.8 5.5 11.5 7.5 C11.2 4 14 0.2 14 0.2 Z"
              fill={`url(#${gradId})`}
            />
            <path
              d="M14 10 C14 10 18.5 14.5 19 20 C19 25.5 16.8 28.5 14 28.5 C11.2 28.5 9 25.5 9 20 C9.5 14.5 14 10 14 10 Z"
              fill={isDead ? '#d1d5db' : tier.innerColor}
              opacity="0.92"
            />
          </>
        )}

        {/* Percikan Bara Api di Atas untuk Level Tinggi (30d, 100d, 200d+) */}
        {!isDead && tier.hasSparks && (
          <>
            <circle
              cx="22.5"
              cy="4.5"
              r="1.6"
              fill={tier.outerStart}
              className="streak-ember-spark-1"
            />
            <circle
              cx="6"
              cy="5.5"
              r="1.3"
              fill={tier.innerColor}
              className="streak-ember-spark-2"
            />
            {tier.level >= 5 && (
              <circle
                cx="14"
                cy="2"
                r="1.3"
                fill={tier.outerStart}
                className="streak-ember-spark-1"
              />
            )}
          </>
        )}
      </svg>
    </div>
  );
};

export interface StreakInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  isDead: boolean;
  isTodayQualified?: boolean;
  restoreAvailable: boolean;
  onRestoreStreak: () => Promise<void>;
}

export const StreakInfoModal: React.FC<StreakInfoModalProps> = ({
  isOpen,
  onClose,
  streak,
  isDead,
  isTodayQualified = false,
  restoreAvailable,
  onRestoreStreak
}) => {
  const currentTier = getStreakTier(streak);
  const [selectedTier, setSelectedTier] = useState<StreakTierConfig>(currentTier);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  const isSelectedTierUnlocked = !isDead && streak >= selectedTier.minDays;

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      setRestoreNotice(null);
      soundManager.playTap();
      await onRestoreStreak();
      soundManager.playSuccess();
      setRestoreNotice('Streak berhasil dipulihkan! Api cinta kita kembali menyala ❤️🔥');
    } catch (err) {
      setRestoreNotice(err instanceof Error ? err.message : 'Gagal memulihkan streak.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="streak-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              soundManager.playTap();
              onClose();
            }
          }}
        >
          <motion.div
            key="streak-modal-sheet"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.85 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 90 || info.velocity.y > 350) {
                soundManager.playTap();
                onClose();
              }
            }}
            className="relative flex max-h-[92vh] w-full max-w-[430px] flex-col overflow-y-auto rounded-t-[32px] border-t border-rose-200/60 bg-white p-5 pb-7 text-[#3b121d] shadow-2xl dark:border-white/10 dark:bg-[#1e0a13] dark:text-rose-50 sm:rounded-[32px] sm:border touch-pan-y"
          >
            {/* Top Drag Indicator (Bar & Area Drag) */}
            <div className="mx-auto -mt-2 mb-2 flex h-6 w-full cursor-grab items-center justify-center active:cursor-grabbing">
              <div className="h-1.5 w-12 rounded-full bg-stone-300 transition-colors hover:bg-stone-400 dark:bg-white/25 dark:hover:bg-white/40" />
            </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-rose-100 hover:text-rose-600 active:scale-95 dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/20 dark:hover:text-rose-200"
            aria-label="Tutup"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>

          {/* Overlapping Couple Avatars (Ala TikTok) */}
          <div className="flex justify-center -space-x-3 pt-3 pb-3">
            <div className="relative h-15 w-15 overflow-hidden rounded-full border-2 border-white bg-amber-100 shadow-md ring-2 ring-rose-200/60 dark:border-[#1e0a13] dark:ring-white/10">
              <img
                src="/characters/expressions/savero/bahagia.webp"
                alt="Savero"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div className="relative h-15 w-15 overflow-hidden rounded-full border-2 border-white bg-pink-100 shadow-md ring-2 ring-rose-200/60 dark:border-[#1e0a13] dark:ring-white/10">
              <img
                src="/characters/expressions/soffie/bahagia.webp"
                alt="Soffie"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top"
              />
            </div>
          </div>

          {/* Main Title & Status */}
          <div className="text-center">
            <h2 className="text-lg font-black tracking-tight text-stone-900 dark:text-white sm:text-xl">
              {isDead
                ? !isTodayQualified && streak > 0 && !restoreAvailable
                  ? 'Streak Hari Ini Belum Menyala'
                  : 'Streak Cinta Sedang Padam'
                : 'Streak Kita Menyala Selama'}
            </h2>
            <div className="mt-1 flex items-center justify-center gap-2">
              <div className="h-8 w-8">
                <StreakFlameSvg
                  tier={currentTier}
                  isDead={isDead}
                  idPrefix="modal-hero-flame"
                />
              </div>
              <span
                className="text-2xl font-black tracking-tight tabular-nums sm:text-3xl transition-colors"
                style={
                  isDead
                    ? {
                        color: '#9ca3af',
                        textShadow: 'none'
                      }
                    : {
                        color: currentTier.textColor,
                        textShadow: `0 2px 14px ${currentTier.glowColor}`
                      }
                }
              >
                {streak} Hari
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="mt-2.5 px-3 text-center text-xs leading-relaxed text-stone-600 dark:text-rose-200/80">
            {isDead && !isTodayQualified && streak > 0 && !restoreAvailable
              ? 'Kalian belum check-in bersama hari ini! Selesaikan check-in dan penuhi love bar hari ini agar api streak kalian kembali menyala dan bertambah.'
              : 'Streak bertambah saat Savero & Soffie sama-sama aktif mengisi check-in atau cinta harian berturut-turut. Terus jaga api cinta kita setiap hari untuk membuka tingkatan api yang lebih membara!'}
          </p>

          {/* Milestone Progression Timeline (Ala TikTok) */}
          <div className="mt-5 rounded-2xl bg-stone-50/90 p-3.5 border border-stone-200/60 dark:bg-black/30 dark:border-white/5">
            <div className="mb-2.5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-rose-200/60">
              <span>Tingkatan Api</span>
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">
                Klik ikon untuk info
              </span>
            </div>

            <div className="flex items-center justify-between">
              {STREAK_TIERS.map((tier, idx) => {
                const isUnlocked = !isDead && streak >= tier.minDays;
                const isSelected = selectedTier.level === tier.level;

                return (
                  <React.Fragment key={tier.level}>
                    {/* Milestone Item */}
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedTier(tier);
                      }}
                      className={`group relative flex flex-col items-center p-1 rounded-xl transition-all active:scale-90 ${
                        isSelected
                          ? 'scale-110 bg-white shadow-sm ring-2 ring-rose-400 dark:bg-white/10 dark:ring-rose-400'
                          : 'hover:bg-white/60 dark:hover:bg-white/5'
                      }`}
                      title={`${tier.name} (${tier.minDays}d)`}
                    >
                      <div className="relative h-7 w-7 sm:h-8 sm:w-8">
                        <StreakFlameSvg
                          tier={tier}
                          isDead={!isUnlocked}
                          idPrefix={`milestone-${tier.level}`}
                        />
                        {!isUnlocked && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-black/60 text-[7px] text-stone-200 shadow-2xs backdrop-blur-2xs ring-1 ring-white/20">
                            <Lock className="h-1.5 w-1.5" />
                          </span>
                        )}
                      </div>
                      <span
                        className={`mt-1 text-[10.5px] font-black tabular-nums transition-colors ${
                          isUnlocked
                            ? 'text-stone-800 dark:text-rose-100'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                      >
                        {tier.minDays}d
                      </span>
                    </button>

                    {/* Connecting Line between milestones */}
                    {idx < STREAK_TIERS.length - 1 && (
                      <div
                        className={`h-[2px] flex-1 mx-0.5 rounded-full transition-colors ${
                          !isDead && streak >= STREAK_TIERS[idx + 1].minDays
                            ? 'bg-gradient-to-r from-orange-400 to-rose-500'
                            : 'bg-stone-200 dark:bg-stone-700'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Selected Tier Detail Card */}
          <div className="mt-3.5 rounded-2xl border border-rose-100 bg-rose-50/70 p-3.5 text-left transition-all dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0">
                <StreakFlameSvg
                  tier={selectedTier}
                  isDead={!isSelectedTierUnlocked}
                  idPrefix="selected-tier-detail"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs font-black text-[#5c192b] dark:text-rose-100">
                    {isSelectedTierUnlocked
                      ? selectedTier.name
                      : `Tingkat ${selectedTier.level}: Rahasia Terkunci 🔒`}
                  </h4>

                  {isSelectedTierUnlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9.5px] font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Terbuka
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2 py-0.5 text-[9.5px] font-bold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                      <Lock className="h-2.5 w-2.5" />
                      Syarat: {selectedTier.minDays}d
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[11px] leading-relaxed text-[#7a2e42] dark:text-rose-200/80">
                  {isSelectedTierUnlocked
                    ? selectedTier.desc
                    : `Api misterius ini masih tertidur... Terus aktif bersama Soffie & Savero setiap hari untuk membangkitkan warna dan kekuatan apinya! ✨`}
                </p>
              </div>
            </div>
          </div>

          {/* Streak Restore Section (Jika tersedia pemulihan) */}
          {restoreAvailable && (
            <div className="mt-3.5 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 text-center shadow-xs dark:border-amber-700/50 dark:from-amber-950/40 dark:to-orange-950/30">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Streak Kemarin Terlewat!</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                Jangan khawatir, kalian memiliki 1 kesempatan pemulihan untuk menyalakan kembali api cinta kalian.
              </p>

              <button
                type="button"
                onClick={handleRestore}
                disabled={isRestoring}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 px-4 text-xs font-extrabold text-white shadow-md transition hover:from-amber-600 hover:to-orange-600 active:scale-98 disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Memulihkan streak...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>🔥 Pulihkan Streak Kemarin</span>
                  </>
                )}
              </button>

              {restoreNotice && (
                <p className="mt-2 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                  {restoreNotice}
                </p>
              )}
            </div>
          )}

          {/* Action Button: Got It / Sip, Mengerti! */}
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#FF5C77] to-[#d9386a] py-3 text-center text-sm font-black text-white shadow-md transition hover:opacity-95 active:scale-98"
          >
            Sip, Mengerti!
          </button>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
