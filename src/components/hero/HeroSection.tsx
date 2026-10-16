import React, { CSSProperties, useEffect, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Compass, Flower2, Heart, Sparkles, Star, X } from 'lucide-react';
import { InteractiveHeart } from './InteractiveHeart';
import { AppSettings } from '../../types';
import { CoupleMoodLog, CoupleProfile, DailyCheckin, DailyHeartProgress, MeetingConfirmation, MoodDiaryEntry, MoodExpression, StreakRestore } from '../../types';
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

const moodOptions: { id: MoodExpression; label: string; asset: string }[] = [
  { id: 'bahagia', label: 'Senang', asset: 'bahagia' },
  { id: 'rindu', label: 'Rindu', asset: 'gemas-sayang' },
  { id: 'tenang', label: 'Tenang', asset: 'serius' },
  { id: 'semangat', label: 'Semangat', asset: 'semangat' },
  { id: 'lelah', label: 'Lelah', asset: 'mengantuk' },
  { id: 'sedih', label: 'Sedih', asset: 'sedih' }
];

const moodImage = (profile: 'Savero' | 'Soffie', mood: MoodExpression) => {
  const asset = moodOptions.find((option) => option.id === mood)?.asset ?? 'bahagia';
  return `/characters/expressions/${profile.toLowerCase()}/${asset}.png`;
};

const localDateKey = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
};

async function compressSquareImage(file: File): Promise<Blob> {
  const image = await createImageBitmap(file);
  const side = Math.min(image.width, image.height);
  const canvas = document.createElement('canvas');
  let size = Math.min(768, side);
  canvas.width = size; canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Foto tidak dapat diproses di perangkat ini.');
  const encode = (quality: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('Kompresi foto gagal.'));
    } else if (['image/webp', 'image/png', 'image/jpeg'].includes(blob.type)) {
      resolve(blob);
    } else {
      reject(new Error(`Format foto hasil kompresi tidak didukung (${blob.type || 'tidak diketahui'}).`));
    }
  }, 'image/webp', quality));
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      canvas.width = size; canvas.height = size;
      context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
      const blob = await encode(attempt === 0 ? 0.76 : 0.62);
      if (blob.size <= 740 * 1024 || size <= 384) return blob;
      size = Math.max(384, Math.round(size * 0.82));
    }
    throw new Error('Ukuran foto masih terlalu besar setelah dikompres.');
  } finally { image.close(); }
}

