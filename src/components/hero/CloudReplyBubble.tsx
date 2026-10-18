import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { CoupleProfile, InstantReply } from '../../types';
import { soundManager } from '../../utils/audio';

interface CloudReplyBubbleProps {
  reply: InstantReply;
  authorProfile: CoupleProfile;
  activeProfile: CoupleProfile;
  onDeleteReply?: (replyId: string) => void;
}

export const CloudReplyBubble: React.FC<CloudReplyBubbleProps> = ({
  reply,
  authorProfile,
  onDeleteReply
}) => {
  const isLeft = authorProfile === 'Soffie';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus balasan ini?')) {
      soundManager.playPop();
      onDeleteReply?.(reply.id);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 14px)',
        [isLeft ? 'left' : 'right']: '-16px',
        zIndex: 45,
        width: '204px',
        pointerEvents: 'auto',
        userSelect: 'none',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        filter: 'none'
      }}
      role="dialog"
      aria-label={`Balasan dari ${authorProfile}`}
    >
      <style>{`
        @keyframes cuteCloudFloat {
          0%, 100% {
            transform: translate3d(0, 0px, 0) rotate(0deg) scale(1);
          }
          33% {
            transform: translate3d(0, -6px, 0) rotate(-1deg) scale(1.015, 0.99);
          }
          66% {
            transform: translate3d(0, -3px, 0) rotate(1deg) scale(0.99, 1.015);
          }
        }

        @keyframes thoughtDotFloat1 {
          0%, 100% {
            transform: translate3d(0, 0px, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -4px, 0) scale(1.12);
          }
        }

        @keyframes thoughtDotFloat2 {
          0%, 100% {
            transform: translate3d(0, 0px, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -3px, 0) scale(1.18);
          }
        }

        .cute-cloud-float-wrap {
          animation: cuteCloudFloat 4.5s ease-in-out infinite;
          transform-origin: center bottom;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          filter: none !important;
        }
      `}</style>

      <div className="cute-cloud-float-wrap relative">
        {/* === 3D VECTOR CLOUD CONTAINER (Bebas Kotak Compositing) === */}
        <div className="relative pt-5 pb-3.5 px-5">
          
          {/* SVG 3D Fluffy Cloud Background */}
          <svg
            viewBox="0 0 240 145"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              {/* Gradasi Utama Awan 3D (Putih Bersih ke Pink Marshmallow) */}
              <linearGradient id={`cloudBodyGrad-${authorProfile}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="58%" stopColor="#fff8fa" />
                <stop offset="88%" stopColor="#ffe3ec" />
                <stop offset="100%" stopColor="#f9cad9" />
              </linearGradient>

              {/* Gradasi Rim Bawah 3D (Efek Tebal seperti Awan Kiri Bawah Chibi) */}
              <linearGradient id={`cloudBase3D-${authorProfile}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f5c2d2" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#e29ab0" stopOpacity="0.85" />
              </linearGradient>

              {/* Gradasi Gumpalan Dalam (Subtle 3D Puff Volume) */}
              <radialGradient id={`puffVolume-${authorProfile}`} cx="45%" cy="25%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#fff3f7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f7bfd0" stopOpacity="0.35" />
              </radialGradient>

              {/* Soft Ambient Shadow Bulat (Tanpa Kotak) */}
              <radialGradient id={`ambientShadow-${authorProfile}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#9e2a4b" stopOpacity="0.22" />
                <stop offset="60%" stopColor="#9e2a4b" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#9e2a4b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 1. Soft Oval Shadow di Bawah Awan (Anti-Kotak 100%) */}
            <ellipse
              cx="120"
              cy="128"
              rx="102"
              ry="16"
              fill={`url(#ambientShadow-${authorProfile})`}
            />

            {/* 2. Layer Ketebalan 3D Bawah (3D Clay Extrusion Rim) */}
            <path
              d="M 44 122
                 C 20 122, 8 107, 10 88
                 C 11 73, 21 61, 35 58
                 C 37 37, 55 24, 77 27
                 C 89 12, 112 7, 133 15
                 C 146 20, 155 29, 160 39
                 C 178 33, 198 43, 203 61
                 C 219 65, 230 78, 229 94
                 C 228 111, 214 122, 192 122
                 Z"
              transform="translate(0, 4.5)"
              fill={`url(#cloudBase3D-${authorProfile})`}
            />

            {/* 3. Siluet Utama Awan 3D yang Menyatu Utuh & Fluffy */}
            <path
              d="M 44 122
                 C 20 122, 8 107, 10 88
                 C 11 73, 21 61, 35 58
                 C 37 37, 55 24, 77 27
                 C 89 12, 112 7, 133 15
                 C 146 20, 155 29, 160 39
                 C 178 33, 198 43, 203 61
                 C 219 65, 230 78, 229 94
                 C 228 111, 214 122, 192 122
                 Z"
              fill={`url(#cloudBodyGrad-${authorProfile})`}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* 4. Detail Lipatan Volume 3D Halus (Seperti Awan Kiri Bawah Chibi) */}
            <circle cx="72" cy="54" r="26" fill={`url(#puffVolume-${authorProfile})`} />
            <circle cx="168" cy="64" r="24" fill={`url(#puffVolume-${authorProfile})`} />
            <circle cx="120" cy="44" r="33" fill={`url(#puffVolume-${authorProfile})`} />

            {/* Garis Lengkung Dalam Halus untuk Dimensi 3D */}
            <path
              d="M 74 28 C 82 36, 84 46, 80 55"
              fill="none"
              stroke="#f4c2d1"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M 160 39 C 154 47, 153 56, 157 64"
              fill="none"
              stroke="#f4c2d1"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.55"
            />

            {/* 5. Specular Glossy Highlights (Kilau 3D di Puncak Awan) */}
            <path
              d="M 94 21 C 108 13, 127 14, 140 22"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.95"
            />
            <path
              d="M 46 43 C 54 33, 66 31, 74 34"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M 168 43 C 178 40, 188 44, 193 52"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>

          {/* === KONTEN TEKS DI DALAM AWAN === */}
          <div className="relative z-10 flex flex-col gap-1 text-left pt-1.5 pb-0.5 px-1">
            {/* Baris Header */}
            <div className="flex items-center justify-between gap-1 border-b border-rose-300/40 pb-1">
              <span className="flex items-center gap-1 text-[9px] font-extrabold tracking-wide text-[#942642]">
                <MessageCircle className="h-2.5 w-2.5 text-rose-500 fill-rose-300/60 shrink-0" />
                <span className="truncate">Membalas {reply.targetProfile}:</span>
              </span>

              {/* Tombol Hapus Balasan */}
              {onDeleteReply && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100/80 text-rose-500 hover:bg-rose-500 hover:text-white active:scale-90 transition"
                  title="Hapus balasan"
                  aria-label="Hapus balasan"
                >
                  <X className="h-2.5 w-2.5 stroke-[2.75]" />
                </button>
              )}
            </div>

            {/* Isi Pesan */}
            <p className="line-clamp-3 pt-0.5 text-[11.5px] font-black leading-snug text-[#461321] break-words">
              {reply.emoji && <span className="mr-1">{reply.emoji}</span>}
              {reply.text}
            </p>
          </div>
        </div>

        {/* === GELEMBUNG PIKIRAN 3D (Trailing Thought Bubbles) === */}
        <div
          style={{
            position: 'absolute',
            bottom: '-18px',
            [isLeft ? 'left' : 'right']: '36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            pointerEvents: 'none',
            zIndex: 20
          }}
          aria-hidden="true"
        >
          {/* Gelembung 1 (Besar) */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            style={{
              marginLeft: isLeft ? '6px' : '-6px',
              animation: 'thoughtDotFloat1 3.2s ease-in-out infinite',
              overflow: 'visible'
            }}
          >
            <ellipse cx="12" cy="19" rx="8" ry="3.5" fill="#9e2a4b" opacity="0.16" />
            <circle cx="12" cy="13" r="7.5" fill="#e59eb3" />
            <circle
              cx="12"
              cy="11.5"
              r="7.5"
              fill={`url(#cloudBodyGrad-${authorProfile})`}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <ellipse cx="9.5" cy="8.5" rx="2.8" ry="1.6" transform="rotate(-20 9.5 8.5)" fill="#ffffff" />
          </svg>

          {/* Gelembung 2 (Kecil) */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 20 20"
            style={{
              marginLeft: isLeft ? '-4px' : '4px',
              animation: 'thoughtDotFloat2 3.2s ease-in-out infinite 0.4s',
              overflow: 'visible'
            }}
          >
            <ellipse cx="10" cy="16" rx="6" ry="2.5" fill="#9e2a4b" opacity="0.14" />
            <circle cx="10" cy="11" r="5.5" fill="#e59eb3" />
            <circle
              cx="10"
              cy="9.8"
              r="5.5"
              fill={`url(#cloudBodyGrad-${authorProfile})`}
              stroke="#ffffff"
              strokeWidth="1.4"
            />
            <circle cx="8.2" cy="7.8" r="1.5" fill="#ffffff" />
          </svg>
        </div>
      </div>
    </div>
  );
};