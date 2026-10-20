import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Calendar, Heart, Pencil, Trash2 } from 'lucide-react';
import { CoupleProfile, MoodExpression } from '../../types';
import {
  getCurvedCaptionFontSize,
  getCurvedCaptionStartOffset,
  SQUIRCLE_CURVE_PATH
} from '../../utils/caption';
import { moodImage, moodOptions } from '../../utils/mood';

interface PhotoLightboxModalProps {
  id?: string;
  photoUrl: string;
  photoPath?: string | null;
  caption?: string | null;
  profile?: CoupleProfile;
  date?: string;
  expression?: MoodExpression;
  rating?: number | null;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => Promise<void> | void;
  onClose: () => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photoUrl,
  caption,
  profile,
  date,
  expression,
  rating,
  canManage = false,
  onEdit,
  onDelete,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const toggleZoom = () => {
    setZoomLevel((current) => (current === 1 ? 1.55 : 1));
  };

  const formattedDate = date
    ? new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date(`${date}T12:00:00+07:00`))
    : 'Momen Indah';

  const moodLabel = expression
    ? moodOptions.find((m) => m.id === expression)?.label ?? expression
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Compact 3D Clay Instant Viewer Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 24, stiffness: 330 }}
          className="relative flex w-full max-w-[350px] flex-col gap-2.5 rounded-[2.4rem] border border-white/90 bg-gradient-to-b from-[#fffdfd] via-[#fff5f8] to-[#ffe6ee] p-3.5 text-[#4a1623] shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_4px_8px_#ffffff,inset_0_-6px_12px_rgba(230,140,170,0.35)] dark:border-rose-200/20 dark:from-[#381824] dark:via-[#2a111b] dark:to-[#1e0b12] dark:text-rose-50 dark:shadow-[0_26px_65px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.12)] sm:max-w-[370px]"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {profile && (
                <div className="rounded-full bg-gradient-to-tr from-rose-400 via-pink-300 to-amber-300 p-[1.5px] shadow-xs">
                  <img
                    src={moodImage(profile, expression ?? 'bahagia')}
                    alt={profile}
                    className="h-7 w-7 rounded-full bg-white object-cover object-top dark:bg-[#2a111b]"
                  />
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-black leading-tight text-[#521625] dark:text-rose-100">
                  {profile ?? 'Momen Kita'}
                </span>
                <span className="flex items-center gap-1 text-[9.5px] font-bold text-[#9c4c60] dark:text-rose-300/80">
                  <Calendar className="h-2.5 w-2.5" />
                  {formattedDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {canManage && onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/90 bg-white/90 text-[#6e2236] shadow-xs transition hover:bg-rose-500 hover:text-white hover:scale-105 active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-rose-100"
                  title="Edit Instant"
                  aria-label="Edit Instant"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {canManage && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/90 bg-white/90 text-rose-500 shadow-xs transition hover:bg-rose-600 hover:text-white hover:scale-105 active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-rose-300"
                  title="Hapus Instant"
                  aria-label="Hapus Instant"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleZoom}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/90 bg-white/90 text-[#6e2236] shadow-xs transition hover:scale-105 active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-rose-100"
                title={zoomLevel === 1 ? 'Perbesar' : 'Perkecil'}
              >
                {zoomLevel === 1 ? <ZoomIn className="h-3.5 w-3.5" /> : <ZoomOut className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/90 bg-white/90 text-[#6e2236] shadow-xs transition hover:bg-rose-500 hover:text-white active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-rose-100"
                aria-label="Tutup"
              >
                <X className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Squircle Photo Container */}
          <div
            className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-[22%] border-[2.5px] border-white bg-[#14070c] shadow-[0_12px_28px_rgba(110,20,45,0.2)] dark:border-rose-200/20"
            onClick={toggleZoom}
          >
            <motion.img
              animate={{ scale: zoomLevel }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              src={photoUrl}
              alt={caption || 'Foto kenangan'}
              className="h-full w-full object-cover"
            />

            {caption && zoomLevel === 1 && (
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(0,0,0,0.34)_0%,transparent_58%)]"
                aria-hidden="true"
              />
            )}

            {/* Curved Caption Following Squircle Frame */}
            {caption && zoomLevel === 1 && (
              <svg
                viewBox="0 0 400 400"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <defs>
                  <path id="lightbox-curve" d={SQUIRCLE_CURVE_PATH} fill="none" />
                  <filter id="caption-shadow-lightbox" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" floodColor="#000000" floodOpacity="0.65" />
                  </filter>
                </defs>
                <text
                  fill="#ffffff"
                  fontSize={getCurvedCaptionFontSize(caption)}
                  fontWeight="800"
                  letterSpacing="1.3"
                  filter="url(#caption-shadow-lightbox)"
                >
                  <textPath
                    href="#lightbox-curve"
                    startOffset={getCurvedCaptionStartOffset(caption)}
                  >
                    {caption.toUpperCase()}
                  </textPath>
                </text>
              </svg>
            )}
          </div>

          {/* Bottom Mood & 3D Heart Rating Bar */}
          <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
            {moodLabel ? (
              <div className="flex items-center gap-1.5 rounded-full border border-white/90 bg-gradient-to-b from-white to-[#ffeef4] py-1 pl-1.5 pr-3 text-[10.5px] font-extrabold text-[#7a2037] shadow-xs dark:border-rose-200/20 dark:from-[#4f2433] dark:to-[#381723] dark:text-rose-100">
                {profile && expression && (
                  <img
                    src={moodImage(profile, expression)}
                    alt={moodLabel}
                    className="h-4.5 w-4.5 rounded-full border border-white object-cover object-top"
                  />
                )}
                <span>{moodLabel}</span>
              </div>
            ) : <span />}

            {rating !== null && rating !== undefined && (
              <div className="flex items-center gap-1 rounded-full border border-white/80 bg-rose-100/80 px-2.5 py-1 shadow-inner dark:border-rose-200/15 dark:bg-[#260e17]">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= rating;
                  return (
                    <Heart
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        active
                          ? 'fill-[#ff477e] text-[#ff477e] drop-shadow-[0_1px_3px_rgba(255,71,126,0.55)]'
                          : 'fill-rose-300/35 text-rose-300/60 dark:fill-rose-200/15 dark:text-rose-200/25'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
