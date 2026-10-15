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
  MovieCollection,
  WishlistPlace,
  WishlistDrink,
  AchievementBadge,
  LockedLetter,
  LoveSong
} from './types';
import { appStorage } from './utils/storage';
import { soundManager } from './utils/audio';
import { APIProvider } from '@vis.gl/react-google-maps';
import { getGoogleMapsApiKey } from './config/env';

const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();

// Visual Effects & Backgrounds
import { FloatingHearts } from './components/effects/FloatingHearts';

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

export default function App() {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [authenticated, setAuthenticated] = useState(!isSupabaseConfigured);
  // Application Data States initialized from Local Storage
  const [settings, setSettings] = useState<AppSettings>(() => appStorage.getSettings());
  const [pins, setPins] = useState<MemoryPin[]>(() => appStorage.getPins());
  const [cycles, setCycles] = useState<CycleRecord[]>(() => appStorage.getCycles());
  const [intimateLogs, setIntimateLogs] = useState<IntimateLog[]>(() => appStorage.getIntimateLogs());
  const [movies, setMovies] = useState<MovieItem[]>(() => appStorage.getMovies());
  const [actors, setActors] = useState<ActorItem[]>(() => appStorage.getActors());
  const [collections, setCollections] = useState<MovieCollection[]>(() => appStorage.getCollections());
  const [wishlistPlaces, setWishlistPlaces] = useState<WishlistPlace[]>(() => appStorage.getWishlistPlaces());
  const [wishlistDrinks, setWishlistDrinks] = useState<WishlistDrink[]>(() => appStorage.getWishlistDrinks());
  const [badges, setBadges] = useState<AchievementBadge[]>(() => appStorage.getBadges());
  const [letters, setLetters] = useState<LockedLetter[]>(() => appStorage.getLetters());
  const [songs, setSongs] = useState<LoveSong[]>(() => appStorage.getSongs());

  // Navigation & Modals: Individual Dedicated Pages
  const [activeSection, setActiveSection] = useState<string>('beranda');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedPinIdForMap, setSelectedPinIdForMap] = useState<string | null>(null);
  const [themeNotice, setThemeNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) { setAuthenticated(Boolean(data.session)); setAuthReady(true); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
      setAuthReady(true);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

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

  const handleAddPin = (pin: MemoryPin) => {
    const updated = [pin, ...pins];
    setPins(updated);
    appStorage.savePins(updated);
  };

  const handleUpdatePin = (pin: MemoryPin) => {
    const updated = pins.map((p) => (p.id === pin.id ? pin : p));
    setPins(updated);
    appStorage.savePins(updated);
  };

  const handleDeletePin = (pinId: string) => {
    const updated = pins.filter((p) => p.id !== pinId);
    setPins(updated);
    appStorage.savePins(updated);
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

  const handleAddMovie = (movie: MovieItem) => {
    const updated = [movie, ...movies];
    setMovies(updated);
    appStorage.saveMovies(updated);
  };

  const handleUpdateMovie = (movie: MovieItem) => {
    setMovies((current) => {
      const updated = current.map((item) => (item.id === movie.id ? movie : item));
      appStorage.saveMovies(updated);
      return updated;
    });
  };

  const handleToggleActorLike = (actorId: string, likedBy: 'Savero' | 'Soffie' | 'Berdua') => {
    const updated = actors.map((a) => (a.id === actorId ? { ...a, likedBy } : a));
    setActors(updated);
    appStorage.saveActors(updated);
  };

  const handleUpdateActor = (actor: ActorItem) => {
    setActors((current) => {
      const updated = current.map((item) => (item.id === actor.id ? actor : item));
      appStorage.saveActors(updated);
      return updated;
    });
  };

  const handleAddActor = (actor: ActorItem) => {
    setActors((current) => {
      if (current.some((item) => item.id === actor.id || (actor.tmdbId && item.tmdbId === actor.tmdbId))) return current;
      const updated = [actor, ...current];
      appStorage.saveActors(updated);
      return updated;
    });
  };

  const handleAddWishlistPlace = (place: WishlistPlace) => {
    const updated = [place, ...wishlistPlaces];
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

  const handleOpenLetter = (letterId: string) => {
    const updated = letters.map((l) => (l.id === letterId ? { ...l, isOpened: true } : l));
    setLetters(updated);
    appStorage.saveLetters(updated);
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

  if (isSupabaseConfigured && (!authReady || !authenticated)) {
    return authReady ? <SupabaseLogin /> : <div className="fixed inset-0 grid place-items-center bg-[#fff7f1] dark:bg-[#21151a]">Memuat sesi…</div>;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker', 'geometry', 'core']}>
      <div className="app-clay-theme relative flex min-h-screen flex-col overflow-x-hidden bg-[#fffaf0] font-sans-clean text-[#57202c] selection:bg-[#f4b6c2] selection:text-[#7a1018] transition-colors duration-300 dark:bg-[#21151a] dark:text-rose-50">
      {/* Floating Ethereal Particles & Petals */}
      <FloatingHearts />

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
        activeSection={activeSection}
        onToggleGuestMode={handleToggleGuestMode}
        onLockApp={() => setIsLocked(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleDarkMode={handleToggleDarkMode}
        onGoHome={() => handleSelectSection('beranda')}
        onOpenBadges={() => handleSelectSection('piala')}
        onSignOut={handleSignOut}
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
                settings={settings}
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
                actors={actors}
                collections={collections}
                pins={pins}
                settings={settings}
                onAddMovie={handleAddMovie}
                onUpdateMovie={handleUpdateMovie}
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
                onAddPlace={handleAddWishlistPlace}
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
                pins={pins}
                movies={movies}
                settings={settings}
                onAddLetter={handleAddLetter}
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
            onSaveSettings={handleUpdateSettings}
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
