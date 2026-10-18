import React, { CSSProperties, useEffect, useRef, useState } from 'react';
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
  Send
} from 'lucide-react';
import { InteractiveHeart } from './InteractiveHeart';
import { InstagramInstantModal } from './InstagramInstantModal';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { PhotoMemoriesModal } from './PhotoMemoriesModal';
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

// Sistem Tingkatan Level Api Streak (Mengacu pada 3d, 10d, 30d, 100d, 200d+)
interface StreakTierConfig {
  level: number;
  name: string;
  outerStart: string;
  outerEnd: string;
  innerColor: string;
  textColor: string;
  glowColor: string;
  speed: string;
  hasSparks: boolean;
}

const getStreakTier = (days: number): StreakTierConfig => {
  if (days >= 200) {
    return {
      level: 6,
      name: 'Mythic Violet (200d+)',
      outerStart: '#c084fc',
      outerEnd: '#7e22ce',
      innerColor: '#f3e8ff',
      textColor: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.55)',
      speed: '1.15s',
      hasSparks: true
    };
  }
  if (days >= 100) {
    return {
      level: 5,
      name: 'Neon Magenta (100d+)',
      outerStart: '#ff66cc',
      outerEnd: '#db2777',
      innerColor: '#ffd6f0',
      textColor: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.52)',
      speed: '1.3s',
      hasSparks: true
    };
  }
  if (days >= 30) {
    return {
      level: 4,
      name: 'Ruby Crimson (30d+)',
      outerStart: '#ff5c77',
      outerEnd: '#e11d48',
      innerColor: '#ffccd5',
      textColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.48)',
      speed: '1.45s',
      hasSparks: true
    };
  }
  if (days >= 10) {
    return {
      level: 3,
      name: 'Fiery Red-Orange (10d+)',
      outerStart: '#ff7b29',
      outerEnd: '#ea2a15',
      innerColor: '#ffe082',
      textColor: '#ff4d29',
      glowColor: 'rgba(255, 77, 41, 0.45)',
      speed: '1.65s',
      hasSparks: false
    };
  }
  if (days >= 3) {
    return {
      level: 2,
      name: 'Blazing Orange (3d+)',
      outerStart: '#ffaa1d',
      outerEnd: '#f95700',
      innerColor: '#fff099',
      textColor: '#ff7700',
      glowColor: 'rgba(255, 119, 0, 0.4)',
      speed: '1.85s',
      hasSparks: false
    };
  }
  return {
    level: 1,
    name: 'Warm Spark',
    outerStart: '#ffcf40',
    outerEnd: '#f59e0b',
    innerColor: '#fff8cc',
    textColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    speed: '2.1s',
    hasSparks: false
  };
};

