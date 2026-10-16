export type PinCategory =
  | 'kafe'
  | 'restoran'
  | 'hotel'
  | 'motel'
  | 'rekreasi'
  | 'pantai'
  | 'gunung'
  | 'bioskop'
  | 'taman'
  | 'rumah'
  | 'kos'
  | 'jalan'
  | 'lainnya';

export type MoodExpression = 'bahagia' | 'rindu' | 'tenang' | 'semangat' | 'lelah' | 'sedih';
export interface CurrentMoodLog {
  expression: MoodExpression;
  updatedAt: string;
}
export type CoupleMoodLog = Record<'Savero' | 'Soffie', CurrentMoodLog>;

export interface MoodDiaryEntry {
  id: string;
  profile: 'Savero' | 'Soffie';
  date: string;
  expression: MoodExpression;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type CoupleProfile = 'Savero' | 'Soffie';
export interface DailyHeartProgress {
  profile: CoupleProfile;
  progress_date: string;
  percentage: number;
}
export interface DailyCheckin {
  id: string;
  user_id: string;
  profile: CoupleProfile;
  log_date: string;
  expression: MoodExpression;
  rating: number;
  diary_text: string | null;
  photo_path: string | null;
  photo_url?: string | null;
  expires_at: string;
  created_at: string;
}
export interface MeetingConfirmation {
  id: string;
  user_id: string;
  profile: CoupleProfile;
  meeting_date: string;
  confirmed_at: string;
}
export interface StreakRestore {
  missed_date: string;
  restored_by: string;
  restored_at: string;
}

export interface MemoryPin {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description: string;
  photos: string[];
  rating: number; // 1-5
  tags: string[];
  category: PinCategory;
  lat: number;
  lng: number;
  mapUrl?: string;
  status: 'visited' | 'wishlist';
  addedBy: 'Savero' | 'Soffie' | 'Berdua';
  isSensitive?: boolean; // True for rumah, kos, motel
  isRoute?: boolean; // For routes like Jangli-Undip
  routeCoords?: [number, number][];
}

export type ProtectionType = 'kondom' | 'tanpa_pengaman' | 'metode_lain' | 'tidak_ingat';

export interface IntimateLog {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  protection: ProtectionType;
  protectionIssue?: boolean; // condom tear/slip/leak
  otherMethodDetails?: string;
  mood?: string; // emoji
  notes?: string;
  pinId?: string; // link to map pin
  createdAt: string;
}

export interface CycleRecord {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (typically ~5 days)
  fertileStartDate?: string; // optional manually corrected fertile-window start
  fertileEndDate?: string; // optional manually corrected fertile-window end
  ovulationDate?: string; // optional manually corrected ovulation date
  cycleLength: number; // e.g. 28
  periodLength: number; // e.g. 5
  notes?: string;
  flow?: 'ringan' | 'sedang' | 'banyak';
  pain?: 'tidak_ada' | 'ringan' | 'sedang' | 'parah';
  mood?: string;
}

export interface MovieItem {
  id: string;
  tmdbId?: number;
  tmdbMetadataFetched?: boolean;
  title: string;
  year?: number;
  posterUrl: string;
  backdropUrl?: string;
  genres: string[];
  durationMinutes?: number;
  overview: string;
  tmdbRating?: number;
  trailerUrl?: string;
  cast?: string[];
  status: 'together' | 'savero' | 'soffie' | 'separate' | 'watchlist';
  addedBy?: 'Savero' | 'Soffie';
  watchedDate?: string;
  venuePinId?: string; // link to cinema pin
  ratingSavero?: number; // 1-5
  ratingSoffie?: number; // 1-5
  notes?: string;
  emojiReaction?: string;
}

export interface ActorItem {
  id: string;
  tmdbId?: number;
  tmdbMetadataFetched?: boolean;
  name: string;
  photoUrl: string;
  birthDate?: string;
  birthPlace?: string;
  biography?: string;
  likedBy: 'Savero' | 'Soffie' | 'Berdua';
  topMovies?: string[];
}

export interface MovieCollection {
  id: string;
  name: string;
  description: string;
  movieTitles: string[];
  isTargetThisYear?: boolean;
}

export interface TvSeries {
  id: string;
  tmdbId?: number;
  tmdbMetadataFetched?: boolean;
  title: string;
  posterUrl: string;
  totalSeasons: number;
  totalEpisodes: number;
  watchedEpisodes: number;
  firstAirDate?: string;
  overview?: string;
  tmdbRating?: number;
  genres?: string[];
  cast?: string[];
  notes?: string;
  status: 'watching' | 'completed' | 'watchlist';
}

export interface WishlistPlace {
  id: string;
  name: string;
  category: PinCategory;
  mapUrl?: string;
  area: string;
  budgetEstimate: 'murah' | 'sedang' | 'mewah';
  priority: 'tinggi' | 'sedang' | 'rendah';
  requestedBy: 'Savero' | 'Soffie' | 'Berdua';
  notes?: string;
  tags: string[];
  createdAt: string;
  isVisited?: boolean;
}

export interface WishlistDrink {
  id: string;
  name: string;
  type: 'kopi' | 'matcha' | 'non-kopi' | 'alkohol';
  venueName: string;
  venuePinId?: string;
  price?: number;
  forWhom: 'Savero' | 'Soffie' | 'Berdua';
  addedBy?: 'Savero' | 'Soffie';
  status: 'ingin_coba' | 'sudah_coba';
  rating?: number; // 1-5
  tastingNotes?: string;
  alcoholType?: string;
  alcoholPercentage?: number;
  createdAt: string;
}

export type CafeBadgeType = 'baru_buka' | 'segera_buka' | 'viral' | 'spesial_matcha' | 'spesial_kopi';

export interface RealtimeCafeRecommendation {
  id: string;
  name: string;
  category: 'kafe' | 'dessert' | 'restoran' | 'roastery';
  area: string;
  address: string;
  lat: number;
  lng: number;
  openTime: string; // e.g. "08:00"
  closeTime: string; // e.g. "23:00"
  openDays: string; // e.g. "Setiap Hari"
  statusBadge: CafeBadgeType;
  statusBadgeLabel: string;
  openingDateEstimate?: string;
  priceRange: 'murah' | 'sedang' | 'mewah';
  averagePrice: string;
  photoUrl: string;
  signatureMenu: string;
  matchaMenu?: string;
  coffeeMenu?: string;
  atmosphere: string;
  highlightForCouple: string;
  mapUrl: string;
  instagramHandle?: string;
  rating: number; // 1-5
  reviewCount: number;
}

export type BadgeTier = 'perunggu' | 'perak' | 'emas' | 'hati';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: 'cinta' | 'tempat' | 'film' | 'minuman' | 'spesial';
  tier: BadgeTier;
  iconType: 'cangkir' | 'matcha' | 'klaper' | 'palu' | 'stetoskop' | 'sate' | 'pin' | 'bantal' | 'bianglala' | 'hati' | 'jalan';
  isUnlocked: boolean;
  unlockedAt?: string;
  triggerContext?: string;
  isSecret?: boolean;
  isSensitive?: boolean; // Hidden in guest mode
  progress?: {
    current: number;
    target: number;
  };
}

