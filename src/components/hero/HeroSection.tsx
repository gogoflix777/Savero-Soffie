import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flower2,
  Heart,
  Sparkles,
  X,
  Calendar,
  MessageCircle,
  Send,
  Pencil,
  Trash2
} from 'lucide-react';
import { InteractiveHeart } from './InteractiveHeart';
import { InstagramInstantModal } from './InstagramInstantModal';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { PhotoMemoriesModal } from './PhotoMemoriesModal';
import { StreakInfoModal, StreakFlameSvg, getStreakTier } from './StreakInfoModal';
import { CloudReplyBubble } from './CloudReplyBubble';
import {
  getCurvedCaptionFontSize,
  getCurvedCaptionStartOffset,
  SQUIRCLE_CURVE_PATH
} from '../../utils/caption';
import { moodOptions, moodImage } from '../../utils/mood';
import {
  AppSettings,
  InstantReply,
  CoupleMoodLog,
  CoupleProfile,
  DailyCheckin,
  DailyHeartProgress,
  MeetingConfirmation,
  MoodDiaryEntry,
  MoodExpression,
  StreakRestore
} from '../../types';
import { soundManager } from '../../utils/audio';
import { triggerNotification } from '../../utils/notifications';

interface HeroSectionProps {
  settings: AppSettings;
  activeProfile: 'Savero' | 'Soffie';
  coupleMoodLog: CoupleMoodLog;
  moodDiary: MoodDiaryEntry[];
  onMoodChange: (profile: 'Savero' | 'Soffie', expression: MoodExpression) => void;
  onSaveMoodDiary: (profile: 'Savero' | 'Soffie', expression: MoodExpression, content: string) => void;
  dailyCheckins: DailyCheckin[];
  streakRestores: StreakRestore[];
  meetingConfirmations: MeetingConfirmation[];
  heartProgress: Record<CoupleProfile, number>;
  dailyHeartProgress: DailyHeartProgress[];
  meetingFillProgress: Record<CoupleProfile, number>;
  dailyActionError: string | null;
  instantReplies?: InstantReply[];
  onSendReply?: (targetProfile: CoupleProfile, text: string, emoji?: string) => Promise<void>;
  onDeleteReply?: (replyId: string) => Promise<void> | void;
  onSaveDailyCheckin: (input: { expression: MoodExpression; rating: number; diaryText: string; photo?: Blob | null }) => Promise<void>;
  onRestoreStreak: () => Promise<void>;
  onConfirmMeeting: () => Promise<void>;
  onCancelMeeting: () => Promise<void>;
  onHeartProgressChange: (percentage: number) => void;
  onMeetingFillProgressChange: (percentage: number) => void;
  onExploreClick: () => void;
  onAddMemoryClick: () => void;
  isAdminAccount?: boolean;
  adminMode?: boolean;
  onUpdateDailyCheckin?: (input: {
    id: string;
    profile: CoupleProfile;
    logDate: string;
    expression: MoodExpression;
    rating: number;
    diaryText: string;
    photo?: Blob | null;
    keepExistingPhoto?: boolean;
  }) => Promise<void>;
  onDeleteDailyCheckin?: (input: {
    id: string;
    profile: CoupleProfile;
    logDate?: string;
    photoPath?: string | null;
  }) => Promise<void>;
}

interface HeartParticle {
  id: number;
  shape: 'heart' | 'sparkle' | 'flower';
  glyph?: string;
  style: CSSProperties;
}

const particleIcons = {
  heart: Heart,
  sparkle: Sparkles,
  flower: Flower2
};

// Synthesizer khusus untuk 2 klimaks di panggung Hero (Streak Nyala vs 2 Hati Bertabrakan)
const playStageClimaxAudio = (mode: 'streak' | 'collision') => {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  const now = ctx.currentTime;

  if (mode === 'streak') {
    // Suara kobaran api streak + lonceng kristal naik
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(180, now);
    sweep.frequency.exponentialRampToValueAtTime(680, now + 0.45);
    sweepGain.gain.setValueAtTime(0.08, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sweep.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweep.start(now);
    sweep.stop(now + 0.52);

    [587.33, 739.99, 880, 1174.66, 1479.98].forEach((freq, idx) => {
      const t = now + 0.12 + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.68);
    });
    return;
  }

  // Mode 'collision' (Sinematik 2 Hati Mengorbit & Bertabrakan dari gemini-code)
  const whoosh = ctx.createOscillator();
  const whooshGain = ctx.createGain();
  whoosh.type = 'sine';
  whoosh.frequency.setValueAtTime(140, now);
  whoosh.frequency.exponentialRampToValueAtTime(720, now + 2.1);
  whooshGain.gain.setValueAtTime(0.01, now);
  whooshGain.gain.linearRampToValueAtTime(0.24, now + 1.95);
  whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
  whoosh.connect(whooshGain);
  whooshGain.connect(ctx.destination);
  whoosh.start(now);
  whoosh.stop(now + 2.22);

  const impactTime = now + 2.2;
  const boom = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(160, impactTime);
  boom.frequency.exponentialRampToValueAtTime(42, impactTime + 0.55);
  boomGain.gain.setValueAtTime(0.35, impactTime);
  boomGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.6);
  boom.connect(boomGain);
  boomGain.connect(ctx.destination);
  boom.start(impactTime);
  boom.stop(impactTime + 0.62);

  [1760, 2093, 2349, 2637, 3135, 3520].forEach((f, idx) => {
    const t = impactTime + idx * 0.024;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.68, t + 0.15);
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.17);
  });

  const chord = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98, 2093.0];
  chord.forEach((freq, idx) => {
    const t = impactTime + 0.1 + idx * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.95);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.98);
  });
};

