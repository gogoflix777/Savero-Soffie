import React from 'react';
import { motion } from 'motion/react';
import {
  Film,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  ExternalLink,
  Heart
} from 'lucide-react';
import { MovieNightPlan } from '../../types';
import { ManagedImage } from '../common/ManagedImage';
import { soundManager } from '../../utils/audio';

interface MovieNightCardProps {
  plan: MovieNightPlan | null;
  onNavigateToCinema: () => void;
  onCompletePlan?: () => void;
  onCancelPlan?: () => void;
}

export const MovieNightCard: React.FC<MovieNightCardProps> = ({
  plan,
  onNavigateToCinema,
  onCompletePlan,
  onCancelPlan
}) => {
  if (!plan || plan.status !== 'confirmed') {
    return null;
  }

  // Format date & time nicely in Indonesian
  let formattedDate = plan.scheduledAt;
  let isToday = false;
  let isTomorrow = false;

  try {
    const planDate = new Date(plan.scheduledAt);
    if (!isNaN(planDate.getTime())) {
      const now = new Date();
      const planDateOnly = new Date(planDate.getFullYear(), planDate.getMonth(), planDate.getDate());
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((planDateOnly.getTime() - nowDateOnly.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) isToday = true;
      else if (diffDays === 1) isTomorrow = true;

      formattedDate = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(planDate);
    }
  } catch {
    // fallback to raw string
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto my-4 w-full max-w-4xl px-3 sm:px-4"
    >
      <div className="clay-card-3d relative overflow-hidden rounded-[2.2rem] border-2 border-rose-300/40 bg-gradient-to-br from-rose-50/95 via-[#fff5f7] to-amber-50/90 p-4 shadow-xl dark:border-white/10 dark:from-[#2a0e19] dark:via-[#220b14] dark:to-[#1a0810] sm:p-5">
        {/* Glow ambient accent */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-rose-400/15 blur-2xl dark:bg-rose-500/10" />

        {/* Top Header Row */}
        <div className="mb-3.5 flex items-center justify-between border-b border-rose-200/50 pb-2.5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white shadow-xs">
              <Film className="h-3.5 w-3.5" />
            </span>
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-rose-500 dark:text-rose-300">
                KENCAN ROMANTIS
              </span>
              <h3 className="text-xs font-black text-[#4a1623] dark:text-rose-50 sm:text-sm">
                Jadwal Movie Night Berdua
              </h3>
            </div>
          </div>

          {/* Status & Chibi indicator */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8.5px] font-extrabold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Terkonfirmasi</span>
            </span>

            {/* Chibi heads of Savero & Soffie */}
            <div className="flex items-center -space-x-1.5 drop-shadow-xs" title="Kencan Berdua">
              <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-amber-50 dark:border-[#200508]">
                <img
                  src="/characters/expressions/savero/bahagia.webp"
                  alt="Savero"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top scale-125"
                />
              </div>
              <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-rose-50 dark:border-[#200508]">
                <img
                  src="/characters/expressions/soffie/gemas-sayang.webp"
                  alt="Soffie"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top scale-125"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
          {/* Movie Poster Thumbnail */}
          <div className="relative mx-auto h-36 w-24 shrink-0 overflow-hidden rounded-[1.3rem] bg-black/10 shadow-md sm:mx-0">
            {plan.posterUrl ? (
              <ManagedImage
                src={plan.posterUrl}
                alt={plan.movieTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-2 text-center text-[10px] text-gray-400">
                <Film className="mb-1 h-6 w-6 text-rose-300" />
                <span>No Poster</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-2 text-left">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-black text-[#4a1623] dark:text-rose-50 sm:text-lg">
                  {plan.movieTitle}
                </h4>
                {isToday && (
                  <span className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[8.5px] font-black text-white shadow-2xs">
                    Malam Ini! 🔥
                  </span>
                )}
                {isTomorrow && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[8.5px] font-black text-white shadow-2xs">
                    Besok ✨
                  </span>
                )}
              </div>
              <p className="text-[10px] font-semibold text-[#8c4f60] dark:text-rose-200/80">
                Kencan nonton santai berdua di bioskop atau di rumah.
              </p>
            </div>

            {/* Schedule & Snacks grid */}
            <div className="grid grid-cols-1 gap-2 rounded-2xl bg-white/70 p-2.5 dark:bg-black/20 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                  <Calendar className="h-3 w-3" />
                </span>
                <div className="min-w-0">
                  <span className="block text-[8.5px] font-black uppercase text-[#8c4f60] dark:text-rose-300">
                    Waktu Kencan
                  </span>
                  <span className="block truncate text-[11px] font-extrabold text-[#4a1623] dark:text-rose-100">
                    {formattedDate}
                  </span>
                </div>
              </div>

              {plan.snacks && (
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                    <span className="text-xs">🍿</span>
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[8.5px] font-black uppercase text-[#8c4f60] dark:text-rose-300">
                      Camilan & Minuman
                    </span>
                    <span className="block truncate text-[11px] font-extrabold text-[#4a1623] dark:text-rose-100" title={plan.snacks}>
                      {plan.snacks}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons inside card */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                <span>Direncanakan oleh {plan.plannedBy || 'Berdua'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {onCompletePlan && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playSuccess();
                      onCompletePlan();
                    }}
                    className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold text-white shadow-2xs transition active:scale-95 hover:bg-emerald-700"
                    title="Tandai kencan sudah selesai ditonton"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>Sudah Selesai</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    onNavigateToCinema();
                  }}
                  className="flex items-center gap-1 rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] px-3.5 py-1 text-[10.5px] font-extrabold text-white shadow-2xs transition active:scale-95 hover:shadow-xs"
                >
                  <Film className="h-3 w-3" />
                  <span>Buka di Sinema</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
