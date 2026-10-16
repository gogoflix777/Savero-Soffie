import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Moon, Sun } from 'lucide-react';
import {
  AppSettings,
  MemoryPin,
  CycleRecord,
  IntimateLog,
  MovieItem,
  ActorItem,
  TvSeries,
  MovieCollection,
  WishlistPlace,
  WishlistDrink,
  AchievementBadge,
  LockedLetter,
  LoveSong,
  FavoriteSinger,
  CoupleMoodLog,
  MoodExpression,
  MoodDiaryEntry,
  CoupleProfile,
  DailyCheckin,
  DailyHeartProgress,
  MeetingConfirmation,
  StreakRestore
} from './types';
import { appStorage } from './utils/storage';
import { soundManager } from './utils/audio';
import { APIProvider } from '@vis.gl/react-google-maps';
import { getGoogleMapsApiKey } from './config/env';

const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();

const localDateKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Visual Effects & Backgrounds
import { FloatingHearts } from './components/effects/FloatingHearts';
import { ChibiPageDecorations } from './components/effects/ChibiPageDecorations';

// Layout & Navigation
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { MarqueeTicker } from './components/layout/MarqueeTicker';
import { AppLauncherHub } from './components/home/AppLauncherHub';

// Section Pages
import { HeroSection } from './components/hero/HeroSection';
import { IntroSection } from './components/hero/IntroSection';
import { TimelineSection } from './components/timeline/TimelineSection';
import { MemoryMapSection } from './components/map/MemoryMapSection';
import { FloCycleSection } from './components/cycle/FloCycleSection';
import { MoviesSection } from './components/movies/MoviesSection';
import { WishlistSection } from './components/wishlist/WishlistSection';
import { TrophyCabinetSection } from './components/badges/TrophyCabinetSection';
import { RomanticExtrasSection } from './components/romantic/RomanticExtrasSection';