const buildMiniOrbWavePath = (pct: number, phase: number) => {
  const levelY = 88 - (Math.min(100, Math.max(0, pct)) / 100) * 80;
  const amp = pct > 98 || pct < 2 ? 0.5 : 2.6;
  let d = `M -10 105 L -10 ${levelY.toFixed(1)}`;
  for (let x = -10; x <= 110; x += 12) {
    const y = levelY + Math.sin(x * 0.08 + phase) * amp;
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return `${d} L 110 105 Z`;
};

const StreakFlameBadge: React.FC<{
  streak: number;
  isActiveToday: boolean;
  isDead: boolean;
}> = ({ streak, isActiveToday, isDead }) => {
  const tier = getStreakTier(streak);

  return (
    <div
      className="streak-tier-item flex items-center gap-1.5 px-2.5 py-1 select-none"
      title={
        isDead
          ? 'Streak Padam · Klik untuk lihat info & pulihkan'
          : `${streak} Hari Streak · ${tier.name}${isActiveToday ? ' (Aktif hari ini)' : ''}`
      }
      aria-label={`${streak} hari streak`}
    >
      <div className="relative flex h-4.5 w-4.5 items-center justify-center">
        <StreakFlameSvg tier={tier} isDead={isDead} idPrefix="hero-dock-flame" />
      </div>

      <span
        className="text-[13px] font-black leading-none tracking-tight tabular-nums transition-colors"
        style={
          isDead
            ? { color: '#9ca3af', textShadow: 'none' }
            : { color: tier.textColor, textShadow: `0 1px 8px ${tier.glowColor}` }
        }
      >
        {streak}
      </span>
    </div>
  );
};

const localDateKey = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

const RelationshipCounters: React.FC<{ anniversaryDate: string }> = React.memo(
  ({ anniversaryDate }) => {
    const [timeTogether, setTimeTogether] = useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    });

    useEffect(() => {
      const calculateTime = () => {
        const anniversary = new Date(`${anniversaryDate}T00:00:00`);
        const diff = Math.max(0, Date.now() - anniversary.getTime());
        setTimeTogether({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff / 3600000) % 24),
          minutes: Math.floor((diff / 60000) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      };
      calculateTime();
      const interval = window.setInterval(calculateTime, 1000);
      return () => window.clearInterval(interval);
    }, [anniversaryDate]);

    const counters = [
      { label: 'Hari', value: timeTogether.days },
      { label: 'Jam', value: timeTogether.hours },
      { label: 'Menit', value: timeTogether.minutes },
      { label: 'Detik', value: timeTogether.seconds }
    ];

    return (
      <div className="mb-4 flex items-center justify-center gap-2 sm:mb-5 sm:gap-2.5">
        {counters.map(({ label, value }) => (
          <div
            key={label}
            className="hero-count-card flex h-[70px] w-[clamp(54px,12vw,66px)] flex-col items-center justify-center rounded-[1.3rem] bg-[#f9dce1] sm:h-[74px] sm:w-[70px]"
          >
            <span className="font-sans-clean text-[25px] font-extrabold leading-none text-[#501522] dark:text-rose-100 sm:text-[28px]">
              {value}
            </span>
            <span className="mt-1 font-sans-clean text-[11px] font-bold leading-none text-[#501522] dark:text-rose-100/80 sm:text-xs">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }
);

export const HeroSection: React.FC<HeroSectionProps> = ({
  settings,
  activeProfile,
  coupleMoodLog,
  moodDiary,
  dailyCheckins,
  streakRestores,
  meetingConfirmations,
  heartProgress,
  dailyHeartProgress,
  meetingFillProgress,
  dailyActionError,
  instantReplies = [],
  onSendReply,
  onDeleteReply,
  onMoodChange,
  onSaveMoodDiary,
  onSaveDailyCheckin,
  onRestoreStreak,
  onConfirmMeeting,
  onCancelMeeting,
  onHeartProgressChange,
  onMeetingFillProgressChange,
  onExploreClick,
  onAddMemoryClick,
  isAdminAccount,
  onUpdateDailyCheckin,
  onDeleteDailyCheckin
}) => {
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [isMemoriesModalOpen, setIsMemoriesModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState<DailyCheckin | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    id?: string;
    photoUrl: string;
    photoPath?: string | null;
    caption?: string | null;
    profile: CoupleProfile;
    date: string;
    expression: MoodExpression;
    rating?: number | null;
    checkin?: DailyCheckin;
  } | null>(null);

  const [wigglingProfile, setWigglingProfile] = useState<'Savero' | 'Soffie' | null>(null);
  const wigglingTimeoutRef = useRef<number | null>(null);
  const [moodChangedProfile, setMoodChangedProfile] = useState<'Savero' | 'Soffie' | null>(null);
  const [diaryBubbleProfile, setDiaryBubbleProfile] = useState<'Savero' | 'Soffie' | null>(null);
  const [diaryHistoryIndex, setDiaryHistoryIndex] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Refs untuk Panggung Animasi (Streak Nyala & 2 Hati Bertabrakan dari gemini-code)
  const heartStageRef = useRef<HTMLDivElement>(null);
  const collisionStageRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const collideLeftRef = useRef<SVGSVGElement>(null);
  const collideRightRef = useRef<SVGSVGElement>(null);
  const collisionFlashRef = useRef<HTMLDivElement>(null);
  const impactRaysRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);
  const shatterLayerRef = useRef<HTMLDivElement>(null);
  const stageParticleLayerRef = useRef<HTMLDivElement>(null);
  const screenFlashRef = useRef<HTMLDivElement>(null);
  const cineVignetteRef = useRef<HTMLDivElement>(null);
  const cineTopRef = useRef<HTMLDivElement>(null);
  const cineBottomRef = useRef<HTMLDivElement>(null);
  const orbSoffieRef = useRef<HTMLDivElement>(null);
  const orbSaveroRef = useRef<HTMLDivElement>(null);
  const miniWaveSoffieRef = useRef<SVGPathElement>(null);
  const miniWaveSaveroRef = useRef<SVGPathElement>(null);
  const chibiWrapLeftRef = useRef<HTMLDivElement>(null);
  const chibiWrapRightRef = useRef<HTMLDivElement>(null);

  const [isCollidingNow, setIsCollidingNow] = useState(false);
  const [isStreakAnimatingNow, setIsStreakAnimatingNow] = useState(false);
  const [syncToastMsg, setSyncToastMsg] = useState<string | null>(null);

  const showSyncToast = useCallback((msg: string) => {
    setSyncToastMsg(msg);
    window.setTimeout(() => {
      setSyncToastMsg((curr) => (curr === msg ? null : curr));
    }, 4500);
  }, []);

  // Animasi gelombang live pada Mini Heart Orb di atas masing-masing Chibi
  useEffect(() => {
    let active = true;
    let phase = 0;
    let visualSoffie = heartProgress.Soffie;
    let visualSavero = heartProgress.Savero;

    const tickMiniOrbs = () => {
      if (!active) return;
      phase += 0.075;
      visualSoffie += (heartProgress.Soffie - visualSoffie) * 0.12;
      visualSavero += (heartProgress.Savero - visualSavero) * 0.12;
      miniWaveSoffieRef.current?.setAttribute(
        'd',
        buildMiniOrbWavePath(visualSoffie, phase)
      );
      miniWaveSaveroRef.current?.setAttribute(
        'd',
        buildMiniOrbWavePath(visualSavero, -phase * 1.1)
      );
      requestAnimationFrame(tickMiniOrbs);
    };
    const id = requestAnimationFrame(tickMiniOrbs);
    return () => {
      active = false;
      cancelAnimationFrame(id);
    };
  }, [heartProgress.Soffie, heartProgress.Savero]);

  useEffect(() => {
    if (dailyActionError) {
      triggerNotification({
        category: 'notes',
        title: 'Pemberitahuan Sistem',
        message: dailyActionError,
        settings: settings.notifications
      });
    }
  }, [dailyActionError, settings.notifications]);

  const spawnStageExplosionParticles = useCallback(
    (icons: string[], count = 20, isClimax = true) => {
      const layer = stageParticleLayerRef.current;
      if (!layer) return;
      for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'gemini-pop-particle';
        el.textContent = icons[Math.floor(Math.random() * icons.length)];
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
        const dist = isClimax ? 85 + Math.random() * 105 : 50 + Math.random() * 48;
        el.style.setProperty('--tx', `${(Math.cos(angle) * dist).toFixed(1)}px`);
        el.style.setProperty('--ty', `${(Math.sin(angle) * dist - 15).toFixed(1)}px`);
        el.style.setProperty('--rot', `${(Math.random() * 110 - 55).toFixed(0)}deg`);
        el.style.setProperty('--sc', isClimax ? '1.32' : '1');
        el.style.setProperty('--dur', `${isClimax ? 1100 : 680}ms`);
        layer.appendChild(el);
        window.setTimeout(() => el.remove(), 1150);
      }
    },
    []
  );

  const spawnCrystalShards = useCallback(() => {
    const layer = shatterLayerRef.current;
    if (!layer) return;
    const palette = [
      ['#ffffff', '#ffb3d1', '#ff7eb6'],
      ['#ffffff', '#ff7a9f', '#e01e5a']
    ];
    for (let i = 0; i < 30; i++) {
      const c = palette[i % 2];
      const shard = document.createElement('div');
      shard.className = 'gemini-crystal-shard';
      shard.style.background = `linear-gradient(135deg, ${c[0]}, ${c[1]} 55%, ${c[2]})`;
      const w = 10 + Math.random() * 18;
      shard.style.width = `${w}px`;
      shard.style.height = `${(w * (1.1 + Math.random() * 0.5)).toFixed(1)}px`;
      const angle = Math.random() * Math.PI * 2;
      const dist = 65 + Math.random() * 125;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - 28;
      const rot = Math.random() * 540 - 270;
      const sc = 0.6 + Math.random() * 0.9;
      shard.animate(
        [
          { transform: 'translate(-50%,-50%) scale(.3) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${sc}) rotate(${
              rot * 0.7
            }deg)`,
            opacity: 1,
            offset: 0.55
          },
          {
            transform: `translate(calc(-50% + ${tx * 1.15}px), calc(-50% + ${
              ty + 85
            }px)) scale(${sc * 0.6}) rotate(${rot}deg)`,
            opacity: 0
          }
        ],
        {
          duration: 1100 + Math.random() * 480,
          easing: 'cubic-bezier(.2,.8,.3,1)',
          fill: 'forwards'
        }
      );
      layer.appendChild(shard);
      window.setTimeout(() => shard.remove(), 1650);
    }
  }, []);

  // =========================================================================
  // ANIMASI 1: KETIKA STREAK NYALA (FLASH + SHOCKWAVE RINGS + SOLAR RAYS)
  // =========================================================================
  const playStreakIgnitionSequence = useCallback(() => {
    if (isCollidingNow || isStreakAnimatingNow) return;
    setIsStreakAnimatingNow(true);
    playStageClimaxAudio('streak');

    if (collisionFlashRef.current) {
      collisionFlashRef.current.classList.remove('boom');
      void collisionFlashRef.current.offsetWidth;
      collisionFlashRef.current.classList.add('boom');
    }

    screenFlashRef.current?.animate([{ opacity: 0.72 }, { opacity: 0 }], {
      duration: 480,
      easing: 'ease-out'
    });

    impactRaysRef.current?.animate(
      [
        { opacity: 0.95, transform: 'scale(.35) rotate(0deg)' },
        { opacity: 0, transform: 'scale(1.45) rotate(45deg)' }
      ],
      { duration: 920, easing: 'cubic-bezier(.16,1,.3,1)' }
    );

    [ring1Ref.current, ring2Ref.current, ring3Ref.current].forEach((r, idx) => {
      if (!r) return;
      r.classList.remove('animate');
      void r.offsetWidth;
      window.setTimeout(() => r.classList.add('animate'), idx * 140);
    });

    spawnStageExplosionParticles(['🔥', '✨', '💖', '⚡', '🌸', '⭐'], 24, true);
    window.setTimeout(
      () => spawnStageExplosionParticles(['🔥', '✨', '👑', '💗'], 16, true),
      260
    );

    window.setTimeout(() => {
      setIsStreakAnimatingNow(false);
    }, 1500);
  }, [isCollidingNow, isStreakAnimatingNow, spawnStageExplosionParticles]);

  // =========================================================================
  // ANIMASI 2: KETIKA KONFIRMASI BERTEMU (2 HATI MENGORBIT & BERTABRAKAN)
  // =========================================================================
  const playTwoHeartsCollisionSequence = useCallback(() => {
    if (isCollidingNow) return;
    const stageEl = heartStageRef.current;
    const trailCanvas = trailCanvasRef.current;
    const leftHeart = collideLeftRef.current;
    const rightHeart = collideRightRef.current;
    if (!stageEl || !trailCanvas || !leftHeart || !rightHeart) return;

    setIsCollidingNow(true);
    playStageClimaxAudio('collision');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cineAnims: Animation[] = [];
    if (!reduceMotion && cineTopRef.current && cineBottomRef.current && cineVignetteRef.current) {
      const ease = 'cubic-bezier(.22,1,.36,1)';
      cineAnims = [
        cineTopRef.current.animate(
          [{ transform: 'translateY(-101%)' }, { transform: 'translateY(0)' }],
          { duration: 800, easing: ease, fill: 'forwards' }
        ),
        cineBottomRef.current.animate(
          [{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }],
          { duration: 800, easing: ease, fill: 'forwards' }
        ),
        cineVignetteRef.current.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 900,
          easing: 'ease-out',
          fill: 'forwards'
        })
      ];
    }

    const W = stageEl.offsetWidth || 460;
    const H = stageEl.offsetHeight || 285;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    trailCanvas.width = W * dpr;
    trailCanvas.height = H * dpr;
    const ctx = trailCanvas.getContext('2d');

    const getStageOffset = (el: HTMLElement | null, fallbackX: number) => {
      if (!el) return { x: fallbackX, y: -20 };
      const stageRect = stageEl.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - (stageRect.left + stageRect.width / 2),
        y: rect.top + rect.height / 2 - (stageRect.top + stageRect.height / 2)
      };
    };

    const hearts = [
      {
        el: leftHeart,
        o: getStageOffset(orbSoffieRef.current, -145),
        col: '255,140,190',
        phase: 0,
        th0: Math.PI,
        trail: [] as Array<{ x: number; y: number; t: number }>,
        vx: 0,
        vy: 0,
        px: -145,
        py: -20
      },
      {
        el: rightHeart,
        o: getStageOffset(orbSaveroRef.current, 145),
        col: '255,50,110',
        phase: Math.PI,
        th0: 0,
        trail: [] as Array<{ x: number; y: number; t: number }>,
        vx: 0,
        vy: 0,
        px: 145,
        py: -20
      }
    ];

    const R0 = (Math.abs(hearts[0].o.x) + Math.abs(hearts[1].o.x)) / 2 || 155;
    const R1 = R0 * 0.62;
    const REND = 30;
    const ORBIT_Y = -4;
    const SWEEP = reduceMotion ? 0 : Math.PI * 2;
    const FLIGHT_MS = 2100;
    const IMPACT_MS = 2200;

    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const easeOutBack = (x: number) =>
      1 + 2.9 * Math.pow(x - 1, 3) + 1.9 * Math.pow(x - 1, 2);

    const radius = (q: number) => {
      const a = easeInOutSine(clamp01(q / 0.78));
      const b = Math.pow(clamp01((q - 0.78) / 0.22), 3.2);
      return R0 + (R1 - R0) * a + (REND - R1) * b;
    };

    const sparks: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      r: number;
      col: string;
    }> = [];

    const t0 = performance.now();
    let last = t0;

    const finishImpact = () => {
      ctx?.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      hearts.forEach((h) => {
        h.el.style.transform = '';
        h.el.style.filter = '';
        h.el.style.opacity = '';
        h.el.style.zIndex = '';
      });
      stageEl.style.transform = '';
      cineAnims.forEach((a) => a.reverse());

      if (collisionFlashRef.current) {
        collisionFlashRef.current.classList.remove('boom');
        void collisionFlashRef.current.offsetWidth;
        collisionFlashRef.current.classList.add('boom');
      }

      screenFlashRef.current?.animate([{ opacity: 0.9 }, { opacity: 0 }], {
        duration: 520,
        easing: 'ease-out'
      });

      impactRaysRef.current?.animate(
        [
          { opacity: 1, transform: 'scale(.3) rotate(0deg)' },
          { opacity: 0, transform: 'scale(1.5) rotate(40deg)' }
        ],
        { duration: 950, easing: 'cubic-bezier(.16,1,.3,1)' }
      );

      spawnCrystalShards();
      spawnStageExplosionParticles(
        ['💖', '✨', '💎', '🌸', '👑', '⭐', '💝'],
        24,
        true
      );
      window.setTimeout(
        () =>
          spawnStageExplosionParticles(
            ['💖', '✨', '💎', '🌸', '👑', '⭐', '💝'],
            18,
            true
          ),
        280
      );

      [ring1Ref.current, ring2Ref.current, ring3Ref.current].forEach((r, idx) => {
        if (!r) return;
        r.classList.remove('animate');
        void r.offsetWidth;
        window.setTimeout(() => r.classList.add('animate'), idx * 150);
      });

      if (!reduceMotion) {
        const shake: Keyframe[] = [];
        for (let i = 0; i < 10; i++) {
          const m = (1 - i / 10) * 11;
          shake.push({
            transform: `translate(${((i % 2 ? 1 : -1) * m).toFixed(1)}px, ${(
              (i % 3 - 1) *
              m *
              0.6
            ).toFixed(1)}px) scale(${(1 + 0.07 * (1 - i / 10)).toFixed(4)})`
          });
        }
        shake.push({ transform: 'translate(0,0) scale(1)' });
        stageEl.animate(shake, { duration: 460, easing: 'ease-out' });

        [
          [chibiWrapLeftRef.current, -1],
          [chibiWrapRightRef.current, 1]
        ].forEach(([el, dir]) => {
          (el as HTMLElement | null)?.animate(
            [
              { transform: 'translateX(0)' },
              {
                transform: `translateX(${(dir as number) * 14}px) scale(.94)`,
                offset: 0.25
              },
              { transform: 'translateX(0)' }
            ],
            { duration: 700, easing: 'ease-out', composite: 'add' }
          );
        });
      }

      setIsCollidingNow(false);
    };

    const loop = (now: number) => {
      const t = Math.max(0, now - t0);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const q = clamp01(t / FLIGHT_MS);
      const sq = easeInOutSine(clamp01((q - 0.93) / 0.07));

      if (ctx) {
        ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
      }

      hearts.forEach((h) => {
        const r = radius(q);
        const th = h.th0 + SWEEP * easeInOutSine(q);
        const blend = 1 - easeOutCubic(clamp01(q / 0.3));
        let x = r * Math.cos(th) + (h.o.x - Math.cos(h.th0) * R0) * blend;
        let y = ORBIT_Y + r * 0.4 * Math.sin(th) + (h.o.y - ORBIT_Y) * blend;
        if (t > FLIGHT_MS) {
          x += (Math.random() - 0.5) * 2.4;
          y += (Math.random() - 0.5) * 2.4;
        }

        if (dt > 0) {
          const k = Math.min(1, dt * 14);
          h.vx += ((x - h.px) / dt - h.vx) * k;
          h.vy += ((y - h.py) / dt - h.vy) * k;
        }
        h.px = x;
        h.py = y;

        const st = Math.min(0.28, Math.hypot(h.vx, h.vy) / 3200);
        const phi = (Math.atan2(h.vy, h.vx) * 180) / Math.PI;
        const depth = Math.sin(th) * clamp01(r / R0);
        const tilt =
          (clamp01((h.vx + 1000) / 2000) * 2 - 1) * 12 * (1 - sq) +
          Math.sin(t * 0.006 + h.phase) * 2.5 * (1 - sq);
        const base =
          (0.4 +
            0.52 * easeOutBack(clamp01(q / 0.28)) +
            0.1 * easeInOutSine(clamp01((q - 0.28) / 0.67))) *
          (1 + 0.16 * depth);
        const sx = base * (1 + 0.3 * sq);
        const sy = base * (1 - 0.26 * sq);
        const g =
          14 +
          34 * Math.pow(q, 1.6) +
          (q > 0.78 ? Math.sin(t * 0.04) * 4 : 0);

        h.el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(
          2
        )}px) rotate(${tilt.toFixed(2)}deg) rotate(${phi.toFixed(
          1
        )}deg) scale(${(1 + st).toFixed(3)}, ${(1 - st * 0.55).toFixed(
          3
        )}) rotate(${(-phi).toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(
          3
        )})`;
        h.el.style.filter = `drop-shadow(0 0 ${g.toFixed(1)}px rgba(${h.col},.95))`;
        h.el.style.opacity = clamp01(q / 0.08).toFixed(2);
        h.el.style.zIndex = depth > 0 ? '3' : '2';

        if (reduceMotion || !ctx) return;
        h.trail.push({ x, y, t: now });
        while (h.trail.length && now - h.trail[0].t > 520) h.trail.shift();
        for (let k = 1; k < h.trail.length; k++) {
          const a = h.trail[k - 1];
          const b = h.trail[k];
          const f = 1 - (now - b.t) / 520;
          ctx.beginPath();
          ctx.moveTo((W / 2 + a.x) * dpr, (H / 2 + a.y) * dpr);
          ctx.lineTo((W / 2 + b.x) * dpr, (H / 2 + b.y) * dpr);
          ctx.strokeStyle = `rgba(${h.col},${(f * f * 0.28).toFixed(3)})`;
          ctx.lineWidth = (8 + 34 * f) * dpr;
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,236,205,${(f * 0.5).toFixed(3)})`;
          ctx.lineWidth = (2 + 12 * f) * dpr;
          ctx.stroke();
        }
        if (q > 0.1 && Math.random() < 0.75) {
          sparks.push({
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 50 - h.vx * 0.05,
            vy: (Math.random() - 0.5) * 50 - 20,
            life: 0,
            max: 0.6 + Math.random() * 0.5,
            r: 1.5 + Math.random() * 2.6,
            col: Math.random() < 0.4 ? '255,229,143' : h.col
          });
        }
      });

      if (ctx) {
        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i];
          sp.life += dt;
          if (sp.life > sp.max) {
            sparks.splice(i, 1);
            continue;
          }
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vy += 40 * dt;
          ctx.fillStyle = `rgba(${sp.col},${(1 - sp.life / sp.max).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc((W / 2 + sp.x) * dpr, (H / 2 + sp.y) * dpr, sp.r * dpr, 0, 6.2832);
          ctx.fill();
        }
      }

      if (!reduceMotion) {
        stageEl.style.transform = `scale(${(1 + 0.07 * easeInOutSine(q)).toFixed(4)})`;
      }

      if (t >= IMPACT_MS) {
        finishImpact();
        return;
      }
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }, [isCollidingNow, spawnCrystalShards, spawnStageExplosionParticles]);

  const handleChibiTap = (profile: 'Savero' | 'Soffie') => {
    soundManager.playTap();
    setDiaryHistoryIndex(0);
    setIsReplying(false);
    setReplyText('');
    setDiaryBubbleProfile((current) => (current === profile ? null : profile));

    if (wigglingTimeoutRef.current) {
      window.clearTimeout(wigglingTimeoutRef.current);
      wigglingTimeoutRef.current = null;
    }
    setWigglingProfile(null);
    requestAnimationFrame(() => {
      setWigglingProfile(profile);
    });
    wigglingTimeoutRef.current = window.setTimeout(() => {
      setWigglingProfile((current) => (current === profile ? null : current));
    }, 680);
  };

  const today = localDateKey();
  const checkinProfilesByDate = new Map<string, Set<CoupleProfile>>();
  for (const entry of dailyCheckins) {
    const profiles = checkinProfilesByDate.get(entry.log_date) ?? new Set<CoupleProfile>();
    profiles.add(entry.profile);
    checkinProfilesByDate.set(entry.log_date, profiles);
  }
  const fullHeartProfilesByDate = new Map<string, Set<CoupleProfile>>();
  for (const entry of dailyHeartProgress) {
    if (entry.percentage < 100) continue;
    const profiles =
      fullHeartProfilesByDate.get(entry.progress_date) ?? new Set<CoupleProfile>();
    profiles.add(entry.profile);
    fullHeartProfilesByDate.set(entry.progress_date, profiles);
  }
  if (heartProgress.Savero >= 100) {
    const s = fullHeartProfilesByDate.get(today) ?? new Set<CoupleProfile>();
    s.add('Savero');
    fullHeartProfilesByDate.set(today, s);
  }
  if (heartProgress.Soffie >= 100) {
    const s = fullHeartProfilesByDate.get(today) ?? new Set<CoupleProfile>();
    s.add('Soffie');
    fullHeartProfilesByDate.set(today, s);
  }

  const restoredDates = new Set(streakRestores.map((item) => item.missed_date));
  const isQualifiedDay = (date: string) =>
    restoredDates.has(date) ||
    ((checkinProfilesByDate.get(date)?.size ?? 0) >= 2 &&
      (fullHeartProfilesByDate.get(date)?.size ?? 0) >= 2);

  const dateOffset = (date: string, days: number) => {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  };

  let streak = 0;
  let streakDay = isQualifiedDay(today) ? today : dateOffset(today, -1);
  while (streak < 5000 && isQualifiedDay(streakDay)) {
    streak += 1;
    streakDay = dateOffset(streakDay, -1);
  }
  const yesterday = dateOffset(today, -1);
  const twoDaysAgo = dateOffset(today, -2);
  const restoreAvailable =
    !streakRestores.some((item) => item.missed_date === yesterday) &&
    !isQualifiedDay(yesterday) &&
    isQualifiedDay(twoDaysAgo) &&
    (!streakRestores[0] ||
      Date.now() - new Date(streakRestores[0].restored_at).getTime() >= 7 * 86400000);

  const isTodayQualified = isQualifiedDay(today);
  const isStreakDead = !isTodayQualified || streak === 0;

  const meetingToday = new Set(
    meetingConfirmations
      .filter((item) => item.meeting_date === today)
      .map((item) => item.profile)
  );
  const mutualMeetingDates = [
    ...new Set(meetingConfirmations.map((item) => item.meeting_date))
  ]
    .filter(
      (date) =>
        new Set(
          meetingConfirmations
            .filter((item) => item.meeting_date === date)
            .map((item) => item.profile)
        ).size >= 2
    )
    .sort();

  const isBothFilledToday =
    meetingFillProgress['Savero'] >= 100 && meetingFillProgress['Soffie'] >= 100;
  const isMeetingTodayConfirmed = meetingToday.size >= 2 || isBothFilledToday;
  const lastMutualMeeting = isMeetingTodayConfirmed
    ? today
    : mutualMeetingDates.at(-1) ?? settings.firstMeetDate;
  const daysSinceMeeting = isMeetingTodayConfirmed
    ? 0
    : lastMutualMeeting
      ? Math.max(
          0,
          Math.floor(
            (new Date(`${today}T12:00:00+07:00`).getTime() -
              new Date(`${lastMutualMeeting}T12:00:00+07:00`).getTime()) /
              86400000
          )
        )
      : null;
  const meetingEffect = daysSinceMeeting !== null && daysSinceMeeting < 2;

  // Deteksi Otomatis & Unseen Replay untuk (1) Animasi Streak Nyala & (2) Sinematik 2 Hati Bertabrakan saat Konfirmasi Bertemu
  useEffect(() => {
    if (!isTodayQualified) return;
    const seenKey = `cerita_kita_streak_anim_${today}_${activeProfile}`;
    if (!localStorage.getItem(seenKey)) {
      localStorage.setItem(seenKey, '1');
      const timer = window.setTimeout(() => {
        showSyncToast('🔥 Streak Hari Ini Menyala! Hati & Instant kalian berdua sudah lengkap!');
        playStreakIgnitionSequence();
      }, 380);
      return () => window.clearTimeout(timer);
    }
  }, [isTodayQualified, today, activeProfile, playStreakIgnitionSequence, showSyncToast]);

  useEffect(() => {
    if (!isMeetingTodayConfirmed) return;
    const seenKey = `cerita_kita_meeting_collision_${today}_${activeProfile}`;
    if (!localStorage.getItem(seenKey)) {
      localStorage.setItem(seenKey, '1');
      const partnerName = activeProfile === 'Savero' ? 'Soffie' : 'Savero';
      const timer = window.setTimeout(() => {
        showSyncToast(
          `💞 Konfirmasi Bertemu ${partnerName} & ${activeProfile} 100%! Menyatukan kedua hati kalian...`
        );
        playTwoHeartsCollisionSequence();
      }, 420);
      return () => window.clearTimeout(timer);
    }
  }, [
    isMeetingTodayConfirmed,
    today,
    activeProfile,
    playTwoHeartsCollisionSequence,
    showSyncToast
  ]);

  const handleRestore = async () => {
    try {
      await onRestoreStreak();
      triggerNotification({
        category: 'streak',
        title: 'Streak Berhasil Dipulihkan 🔥',
        message: 'Streak cinta Savero & Soffie telah kembali menyala!',
        settings: settings.notifications
      });
      playStreakIgnitionSequence();
    } catch (error) {
      triggerNotification({
        category: 'notes',
        title: 'Pemulihan Streak Gagal',
        message: error instanceof Error ? error.message : 'Streak belum bisa dipulihkan.',
        settings: settings.notifications
      });
    }
  };

  const handleMeeting = async () => {
    try {
      await onConfirmMeeting();
      soundManager.playHeart();
      triggerNotification({
        category: 'meeting',
        title: 'Konfirmasi Bertemu Tersimpan ♥',
        message: 'Konfirmasi bertemu hari ini tersimpan! Klik tombol Palu jika ingin membocorkan & membatalkan.',
        settings: settings.notifications
      });
      return true;
    } catch (error) {
      triggerNotification({
        category: 'notes',
        title: 'Gagal Menyimpan',
        message: error instanceof Error ? error.message : 'Konfirmasi belum tersimpan.',
        settings: settings.notifications
      });
      return false;
    }
  };

  const handleCancelMeeting = async () => {
    try {
      localStorage.removeItem(`cerita_kita_meeting_collision_${today}_Savero`);
      localStorage.removeItem(`cerita_kita_meeting_collision_${today}_Soffie`);
      await onCancelMeeting();
      triggerNotification({
        category: 'hammer',
        title: 'Liquid Hati Dibocorkan 🔨',
        message: 'Liquid konfirmasi bertemu dibocorkan & dibatalkan ke 0%.',
        settings: settings.notifications
      });
    } catch (error) {
      triggerNotification({
        category: 'notes',
        title: 'Gagal Membatalkan',
        message:
          error instanceof Error
            ? error.message
            : 'Konfirmasi bertemu belum bisa dibatalkan.',
        settings: settings.notifications
      });
    }
  };

  const handleSendCustomReply = async (targetProfile: CoupleProfile) => {
    if (!replyText.trim() || !onSendReply || isSendingReply) return;
    setIsSendingReply(true);
    soundManager.playPop();
    try {
      await onSendReply(targetProfile, replyText.trim());
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleHeartTap = (
    { x, y }: { x: number; y: number },
    profile?: CoupleProfile
  ) => {
    const originX = x || window.innerWidth / 2;
    const originY = y || window.innerHeight * 0.44;
    const glyphs = profile === 'Soffie' ? ['🌸', '💗', '🫧'] : ['✦', '💗', '⭐'];
    const burst = Array.from({ length: 5 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 5 + (Math.random() - 0.5) * 0.4;
      const distance = 44 + Math.random() * 32;
      return {
        id: Date.now() + index + Math.random(),
        shape: (['heart', 'sparkle', 'flower'] as const)[index % 3],
        glyph: glyphs[index % glyphs.length],
        style: {
          left: `${originX}px`,
          top: `${originY}px`,
          '--tx': `${Math.cos(angle) * distance}px`,
          '--ty': `${Math.sin(angle) * distance - 32}px`,
          '--rot': `${Math.round((Math.random() - 0.5) * 70)}deg`,
          animationDelay: `${index * 12}ms`
        } as CSSProperties
      };
    });
    setHeartParticles((current) => [...current, ...burst]);
    window.setTimeout(() => {
      setHeartParticles((current) =>
        current.filter((particle) => !burst.some((item) => item.id === particle.id))
      );
    }, 1050);
  };

  return (
    <section className="relative bg-[#fffaf0] px-4 pb-7 pt-5 transition-colors dark:bg-[#21151a] sm:pb-10 sm:pt-7">
      {/* Efek Layar Sinematik & Toast Sinkronisasi dari gemini-code */}
      <div ref={screenFlashRef} className="gemini-screen-flash" aria-hidden="true" />
      <div ref={cineVignetteRef} className="gemini-cine-vignette" aria-hidden="true" />
      <div ref={cineTopRef} className="gemini-cine-bar top" aria-hidden="true" />
      <div ref={cineBottomRef} className="gemini-cine-bar bottom" aria-hidden="true" />

      <div
        className={`gemini-sync-toast ${syncToastMsg ? 'show' : ''}`}
        role="status"
        aria-live="polite"
      >
        <span>💞</span>
        <span>{syncToastMsg}</span>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/3 h-44 w-44 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute -right-20 bottom-16 h-48 w-48 rounded-full bg-pink-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[540px] flex-col items-center text-center">
        <h1 className="mb-1 font-script text-[40px] leading-tight text-[#bd5b76] drop-shadow-sm dark:text-[#f0a8b7] sm:text-5xl">
          cerita kita
        </h1>
        <p className="mx-auto mb-1.5 max-w-[480px] px-1 font-sans-clean text-[14px] leading-[1.45] text-[#43252d] dark:text-rose-50/85 sm:mb-2 sm:text-[15px]">
          “Dari malam pertama di Mie Gacoan hingga subuh berkabut di jalan baru Jangli–Undip, ini adalah ruang perjalanan cinta kita di Semarang.”
        </p>

        {/* Heart & Chibi Stage */}
        <div
          ref={heartStageRef}
          className={`hero-heart-stage relative mb-0 mt-0 flex h-[248px] w-full max-w-[490px] items-center justify-center sm:h-[292px] ${
            isCollidingNow ? 'is-stage-colliding' : ''
          }`}
        >
          {/* Layer Efek Klimaks (Flash, Shockwave Rings, Impact Rays, 2 Colliding Hearts, Crystal Shards) */}
          <div ref={collisionFlashRef} className="gemini-collision-flash" aria-hidden="true" />
          <div ref={ring1Ref} className="gemini-shockwave-ring" aria-hidden="true" />
          <div ref={ring2Ref} className="gemini-shockwave-ring" aria-hidden="true" />
          <div ref={ring3Ref} className="gemini-shockwave-ring" aria-hidden="true" />
          <div ref={impactRaysRef} className="gemini-impact-rays" aria-hidden="true" />

          <div
            ref={collisionStageRef}
            className={`gemini-collision-stage ${isCollidingNow ? 'active' : ''}`}
            aria-hidden="true"
          >
            <canvas ref={trailCanvasRef} className="gemini-trail-canvas" />
            <svg
              ref={collideLeftRef}
              className="gemini-collide-heart left-soffie"
              viewBox="0 0 200 200"
            >
              <path
                d="M100,178 C100,178 22,126 22,68 C22,36 47,16 74,16 C91,16 100,28 100,36 C100,28 109,16 126,16 C153,16 178,36 178,68 C178,126 100,178 100,178 Z"
                fill="#ff7eb6"
                stroke="#ffffff"
                strokeWidth="5"
              />
            </svg>
            <svg
              ref={collideRightRef}
              className="gemini-collide-heart right-savero"
              viewBox="0 0 200 200"
            >
              <path
                d="M100,178 C100,178 22,126 22,68 C22,36 47,16 74,16 C91,16 100,28 100,36 C100,28 109,16 126,16 C153,16 178,36 178,68 C178,126 100,178 100,178 Z"
                fill="#e01e5a"
                stroke="#ffe58f"
                strokeWidth="5"
              />
            </svg>
          </div>

          <div ref={shatterLayerRef} className="gemini-shatter-layer" aria-hidden="true" />
          <div
            ref={stageParticleLayerRef}
            className="gemini-particle-layer"
            aria-hidden="true"
          />

          <Sparkles className="hero-sparkle hero-sparkle-one" aria-hidden="true" />
          <Sparkles className="hero-sparkle hero-sparkle-two" aria-hidden="true" />
          <Sparkles className="hero-sparkle hero-sparkle-three" aria-hidden="true" />
          <Flower2 className="hero-flower hero-flower-one" aria-hidden="true" />
          <Flower2 className="hero-flower hero-flower-two" aria-hidden="true" />
          <Heart className="hero-tiny-heart hero-tiny-heart-one" aria-hidden="true" fill="currentColor" />
          <Heart className="hero-tiny-heart hero-tiny-heart-two" aria-hidden="true" fill="currentColor" />
          <span className="hero-petal" aria-hidden="true" />
          <span className="hero-cloud hero-cloud-left" aria-hidden="true" />
          <span className="hero-cloud hero-cloud-right" aria-hidden="true" />

          {(['Soffie', 'Savero'] as const).map((profile) => {
            const profileCheckins = dailyCheckins
              .filter((entry) => entry.profile === profile)
              .sort((left, right) => right.log_date.localeCompare(left.log_date));
            const checkinDates = new Set(profileCheckins.map((entry) => entry.log_date));
            const localDiaryHistory = moodDiary
              .filter((entry) => entry.profile === profile && !checkinDates.has(entry.date))
              .map((entry) => ({
                id: entry.id,
                date: entry.date,
                content: entry.content,
                expression: entry.expression,
                photo_url: null as string | null,
                photo_path: null as string | null,
                rating: null as number | null,
                created_at: entry.updatedAt || entry.createdAt,
                checkin: undefined as DailyCheckin | undefined
              }));

            const diaryHistory = [
              ...profileCheckins.map((entry) => ({
                id: entry.id,
                date: entry.log_date,
                content: entry.diary_text,
                expression: entry.expression,
                photo_url: entry.photo_url,
                photo_path: entry.photo_path,
                rating: entry.rating,
                created_at: entry.photo_uploaded_at || entry.updated_at || entry.created_at,
                checkin: entry
              })),
              ...localDiaryHistory
            ].sort((left, right) => right.date.localeCompare(left.date));

            const selectedHistoryIndex = Math.min(
              diaryHistoryIndex,
              Math.max(0, diaryHistory.length - 1)
            );
            const latestDiary = diaryHistory[selectedHistoryIndex];
            const historyTime = latestDiary?.created_at
              ? new Intl.DateTimeFormat('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(new Date(latestDiary.created_at))
              : null;
            const historyDateLabel =
              latestDiary?.date === localDateKey()
                ? 'Hari ini'
                : latestDiary?.date
                  ? new Intl.DateTimeFormat('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      day: 'numeric',
                      month: 'short'
                    }).format(new Date(`${latestDiary.date}T12:00:00+07:00`))
                  : 'Kosong';

            const isActive = activeProfile === profile;
            const sideClass =
              profile === 'Soffie'
                ? 'hero-character-wrap-left'
                : 'hero-character-wrap-right';

            const profileLatestReply = instantReplies.find(
              (r) => r.authorProfile === profile
            );
            const latestProfileEntry = diaryHistory[0];
            const profileActiveExpression =
              latestProfileEntry?.expression ?? coupleMoodLog[profile].expression;
            const currentMoodOption = moodOptions.find(
              (opt) => opt.id === (latestDiary?.expression ?? profileActiveExpression)
            );
            const canManageCurrentEntry =
              (profile === activeProfile || Boolean(isAdminAccount)) &&
              Boolean(latestDiary && latestDiary.checkin);
            const pctRounded = Math.round(heartProgress[profile]);

            return (
              <div
                key={profile}
                ref={profile === 'Soffie' ? chibiWrapLeftRef : chibiWrapRightRef}
                className={`hero-character-wrap ${sideClass} ${
                  diaryBubbleProfile === profile ? 'hero-character-wrap-bubble-open' : ''
                } ${
                  profileLatestReply && diaryBubbleProfile !== profile
                    ? 'hero-character-wrap-has-reply'
                    : ''
                }`}
              >
                {/* MINI HEART ORB LIVE WAVE DARI GEMINI-CODE DI ATAS CHIBI */}
                <div
                  ref={profile === 'Soffie' ? orbSoffieRef : orbSaveroRef}
                  className={`gemini-mini-heart-orb ${
                    pctRounded >= 100 ? 'partner-ready' : ''
                  }`}
                  role="status"
                  aria-label={`Hati ${profile}: ${pctRounded}%`}
                >
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                      <path
                        id={`miniHeartPath-${profile}`}
                        d="M50,88 C50,88 12,62 12,34 C12,18 24,8 37,8 C45,8 50,14 50,18 C50,14 55,8 63,8 C76,8 88,18 88,34 C88,62 50,88 50,88 Z"
                      />
                      <clipPath id={`miniClip-${profile}`}>
                        <use href={`#miniHeartPath-${profile}`} />
                      </clipPath>
                    </defs>
                    <use
                      href={`#miniHeartPath-${profile}`}
                      fill="rgba(255,255,255,0.24)"
                    />
                    <g clipPath={`url(#miniClip-${profile})`}>
                      <path
                        ref={
                          profile === 'Soffie'
                            ? miniWaveSoffieRef
                            : miniWaveSaveroRef
                        }
                        fill={profile === 'Soffie' ? '#ff75a8' : '#e01e5a'}
                        d="M0,95 L100,95 L100,100 L0,100 Z"
                      />
                    </g>
                    <use
                      href={`#miniHeartPath-${profile}`}
                      fill="none"
                      stroke={profile === 'Soffie' ? '#ffd1e3' : '#ff9ebb'}
                      strokeWidth="4"
                    />
                  </svg>
                  <span className="gemini-mini-orb-pct">{pctRounded}%</span>
                </div>

                {/* 3D Puffy Cloud Reply Bubble */}
                {profileLatestReply && diaryBubbleProfile !== profile && (
                  <CloudReplyBubble
                    reply={profileLatestReply}
                    authorProfile={profile}
                    activeProfile={activeProfile}
                    onDeleteReply={onDeleteReply}
                  />
                )}

                {/* ULTRA-COMPACT 3D CLAY POPUP */}
                {diaryBubbleProfile === profile && (
                  <div
                    className="hero-diary-bubble"
                    role="dialog"
                    aria-label={`Momen ${profile}`}
                  >
                    <div className="flex items-center justify-between gap-1 px-0.5 pb-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div className="relative flex-none rounded-full bg-gradient-to-tr from-rose-400 via-pink-300 to-amber-300 p-[1.5px] shadow-2xs">
                          <img
                            src={moodImage(
                              profile,
                              latestDiary?.expression ?? profileActiveExpression
                            )}
                            alt={profile}
                            className="h-5.5 w-5.5 rounded-full bg-white object-cover object-top dark:bg-[#301c24]"
                          />
                        </div>
                        <div className="flex min-w-0 flex-col text-left">
                          <div className="flex items-center gap-1">
                            <strong className="truncate text-[10.5px] font-black leading-none text-[#4e1d29] dark:text-rose-50">
                              {profile}
                            </strong>
                            {isActive && (
                              <span className="rounded-full bg-rose-500/15 px-1.5 py-0.2 text-[7px] font-extrabold text-rose-600 dark:bg-rose-400/20 dark:text-rose-200">
                                Kamu
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[7.5px] font-bold text-[#8b4d5b] dark:text-rose-200/75">
                            <span>{historyDateLabel}</span>
                            {historyTime && (
                              <>
                                <span className="opacity-40">•</span>
                                <span>{historyTime}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {diaryHistory.length > 1 && (
                          <div className="flex items-center rounded-full border border-rose-200/70 bg-white/80 px-1 py-0.5 text-[7.5px] font-extrabold text-[#783042] dark:border-white/15 dark:bg-white/10 dark:text-rose-100">
                            <button
                              type="button"
                              aria-label="Lebih baru"
                              disabled={selectedHistoryIndex <= 0}
                              onClick={() =>
                                setDiaryHistoryIndex((index) => Math.max(0, index - 1))
                              }
                              className="p-0.5 hover:text-rose-500 disabled:opacity-30"
                            >
                              <ChevronLeft className="h-2.5 w-2.5" />
                            </button>
                            <span className="px-0.5 tabular-nums">
                              {selectedHistoryIndex + 1}/{diaryHistory.length}
                            </span>
                            <button
                              type="button"
                              aria-label="Lebih lama"
                              disabled={selectedHistoryIndex >= diaryHistory.length - 1}
                              onClick={() =>
                                setDiaryHistoryIndex((index) =>
                                  Math.min(diaryHistory.length - 1, index + 1)
                                )
                              }
                              className="p-0.5 hover:text-rose-500 disabled:opacity-30"
                            >
                              <ChevronRight className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        )}
                        {canManageCurrentEntry && (
                          <>
                            <button
                              type="button"
                              title="Edit Instant"
                              aria-label="Edit Instant"
                              onClick={() => {
                                setEditingCheckin(latestDiary.checkin!);
                                setDiaryBubbleProfile(null);
                                setIsInstantModalOpen(true);
                              }}
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-rose-200/70 bg-white/90 text-[#8c4053] shadow-2xs transition hover:bg-rose-500 hover:text-white active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-rose-100"
                            >
                              <Pencil className="h-2.5 w-2.5 stroke-[2.2]" />
                            </button>
                            <button
                              type="button"
                              title="Hapus Instant"
                              aria-label="Hapus Instant"
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    `Hapus instant tanggal ${historyDateLabel} milik ${profile}? Foto dan catatan ini tidak dapat dipulihkan.`
                                  )
                                )
                                  return;
                                try {
                                  if (onDeleteDailyCheckin && latestDiary.checkin) {
                                    await onDeleteDailyCheckin({
                                      id: latestDiary.checkin.id,
                                      profile: latestDiary.checkin.profile,
                                      logDate: latestDiary.checkin.log_date,
                                      photoPath: latestDiary.checkin.photo_path
                                    });
                                  }
                                  soundManager.playPop();
                                  setDiaryBubbleProfile(null);
                                } catch (err) {
                                  alert(
                                    err instanceof Error
                                      ? err.message
                                      : 'Gagal menghapus instant.'
                                  );
                                }
                              }}
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-rose-200/70 bg-white/90 text-rose-500 shadow-2xs transition hover:bg-rose-600 hover:text-white active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-rose-300"
                            >
                              <Trash2 className="h-2.5 w-2.5 stroke-[2.2]" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setDiaryBubbleProfile(null);
                            setIsReplying(false);
                          }}
                          aria-label="Tutup"
                          className="flex h-5 w-5 items-center justify-center rounded-full border border-rose-200/70 bg-white/90 text-[#8c4053] shadow-2xs transition hover:bg-rose-500 hover:text-white active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-rose-100"
                        >
                          <X className="h-2.5 w-2.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    {latestDiary?.photo_url ? (
                      <div
                        className="instant-squircle-photo group"
                        onClick={() => {
                          setLightboxPhoto({
                            id: latestDiary.id,
                            photoUrl: latestDiary.photo_url!,
                            photoPath: latestDiary.photo_path,
                            caption: latestDiary.content,
                            profile,
                            date: latestDiary.date,
                            expression: latestDiary.expression,
                            rating: latestDiary.rating,
                            checkin: latestDiary.checkin
                          });
                        }}
                      >
                        <img
                          src={latestDiary.photo_url}
                          alt={`Momen ${profile}`}
                          className="instant-main-photo h-full w-full object-cover"
                        />
                        <div
                          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,transparent_36%,transparent_68%,rgba(0,0,0,0.52)_100%)]"
                          aria-hidden="true"
                        />

                        {latestDiary.content && (
                          <svg
                            viewBox="0 0 400 400"
                            className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
                          >
                            <defs>
                              <path
                                id={`bubble-curve-${profile}`}
                                d={SQUIRCLE_CURVE_PATH}
                                fill="none"
                              />
                              <filter
                                id={`caption-shadow-${profile}`}
                                x="-20%"
                                y="-20%"
                                width="140%"
                                height="140%"
                              >
                                <feDropShadow
                                  dx="0"
                                  dy="1.5"
                                  stdDeviation="2.2"
                                  floodColor="#000000"
                                  floodOpacity="0.7"
                                />
                              </filter>
                            </defs>
                            <text
                              fill="#ffffff"
                              stroke="none"
                              fontSize={getCurvedCaptionFontSize(latestDiary.content)}
                              fontWeight="800"
                              letterSpacing="1.3"
                              filter={`url(#caption-shadow-${profile})`}
                            >
                              <textPath
                                href={`#bubble-curve-${profile}`}
                                startOffset={getCurvedCaptionStartOffset(
                                  latestDiary.content
                                )}
                              >
                                {latestDiary.content.toUpperCase()}
                              </textPath>
                            </text>
                          </svg>
                        )}

                        <div className="pointer-events-none absolute bottom-2 left-2 z-[3] flex items-center gap-1 rounded-full border border-white/40 bg-black/55 py-0.5 pl-0.5 pr-2 text-[8.5px] font-extrabold text-white shadow-md backdrop-blur-md">
                          <span className="relative block h-[18px] w-[18px] shrink-0 overflow-hidden rounded-full border border-white/90 bg-rose-100">
                            <img
                              src={moodImage(
                                profile,
                                latestDiary?.expression ?? profileActiveExpression
                              )}
                              alt=""
                              style={{
                                width: '18px',
                                height: '18px',
                                objectFit: 'cover',
                                objectPosition: 'center top'
                              }}
                            />
                          </span>
                          <span className="tracking-wide text-white drop-shadow-2xs">
                            {currentMoodOption?.label ?? 'Tenang'}
                          </span>
                        </div>

                        {latestDiary?.rating !== null &&
                          latestDiary?.rating !== undefined && (
                            <div className="pointer-events-none absolute bottom-2 right-2 z-[3] flex items-center gap-0.5 rounded-full border border-white/35 bg-black/55 px-1.5 py-1 shadow-md backdrop-blur-md">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const active = star <= (latestDiary.rating ?? 0);
                                return (
                                  <Heart
                                    key={star}
                                    className={`h-2.5 w-2.5 ${
                                      active
                                        ? 'fill-[#ff477e] text-[#ff477e] drop-shadow-[0_1px_2px_rgba(255,71,126,0.7)]'
                                        : 'fill-white/15 text-white/35'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="relative flex flex-col gap-1.5 rounded-2xl border border-rose-200/40 bg-white/70 p-2.5 dark:border-white/10 dark:bg-black/25">
                        <p className="text-left text-[10px] font-semibold leading-relaxed text-[#5e2431] dark:text-rose-100">
                          {latestDiary?.content || 'Belum ada foto atau cerita hari ini.'}
                        </p>
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="flex items-center gap-1 text-[8.5px] font-extrabold text-rose-500 dark:text-rose-300">
                            <img
                              src={moodImage(
                                profile,
                                latestDiary?.expression ?? profileActiveExpression
                              )}
                              alt=""
                              className="h-4 w-4 rounded-full object-cover object-top"
                            />
                            {currentMoodOption?.label ?? 'Tenang'}
                          </span>
                        </div>
                      </div>
                    )}

                    {isReplying && !isActive && onSendReply ? (
                      <div className="flex items-center gap-1 rounded-full border border-rose-300/80 bg-white/95 p-0.5 pl-2.5 shadow-sm dark:border-rose-300/25 dark:bg-[#261119]">
                        <input
                          ref={replyInputRef}
                          type="text"
                          placeholder={`Balas ${profile}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void (async () => {
                                await handleSendCustomReply(profile);
                                setIsReplying(false);
                              })();
                            }
                            if (e.key === 'Escape') setIsReplying(false);
                          }}
                          className="min-h-[23px] w-full flex-1 bg-transparent text-[9.5px] font-bold text-[#501522] focus:outline-none dark:text-rose-50 placeholder:text-rose-400/65"
                        />
                        <button
                          type="button"
                          disabled={!replyText.trim() || isSendingReply}
                          onClick={async () => {
                            await handleSendCustomReply(profile);
                            setIsReplying(false);
                          }}
                          className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white shadow-xs active:scale-90 disabled:opacity-40"
                          aria-label="Kirim"
                        >
                          <Send className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsReplying(false);
                            setReplyText('');
                          }}
                          className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-rose-400 hover:text-rose-600"
                          aria-label="Batal"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : isActive ? (
                      latestDiary?.checkin ? (
                        <div className="flex w-full items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCheckin(null);
                              setDiaryBubbleProfile(null);
                              setIsReplying(false);
                              setIsInstantModalOpen(true);
                            }}
                            className="hero-diary-bubble-action flex-1 justify-center"
                          >
                            <span className="flex items-center gap-1.5">
                              <Camera className="h-3 w-3" />
                              <span>Ambil Baru</span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCheckin(latestDiary.checkin!);
                              setDiaryBubbleProfile(null);
                              setIsReplying(false);
                              setIsInstantModalOpen(true);
                            }}
                            className="hero-diary-bubble-action flex-1 justify-center"
                          >
                            <span className="flex items-center gap-1.5">
                              <Pencil className="h-3 w-3" />
                              <span>Edit Momen</span>
                            </span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCheckin(null);
                            setDiaryBubbleProfile(null);
                            setIsReplying(false);
                            setIsInstantModalOpen(true);
                          }}
                          className="hero-diary-bubble-action w-full justify-center"
                        >
                          <span className="flex items-center gap-1.5">
                            <Camera className="h-3 w-3" />
                            <span>Ambil Instant Hari Ini</span>
                          </span>
                        </button>
                      )
                    ) : (
                      onSendReply && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsReplying(true);
                            setTimeout(() => replyInputRef.current?.focus(), 60);
                          }}
                          className="hero-diary-bubble-action w-full justify-center"
                        >
                          <span className="flex items-center gap-1.5">
                            <MessageCircle className="h-3 w-3" />
                            <span>Balas Instant</span>
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* Chibi Sticker */}
                <button
                  type="button"
                  onClick={() => handleChibiTap(profile)}
                  aria-label={`Perasaan ${profile}: ${
                    moodOptions.find((option) => option.id === profileActiveExpression)
                      ?.label
                  }`}
                  className={`hero-character-sticker ${
                    wigglingProfile === profile
                      ? 'hero-character-sticker-wiggle'
                      : moodChangedProfile === profile
                        ? 'hero-character-sticker-mood-change'
                        : isMeetingTodayConfirmed || isTodayQualified
                          ? 'hero-character-sticker-party'
                          : heartProgress[profile] >= 100
                            ? 'hero-character-sticker-party'
                            : heartProgress[profile] >= 70
                              ? 'hero-character-sticker-fever'
                              : ''
                  }`}
                >
                  <img src={moodImage(profile, profileActiveExpression)} alt="" />
                </button>
              </div>
            );
          })}

          <div
            className={`hero-profile-hearts transition-opacity duration-300 ${
              isCollidingNow ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
            <InteractiveHeart
              profileName={activeProfile}
              percentage={heartProgress[activeProfile]}
              meetingProgress={meetingFillProgress[activeProfile]}
              meetingCount={meetingToday.size}
              readOnly={false}
              meetingLocked={meetingToday.has(activeProfile)}
              isStreakLit={isTodayQualified}
              isMutualMeetingConfirmed={isMeetingTodayConfirmed}
              onProgressChange={onHeartProgressChange}
              onMeetingProgressChange={onMeetingFillProgressChange}
              onTap={handleHeartTap}
              onMeetingConfirm={handleMeeting}
              onCancelMeeting={handleCancelMeeting}
              className={`hero-profile-heart ${
                meetingEffect ? 'reunion-main-heart' : ''
              }`}
            />
          </div>
        </div>

        {/* UNIFIED 3D CLAY LOCKET DOCK */}
        <div className="-mt-1 mb-3.5 flex w-full max-w-[380px] flex-col items-center gap-1.5">
          <div className="hero-unified-clay-dock inline-flex items-center p-1">
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setIsStreakModalOpen(true);
              }}
              className="hero-dock-streak-btn flex cursor-pointer items-center rounded-full transition-all hover:scale-105 active:scale-95"
              aria-label="Detail Streak"
            >
              <StreakFlameBadge
                streak={streak}
                isActiveToday={isTodayQualified}
                isDead={isStreakDead}
              />
            </button>

            <span
              className="mx-0.5 h-4 w-[1.5px] rounded-full bg-rose-300/50 dark:bg-rose-200/15"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setIsMemoriesModalOpen(true);
              }}
              className="hero-dock-archive-btn flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold transition-all active:scale-95"
              aria-label="Buka Arsip"
            >
              <Calendar className="h-3.5 w-3.5 text-rose-500 dark:text-rose-300" />
              <span>Arsip</span>
            </button>
          </div>

          {daysSinceMeeting === 0 ? (
            <button
              type="button"
              onClick={() => playTwoHeartsCollisionSequence()}
              title="Klik untuk memutar ulang animasi 2 hati bertabrakan"
              className="meeting-celebration-pill cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <Heart className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span className="font-extrabold">
                Hari ini kita bertemu! (Putar Animasi 💞)
              </span>
            </button>
          ) : daysSinceMeeting !== null ? (
            <div className="meeting-days-card">
              <span>{daysSinceMeeting} hari ga ketemuuu</span>
              {lastMutualMeeting && (
                <span className="text-[9.5px] font-bold opacity-80">
                  (
                  {new Intl.DateTimeFormat('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: 'numeric',
                    month: 'short'
                  }).format(new Date(`${lastMutualMeeting}T12:00:00+07:00`))}
                  )
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Time Counters */}
        <RelationshipCounters anniversaryDate={settings.anniversaryDate} />

        {/* Action Buttons */}
        <div className="flex w-full max-w-[480px] flex-col items-center justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onExploreClick}
            className="clay-action-button flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-[#ad4b63] bg-[#d46480] px-5 py-2.5 font-sans-clean text-[14px] font-extrabold tracking-wide text-white shadow-[0_5px_0_#9d4058,0_8px_15px_rgba(128,43,61,.17)] transition-all hover:-translate-y-0.5 hover:bg-[#ca5875] active:translate-y-1 active:shadow-none sm:text-[15px]"
          >
            <Compass className="h-4.5 w-4.5" />
            <span>JELAJAHI PETA KENANGAN</span>
          </button>
          <button
            type="button"
            onClick={onAddMemoryClick}
            className="clay-action-button flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-[2.5px] border-[#c76b80] bg-[#fff1f2] px-5 py-2.5 font-sans-clean text-[14px] font-extrabold tracking-wide text-[#501522] shadow-[0_3px_8px_rgba(128,43,61,.12)] transition-all hover:-translate-y-0.5 hover:bg-rose-100 active:scale-[.98] dark:bg-white/5 dark:text-rose-100 sm:text-[15px]"
          >
            <Heart className="h-4.5 w-4.5 fill-[#df7890] text-[#c76b80]" />
            <span>TAMBAH KENANGAN BARU</span>
          </button>
        </div>
      </div>

      {heartParticles.map(({ id, shape, glyph, style }) => {
        const ParticleIcon = particleIcons[shape];
        return (
          <span
            key={id}
            className={`heart-burst-particle heart-burst-${shape}`}
            style={style}
            aria-hidden="true"
          >
            {glyph ?? <ParticleIcon />}
          </span>
        );
      })}

      {isInstantModalOpen && (
        <InstagramInstantModal
          activeProfile={editingCheckin?.profile || activeProfile}
          initialExpression={
            editingCheckin?.expression || coupleMoodLog[activeProfile].expression
          }
          initialData={
            editingCheckin
              ? {
                  id: editingCheckin.id,
                  profile: editingCheckin.profile,
                  logDate: editingCheckin.log_date,
                  expression: editingCheckin.expression,
                  rating: editingCheckin.rating,
                  diaryText: editingCheckin.diary_text,
                  photoUrl: editingCheckin.photo_url,
                  photoPath: editingCheckin.photo_path
                }
              : null
          }
          onSaveInstant={async (data) => {
            if (data.id && onUpdateDailyCheckin) {
              await onUpdateDailyCheckin({
                id: data.id,
                profile: editingCheckin?.profile || activeProfile,
                logDate: data.logDate || localDateKey(),
                expression: data.expression,
                rating: data.rating,
                diaryText: data.diaryText,
                photo: data.photo,
                keepExistingPhoto: data.keepExistingPhoto
              });
            } else {
              await onSaveDailyCheckin(data);
            }
            onMoodChange(editingCheckin?.profile || activeProfile, data.expression);
            onSaveMoodDiary(
              editingCheckin?.profile || activeProfile,
              data.expression,
              data.diaryText
            );
            setDiaryBubbleProfile(editingCheckin?.profile || activeProfile);
            setMoodChangedProfile(editingCheckin?.profile || activeProfile);
            setEditingCheckin(null);
            window.setTimeout(
              () => setMoodChangedProfile((c) => (c === activeProfile ? null : c)),
              700
            );
          }}
          onClose={() => {
            setIsInstantModalOpen(false);
            setEditingCheckin(null);
          }}
        />
      )}

      {lightboxPhoto && (
        <PhotoLightboxModal
          id={lightboxPhoto.id}
          photoUrl={lightboxPhoto.photoUrl}
          photoPath={lightboxPhoto.photoPath}
          caption={lightboxPhoto.caption}
          profile={lightboxPhoto.profile}
          date={lightboxPhoto.date}
          expression={lightboxPhoto.expression}
          rating={lightboxPhoto.rating}
          canManage={
            lightboxPhoto.profile === activeProfile || Boolean(isAdminAccount)
          }
          onEdit={() => {
            const targetCheckin =
              lightboxPhoto.checkin ||
              dailyCheckins.find((c) => c.id === lightboxPhoto.id);
            if (targetCheckin) {
              setEditingCheckin(targetCheckin);
              setLightboxPhoto(null);
              setIsInstantModalOpen(true);
            }
          }}
          onDelete={async () => {
            if (
              !window.confirm(
                `Hapus instant tanggal ${lightboxPhoto.date} milik ${lightboxPhoto.profile}? Foto dan catatan ini tidak dapat dipulihkan.`
              )
            )
              return;
            try {
              if (onDeleteDailyCheckin && lightboxPhoto.id) {
                await onDeleteDailyCheckin({
                  id: lightboxPhoto.id,
                  profile: lightboxPhoto.profile,
                  logDate: lightboxPhoto.date,
                  photoPath: lightboxPhoto.photoPath
                });
              }
              soundManager.playPop();
              setLightboxPhoto(null);
            } catch (err) {
              alert(
                err instanceof Error ? err.message : 'Gagal menghapus instant.'
              );
            }
          }}
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      {isMemoriesModalOpen && (
        <PhotoMemoriesModal
          checkins={dailyCheckins}
          streak={streak}
          onSelectPhoto={(photo) => {
            setIsMemoriesModalOpen(false);
            setLightboxPhoto(photo);
          }}
          onClose={() => setIsMemoriesModalOpen(false)}
        />
      )}

      <StreakInfoModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streak={streak}
        isDead={isStreakDead}
        isTodayQualified={isTodayQualified}
        restoreAvailable={restoreAvailable}
        onRestoreStreak={handleRestore}
      />
    </section>
  );
};