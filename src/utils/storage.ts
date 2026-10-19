import {
  AppSettings,
  MemoryPin,
  CycleRecord,
  IntimateLog,
  MovieItem,
  MovieNightPlan,
  ActorItem,
  MovieCollection,
  TvSeries,
  WishlistPlace,
  WishlistDrink,
  AchievementBadge,
  LockedLetter,
  LoveSong,
  CoupleMoodLog,
  MoodDiaryEntry,
  DailyCheckin,
  MeetingConfirmation,
  StreakRestore,
  DailyHeartProgress,
  InstantReply
} from '../types';
import {
  initialSettings,
  initialCycles,
  initialIntimateLogs,
  initialMovies,
  initialActors,
  initialCollections,
  initialTvSeries,
  initialWishlistPlaces,
  initialWishlistDrinks,
  initialBadges,
  initialLetters,
  initialSongs
} from '../data/initialData';

const PREFIX = 'ss_app_';

function load<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage:`, err);
  }
}

function loadCatalog<T extends { id: string; status?: string }>(
  key: string,
  fallback: T[],
  seedPrefix: string,
  clearWishlist = false
): T[] {
  const items = load<T[]>(key, fallback);
  const clearLegacyWishlist = clearWishlist && !load<boolean>(`${key}_wishlist_cleanup_v1`, false);
  const currentItems = items.filter((item) =>
    !new RegExp(`^${seedPrefix}-\\d+$`).test(item.id) && !(clearLegacyWishlist && item.status === 'watchlist')
  );
  if (currentItems.length !== items.length) save(key, currentItems);
  if (clearLegacyWishlist) save(`${key}_wishlist_cleanup_v1`, true);
  return currentItems;
}

export const appStorage = {
  getActiveProfile: (): 'Savero' | 'Soffie' => load<'Savero' | 'Soffie'>('active_profile', 'Soffie'),
  saveActiveProfile: (profile: 'Savero' | 'Soffie') => save('active_profile', profile),
  getCoupleMoodLog: (): CoupleMoodLog => load<CoupleMoodLog>('couple_mood_log', {
    Savero: { expression: 'bahagia', updatedAt: '' },
    Soffie: { expression: 'tenang', updatedAt: '' }
  }),
  saveCoupleMoodLog: (moodLog: CoupleMoodLog) => save('couple_mood_log', moodLog),
  getMoodDiary: (): MoodDiaryEntry[] => load<MoodDiaryEntry[]>('mood_diary', []),
  saveMoodDiary: (entries: MoodDiaryEntry[]) => save('mood_diary', entries),
  getDailyCheckins: (): DailyCheckin[] => load<DailyCheckin[]>('daily_checkins', []),
  saveDailyCheckins: (entries: DailyCheckin[]) => save('daily_checkins', entries),
  getStreakRestores: (): StreakRestore[] => load<StreakRestore[]>('streak_restores', []),
  saveStreakRestores: (entries: StreakRestore[]) => save('streak_restores', entries),
  getMeetingConfirmations: (): MeetingConfirmation[] => load<MeetingConfirmation[]>('meeting_confirmations', []),
  saveMeetingConfirmations: (entries: MeetingConfirmation[]) => save('meeting_confirmations', entries),
  getMeetingFillProgress: (date: string): Record<'Savero' | 'Soffie', number> => {
    const saved = load<{ date: string; progress: Record<'Savero' | 'Soffie', number> } | null>('meeting_fill_progress', null);
    return saved?.date === date ? saved.progress : { Savero: 0, Soffie: 0 };
  },
  saveMeetingFillProgress: (date: string, progress: Record<'Savero' | 'Soffie', number>) =>
    save('meeting_fill_progress', { date, progress }),
  getDailyHeartProgress: (): DailyHeartProgress[] => load<DailyHeartProgress[]>('daily_heart_progress', []),
  saveDailyHeartProgress: (entries: DailyHeartProgress[]) => save('daily_heart_progress', entries),
  getInstantReplies: (): InstantReply[] => load<InstantReply[]>('instant_replies', []),
  saveInstantReplies: (entries: InstantReply[]) => save('instant_replies', entries),
  getSettings: (): AppSettings => {
    const saved = load<AppSettings>('settings', initialSettings);
    return {
      ...initialSettings,
      ...saved,
      notifications: {
        ...initialSettings.notifications!,
        ...(saved.notifications ?? {})
      },
      shareCycleWithPartner: true,
      shareOnlyPredictions: false,
      allowAlcoholCategory: true
    };
  },
  saveSettings: (settings: AppSettings) => save('settings', {
    ...settings,
    shareCycleWithPartner: true,
    shareOnlyPredictions: false,
    allowAlcoholCategory: true
  }),

  getPins: (): MemoryPin[] => load<MemoryPin[]>('pins', []),
  savePins: (pins: MemoryPin[]) => save('pins', pins),

  getCycles: (): CycleRecord[] => {
    const cycles = load<CycleRecord[]>('cycles', initialCycles);
    if (cycles && cycles.length > 0 && (cycles[0].startDate === '2026-09-01' || cycles[0].startDate === '2026-09-29')) {
      save('cycles', initialCycles);
      return initialCycles;
    }
    return cycles;
  },
  saveCycles: (cycles: CycleRecord[]) => save('cycles', cycles),

  getIntimateLogs: (): IntimateLog[] => {
    const logs = load<IntimateLog[]>('intimate_logs', initialIntimateLogs);
    if (logs && (logs.length <= 2 || (logs.length > 0 && logs[0].time === '02:30'))) {
      save('intimate_logs', initialIntimateLogs);
      return initialIntimateLogs;
    }
    return logs;
  },
  saveIntimateLogs: (logs: IntimateLog[]) => save('intimate_logs', logs),

  getMovies: (): MovieItem[] => loadCatalog('movies', initialMovies, 'mov', true),
  saveMovies: (movies: MovieItem[]) => save('movies', movies),

  getMovieNightPlan: (): MovieNightPlan | null => load<MovieNightPlan | null>('movie_night_plan', null),
  saveMovieNightPlan: (plan: MovieNightPlan | null) => save('movie_night_plan', plan),

  getActors: (): ActorItem[] => loadCatalog('actors', initialActors, 'act'),
  saveActors: (actors: ActorItem[]) => save('actors', actors),

  getCollections: (): MovieCollection[] => loadCatalog('collections', initialCollections, 'col'),
  saveCollections: (collections: MovieCollection[]) => save('collections', collections),

  getTvSeries: (): TvSeries[] => loadCatalog('tv_series', initialTvSeries, 'series', true),
  saveTvSeries: (series: TvSeries[]) => save('tv_series', series),

  getWishlistPlaces: (): WishlistPlace[] => load<WishlistPlace[]>('wishlist_places', initialWishlistPlaces),
  saveWishlistPlaces: (places: WishlistPlace[]) => save('wishlist_places', places),

  getWishlistDrinks: (): WishlistDrink[] => load<WishlistDrink[]>('wishlist_drinks', initialWishlistDrinks),
  saveWishlistDrinks: (drinks: WishlistDrink[]) => save('wishlist_drinks', drinks),

  getBadges: (): AchievementBadge[] => load<AchievementBadge[]>('badges', initialBadges),
  saveBadges: (badges: AchievementBadge[]) => save('badges', badges),

  getLetters: (): LockedLetter[] => load<LockedLetter[]>('letters', initialLetters),
  saveLetters: (letters: LockedLetter[]) => save('letters', letters),

  getSongs: (): LoveSong[] => load<LoveSong[]>('songs', initialSongs),
  saveSongs: (songs: LoveSong[]) => save('songs', songs),

  // Clear only cycle and intimate data
  wipeCycleData: () => {
    localStorage.removeItem(PREFIX + 'cycles');
    localStorage.removeItem(PREFIX + 'intimate_logs');
  },

  // Export full backup
  exportBackup: () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      activeProfile: appStorage.getActiveProfile(),
      coupleMoodLog: appStorage.getCoupleMoodLog(),
      moodDiary: appStorage.getMoodDiary(),
      dailyCheckins: appStorage.getDailyCheckins(),
      streakRestores: appStorage.getStreakRestores(),
      meetingConfirmations: appStorage.getMeetingConfirmations(),
      settings: appStorage.getSettings(),
      pins: appStorage.getPins(),
      cycles: appStorage.getCycles(),
      intimateLogs: appStorage.getIntimateLogs(),
      movies: appStorage.getMovies(),
      tvSeries: appStorage.getTvSeries(),
      actors: appStorage.getActors(),
      collections: appStorage.getCollections(),
      wishlistPlaces: appStorage.getWishlistPlaces(),
      wishlistDrinks: appStorage.getWishlistDrinks(),
      badges: appStorage.getBadges(),
      letters: appStorage.getLetters(),
      songs: appStorage.getSongs()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savero-soffie-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import backup
  importBackup: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.settings) appStorage.saveSettings(data.settings);
      if (data.activeProfile) appStorage.saveActiveProfile(data.activeProfile);
      if (data.coupleMoodLog) appStorage.saveCoupleMoodLog(data.coupleMoodLog);
      if (data.moodDiary) appStorage.saveMoodDiary(data.moodDiary);
      if (data.dailyCheckins) appStorage.saveDailyCheckins(data.dailyCheckins);
      if (data.streakRestores) appStorage.saveStreakRestores(data.streakRestores);
      if (data.meetingConfirmations) appStorage.saveMeetingConfirmations(data.meetingConfirmations);
      if (data.pins) appStorage.savePins(data.pins);
      if (data.cycles) appStorage.saveCycles(data.cycles);
      if (data.intimateLogs) appStorage.saveIntimateLogs(data.intimateLogs);
      if (data.movies) appStorage.saveMovies(data.movies);
      if (data.tvSeries) appStorage.saveTvSeries(data.tvSeries);
      if (data.actors) appStorage.saveActors(data.actors);
      if (data.collections) appStorage.saveCollections(data.collections);
      if (data.wishlistPlaces) appStorage.saveWishlistPlaces(data.wishlistPlaces);
      if (data.wishlistDrinks) appStorage.saveWishlistDrinks(data.wishlistDrinks);
      if (data.badges) appStorage.saveBadges(data.badges);
      if (data.letters) appStorage.saveLetters(data.letters);
      if (data.songs) appStorage.saveSongs(data.songs);
      return true;
    } catch (e) {
      console.error('Failed to parse backup:', e);
      return false;
    }
  }
};