// Komponen 3D Multi-Tier Flame + Angka Senada
const StreakFlameBadge: React.FC<{ streak: number; isActiveToday: boolean }> = ({
  streak,
  isActiveToday
}) => {
  const tier = getStreakTier(streak);
  const gradId = `streak-flame-grad-${tier.level}`;

  return (
    <div
      className="streak-tier-item flex items-center gap-1.5 px-2.5 py-1 select-none"
      title={`${streak} Hari Streak · ${tier.name}${isActiveToday ? ' (Aktif hari ini)' : ''}`}
      aria-label={`${streak} hari streak`}
    >
      <div
        className="relative flex h-4.5 w-4.5 items-center justify-center"
        style={
          {
            '--flame-glow': tier.glowColor,
            '--flame-speed': tier.speed
          } as CSSProperties
        }
      >
        <svg
          viewBox="0 0 28 32"
          className="streak-multi-flame-svg h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={tier.outerStart} />
              <stop offset="100%" stopColor={tier.outerEnd} />
            </linearGradient>
          </defs>

          {/* Lidah Api Utama (Semakin tinggi level, bentuk semakin membara) */}
          {tier.level >= 4 ? (
            /* Siluet Api 3-Lidah Membara (Level 30d, 100d, 200d+) */
            <path
              d="M14 1.5 C14 1.5 20.5 7 19.5 12.5 C21.8 10.8 23 8.5 23 8.5 C25.8 13.5 25.5 21 21.2 26 C19.2 28.4 16.8 29.8 14 29.8 C11.2 29.8 8.8 28.4 6.8 26 C2.5 21 2.2 13.5 5 8.5 C5 8.5 6.2 10.8 8.5 12.5 C7.5 7 14 1.5 14 1.5 Z"
              fill={`url(#${gradId})`}
            />
          ) : (
            /* Siluet Api 2-Lidah Klasik (Level 1d - 29d) */
            <path
              d="M14.5 2 C14.5 2 21 8.2 20 14.2 C22 12.8 22.8 10.5 22.8 10.5 C25.2 15 24.5 22 20.5 26.5 C18.8 28.5 16.5 29.8 14 29.8 C11.2 29.8 8.8 28.2 7.2 26 C3.8 21.5 4.2 14.5 7.5 10 C7.5 10 8.2 12.2 10 13.2 C9.5 7.8 14.5 2 14.5 2 Z"
              fill={`url(#${gradId})`}
            />
          )}

          {/* Inti Api Dalam (Inner Core Flame) */}
          <path
            d="M14 14.5 C14 14.5 17.8 18.2 17.5 22.5 C17.3 25.5 15.8 27.5 14 27.5 C12.2 27.5 10.7 25.5 10.5 22.5 C10.2 18.2 14 14.5 14 14.5 Z"
            fill={tier.innerColor}
            opacity="0.92"
          />

          {/* Percikan Bara Api di Atas untuk Level Tinggi (30d, 100d, 200d+) */}
          {tier.hasSparks && (
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
            </>
          )}
        </svg>
      </div>

      {/* Angka Hitungan Hari dengan Warna Senada Api */}
      <span
        className="text-[13px] font-black leading-none tracking-tight tabular-nums"
        style={{
          color: tier.textColor,
          textShadow: `0 1px 8px ${tier.glowColor}`
        }}
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
  onAddMemoryClick
}) => {
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [isMemoriesModalOpen, setIsMemoriesModalOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    photoUrl: string;
    caption?: string | null;
    profile: CoupleProfile;
    date: string;
    expression: MoodExpression;
    rating?: number | null;
  } | null>(null);

  const [wigglingProfile, setWigglingProfile] = useState<'Savero' | 'Soffie' | null>(null);
  const [moodChangedProfile, setMoodChangedProfile] = useState<'Savero' | 'Soffie' | null>(null);
  const [diaryBubbleProfile, setDiaryBubbleProfile] = useState<'Savero' | 'Soffie' | null>(null);
  const [diaryHistoryIndex, setDiaryHistoryIndex] = useState(0);
  const [dailyNotice, setDailyNotice] = useState('');
  const [meetingNotice, setMeetingNotice] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const handleChibiTap = (profile: 'Savero' | 'Soffie') => {
    soundManager.playTap();
    setDiaryHistoryIndex(0);
    setIsReplying(false);
    setReplyText('');
    setDiaryBubbleProfile((current) => (current === profile ? null : profile));
    setWigglingProfile(profile);
    window.setTimeout(() => setWigglingProfile((current) => (current === profile ? null : current)), 650);
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
    const profiles = fullHeartProfilesByDate.get(entry.progress_date) ?? new Set<CoupleProfile>();
    profiles.add(entry.profile);
    fullHeartProfilesByDate.set(entry.progress_date, profiles);
  }
  const restoredDates = new Set(streakRestores.map((item) => item.missed_date));
  const isQualifiedDay = (date: string) =>
    restoredDates.has(date) ||
    ((checkinProfilesByDate.get(date)?.size ?? 0) >= 2 && (fullHeartProfilesByDate.get(date)?.size ?? 0) >= 2);

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
    isQualifiedDay(twoDaysAgo) &&
    (!streakRestores[0] || Date.now() - new Date(streakRestores[0].restored_at).getTime() >= 7 * 86400000);

  const meetingToday = new Set(
    meetingConfirmations.filter((item) => item.meeting_date === today).map((item) => item.profile)
  );
  const mutualMeetingDates = [...new Set(meetingConfirmations.map((item) => item.meeting_date))]
    .filter((date) => new Set(meetingConfirmations.filter((item) => item.meeting_date === date).map((item) => item.profile)).size >= 2)
    .sort();

  const isBothFilledToday = meetingFillProgress['Savero'] >= 100 && meetingFillProgress['Soffie'] >= 100;
  const isMeetingTodayConfirmed = meetingToday.size >= 2 || isBothFilledToday;
  const lastMutualMeeting = isMeetingTodayConfirmed ? today : (mutualMeetingDates.at(-1) ?? settings.firstMeetDate);
  const daysSinceMeeting = isMeetingTodayConfirmed
    ? 0
    : lastMutualMeeting
      ? Math.max(0, Math.floor((new Date(`${today}T12:00:00+07:00`).getTime() - new Date(`${lastMutualMeeting}T12:00:00+07:00`).getTime()) / 86400000))
      : null;
  const meetingEffect = daysSinceMeeting !== null && daysSinceMeeting < 2;

  const handleRestore = async () => {
    setDailyNotice('');
    try {
      await onRestoreStreak();
      setDailyNotice('Streak berhasil dipulihkan.');
    } catch (error) {
      setDailyNotice(error instanceof Error ? error.message : 'Streak belum bisa dipulihkan.');
    }
  };

  const handleMeeting = async () => {
    setDailyNotice('');
    setMeetingNotice('');
    try {
      await onConfirmMeeting();
      soundManager.playHeart();
      setMeetingNotice('Konfirmasi bertemu tersimpan ♥');
      window.setTimeout(() => setMeetingNotice(''), 2800);
      return true;
    } catch (error) {
      setDailyNotice(error instanceof Error ? error.message : 'Konfirmasi belum tersimpan.');
      return false;
    }
  };

  const handleCancelMeeting = async () => {
    if (!window.confirm('Batalkan konfirmasi bertemu hari ini? Progres liquid kedua akan kembali ke 0%.')) return;
    setDailyNotice('');
    setMeetingNotice('');
    try {
      await onCancelMeeting();
      setMeetingNotice('Konfirmasi bertemu dibatalkan.');
      window.setTimeout(() => setMeetingNotice(''), 3200);
    } catch (error) {
      setDailyNotice(error instanceof Error ? error.message : 'Konfirmasi bertemu belum bisa dibatalkan.');
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

  useEffect(() => {
    const calculateTime = () => {
      const anniversary = new Date(`${settings.anniversaryDate}T00:00:00`);
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
  }, [settings.anniversaryDate]);

  const handleHeartTap = ({ x, y }: { x: number; y: number }, profile?: CoupleProfile) => {
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
      setHeartParticles((current) => current.filter((particle) => !burst.some((item) => item.id === particle.id)));
    }, 1050);
  };

  const counters = [
    { label: 'Hari', value: timeTogether.days },
    { label: 'Jam', value: timeTogether.hours },
    { label: 'Menit', value: timeTogether.minutes },
    { label: 'Detik', value: timeTogether.seconds }
  ];

  return (
    <section className="relative bg-[#fffaf0] px-4 pb-7 pt-5 transition-colors dark:bg-[#21151a] sm:pb-10 sm:pt-7">
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
        <div className="hero-heart-stage relative mb-0 mt-0 flex h-[238px] w-full max-w-[490px] items-center justify-center sm:h-[285px]">
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
                date: entry.date,
                content: entry.content,
                expression: entry.expression,
                photo_url: null,
                rating: null,
                created_at: entry.updatedAt || entry.createdAt
              }));

            const diaryHistory = [
              ...profileCheckins.map((entry) => ({
                date: entry.log_date,
                content: entry.diary_text,
                expression: entry.expression,
                photo_url: entry.photo_url,
                rating: entry.rating,
                created_at: entry.photo_uploaded_at || entry.updated_at || entry.created_at
              })),
              ...localDiaryHistory
            ].sort((left, right) => right.date.localeCompare(left.date));

            const selectedHistoryIndex = Math.min(diaryHistoryIndex, Math.max(0, diaryHistory.length - 1));
            const latestDiary = diaryHistory[selectedHistoryIndex];
            const historyTime = latestDiary?.created_at
              ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).format(new Date(latestDiary.created_at))
              : null;
            const historyDateLabel =
              latestDiary?.date === localDateKey()
                ? 'Hari ini'
                : latestDiary?.date
                  ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short' }).format(new Date(`${latestDiary.date}T12:00:00+07:00`))
                  : 'Kosong';

            const isActive = activeProfile === profile;
            const sideClass = profile === 'Soffie' ? 'hero-character-wrap-left' : 'hero-character-wrap-right';

            const profileLatestReply = instantReplies.find((r) => r.authorProfile === profile);
            const latestProfileEntry = diaryHistory[0];
            const profileActiveExpression = latestProfileEntry?.expression ?? coupleMoodLog[profile].expression;
            const currentMoodOption = moodOptions.find(
              (opt) => opt.id === (latestDiary?.expression ?? profileActiveExpression)
            );

            return (
              <div
                key={profile}
                className={`hero-character-wrap ${sideClass} ${
                  diaryBubbleProfile === profile ? 'hero-character-wrap-bubble-open' : ''
                } ${profileLatestReply && diaryBubbleProfile !== profile ? 'hero-character-wrap-has-reply' : ''}`}
              >
                {/* Chibi Heart Shoulder Badge */}
                <span
                  className={`profile-heart-shoulder-badge profile-heart-badge-${profile.toLowerCase()}`}
                  role="status"
                  aria-label={`Hati ${profile}: ${Math.round(heartProgress[profile])}%`}
                >
                  <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                  <span>{Math.round(heartProgress[profile])}%</span>
                </span>

                {/* 3D Puffy Cloud Reply Bubble */}
                {profileLatestReply && diaryBubbleProfile !== profile && (
                  <CloudReplyBubble
                    reply={profileLatestReply}
                    authorProfile={profile}
                    activeProfile={activeProfile}
                    onDeleteReply={onDeleteReply}
                  />
                )}

                {/* OPSI A: ULTRA-COMPACT 3D CLAY POPUP (Chibi & Caption Inside Squircle, No Duplicate Archive Button) */}
                {diaryBubbleProfile === profile && (
                  <div className="hero-diary-bubble" role="dialog" aria-label={`Momen ${profile}`}>
                    {/* Minimal Header */}
                    <div className="flex items-center justify-between gap-1 px-0.5 pb-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div className="relative flex-none rounded-full bg-gradient-to-tr from-rose-400 via-pink-300 to-amber-300 p-[1.5px] shadow-2xs">
                          <img
                            src={moodImage(profile, latestDiary?.expression ?? profileActiveExpression)}
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
                              onClick={() => setDiaryHistoryIndex((index) => Math.max(0, index - 1))}
                              className="p-0.5 hover:text-rose-500 disabled:opacity-30"
                            >
                              <ChevronLeft className="h-2.5 w-2.5" />
                            </button>
                            <span className="px-0.5 tabular-nums">{selectedHistoryIndex + 1}/{diaryHistory.length}</span>
                            <button
                              type="button"
                              aria-label="Lebih lama"
                              disabled={selectedHistoryIndex >= diaryHistory.length - 1}
                              onClick={() => setDiaryHistoryIndex((index) => Math.min(diaryHistory.length - 1, index + 1))}
                              className="p-0.5 hover:text-rose-500 disabled:opacity-30"
                            >
                              <ChevronRight className="h-2.5 w-2.5" />
                            </button>
                          </div>
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

                    {/* Squircle Photo Frame with Embedded Curved Caption + Floating Chibi Mood + Rating */}
                    {latestDiary?.photo_url ? (
                      <div
                        className="instant-squircle-photo group"
                        onClick={() => {
                          setLightboxPhoto({
                            photoUrl: latestDiary.photo_url!,
                            caption: latestDiary.content,
                            profile,
                            date: latestDiary.date,
                            expression: latestDiary.expression,
                            rating: latestDiary.rating
                          });
                        }}
                      >
                        {/* Foto Utama (diberi class instant-main-photo) */}
                        <img
                          src={latestDiary.photo_url}
                          alt={`Momen ${profile}`}
                          className="instant-main-photo h-full w-full object-cover"
                        />

                        {/* Vignette halus di atas & bawah agar teks melengkung & badge terbaca jelas */}
                        <div
                          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,transparent_36%,transparent_68%,rgba(0,0,0,0.52)_100%)]"
                          aria-hidden="true"
                        />

                        {/* Curved Caption Hugging Top-Left Squircle Corner */}
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
                              <filter id={`caption-shadow-${profile}`} x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" floodColor="#000000" floodOpacity="0.7" />
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
                                startOffset={getCurvedCaptionStartOffset(latestDiary.content)}
                              >
                                {latestDiary.content.toUpperCase()}
                              </textPath>
                            </text>
                          </svg>
                        )}

                        {/* Pojok Kiri-Bawah Dalam Foto: Badge Chibi Mungil + Label Mood */}
                        <div className="pointer-events-none absolute bottom-2 left-2 z-[3] flex items-center gap-1 rounded-full border border-white/40 bg-black/55 py-0.5 pl-0.5 pr-2 text-[8.5px] font-extrabold text-white shadow-md backdrop-blur-md">
                          <span className="relative block h-[18px] w-[18px] shrink-0 overflow-hidden rounded-full border border-white/90 bg-rose-100">
                            <img
                              src={moodImage(profile, latestDiary?.expression ?? profileActiveExpression)}
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

                        {/* Pojok Kanan-Bawah Dalam Foto: 3D Heart Rating Badge */}
                        {latestDiary?.rating !== null && latestDiary?.rating !== undefined && (
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
                      /* Fallback jika tidak ada foto (hanya teks catatan) */
                      <div className="relative flex flex-col gap-1.5 rounded-2xl border border-rose-200/40 bg-white/70 p-2.5 dark:border-white/10 dark:bg-black/25">
                        <p className="text-left text-[10px] font-semibold leading-relaxed text-[#5e2431] dark:text-rose-100">
                          {latestDiary?.content || 'Belum ada foto atau cerita hari ini.'}
                        </p>
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="flex items-center gap-1 text-[8.5px] font-extrabold text-rose-500 dark:text-rose-300">
                            <img
                              src={moodImage(profile, latestDiary?.expression ?? profileActiveExpression)}
                              alt=""
                              className="h-4 w-4 rounded-full object-cover object-top"
                            />
                            {currentMoodOption?.label ?? 'Tenang'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* SINGLE COMPACT ACTION ROW (Tanpa Tombol Arsip Ganda!) */}
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
                      <button
                        type="button"
                        onClick={() => {
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
                    moodOptions.find((option) => option.id === profileActiveExpression)?.label
                  }`}
                  className={`hero-character-sticker ${
                    heartProgress[profile] >= 70 ? 'hero-character-sticker-fever' : ''
                  } ${heartProgress[profile] >= 100 ? 'hero-character-sticker-party' : ''} ${
                    wigglingProfile === profile ? 'hero-character-sticker-wiggle' : ''
                  } ${moodChangedProfile === profile ? 'hero-character-sticker-mood-change' : ''}`}
                >
                  <img src={moodImage(profile, profileActiveExpression)} alt="" />
                </button>
              </div>
            );
          })}

          <div className="hero-profile-hearts">
            <InteractiveHeart
              profileName={activeProfile}
              percentage={heartProgress[activeProfile]}
              meetingProgress={meetingFillProgress[activeProfile]}
              meetingCount={meetingToday.size}
              readOnly={false}
              meetingLocked={meetingToday.has(activeProfile)}
              onProgressChange={onHeartProgressChange}
              onMeetingProgressChange={onMeetingFillProgressChange}
              onTap={handleHeartTap}
              onMeetingConfirm={handleMeeting}
              className={`hero-profile-heart ${meetingEffect ? 'reunion-main-heart' : ''}`}
            />
          </div>
        </div>

        {/* OPSI 2: UNIFIED 3D CLAY LOCKET DOCK (Streak Multi-Level + Arsip Tanpa Emot) */}
        <div className="-mt-1 mb-3.5 flex w-full max-w-[380px] flex-col items-center gap-1.5">
          {/* Micro Status Caption (Hanya jika ada notice atau konfirmasi aktif) */}
          {meetingNotice ? (
            <p className="px-2 text-center text-[10px] font-bold leading-snug text-[#6e2b3c] dark:text-rose-200/90">
              <span key="meeting-notice" role="status">{meetingNotice}</span>
            </p>
          ) : meetingToday.has(activeProfile) ? (
            <p className="px-2 text-center text-[10px] font-bold leading-snug text-[#6e2b3c] dark:text-rose-200/90">
              <span key="meeting-confirmed">Konfirmasi bertemu profil ini sudah tersimpan ♥</span>
            </p>
          ) : null}

          {meetingToday.has(activeProfile) && (
            <button
              type="button"
              onClick={() => void handleCancelMeeting()}
              className="meeting-cancel-button rounded-full px-3 py-1 text-[10px] font-extrabold shadow-xs transition active:scale-95"
            >
              Batalkan konfirmasi bertemu
            </button>
          )}

          {/* UNIFIED 3D CLAY DOCK: [ 🔥 1  |  📅 Arsip ] */}
          <div className="hero-unified-clay-dock inline-flex items-center p-1">
            {/* Sisi Kiri: Simbol Api Multi-Level & Angka Hari Senada */}
            <StreakFlameBadge streak={streak} isActiveToday={isQualifiedDay(today)} />

            {/* Garis Pemisah 3D Halus */}
            <span className="mx-0.5 h-4 w-[1.5px] rounded-full bg-rose-300/50 dark:bg-rose-200/15" aria-hidden="true" />

            {/* Sisi Kanan: Tombol Arsip (Simbol Calendar + Teks "Arsip" Tanpa Emot) */}
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

          {/* Compact Meeting Days Pill (Format: X hari ga ketemuuu (tgl) tanpa simbol kalender) */}
          {daysSinceMeeting === 0 ? (
            <div className="meeting-celebration-pill">
              <Heart className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span className="font-extrabold">Hari ini kita bertemu!</span>
            </div>
          ) : daysSinceMeeting !== null ? (
            <div className="meeting-days-card">
              <span>{daysSinceMeeting} hari ga ketemuuu</span>
              {lastMutualMeeting && (
                <span className="text-[9.5px] font-bold opacity-80">
                  ({new Intl.DateTimeFormat('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: 'numeric',
                    month: 'short'
                  }).format(new Date(`${lastMutualMeeting}T12:00:00+07:00`))})
                </span>
              )}
            </div>
          ) : null}

          {restoreAvailable && (
            <button
              type="button"
              onClick={() => void handleRestore()}
              className="streak-restore-link"
            >
              Pulihkan streak kemarin
            </button>
          )}
          {dailyActionError && (
            <p role="alert" className="max-w-[300px] text-center text-[9.5px] font-bold text-red-600 dark:text-red-300">
              {dailyActionError}
            </p>
          )}
          {dailyNotice && (
            <p role="status" className="max-w-[300px] text-center text-[9.5px] font-bold text-[#8d3d52] dark:text-rose-100">
              {dailyNotice}
            </p>
          )}
        </div>

        {/* Time Counters */}
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

      {/* Instagram Instant Camera Modal */}
      {isInstantModalOpen && (
        <InstagramInstantModal
          activeProfile={activeProfile}
          initialExpression={coupleMoodLog[activeProfile].expression}
          onSaveInstant={async (data) => {
            await onSaveDailyCheckin(data);
            onMoodChange(activeProfile, data.expression);
            onSaveMoodDiary(activeProfile, data.expression, data.diaryText);
            setDiaryBubbleProfile(activeProfile);
            setMoodChangedProfile(activeProfile);
            window.setTimeout(() => setMoodChangedProfile((c) => (c === activeProfile ? null : c)), 700);
          }}
          onClose={() => setIsInstantModalOpen(false)}
        />
      )}

      {/* Photo Lightbox Modal */}
      {lightboxPhoto && (
        <PhotoLightboxModal
          photoUrl={lightboxPhoto.photoUrl}
          caption={lightboxPhoto.caption}
          profile={lightboxPhoto.profile}
          date={lightboxPhoto.date}
          expression={lightboxPhoto.expression}
          rating={lightboxPhoto.rating}
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      {/* Photo Memories / Archive Modal */}
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
    </section>
  );
};