export const HeroSection: React.FC<HeroSectionProps> = ({ settings, activeProfile, coupleMoodLog, moodDiary, dailyCheckins, streakRestores, meetingConfirmations, heartProgress, dailyHeartProgress, meetingFillProgress, dailyActionError, onMoodChange, onSaveMoodDiary, onSaveDailyCheckin, onRestoreStreak, onConfirmMeeting, onCancelMeeting, onHeartProgressChange, onMeetingFillProgressChange, onExploreClick, onAddMemoryClick }) => {
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);
  const [isMoodPickerOpen, setIsMoodPickerOpen] = useState(false);
  const [wigglingProfile, setWigglingProfile] = useState<'Savero' | 'Soffie' | null>(null);
  const [moodChangedProfile, setMoodChangedProfile] = useState<'Savero' | 'Soffie' | null>(null);
  const [diaryBubbleProfile, setDiaryBubbleProfile] = useState<'Savero' | 'Soffie' | null>(null);
  const [diaryHistoryIndex, setDiaryHistoryIndex] = useState(0);
  const [selectedExpression, setSelectedExpression] = useState<MoodExpression>(coupleMoodLog[activeProfile].expression);
  const [diaryDraft, setDiaryDraft] = useState('');
  const [dailyRating, setDailyRating] = useState(5);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingDaily, setSavingDaily] = useState(false);
  const [dailyNotice, setDailyNotice] = useState('');
  const [meetingNotice, setMeetingNotice] = useState('');

  const handleChibiTap = (profile: 'Savero' | 'Soffie') => {
    soundManager.playTap();
    setDiaryHistoryIndex(0);
    setDiaryBubbleProfile((current) => current === profile ? null : profile);
    setWigglingProfile(profile);
    window.setTimeout(() => setWigglingProfile((current) => current === profile ? null : current), 650);
  };

  const openDiaryEditor = () => {
    const existing = dailyCheckins.find((entry) => entry.profile === activeProfile && entry.log_date === localDateKey());
    setSelectedExpression(existing?.expression ?? coupleMoodLog[activeProfile].expression);
    setDiaryDraft(existing?.diary_text ?? moodDiary.find((entry) => entry.profile === activeProfile && entry.date === localDateKey())?.content ?? '');
    setDailyRating(existing?.rating ?? 5);
    setPhotoFile(null);
    setPhotoPreview(existing?.photo_url ?? null);
    setIsMoodPickerOpen(true);
    setDiaryBubbleProfile(null);
  };

  useEffect(() => {
    if (!photoPreview?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const saveMoodAndDiary = async () => {
    setSavingDaily(true); setDailyNotice('');
    try {
      let compressedPhoto: Blob | null = null;
      if (photoFile) compressedPhoto = await compressSquareImage(photoFile);
      await onSaveDailyCheckin({ expression: selectedExpression, rating: dailyRating, diaryText: diaryDraft, photo: compressedPhoto });
      onMoodChange(activeProfile, selectedExpression);
      onSaveMoodDiary(activeProfile, selectedExpression, diaryDraft);
      soundManager.playHeart();
      setMoodChangedProfile(activeProfile);
      window.setTimeout(() => setMoodChangedProfile((current) => current === activeProfile ? null : current), 700);
      setIsMoodPickerOpen(false);
    } catch (error) {
      setDailyNotice(error instanceof Error ? error.message : 'Log harian belum tersimpan.');
    } finally { setSavingDaily(false); }
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
  const isQualifiedDay = (date: string) => restoredDates.has(date) || (
    (checkinProfilesByDate.get(date)?.size ?? 0) >= 2 &&
    (fullHeartProfilesByDate.get(date)?.size ?? 0) >= 2
  );
  const dateOffset = (date: string, days: number) => { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };
  let streak = 0;
  let streakDay = isQualifiedDay(today) ? today : dateOffset(today, -1);
  while (streak < 5000 && isQualifiedDay(streakDay)) { streak += 1; streakDay = dateOffset(streakDay, -1); }
  const yesterday = dateOffset(today, -1);
  const twoDaysAgo = dateOffset(today, -2);
  const restoreAvailable = !streakRestores.some((item) => item.missed_date === yesterday) && isQualifiedDay(twoDaysAgo) && (!streakRestores[0] || Date.now() - new Date(streakRestores[0].restored_at).getTime() >= 7 * 86400000);
  const meetingToday = new Set(meetingConfirmations.filter((item) => item.meeting_date === today).map((item) => item.profile));
  const mutualMeetingDates = [...new Set(meetingConfirmations.map((item) => item.meeting_date))].filter((date) => new Set(meetingConfirmations.filter((item) => item.meeting_date === date).map((item) => item.profile)).size >= 2).sort();
  const lastMutualMeeting = mutualMeetingDates.at(-1) ?? settings.firstMeetDate;
  const daysSinceMeeting = lastMutualMeeting ? Math.max(0, Math.floor((new Date(`${today}T12:00:00+07:00`).getTime() - new Date(`${lastMutualMeeting}T12:00:00+07:00`).getTime()) / 86400000)) : null;
  const meetingEffect = daysSinceMeeting !== null && daysSinceMeeting < 2;

  const handleRestore = async () => { setDailyNotice(''); try { await onRestoreStreak(); setDailyNotice('Streak berhasil dipulihkan.'); } catch (error) { setDailyNotice(error instanceof Error ? error.message : 'Streak belum bisa dipulihkan.'); } };
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
      setMeetingNotice('Konfirmasi bertemu dibatalkan. Progres liquid kedua direset.');
      window.setTimeout(() => setMeetingNotice(''), 3200);
    } catch (error) {
      setDailyNotice(error instanceof Error ? error.message : 'Konfirmasi bertemu belum bisa dibatalkan.');
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
      const angle = (Math.PI * 2 * index) / 5;
      const distance = 50 + Math.random() * 45;
      const shape = (['heart', 'sparkle', 'flower'] as const)[index % 3];
      return {
        id: Date.now() + index,
        shape,
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
    <section className="relative overflow-hidden bg-[#fffaf0] px-5 pb-8 pt-7 transition-colors dark:bg-[#21151a] sm:pb-12 sm:pt-8">
      <div className="pointer-events-none absolute -left-20 top-1/3 h-44 w-44 rounded-full bg-rose-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-16 h-48 w-48 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="relative z-10 mx-auto flex max-w-[560px] flex-col items-center text-center">
        <h1 className="mb-1 font-script text-[43px] leading-tight text-[#bd5b76] drop-shadow-sm dark:text-[#f0a8b7] sm:text-5xl">cerita kita</h1>
        <p className="mx-auto mb-2 max-w-[500px] px-1 font-sans-clean text-[15px] leading-[1.5] text-[#43252d] dark:text-rose-50/85 sm:mb-3 sm:text-base">
          “Dari malam pertama di Mie Gacoan hingga subuh berkabut di jalan baru Jangli–Undip, ini adalah ruang perjalanan cinta kita di Semarang.”
        </p>

        <div className="hero-heart-stage relative mb-0 mt-0 flex h-[250px] w-full max-w-[500px] items-center justify-center sm:h-[300px]">
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
            const historyDateLabel = latestDiary?.date === localDateKey()
              ? 'Catatan hari ini'
              : latestDiary?.date
                ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${latestDiary.date}T12:00:00+07:00`))
                : 'Belum ada catatan';
            const historyTimeLabel = latestDiary?.photo_url ? 'Foto diunggah' : 'Disimpan';
            const isActive = activeProfile === profile;
            const sideClass = profile === 'Soffie' ? 'hero-character-wrap-left' : 'hero-character-wrap-right';
            const orbClipId = `profile-orb-clip-${profile.toLowerCase()}`;
            const orbPathId = `profile-orb-path-${profile.toLowerCase()}`;
            const orbFill = profile === 'Soffie' ? '#ff5c97' : '#d90448';
            return <div key={profile} className={`hero-character-wrap ${sideClass} ${diaryBubbleProfile === profile ? 'hero-character-wrap-bubble-open' : ''}`}>
                <span className={`profile-heart-indicator profile-heart-indicator-${profile.toLowerCase()}`} role="status" aria-label={`Hati ${profile}: ${Math.round(heartProgress[profile])}%`}>
                  <svg viewBox="0 0 100 100" width="38" height="38" aria-hidden="true">
                    <defs>
                      <path id={orbPathId} d="M50,88 C50,88 12,62 12,34 C12,18 24,8 37,8 C45,8 50,14 50,18 C50,14 55,8 63,8 C76,8 88,18 88,34 C88,62 50,88 50,88 Z" />
                      <clipPath id={orbClipId}><use href={`#${orbPathId}`} /></clipPath>
                    </defs>
                    <use href={`#${orbPathId}`} fill="rgba(255,255,255,.18)" />
                    <g clipPath={`url(#${orbClipId})`}>
                      <rect x="0" y={88 - (heartProgress[profile] / 100) * 80} width="100" height="95" fill={orbFill} />
                    </g>
                    <use href={`#${orbPathId}`} fill="none" stroke="#ff9ebb" strokeWidth="3.5" />
                  </svg>
                  <span className="profile-heart-indicator-copy"><strong>{profile}</strong><span>{Math.round(heartProgress[profile])}%</span></span>
                </span>
                {diaryBubbleProfile === profile && <div className="hero-diary-bubble" role="dialog" aria-label={`Catatan perasaan ${profile}`}>
                  <div className="hero-diary-bubble-header">
                    <img src={moodImage(profile, latestDiary?.expression ?? coupleMoodLog[profile].expression)} alt="" />
                    <div className="hero-diary-bubble-heading">
                      <strong>{profile}</strong>
                      <span>{historyDateLabel}{historyTime ? ` · ${historyTimeLabel} ${historyTime} WIB` : ''}</span>
                    </div>
                    <button type="button" onClick={() => setDiaryBubbleProfile(null)} aria-label="Tutup cerita" className="hero-diary-bubble-close"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="hero-diary-bubble-nav">
                    <button type="button" aria-label="Catatan lebih baru" disabled={selectedHistoryIndex <= 0} onClick={() => setDiaryHistoryIndex((index) => Math.max(0, index - 1))}><ChevronLeft /></button>
                    <span>{diaryHistory.length ? `${selectedHistoryIndex + 1} / ${diaryHistory.length}` : '0 catatan'}</span>
                    <button type="button" aria-label="Catatan lebih lama" disabled={selectedHistoryIndex >= diaryHistory.length - 1} onClick={() => setDiaryHistoryIndex((index) => Math.min(diaryHistory.length - 1, index + 1))}><ChevronRight /></button>
                  </div>
                  <div className="hero-diary-mood-pill"><Heart aria-hidden="true" />{moodOptions.find((option) => option.id === (latestDiary?.expression ?? coupleMoodLog[profile].expression))?.label ?? 'Belum dicatat'}</div>
                  <p className="hero-diary-bubble-content">{latestDiary?.content || 'Belum ada cerita hari ini.'}</p>
                  {latestDiary?.photo_url && <img src={latestDiary.photo_url} alt={`Foto diary ${profile}`} className="hero-diary-bubble-photo" />}
                  {latestDiary?.rating !== null && latestDiary?.rating !== undefined && <p className="hero-diary-bubble-rating"><span>Rating hari ini</span><strong>{latestDiary.rating}<span>/5</span> ♥</strong></p>}
                  {isActive && <button type="button" onClick={openDiaryEditor} className="hero-diary-bubble-action">{latestDiary?.date === localDateKey() ? 'Edit catatan hari ini' : 'Tulis / ubah catatan hari ini'}<span aria-hidden="true">→</span></button>}
                </div>}
              <button type="button" onClick={() => handleChibiTap(profile)} aria-label={`Perasaan ${profile}: ${moodOptions.find((option) => option.id === coupleMoodLog[profile].expression)?.label}`} className={`hero-character-sticker ${heartProgress[profile] >= 70 ? 'hero-character-sticker-fever' : ''} ${heartProgress[profile] >= 100 ? 'hero-character-sticker-party' : ''} ${wigglingProfile === profile ? 'hero-character-sticker-wiggle' : ''} ${moodChangedProfile === profile ? 'hero-character-sticker-mood-change' : ''}`}>
                <img src={moodImage(profile, coupleMoodLog[profile].expression)} alt="" />
              </button>
            </div>;
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
        <p className="-mt-1 max-w-[320px] px-3 text-center text-[10px] leading-relaxed text-[#80646a] dark:text-rose-100/70">
          {meetingNotice ? <span role="status">{meetingNotice}</span> : meetingToday.has(activeProfile)
            ? 'Konfirmasi bertemu profil ini sudah tersimpan hari ini.'
            : heartProgress[activeProfile] >= 100
              ? `Liquid pertama tetap penuh. Tahan untuk mengisi liquid kedua (${Math.round(meetingFillProgress[activeProfile])}%).`
              : 'Isi hati hingga 100% untuk progres harian. Setelah penuh, tahan lagi untuk konfirmasi bertemu.'}
        </p>
        {meetingToday.has(activeProfile) && (
          <button
            type="button"
            onClick={() => void handleCancelMeeting()}
            className="meeting-cancel-button mb-2 min-h-9 rounded-full px-3 text-[11px] font-bold shadow-sm transition hover:bg-rose-50 active:scale-95 dark:hover:bg-white/10"
          >
            Batalkan konfirmasi bertemu
          </button>
        )}
        <p className="mb-2 -mt-1 flex items-center justify-center gap-1.5 font-sans-clean text-[11px] font-semibold text-[#80646a] dark:text-rose-100/75" aria-live="polite">
          <span className="font-extrabold text-[#a94761] dark:text-rose-200">{streak} hari streak</span>
        </p>

        <div className="mb-3 flex w-full flex-col items-center gap-1.5">
          {daysSinceMeeting !== null && daysSinceMeeting >= 7 && <p className="meeting-days-reminder"><Heart aria-hidden="true" />Sudah {daysSinceMeeting} hari sejak terakhir bertemu</p>}
          {restoreAvailable && <button type="button" onClick={() => void handleRestore()} className="streak-restore-link">Pulihkan streak kemarin</button>}
          {dailyActionError && <p role="alert" className="max-w-[320px] text-center text-[10px] text-red-700 dark:text-red-300">{dailyActionError}</p>}
          {dailyNotice && <p role="status" className="max-w-[320px] text-center text-[10px] text-[#8d3d52] dark:text-rose-100">{dailyNotice}</p>}
        </div>

        <div className="mb-5 flex items-center justify-center gap-2 sm:mb-6 sm:gap-3">
          {counters.map(({ label, value }) => (
            <div key={label} className="hero-count-card flex h-[76px] w-[clamp(56px,12vw,68px)] flex-col items-center justify-center rounded-[1.35rem] bg-[#f9dce1] sm:h-[78px] sm:w-[72px]">
              <span className="font-sans-clean text-[27px] font-extrabold leading-none text-[#501522] dark:text-rose-100 sm:text-3xl">{value}</span>
              <span className="mt-1 font-sans-clean text-[12px] leading-none text-[#501522] dark:text-rose-100/80 sm:text-xs">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex w-full max-w-[500px] flex-col items-center justify-center gap-3 sm:gap-4">
          <button type="button" onClick={onExploreClick} className="clay-action-button flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full border border-[#ad4b63] bg-[#d46480] px-5 py-3 font-sans-clean text-[15px] font-bold tracking-wide text-white shadow-[0_5px_0_#9d4058,0_8px_15px_rgba(128,43,61,.17)] transition-all hover:-translate-y-0.5 hover:bg-[#ca5875] active:translate-y-1 active:shadow-none sm:text-base">
            <Compass className="h-5 w-5" /><span>JELAJAHI PETA KENANGAN</span>
          </button>
          <button type="button" onClick={onAddMemoryClick} className="clay-action-button flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full border-[3px] border-[#c76b80] bg-[#fff1f2] px-5 py-3 font-sans-clean text-[15px] font-bold tracking-wide text-[#501522] shadow-[0_3px_8px_rgba(128,43,61,.12)] transition-all hover:-translate-y-0.5 hover:bg-rose-100 active:scale-[.98] dark:bg-white/5 dark:text-rose-100 sm:text-base">
            <Heart className="h-5 w-5 fill-[#df7890] text-[#c76b80]" /><span>TAMBAH KENANGAN BARU</span>
          </button>
        </div>
      </div>

      {heartParticles.map(({ id, shape, glyph, style }) => {
        const ParticleIcon = particleIcons[shape];
        return <span key={id} className={`heart-burst-particle heart-burst-${shape}`} style={style} aria-hidden="true">{glyph ?? <ParticleIcon />}</span>;
      })}

      {isMoodPickerOpen && (
        <div className="clay-diary-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsMoodPickerOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="mood-modal-title" className="clay-diary-modal">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <img src={moodImage(activeProfile, selectedExpression)} alt="" className="h-11 w-11 rounded-full object-cover object-top" />
                <div><h2 id="mood-modal-title" className="font-sans-clean text-sm font-extrabold">Perasaan {activeProfile}</h2><p className="text-[10px]">Bagaimana perasaanmu hari ini?</p></div>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => { soundManager.playTap(); setIsMoodPickerOpen(false); }} className="clay-diary-close"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moodOptions.map((option) => {
                const selected = selectedExpression === option.id;
                return <button key={option.id} type="button" aria-pressed={selected} onClick={() => { setSelectedExpression(option.id); soundManager.playTap(); }} className={`clay-diary-mood-option ${selected ? 'is-selected' : ''}`}>
                  <span><img src={moodImage(activeProfile, option.id)} alt="" /></span>
                  <span>{option.label}</span>
                </button>;
              })}
            </div>
            <label htmlFor="mood-diary-entry" className="clay-diary-label">Ceritakan harimu <span>(opsional)</span></label>
            <textarea id="mood-diary-entry" value={diaryDraft} onChange={(event) => setDiaryDraft(event.target.value)} maxLength={500} rows={3} placeholder="Apa hal yang paling kamu rasakan hari ini?" className="clay-diary-textarea" />
            <div className="clay-diary-rating-heading"><label>Beri rating harimu</label><span>{dailyRating}/5</span></div>
            <div className="clay-diary-rating" role="group" aria-label="Rating harian 1 sampai 5"><span className="sr-only">Pilih rating</span>{[1,2,3,4,5].map((rating) => <button key={rating} type="button" aria-label={`${rating} dari 5`} aria-pressed={dailyRating === rating} onClick={() => setDailyRating(rating)}><Star className={rating <= dailyRating ? 'is-filled' : ''} /></button>)}</div>
            <label className="clay-diary-upload"><Camera className="h-4 w-4" />{photoPreview ? 'Ganti foto' : 'Tambah foto hari ini'}<input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); event.currentTarget.value = ''; }} /></label>
            {photoPreview && <div className="clay-diary-preview"><img src={photoPreview} alt="Pratinjau foto diary" /><span>{photoFile ? 'Foto baru, menggantikan foto hari ini saat disimpan' : 'Foto tersimpan hari ini'}</span></div>}
            <div className="clay-diary-footnote"><span>Log harian {activeProfile}</span><span>{diaryDraft.length}/500</span></div>
            {dailyNotice && <p role="alert" className="mt-2 text-[10px] text-red-700 dark:text-red-300">{dailyNotice}</p>}
            <button type="button" disabled={savingDaily} onClick={() => void saveMoodAndDiary()} className="clay-diary-submit">{savingDaily ? 'Menyimpan…' : 'Simpan log harian'}</button>
          </div>
        </div>
      )}
    </section>
  );
};
