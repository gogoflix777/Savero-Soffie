import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyAsh99YPUfShW0Ok9FdBMcl_4fW1Ad8OmE';

// Visual Effects & Backgrounds
import { Lock } from 'lucide-react';
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

export default function App() {
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
    soundManager.playTap();
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
    const updated = movies.map((m) => (m.id === movie.id ? movie : m));
    setMovies(updated);
    appStorage.saveMovies(updated);
  };

  const handleToggleActorLike = (actorId: string, likedBy: 'Savero' | 'Soffie' | 'Berdua') => {
    const updated = actors.map((a) => (a.id === actorId ? { ...a, likedBy } : a));
    setActors(updated);
    appStorage.saveActors(updated);
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
        photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'],
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

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker', 'geometry', 'core']}>
      <div className="min-h-screen bg-[#EFE6DA] dark:bg-[#1f0507] text-[#3B0A0F] dark:text-[#EFE6DA] transition-colors duration-300 font-sans-clean relative overflow-x-hidden selection:bg-[#F4B6C2] selection:text-[#7A1018] flex flex-col">
      {/* Floating Ethereal Particles & Petals */}
      <FloatingHearts />

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
            <div className="text-center p-6 animate-heartbeat">
              <div className="w-16 h-16 rounded-full bg-[#7A1018] border-2 border-[#D9B26F] flex items-center justify-center mx-auto shadow-2xl mb-2">
                <Lock className="w-8 h-8 text-[#F4B6C2]" />
              </div>
              <div className="font-serif-title text-2xl font-bold text-[#F4B6C2] mt-3 uppercase tracking-widest">
                Ruang Privat Terlindungi
              </div>
              <p className="text-xs text-[#EFE6DA]/70 font-sans-clean mt-1">
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
              <MarqueeTicker />

              {/* Hero Section */}
              <HeroSection
                settings={settings}
                onExploreClick={() => handleSelectSection('peta')}
                onAddMemoryClick={() => handleSelectSection('peta')}
              />

              {/* Intro Section: Savero & Soffie */}
              <IntroSection settings={settings} />

              {/* Mobile Quick App Launcher Grid */}
              <AppLauncherHub
                onSelectSection={handleSelectSection}
                isGuestMode={settings.isGuestMode}
              />
            </motion.div>
          )}

          {/* PAGE 2: PETA KENANGAN */}
          {activeSection === 'peta' && (
            <motion.div
              key="page-peta"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <MemoryMapSection
                pins={pins}
                settings={settings}
                onAddPin={handleAddPin}
                onUpdatePin={handleUpdatePin}
                onDeletePin={handleDeletePin}
                selectedPinId={selectedPinIdForMap}
              />
            </motion.div>
          )}

          {/* PAGE 3: LINIMASA CINTA (TIMELINE) */}
          {activeSection === 'timeline' && (
            <motion.div
              key="page-timeline"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <TimelineSection
                pins={pins}
                settings={settings}
                onOpenPinInMap={handleOpenPinInMap}
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
      <footer className="bg-[#7A1018] text-[#EFE6DA] py-8 px-4 border-t border-[#3B0A0F] text-center text-xs font-sans-clean relative z-10 mb-16 sm:mb-20">
        <div className="max-w-3xl mx-auto space-y-2.5">
          <div className="font-serif-title text-lg sm:text-xl font-bold tracking-widest text-[#F4B6C2] uppercase animate-pulse">
            SAVERO & SOFFIE
          </div>
          <p className="font-editorial italic text-xs sm:text-sm text-[#EFE6DA]/80">
            "Keadilan hukum di meja hijau, ketulusan stetoskop di ruang rawat, dan satu cinta abadi di sudut Semarang."
          </p>
          <div className="text-[10px] uppercase tracking-widest text-[#D9B26F] pt-2 border-t border-white/10">
            Dibuat secara privat • Semarang, Jawa Tengah • EST. 2026
          </div>
        </div>
      </footer>
    </div>
    </APIProvider>
  );
}