// Modals
import { PinModal } from './components/auth/PinModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { SupabaseLogin } from './components/auth/SupabaseLogin';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { cancelMeetingConfirmation, confirmMeeting, getAppAdminStatus, getBoundProfile, getJakartaDate, loadCoupleDaily, loadDailyHeartProgress, loadMeetingFillProgress, loadProfileHeartProgress, restoreStreak, saveAdminHeartProgress, saveAdminMeetingFillProgress, saveDailyCheckin, saveMyHeartProgress, saveMyMeetingFillProgress } from './lib/coupleDaily';
import { loadSharedMediaCatalog, removeSharedMediaItem, saveSharedMediaItem, seedSharedMediaCatalog } from './lib/sharedMediaCatalog';
import { deleteMemoryPin, loadMemoryPins, saveMemoryPin } from './lib/memoryPins';
import { CoupleProfileSetup } from './components/auth/CoupleProfileSetup';
import { deleteFavoriteSinger, loadFavoriteSingers, saveFavoriteSinger } from './lib/favoriteSingers';

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [profileLoadAttempt, setProfileLoadAttempt] = useState(0);
  const authUserIdRef = useRef<string | null>(null);
  const [accountProfile, setAccountProfile] = useState<CoupleProfile | null>(null);
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  // Application Data States initialized from Local Storage
  const [settings, setSettings] = useState<AppSettings>(() => appStorage.getSettings());
  const [activeProfile, setActiveProfile] = useState<'Savero' | 'Soffie'>(() => appStorage.getActiveProfile());
  const [coupleMoodLog, setCoupleMoodLog] = useState<CoupleMoodLog>(() => appStorage.getCoupleMoodLog());
  const [moodDiary, setMoodDiary] = useState<MoodDiaryEntry[]>(() => appStorage.getMoodDiary());
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>(() => appStorage.getDailyCheckins());
  const [streakRestores, setStreakRestores] = useState<StreakRestore[]>(() => appStorage.getStreakRestores());
  const [meetingConfirmations, setMeetingConfirmations] = useState<MeetingConfirmation[]>(() => appStorage.getMeetingConfirmations());
  const [heartProgress, setHeartProgress] = useState<Record<CoupleProfile, number>>(() => {
    const today = getJakartaDate();
    const progress: Record<CoupleProfile, number> = { Savero: 0, Soffie: 0 };
    for (const entry of appStorage.getDailyHeartProgress()) {
      if (entry.progress_date === today) progress[entry.profile] = Math.max(progress[entry.profile], entry.percentage);
    }
    return progress;
  });
  const [dailyHeartProgress, setDailyHeartProgress] = useState<DailyHeartProgress[]>(() => appStorage.getDailyHeartProgress());
  const [meetingFillProgress, setMeetingFillProgress] = useState<Record<CoupleProfile, number>>(() => appStorage.getMeetingFillProgress(getJakartaDate()));
  const [dailyActionError, setDailyActionError] = useState<string | null>(null);
  const [mediaCatalogError, setMediaCatalogError] = useState<string | null>(null);
  const [memoryPinsError, setMemoryPinsError] = useState<string | null>(null);
  const [pins, setPins] = useState<MemoryPin[]>(() => appStorage.getPins());
  const [cycles, setCycles] = useState<CycleRecord[]>(() => appStorage.getCycles());
  const [intimateLogs, setIntimateLogs] = useState<IntimateLog[]>(() => appStorage.getIntimateLogs());
  const [movies, setMovies] = useState<MovieItem[]>(() => appStorage.getMovies());
  const [actors, setActors] = useState<ActorItem[]>(() => appStorage.getActors());
  const [tvSeries, setTvSeries] = useState<TvSeries[]>(() => appStorage.getTvSeries());
  const [collections, setCollections] = useState<MovieCollection[]>(() => appStorage.getCollections());
  const [wishlistPlaces, setWishlistPlaces] = useState<WishlistPlace[]>(() => appStorage.getWishlistPlaces());
  const [wishlistDrinks, setWishlistDrinks] = useState<WishlistDrink[]>(() => appStorage.getWishlistDrinks());
  const [badges, setBadges] = useState<AchievementBadge[]>(() => appStorage.getBadges());
  const [letters, setLetters] = useState<LockedLetter[]>(() => appStorage.getLetters());
  const [songs, setSongs] = useState<LoveSong[]>(() => appStorage.getSongs());
  const [favoriteSingers, setFavoriteSingers] = useState<FavoriteSinger[]>([]);
  const [favoriteSingersError, setFavoriteSingersError] = useState<string | null>(null);

  // Navigation & Modals: Individual Dedicated Pages
  const [activeSection, setActiveSection] = useState<string>('beranda');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedPinIdForMap, setSelectedPinIdForMap] = useState<string | null>(null);
  const [themeNotice, setThemeNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const userId = data.session?.user.id ?? null;
      authUserIdRef.current = userId;
      setAuthUserId(userId);
      setAuthenticated(Boolean(data.session));
      setProfileReady(!data.session);
      setAuthReady(true);
    }).catch((error: unknown) => {
      if (!alive) return;
      setProfileLoadError(error instanceof Error ? error.message : 'Sesi Supabase gagal diperiksa.');
      setProfileReady(true);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      const identityChanged = authUserIdRef.current !== userId;
      authUserIdRef.current = userId;
      setAuthenticated(Boolean(session));
      if (identityChanged) {
        setAuthUserId(userId);
        setAccountProfile(null);
        setIsAdminAccount(false);
        setAdminMode(false);
        setProfileLoadError(null);
        setProfileReady(!session);
      }
      setAuthReady(true);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !authReady || !authenticated || !authUserId) return;
    let alive = true;
    setProfileReady(false);
    setProfileLoadError(null);
    const loadAccountData = async () => {
      try {
        const [profileResult, adminResult] = await Promise.allSettled([getBoundProfile(), getAppAdminStatus()]);
        if (!alive) return;
        if (profileResult.status === 'rejected') throw profileResult.reason;
        const profile = profileResult.value;
        const isAdmin = adminResult.status === 'fulfilled' && adminResult.value;
        setAccountProfile(profile);
        setIsAdminAccount(isAdmin);
        if (profile) {
          setActiveProfile(profile);
          appStorage.saveActiveProfile(profile);
        }
        if (profile || isAdmin) {
          const [dailyResult, progressResult, meetingFillResult, dailyHeartResult, favoriteSingersResult] = await Promise.allSettled([
            loadCoupleDaily(), loadProfileHeartProgress(), loadMeetingFillProgress(), loadDailyHeartProgress(), loadFavoriteSingers()
          ]);
          if (!alive) return;
          const loadErrors: string[] = [];
          if (adminResult.status === 'rejected') {
            loadErrors.push('Status admin gagal diverifikasi. Jalankan migration admin terbaru.');
          }
          if (dailyResult.status === 'fulfilled') {
            setDailyCheckins(dailyResult.value.logs);
            setStreakRestores(dailyResult.value.restores);
            setMeetingConfirmations(dailyResult.value.meetings);
            appStorage.saveDailyCheckins(dailyResult.value.logs);
            appStorage.saveStreakRestores(dailyResult.value.restores);
            appStorage.saveMeetingConfirmations(dailyResult.value.meetings);
          } else {
            loadErrors.push(dailyResult.reason instanceof Error ? dailyResult.reason.message : 'Data harian gagal dimuat.');
          }
          if (progressResult.status === 'fulfilled') {
            setHeartProgress(progressResult.value);
          } else {
            loadErrors.push(progressResult.reason instanceof Error ? progressResult.reason.message : 'Progres hati gagal dimuat.');
          }
          if (meetingFillResult.status === 'fulfilled') {
            setMeetingFillProgress(meetingFillResult.value);
            appStorage.saveMeetingFillProgress(getJakartaDate(), meetingFillResult.value);
          } else {
            loadErrors.push(meetingFillResult.reason instanceof Error ? meetingFillResult.reason.message : 'Progres konfirmasi bertemu gagal dimuat.');
          }
          if (dailyHeartResult.status === 'fulfilled') {
            setDailyHeartProgress(dailyHeartResult.value);
            appStorage.saveDailyHeartProgress(dailyHeartResult.value);
          } else {
            loadErrors.push(dailyHeartResult.reason instanceof Error ? dailyHeartResult.reason.message : 'Riwayat progres hati gagal dimuat.');
          }
          if (favoriteSingersResult.status === 'fulfilled') {
            setFavoriteSingers(favoriteSingersResult.value);
            setFavoriteSingersError(null);
          } else {
            const message = favoriteSingersResult.reason instanceof Error
              ? favoriteSingersResult.reason.message
              : 'Penyanyi favorit gagal dimuat.';
            setFavoriteSingersError(message);
            loadErrors.push(message);
          }
          try {
            let sharedCatalog = await loadSharedMediaCatalog();
            if (!sharedCatalog.movies.length && !sharedCatalog.tvSeries.length && !sharedCatalog.actors.length) {
              await seedSharedMediaCatalog({
                movies: appStorage.getMovies(),
                tvSeries: appStorage.getTvSeries(),
                actors: appStorage.getActors()
              });
              sharedCatalog = await loadSharedMediaCatalog();
            }
            setMovies(sharedCatalog.movies);
            setActors(sharedCatalog.actors);
            setTvSeries(sharedCatalog.tvSeries);
            appStorage.saveMovies(sharedCatalog.movies);
            appStorage.saveActors(sharedCatalog.actors);
            appStorage.saveTvSeries(sharedCatalog.tvSeries);
            setMediaCatalogError(null);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Katalog film/serial/aktor bersama gagal dimuat.';
            setMediaCatalogError(message);
            loadErrors.push(message);
          }
          try {
            const sharedPins = await loadMemoryPins();
            setPins(sharedPins);
            appStorage.savePins(sharedPins);
            setMemoryPinsError(null);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Pin peta bersama gagal dimuat.';
            setMemoryPinsError(message);
            loadErrors.push(message);
          }
          setDailyActionError(loadErrors.length ? loadErrors.join(' ') : null);
        } else if (adminResult.status === 'rejected') {
          setDailyActionError('Status admin gagal diverifikasi. Jalankan migration admin terbaru.');
        }
      } catch (error) {
        if (alive) {
          setProfileLoadError(error instanceof Error ? error.message : 'Profil gagal dimuat dari Supabase.');
          setDailyActionError(error instanceof Error ? error.message : 'Data harian gagal dimuat.');
        }
      } finally {
        if (alive) setProfileReady(true);
      }
    };
    void loadAccountData();
    return () => { alive = false; };
  }, [authReady, authenticated, authUserId, profileLoadAttempt]);

  useEffect(() => {
    const realtimeClient = supabase;
    if (!realtimeClient || (!accountProfile && !isAdminAccount) || !authenticated) return;
    const refreshDaily = async () => {
      try {
        const daily = await loadCoupleDaily();
        setDailyCheckins(daily.logs);
        setStreakRestores(daily.restores);
        setMeetingConfirmations(daily.meetings);
        appStorage.saveDailyCheckins(daily.logs);
        appStorage.saveStreakRestores(daily.restores);
        appStorage.saveMeetingConfirmations(daily.meetings);
      } catch (error) {
        setDailyActionError(error instanceof Error ? error.message : 'Data harian gagal diperbarui.');
      }
    };
    const refreshHeartProgress = async () => {
      try {
        setHeartProgress(await loadProfileHeartProgress());
      } catch (error) {
        setDailyActionError(error instanceof Error ? error.message : 'Progres hati gagal diperbarui.');
      }
    };
    const refreshMeetingFillProgress = async () => {
      try {
        const progress = await loadMeetingFillProgress();
        setMeetingFillProgress(progress);
        appStorage.saveMeetingFillProgress(getJakartaDate(), progress);
      } catch (error) {
        setDailyActionError(error instanceof Error ? error.message : 'Progres konfirmasi bertemu gagal diperbarui.');
      }
    };
    const refreshDailyHeartProgress = async () => {
      try {
        const [progress, history] = await Promise.all([loadProfileHeartProgress(), loadDailyHeartProgress()]);
        setHeartProgress(progress);
        setDailyHeartProgress(history);
        appStorage.saveDailyHeartProgress(history);
      } catch (error) {
        setDailyActionError(error instanceof Error ? error.message : 'Progres hati harian gagal diperbarui.');
      }
    };
    const refreshSharedMediaCatalog = async () => {
      try {
        const catalog = await loadSharedMediaCatalog();
        setMovies(catalog.movies);
        setActors(catalog.actors);
        setTvSeries(catalog.tvSeries);
        appStorage.saveMovies(catalog.movies);
        appStorage.saveActors(catalog.actors);
        appStorage.saveTvSeries(catalog.tvSeries);
      } catch (error) {
        setMediaCatalogError(error instanceof Error ? error.message : 'Katalog bersama gagal diperbarui.');
      }
    };
    const refreshFavoriteSingers = async () => {
      try {
        setFavoriteSingers(await loadFavoriteSingers());
        setFavoriteSingersError(null);
      } catch (error) {
        setFavoriteSingersError(error instanceof Error ? error.message : 'Penyanyi favorit gagal diperbarui.');
      }
    };
    const refreshMemoryPins = async () => {
      try {
        const sharedPins = await loadMemoryPins();
        setPins(sharedPins);
        appStorage.savePins(sharedPins);
        setMemoryPinsError(null);
      } catch (error) {
        setMemoryPinsError(error instanceof Error ? error.message : 'Pin peta bersama gagal diperbarui.');
      }
    };
    const channel = realtimeClient.channel('couple-daily-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_checkins' }, () => { void refreshDaily(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'streak_restores' }, () => { void refreshDaily(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_confirmations' }, () => { void refreshDaily(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_heart_progress' }, () => { void refreshHeartProgress(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_daily_heart_progress' }, () => { void refreshDailyHeartProgress(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_fill_progress' }, () => { void refreshMeetingFillProgress(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_media_catalog' }, () => { void refreshSharedMediaCatalog(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorite_singers' }, () => { void refreshFavoriteSingers(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memory_pins' }, () => { void refreshMemoryPins(); })
      .subscribe();
    return () => { void realtimeClient.removeChannel(channel); };
  }, [accountProfile, isAdminAccount, authenticated]);

  useEffect(() => {
    if (isSupabaseConfigured && (!authenticated || (!accountProfile && !isAdminAccount))) return;
    let lastDay = getJakartaDate();
    const timer = window.setInterval(() => {
      const today = getJakartaDate();
      if (today === lastDay) return;
      lastDay = today;
      if (!supabase) {
        const progress = { Savero: 0, Soffie: 0 };
        setMeetingFillProgress(progress);
        appStorage.saveMeetingFillProgress(today, progress);
        setHeartProgress(progress);
        return;
      }
      void Promise.all([loadMeetingFillProgress(), loadProfileHeartProgress()]).then(([meetingProgress, dailyProgress]) => {
        setMeetingFillProgress(meetingProgress);
        appStorage.saveMeetingFillProgress(today, meetingProgress);
        setHeartProgress(dailyProgress);
      }).catch((error: unknown) => {
        setDailyActionError(error instanceof Error ? error.message : 'Progres konfirmasi bertemu gagal dimuat ulang.');
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [accountProfile, isAdminAccount, authenticated]);

  useEffect(() => {
    if (!themeNotice) return;
    const noticeTimer = window.setTimeout(() => setThemeNotice(null), 2300);
    return () => window.clearTimeout(noticeTimer);
  }, [themeNotice]);

  useEffect(() => {
    const playForInteractiveTarget = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const appRoot = target.closest('.app-clay-theme');
      const interactive = target.closest('button, a, [role="button"], input[type="checkbox"], input[type="radio"], select, [class~="cursor-pointer"]');
      if (!appRoot || !interactive || interactive.matches(':disabled, [aria-disabled="true"]')) return;
      if (interactive.matches('.profile-progress-heart')) return;
      if (soundManager.wasPlayedRecently()) return;

      const closeButton = interactive.matches('button') && (
        interactive.classList.contains('app-close-button') ||
        /close|tutup|batal/i.test(`${interactive.getAttribute('aria-label') ?? ''} ${interactive.getAttribute('title') ?? ''}`)
      );
      if (closeButton) soundManager.playClose();
      else soundManager.playTap();
    };

    document.addEventListener('click', playForInteractiveTarget);
    return () => document.removeEventListener('click', playForInteractiveTarget);
  }, []);

  // Inactivity Auto-Lock Timer (15 minutes)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, 15 * 60 * 1000);
  };

  useEffect(() => {
    const handleActivity = () => resetInactivityTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Section J Privacy requirement: "Layar di-blur saat pindah aplikasi"
    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };
    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Sync Dark Mode class to <html> element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // If in guest mode and activeSection is sensitive, redirect to beranda
  useEffect(() => {
    if (settings.isGuestMode && activeSection === 'siklus') {
      setActiveSection('beranda');
    }
  }, [settings.isGuestMode, activeSection]);

  // Handlers for state updates
  const handleUpdateSettings = (newSettings: AppSettings) => {
    if (settings.darkMode !== newSettings.darkMode) {
      setThemeNotice(newSettings.darkMode ? 'Mode malam aktif' : 'Mode terang aktif');
      soundManager.playChime();
    }
    setSettings(newSettings);
    appStorage.saveSettings(newSettings);
  };

  const handleToggleGuestMode = () => {
    const nextMode = !settings.isGuestMode;
    const updated = { ...settings, isGuestMode: nextMode };
    handleUpdateSettings(updated);
    soundManager.playTap();
  };

  const handleToggleDarkMode = () => {
    const updated = { ...settings, darkMode: !settings.darkMode };
    handleUpdateSettings(updated);
  };

  const handleSelectProfile = (profile: 'Savero' | 'Soffie') => {
    if (accountProfile && !adminMode) return;
    if (isAdminAccount && !adminMode) return;
    setActiveProfile(profile);
    appStorage.saveActiveProfile(profile);
  };

  const handleToggleAdminMode = () => {
    if (!isAdminAccount) return;
    if (adminMode && accountProfile) {
      setActiveProfile(accountProfile);
      appStorage.saveActiveProfile(accountProfile);
    }
    setAdminMode((enabled) => !enabled);
  };

  const handleProfileSetupComplete = async (profile: CoupleProfile) => {
    setAccountProfile(profile);
    setActiveProfile(profile);
    appStorage.saveActiveProfile(profile);
    setProfileReady(false);
    try {
      const [dailyResult, progressResult] = await Promise.allSettled([loadCoupleDaily(), loadProfileHeartProgress()]);
      const loadErrors: string[] = [];
      if (dailyResult.status === 'fulfilled') {
        setDailyCheckins(dailyResult.value.logs);
        setStreakRestores(dailyResult.value.restores);
        setMeetingConfirmations(dailyResult.value.meetings);
        appStorage.saveDailyCheckins(dailyResult.value.logs);
        appStorage.saveStreakRestores(dailyResult.value.restores);
        appStorage.saveMeetingConfirmations(dailyResult.value.meetings);
      } else {
        loadErrors.push(dailyResult.reason instanceof Error ? dailyResult.reason.message : 'Data harian gagal dimuat.');
      }
      if (progressResult.status === 'fulfilled') {
        setHeartProgress(progressResult.value);
      } else {
        loadErrors.push(progressResult.reason instanceof Error ? progressResult.reason.message : 'Progres hati gagal dimuat.');
      }
      try {
        const sharedPins = await loadMemoryPins();
        setPins(sharedPins);
        appStorage.savePins(sharedPins);
        setMemoryPinsError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Pin peta bersama gagal dimuat.';
        setMemoryPinsError(message);
        loadErrors.push(message);
      }
      setDailyActionError(loadErrors.length ? loadErrors.join(' ') : null);
    } catch (error) {
      setDailyActionError(error instanceof Error ? error.message : 'Data profil gagal dimuat.');
    } finally {
      setProfileReady(true);
    }
  };

  const handleUpdateMood = (profile: 'Savero' | 'Soffie', expression: MoodExpression) => {
    setCoupleMoodLog((current) => {
      const updated = { ...current, [profile]: { expression, updatedAt: new Date().toISOString() } };
      appStorage.saveCoupleMoodLog(updated);
      return updated;
    });
  };

  const handleSaveMoodDiary = (profile: 'Savero' | 'Soffie', expression: MoodExpression, content: string) => {
    const now = new Date().toISOString();
    const date = localDateKey();
    setMoodDiary((current) => {
      const existing = current.find((entry) => entry.profile === profile && entry.date === date);
      const entry: MoodDiaryEntry = {
        id: existing?.id ?? `diary-${profile.toLowerCase()}-${date}`,
        profile,
        date,
        expression,
        content: content.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      const updated = existing
        ? current.map((item) => item.id === existing.id ? entry : item)
        : [entry, ...current];
      appStorage.saveMoodDiary(updated);
      return updated;
    });
  };

  const handleSaveDailyCheckin = async (input: { expression: MoodExpression; rating: number; diaryText: string; photo?: Blob | null }) => {
    const date = getJakartaDate();
    try {
      if (supabase && isAdminAccount && !accountProfile && !adminMode) {
        throw new Error('Aktifkan Mode Admin sebelum mengubah data profil.');
      }
      const entry = supabase && (accountProfile || adminMode)
        ? await saveDailyCheckin({ ...input, profile: adminMode ? activeProfile : accountProfile!, adminMode })
        : {
            id: `local-${activeProfile}-${date}`, user_id: `local-${activeProfile}`, profile: activeProfile,
            log_date: date, expression: input.expression, rating: input.rating, diary_text: input.diaryText.trim() || null,
            photo_path: null, photo_url: input.photo ? URL.createObjectURL(input.photo) : null,
            expires_at: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          } satisfies DailyCheckin;
      setCoupleMoodLog((current) => {
        const updated = { ...current, [activeProfile]: { expression: input.expression, updatedAt: new Date().toISOString() } };
        appStorage.saveCoupleMoodLog(updated);
        return updated;
      });
      setDailyCheckins((current) => {
        const updated = [entry, ...current.filter((item) => !(item.profile === entry.profile && item.log_date === entry.log_date))];
        appStorage.saveDailyCheckins(updated);
        return updated;
      });
      setDailyActionError(null);
    } catch (error) {
      setDailyActionError(error instanceof Error ? error.message : 'Log harian gagal disimpan. Coba lagi.');
      throw error;
    }
  };

  const handleRestoreStreak = async () => {
    if (!supabase) {
      const restoredAt = new Date().toISOString();
      const latest = streakRestores[0];
      if (latest && Date.now() - new Date(latest.restored_at).getTime() < 7 * 86400000) throw new Error('Pemulihan tersedia kembali setelah masa 7 hari.');
      const entry = { missed_date: getJakartaDate(new Date(Date.now() - 86400000)), restored_by: `local-${activeProfile}`, restored_at: restoredAt };
      setStreakRestores((current) => { const updated = [entry, ...current]; appStorage.saveStreakRestores(updated); return updated; });
      return;
    }
    await restoreStreak();
    const daily = await loadCoupleDaily();
    setDailyCheckins(daily.logs); setStreakRestores(daily.restores); setMeetingConfirmations(daily.meetings);
    appStorage.saveDailyCheckins(daily.logs); appStorage.saveStreakRestores(daily.restores); appStorage.saveMeetingConfirmations(daily.meetings);
  };

  const handleConfirmMeeting = async () => {
    if (supabase && isAdminAccount && !accountProfile && !adminMode) {
      throw new Error('Aktifkan Mode Admin sebelum mengubah data profil.');
    }
    if (supabase && adminMode) {
      const entry = await confirmMeeting(activeProfile, true);
      setMeetingConfirmations((current) => { const updated = [entry, ...current.filter((item) => !(item.profile === entry.profile && item.meeting_date === entry.meeting_date))]; appStorage.saveMeetingConfirmations(updated); return updated; });
      return;
    }
    if (!supabase) {
      const entry: MeetingConfirmation = { id: `local-${activeProfile}-${getJakartaDate()}`, user_id: `local-${activeProfile}`, profile: activeProfile, meeting_date: getJakartaDate(), confirmed_at: new Date().toISOString() };
      setMeetingConfirmations((current) => { const updated = [entry, ...current.filter((item) => !(item.profile === entry.profile && item.meeting_date === entry.meeting_date))]; appStorage.saveMeetingConfirmations(updated); return updated; });
      return;
    }
    const entry = await confirmMeeting();
    setMeetingConfirmations((current) => { const updated = [entry, ...current.filter((item) => item.id !== entry.id)]; appStorage.saveMeetingConfirmations(updated); return updated; });
  };

  const handleCancelMeeting = async () => {
    if (supabase && isAdminAccount && !accountProfile && !adminMode) {
      throw new Error('Aktifkan Mode Admin sebelum mengubah data profil.');
    }
    const profile = adminMode ? activeProfile : accountProfile ?? activeProfile;
    if (supabase) await cancelMeetingConfirmation(profile, adminMode);
    const today = getJakartaDate();
    setMeetingConfirmations((current) => {
      const updated = current.filter((item) => !(item.profile === profile && item.meeting_date === today));
      appStorage.saveMeetingConfirmations(updated);
      return updated;
    });
    setMeetingFillProgress((current) => {
      const updated = { ...current, [profile]: 0 };
      appStorage.saveMeetingFillProgress(today, updated);
      return updated;
    });
    setDailyActionError(null);
  };

  const recordDailyHeartProgress = (profile: CoupleProfile, percentage: number) => {
    const progressDate = getJakartaDate();
    setDailyHeartProgress((current) => {
      const existing = current.find((entry) => entry.profile === profile && entry.progress_date === progressDate);
      const value = Math.max(existing?.percentage ?? 0, percentage);
      const updated = existing
        ? current.map((entry) => entry === existing ? { ...entry, percentage: value } : entry)
        : [{ profile, progress_date: progressDate, percentage: value }, ...current];
      appStorage.saveDailyHeartProgress(updated);
      return updated;
    });
  };

  const handleHeartProgressChange = async (percentage: number) => {
    if (supabase && isAdminAccount && !accountProfile && !adminMode) {
      setDailyActionError('Aktifkan Mode Admin sebelum mengubah progres profil.');
      return;
    }
    const profile = adminMode ? activeProfile : accountProfile ?? activeProfile;
    setHeartProgress((current) => ({ ...current, [profile]: Math.max(current[profile], percentage) }));
    recordDailyHeartProgress(profile, percentage);
    if (!supabase || (!accountProfile && !adminMode)) return;
    try {
      const savedPercentage = adminMode
        ? await saveAdminHeartProgress(profile, percentage)
        : await saveMyHeartProgress(percentage);
      setHeartProgress((current) => ({
        ...current, [profile]: Math.max(current[profile], savedPercentage)
      }));
      recordDailyHeartProgress(profile, savedPercentage);
      setDailyActionError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Progres hati gagal disimpan.';
      setDailyActionError(message);
      try {
        const [progress, history] = await Promise.all([loadProfileHeartProgress(), loadDailyHeartProgress()]);
        setHeartProgress(progress);
        setDailyHeartProgress(history);
        appStorage.saveDailyHeartProgress(history);
      } catch (refreshError) {
        const refreshMessage = refreshError instanceof Error ? refreshError.message : 'Progres hati gagal dimuat ulang.';
        setDailyActionError(`${message} ${refreshMessage}`);
      }
    }
  };

  const handleMeetingFillProgressChange = async (percentage: number) => {
    if (supabase && isAdminAccount && !accountProfile && !adminMode) {
      setDailyActionError('Aktifkan Mode Admin sebelum mengubah progres profil.');
      return;
    }
    const profile = adminMode ? activeProfile : accountProfile ?? activeProfile;
    const nextProgress = (current: Record<CoupleProfile, number>) => ({
      ...current,
      [profile]: Math.max(current[profile], percentage)
    });
    setMeetingFillProgress((current) => {
      const updated = nextProgress(current);
      appStorage.saveMeetingFillProgress(getJakartaDate(), updated);
      return updated;
    });
    if (!supabase) return;
    if (!accountProfile && !adminMode) return;
    try {
      const savedPercentage = adminMode
        ? await saveAdminMeetingFillProgress(profile, percentage)
        : await saveMyMeetingFillProgress(percentage);
      setMeetingFillProgress((current) => {
        const updated = { ...current, [profile]: Math.max(current[profile], savedPercentage) };
        appStorage.saveMeetingFillProgress(getJakartaDate(), updated);
        return updated;
      });
      setDailyActionError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Progres konfirmasi bertemu gagal disimpan.';
      setDailyActionError(message);
      try {
        const refreshed = await loadMeetingFillProgress();
        setMeetingFillProgress(refreshed);
        appStorage.saveMeetingFillProgress(getJakartaDate(), refreshed);
      } catch (refreshError) {
        const refreshMessage = refreshError instanceof Error ? refreshError.message : 'Progres konfirmasi bertemu gagal dimuat ulang.';
        setDailyActionError(`${message} ${refreshMessage}`);
      }
    }
  };

  const handleAddPin = async (pin: MemoryPin) => {
    try {
      if (isSupabaseConfigured) await saveMemoryPin(pin);
    } catch (error) {
      setMemoryPinsError(error instanceof Error ? error.message : 'Pin gagal disimpan ke Supabase.');
      throw error;
    }
    setPins((current) => {
      const updated = [pin, ...current.filter((item) => item.id !== pin.id)];
      appStorage.savePins(updated);
      return updated;
    });
    setMemoryPinsError(null);
  };

  const handleUpdatePin = async (pin: MemoryPin) => {
    try {
      if (isSupabaseConfigured) await saveMemoryPin(pin);
    } catch (error) {
      setMemoryPinsError(error instanceof Error ? error.message : 'Perubahan pin gagal disimpan ke Supabase.');
      throw error;
    }
    setPins((current) => {
      const updated = current.map((item) => item.id === pin.id ? pin : item);
      appStorage.savePins(updated);
      return updated;
    });
    setMemoryPinsError(null);
  };

  const handleDeletePin = async (pinId: string) => {
    try {
      if (isSupabaseConfigured) await deleteMemoryPin(pinId);
    } catch (error) {
      setMemoryPinsError(error instanceof Error ? error.message : 'Pin gagal dihapus dari Supabase.');
      throw error;
    }
    setPins((current) => {
      const updated = current.filter((pin) => pin.id !== pinId);
      appStorage.savePins(updated);
      return updated;
    });
    setMemoryPinsError(null);
  };

  const handleOpenPinInMap = (pin: MemoryPin) => {
    setSelectedPinIdForMap(pin.id);
    setActiveSection('peta');
    soundManager.playTap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddCycle = (cycle: CycleRecord) => {
    const updated = [cycle, ...cycles];
    setCycles(updated);
    appStorage.saveCycles(updated);
  };

  const handleUpdateCycle = (cycle: CycleRecord) => {
    const updated = cycles.map((c) => (c.id === cycle.id ? cycle : c));
    setCycles(updated);
    appStorage.saveCycles(updated);
  };

  const handleAddIntimateLog = (log: IntimateLog) => {
    const updated = [log, ...intimateLogs];
    setIntimateLogs(updated);
    appStorage.saveIntimateLogs(updated);
  };

  const handleDeleteIntimateLog = (id: string) => {
    const updated = intimateLogs.filter((l) => l.id !== id);
    setIntimateLogs(updated);
    appStorage.saveIntimateLogs(updated);
  };

  const persistMediaItem = async (kind: 'movie' | 'tv' | 'person', item: MovieItem | TvSeries | ActorItem) => {
    if (isSupabaseConfigured) {
      try {
        await saveSharedMediaItem(kind, item);
        setMediaCatalogError(null);
      } catch (error) {
        setMediaCatalogError(error instanceof Error ? error.message : 'Katalog bersama gagal disimpan.');
        throw error;
      }
    }
  };

  const handleAddMovie = async (movie: MovieItem) => {
    await persistMediaItem('movie', movie);
    const updated = [movie, ...movies.filter((item) => item.tmdbId !== movie.tmdbId)];
    setMovies(updated);
    appStorage.saveMovies(updated);
  };

  const handleUpdateMovie = async (movie: MovieItem) => {
    await persistMediaItem('movie', movie);
    setMovies((current) => {
      const updated = current.map((item) => item.tmdbId === movie.tmdbId ? movie : item);
      appStorage.saveMovies(updated);
      return updated;
    });
  };

  const handleRemoveMovie = async (movie: MovieItem) => {
    if (!movie.tmdbId) throw new Error('Item wishlist tidak memiliki ID TMDB yang valid.');
    if (isSupabaseConfigured) await removeSharedMediaItem('movie', movie.tmdbId);
    setMediaCatalogError(null);
    setMovies((current) => {
      const updated = current.filter((item) => item.tmdbId !== movie.tmdbId);
      appStorage.saveMovies(updated);
      return updated;
    });
  };

  const handleAddTvSeries = async (series: TvSeries) => {
    await persistMediaItem('tv', series);
    const updated = [series, ...tvSeries.filter((item) => item.tmdbId !== series.tmdbId)];
    setTvSeries(updated);
    appStorage.saveTvSeries(updated);
  };

  const handleUpdateTvSeries = async (series: TvSeries) => {
    await persistMediaItem('tv', series);
    setTvSeries((current) => {
      const updated = current.map((item) => item.tmdbId === series.tmdbId ? series : item);
      appStorage.saveTvSeries(updated);
      return updated;
    });
  };

  const handleRemoveTvSeries = async (series: TvSeries) => {
    if (!series.tmdbId) throw new Error('Item wishlist tidak memiliki ID TMDB yang valid.');
    if (isSupabaseConfigured) await removeSharedMediaItem('tv', series.tmdbId);
    setMediaCatalogError(null);
    setTvSeries((current) => {
      const updated = current.filter((item) => item.tmdbId !== series.tmdbId);
      appStorage.saveTvSeries(updated);
      return updated;
    });
  };

  const handleToggleActorLike = async (actorId: string, likedBy: 'Savero' | 'Soffie' | 'Berdua') => {
    const actor = actors.find((item) => item.id === actorId);
    if (!actor) return;
    const updatedActor = { ...actor, likedBy };
    await persistMediaItem('person', updatedActor);
    setActors((current) => {
      const updated = current.map((item) => item.id === actorId ? updatedActor : item);
      appStorage.saveActors(updated);
      return updated;
    });
  };

  const handleUpdateActor = async (actor: ActorItem) => {
    await persistMediaItem('person', actor);
    setActors((current) => {
      const updated = current.map((item) => item.id === actor.id ? actor : item);
      appStorage.saveActors(updated);
      return updated;
    });
  };

  const handleAddActor = async (actor: ActorItem) => {
    await persistMediaItem('person', actor);
    setActors((current) => {
      const updated = [actor, ...current.filter((item) => item.tmdbId !== actor.tmdbId)];
      appStorage.saveActors(updated);
      return updated;
    });
  };

  const handleAddWishlistPlace = (place: WishlistPlace) => {
    const updated = [place, ...wishlistPlaces];
    setWishlistPlaces(updated);
    appStorage.saveWishlistPlaces(updated);
  };

  const handleUpdateWishlistPlace = (place: WishlistPlace) => {
    const updated = wishlistPlaces.map((item) => item.id === place.id ? place : item);
    setWishlistPlaces(updated);
    appStorage.saveWishlistPlaces(updated);
  };

  const handleMarkPlaceVisited = (place: WishlistPlace) => {
    const updatedPlaces = wishlistPlaces.map((p) =>
      p.id === place.id ? { ...p, isVisited: !p.isVisited } : p
    );
    setWishlistPlaces(updatedPlaces);
    appStorage.saveWishlistPlaces(updatedPlaces);

    if (!place.isVisited) {
      const newPin: MemoryPin = {
        id: 'pin-' + Date.now(),
        title: place.name,
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        description: `Kunjungan pertama wishlist kita di ${place.name} (${place.area}). ${place.notes || ''}`,
        photos: [],
        rating: 5,
        tags: [place.category, 'Wishlist Tercapai', place.area],
        category: place.category,
        lat: -6.995 + (Math.random() - 0.5) * 0.05,
        lng: 110.42 + (Math.random() - 0.5) * 0.05,
        mapUrl: place.mapUrl,
        status: 'visited',
        addedBy: place.requestedBy,
        isSensitive: false
      };
      handleAddPin(newPin);
    }
  };

  const handleAddWishlistDrink = (drink: WishlistDrink) => {
    const updated = [drink, ...wishlistDrinks];
    setWishlistDrinks(updated);
    appStorage.saveWishlistDrinks(updated);
  };

  const handleUpdateWishlistDrink = (drink: WishlistDrink) => {
    const updated = wishlistDrinks.map((d) => (d.id === drink.id ? drink : d));
    setWishlistDrinks(updated);
    appStorage.saveWishlistDrinks(updated);
  };

  const handleAddLetter = (letter: LockedLetter) => {
    const updated = [letter, ...letters];
    setLetters(updated);
    appStorage.saveLetters(updated);
  };

  const handleUpdateLetter = (letter: LockedLetter) => {
    const updated = letters.map((item) => (item.id === letter.id ? letter : item));
    setLetters(updated);
    appStorage.saveLetters(updated);
  };

  const handleDeleteLetter = (letterId: string) => {
    const updated = letters.filter((letter) => letter.id !== letterId);
    setLetters(updated);
    appStorage.saveLetters(updated);
  };

  const handleOpenLetter = (letterId: string) => {
    const updated = letters.map((l) => (l.id === letterId ? { ...l, isOpened: true } : l));
    setLetters(updated);
    appStorage.saveLetters(updated);
  };

  const handleAddSong = (song: LoveSong) => {
    const updated = [song, ...songs];
    setSongs(updated);
    appStorage.saveSongs(updated);
  };

  const handleUpdateSong = (song: LoveSong) => {
    const updated = songs.map((item) => (item.id === song.id ? song : item));
    setSongs(updated);
    appStorage.saveSongs(updated);
  };

  const handleDeleteSong = (songId: string) => {
    const updated = songs.filter((song) => song.id !== songId);
    setSongs(updated);
    appStorage.saveSongs(updated);
  };

  const handleSaveFavoriteSinger = async (singer: FavoriteSinger) => {
    await saveFavoriteSinger(singer);
    setFavoriteSingers((current) => [
      singer,
      ...current.filter((item) => !(item.profile === singer.profile && item.musicBrainzId === singer.musicBrainzId))
    ]);
    setFavoriteSingersError(null);
  };

  const handleDeleteFavoriteSinger = async (profile: CoupleProfile, musicBrainzId: string) => {
    await deleteFavoriteSinger(profile, musicBrainzId);
    setFavoriteSingers((current) => current.filter((item) =>
      item.profile !== profile || item.musicBrainzId !== musicBrainzId
    ));
    setFavoriteSingersError(null);
  };

  const handleWipeCycleData = () => {
    appStorage.wipeCycleData();
    setCycles([]);
    setIntimateLogs([]);
  };

  const handleSelectSection = (sectionId: string) => {
    soundManager.playTap();
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const authClient = supabase;
  const handleSignOut = authClient ? () => { void authClient.auth.signOut(); } : undefined;

  if (!isSupabaseConfigured) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#fff7f1] px-5 text-center text-[#57202c] dark:bg-[#21151a] dark:text-rose-50">
        <div className="max-w-md">
          <p className="text-lg font-bold">Konfigurasi login belum tersedia</p>
          <p className="mt-2 text-sm text-[#80646a] dark:text-rose-100/70">
            Akses aplikasi dikunci sampai VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dipasang pada environment build hosting, lalu aplikasi di-build dan di-deploy ulang.
          </p>
        </div>
      </div>
    );
  }
  if (!authReady || !authenticated) {
    return authReady ? <SupabaseLogin /> : <div className="fixed inset-0 grid place-items-center bg-[#fff7f1] dark:bg-[#21151a]">Memuat sesi…</div>;
  }
  if (isSupabaseConfigured && authenticated && profileLoadError) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#fff7f1] px-5 text-[#57202c] dark:bg-[#21151a] dark:text-rose-50">
        <div className="max-w-md text-center">
          <p className="text-lg font-bold">Profil belum berhasil dimuat</p>
          <p className="mt-2 text-sm text-[#80646a] dark:text-rose-100/70">{profileLoadError}</p>
          <button
            type="button"
            onClick={() => {
              setProfileLoadError(null);
              setProfileReady(false);
              setProfileLoadAttempt((attempt) => attempt + 1);
            }}
            className="mt-5 rounded-xl bg-[#7A1018] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5e0a11]"
          >
            Coba muat ulang profil
          </button>
        </div>
      </div>
    );
  }
  if (isSupabaseConfigured && authenticated && !profileReady) {
    return <div className="fixed inset-0 grid place-items-center bg-[#fff7f1] dark:bg-[#21151a]">Memuat profil…</div>;
  }
  if (isSupabaseConfigured && authenticated && profileReady && !accountProfile) {
    if (!isAdminAccount) {
      return <CoupleProfileSetup onComplete={(profile) => { void handleProfileSetupComplete(profile); }} />;
    }
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker', 'geometry', 'core']}>
      <div className="app-clay-theme relative flex min-h-screen flex-col overflow-x-hidden bg-[#fffaf0] font-sans-clean text-[#57202c] selection:bg-[#f4b6c2] selection:text-[#7a1018] transition-colors duration-300 dark:bg-[#21151a] dark:text-rose-50">
      {/* Floating Ethereal Particles & Petals */}
      <FloatingHearts />
      <ChibiPageDecorations />

      <AnimatePresence>
        {themeNotice && (
          <motion.div
            key={themeNotice}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="theme-toast fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[90] flex -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-3"
          >
            <span className="theme-toast-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" aria-hidden="true">
              {settings.darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </span>
            <span className="min-w-[150px]">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--theme-muted)]">Tema diperbarui</span>
              <span className="mt-0.5 block text-sm font-extrabold text-[var(--theme-ink)]">{themeNotice}</span>
            </span>
            <span className="theme-toast-swatch ml-1 h-8 w-8 rounded-full" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Shield: Window Blur Overlay (Section J) */}
      <AnimatePresence>
        {isWindowBlurred && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-[#1a0507]/95 backdrop-blur-3xl flex items-center justify-center pointer-events-none"
          >
            <div className="privacy-shield-card animate-heartbeat mx-5 flex w-full max-w-sm flex-col items-center rounded-[2rem] px-7 py-8 text-center">
              <div className="privacy-shield-logo mb-4 flex h-24 w-24 items-center justify-center rounded-full p-2.5">
                <img src="/logo/logo%20couple%203d.png" alt="" className="h-full w-full object-contain" />
              </div>
              <div className="font-sans-clean text-xl font-extrabold tracking-tight text-[var(--theme-ink)] sm:text-2xl">
                Ruang Privat Terlindungi
              </div>
              <p className="mt-2 max-w-[260px] font-sans-clean text-sm leading-relaxed text-[var(--theme-muted)]">
                Beralih kembali ke aplikasi untuk melanjutkan.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Security Modal if locked */}
      <AnimatePresence>
        {isLocked && (
          <PinModal
            correctPin={settings.pin}
            onSuccess={() => setIsLocked(false)}
            onEnterGuestMode={() => {
              handleUpdateSettings({ ...settings, isGuestMode: true });
              setIsLocked(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Top Mobile App Bar (No Top Navigation Tabs) */}
      <Header
        settings={settings}
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        activeSection={activeSection}
        onToggleGuestMode={handleToggleGuestMode}
        onLockApp={() => setIsLocked(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleDarkMode={handleToggleDarkMode}
        onGoHome={() => handleSelectSection('beranda')}
        onOpenBadges={() => handleSelectSection('piala')}
        onSignOut={handleSignOut}
        profileLocked={(Boolean(accountProfile) || isAdminAccount) && !adminMode}
      />

      {/* Page Content Viewport Container */}
      <main className="flex-1 pb-24 sm:pb-28">
        <AnimatePresence mode="wait">
          {/* PAGE 1: BERANDA (HOME) */}
          {activeSection === 'beranda' && (
            <motion.div
              key="page-beranda"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {/* Cinematic Marquee Ribbon */}
              <MarqueeTicker
                pins={settings.isGuestMode ? pins.filter((pin) => !pin.isSensitive) : pins}
                onPinClick={(pin) => {
                  setSelectedPinIdForMap(pin.id);
                  document.getElementById('peta-kenangan')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Hero Section */}
              <HeroSection
                settings={settings}
                activeProfile={activeProfile}
                coupleMoodLog={coupleMoodLog}
                moodDiary={moodDiary}
                dailyCheckins={dailyCheckins}
                streakRestores={streakRestores}
                meetingConfirmations={meetingConfirmations}
                heartProgress={heartProgress}
                dailyHeartProgress={dailyHeartProgress}
                meetingFillProgress={meetingFillProgress}
                dailyActionError={dailyActionError}
                onMoodChange={handleUpdateMood}
                onSaveMoodDiary={handleSaveMoodDiary}
                onSaveDailyCheckin={handleSaveDailyCheckin}
                onRestoreStreak={handleRestoreStreak}
                onConfirmMeeting={handleConfirmMeeting}
                onCancelMeeting={handleCancelMeeting}
                onHeartProgressChange={(percentage) => { void handleHeartProgressChange(percentage); }}
                onMeetingFillProgressChange={(percentage) => { void handleMeetingFillProgressChange(percentage); }}
                onExploreClick={() => {
                  document.getElementById('peta-kenangan')?.scrollIntoView({ behavior: 'smooth' });
                }}
                onAddMemoryClick={() => {
                  document.getElementById('peta-kenangan')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Intro Section: Savero & Soffie */}
              <IntroSection settings={settings} />

              {/* Mobile Quick App Launcher Grid */}
              <AppLauncherHub
                onSelectSection={handleSelectSection}
                isGuestMode={settings.isGuestMode}
              />

              {/* Peta Kenangan — langsung di Beranda */}
              <MemoryMapSection
                pins={pins}
                syncError={memoryPinsError}
                settings={settings}
                activeProfile={activeProfile}
                onAddPin={handleAddPin}
                onUpdatePin={handleUpdatePin}
                onDeletePin={handleDeletePin}
                selectedPinId={selectedPinIdForMap}
              />

              {/* Timeline Cinta — langsung di Beranda */}
              <TimelineSection
                pins={pins}
                settings={settings}
                onOpenPinInMap={(pin) => {
                  setSelectedPinIdForMap(pin.id);
                  document.getElementById('peta-kenangan')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />

            </motion.div>
          )}

          {/* PAGE 4: SIKLUS & INTIM (FLO & MEDICAL LOGS) */}
          {activeSection === 'siklus' && !settings.isGuestMode && (
            <motion.div
              key="page-siklus"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <FloCycleSection
                cycles={cycles}
                intimateLogs={intimateLogs}
                pins={pins}
                settings={settings}
                canEdit={activeProfile === 'Soffie'}
                onAddCycle={handleAddCycle}
                onUpdateCycle={handleUpdateCycle}
                onAddIntimateLog={handleAddIntimateLog}
                onDeleteIntimateLog={handleDeleteIntimateLog}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onWipeData={handleWipeCycleData}
              />
            </motion.div>
          )}

          {/* PAGE 5: FILM & AKTOR (MOVIES) */}
          {activeSection === 'film' && (
            <motion.div
              key="page-film"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <MoviesSection
                movies={movies}
                tvSeries={tvSeries}
                actors={actors}
                catalogSyncError={mediaCatalogError}
                collections={collections}
                pins={pins}
                settings={settings}
                activeProfile={activeProfile}
                onAddMovie={(movie) => handleAddMovie({ ...movie, addedBy: activeProfile })}
                onUpdateMovie={handleUpdateMovie}
                onRemoveMovie={handleRemoveMovie}
                onAddTvSeries={handleAddTvSeries}
                onUpdateTvSeries={handleUpdateTvSeries}
                onRemoveTvSeries={handleRemoveTvSeries}
                onUpdateActor={handleUpdateActor}
                onAddActor={handleAddActor}
                onToggleActorLike={handleToggleActorLike}
              />
            </motion.div>
          )}

          {/* PAGE 6: WISHLIST TEMPAT & MINUMAN */}
          {activeSection === 'wishlist' && (
            <motion.div
              key="page-wishlist"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <WishlistSection
                places={wishlistPlaces}
                drinks={wishlistDrinks}
                pins={pins}
                settings={settings}
                activeProfile={activeProfile}
                onAddPlace={handleAddWishlistPlace}
                onUpdatePlace={handleUpdateWishlistPlace}
                onMarkPlaceVisited={handleMarkPlaceVisited}
                onAddDrink={handleAddWishlistDrink}
                onUpdateDrink={handleUpdateWishlistDrink}
              />
            </motion.div>
          )}

          {/* PAGE 7: LEMARI PIALA & MEDALI 3D */}
          {activeSection === 'piala' && (
            <motion.div
              key="page-piala"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <TrophyCabinetSection
                badges={badges}
                settings={settings}
              />
            </motion.div>
          )}

          {/* PAGE 8: SURAT TERKUNCI & LOVE WRAPPED */}
          {activeSection === 'romantis' && (
            <motion.div
              key="page-romantis"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <RomanticExtrasSection
                letters={letters}
                songs={songs}
                favoriteSingers={favoriteSingers}
                favoriteSingersError={favoriteSingersError}
                favoriteSingersCanEdit={Boolean(supabase) && (Boolean(accountProfile) || adminMode)}
                activeProfile={accountProfile ?? activeProfile}
                pins={pins}
                movies={movies}
                settings={settings}
                onAddLetter={handleAddLetter}
                onUpdateLetter={handleUpdateLetter}
                onDeleteLetter={handleDeleteLetter}
                onAddSong={handleAddSong}
                onUpdateSong={handleUpdateSong}
                onDeleteSong={handleDeleteSong}
                onSaveFavoriteSinger={handleSaveFavoriteSinger}
                onDeleteFavoriteSinger={handleDeleteFavoriteSinger}
                onOpenLetter={handleOpenLetter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Mobile Bottom Navigation Bar (With Icons) */}
      <BottomNav
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        settings={settings}
      />

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            isAdminAccount={isAdminAccount}
            adminMode={adminMode}
            onSaveSettings={handleUpdateSettings}
            onToggleAdminMode={handleToggleAdminMode}
            onClose={() => setIsSettingsOpen(false)}
            onWipeCycleData={handleWipeCycleData}
          />
        )}
      </AnimatePresence>

      {/* Footer Note */}
      <footer className="site-footer relative z-10 mb-16 px-5 py-8 text-center sm:mb-20 sm:py-10">
        <div className="mx-auto max-w-xl">
          <Heart className="mx-auto mb-2 h-5 w-5 fill-current text-[var(--theme-brand)]" aria-hidden="true" />
          <div className="font-sans-clean text-sm font-extrabold tracking-[0.16em] text-[var(--theme-ink)] sm:text-base">
            SAVERO & SOFFIE
          </div>
          <p className="mx-auto mt-3 max-w-lg font-sans-clean text-xs leading-relaxed text-[var(--theme-muted)] sm:text-sm">
            “Keadilan hukum di meja hijau, ketulusan stetoskop di ruang rawat, dan satu cinta abadi di sudut Semarang.”
          </p>
          <div className="site-footer-meta mt-5 border-t pt-3 font-sans-clean text-[10px] font-bold tracking-[0.12em] text-[var(--theme-muted)] sm:text-[11px]">
            Dibuat secara privat <span aria-hidden="true">•</span> Semarang, Jawa Tengah <span aria-hidden="true">•</span> EST. 2026
          </div>
        </div>
      </footer>
    </div>
    </APIProvider>
  );
}
