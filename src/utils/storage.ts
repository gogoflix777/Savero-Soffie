import {
  AppSettings,
  MemoryPin,
  CycleRecord,
  IntimateLog,
  MovieItem,
  ActorItem,
  MovieCollection,
  TvSeries,
  WishlistPlace,
  WishlistDrink,
  AchievementBadge,
  LockedLetter,
  LoveSong
} from '../types';
import {
  initialSettings,
  initialPins,
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

export const appStorage = {
  getSettings: (): AppSettings => load<AppSettings>('settings', initialSettings),
  saveSettings: (settings: AppSettings) => save('settings', settings),

  getPins: (): MemoryPin[] => load<MemoryPin[]>('pins', initialPins),
  savePins: (pins: MemoryPin[]) => save('pins', pins),

  getCycles: (): CycleRecord[] => load<CycleRecord[]>('cycles', initialCycles),
  saveCycles: (cycles: CycleRecord[]) => save('cycles', cycles),

  getIntimateLogs: (): IntimateLog[] => load<IntimateLog[]>('intimate_logs', initialIntimateLogs),
  saveIntimateLogs: (logs: IntimateLog[]) => save('intimate_logs', logs),

  getMovies: (): MovieItem[] => load<MovieItem[]>('movies', initialMovies),
  saveMovies: (movies: MovieItem[]) => save('movies', movies),

  getActors: (): ActorItem[] => load<ActorItem[]>('actors', initialActors),
  saveActors: (actors: ActorItem[]) => save('actors', actors),

  getCollections: (): MovieCollection[] => load<MovieCollection[]>('collections', initialCollections),
  saveCollections: (collections: MovieCollection[]) => save('collections', collections),

  getTvSeries: (): TvSeries[] => load<TvSeries[]>('tv_series', initialTvSeries),
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
      settings: appStorage.getSettings(),
      pins: appStorage.getPins(),
      cycles: appStorage.getCycles(),
      intimateLogs: appStorage.getIntimateLogs(),
      movies: appStorage.getMovies(),
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
      if (data.pins) appStorage.savePins(data.pins);
      if (data.cycles) appStorage.saveCycles(data.cycles);
      if (data.intimateLogs) appStorage.saveIntimateLogs(data.intimateLogs);
      if (data.movies) appStorage.saveMovies(data.movies);
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