export interface LockedLetter {
  id: string;
  sender: 'Savero' | 'Soffie';
  recipient: 'Savero' | 'Soffie';
  title: string;
  content: string;
  unlockDate: string; // YYYY-MM-DD
  isOpened?: boolean;
  themeColor?: string;
}

export interface LoveSong {
  id: string;
  musicBrainzId?: string;
  title: string;
  artist: string;
  albumArt: string;
  releaseTitle?: string;
  durationMs?: number;
  description?: string;
  memoryNote?: string;
  spotifyUri?: string;
  audioUrl?: string;
}

export interface FavoriteSinger {
  profile: CoupleProfile;
  musicBrainzId: string;
  name: string;
  disambiguation?: string;
  country?: string;
  artistType?: string;
  photoUrl?: string;
  description: string;
  createdAt: string;
}

export interface AppSettings {
  pin: string; // default "2608"
  isGuestMode: boolean;
  darkMode: boolean;
  anniversaryDate: string; // 2026-08-26
  firstMeetDate: string; // 2026-03-24
  coupleNameSavero: string;
  coupleNameSoffie: string;
  saveroCollege: string;
  soffieCollege: string;
  shareCycleWithPartner: boolean;
  shareOnlyPredictions: boolean;
  allowAlcoholCategory: boolean;
}
