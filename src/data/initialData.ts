import {
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
  LoveSong,
  AppSettings
} from '../types';

export const initialSettings: AppSettings = {
  pin: '2608',
  isGuestMode: false,
  darkMode: false,
  anniversaryDate: '2026-08-26',
  firstMeetDate: '2026-03-24',
  coupleNameSavero: 'Savero Pramudika Arya Wibowo',
  coupleNameSoffie: 'Soffie Aulia Fatikhasari',
  saveroCollege: 'Mahasiswa Hukum UNNES',
  soffieCollege: 'Mahasiswi Keperawatan UNDIP',
  shareCycleWithPartner: true,
  shareOnlyPredictions: false,
  allowAlcoholCategory: true,
  notifications: {
    enabled: true,
    webPush: true,
    inAppToast: true,
    notifyOnPin: true,
    notifyOnPhoto: true,
    notifyOnWishlist: true,
    notifyOnReply: true,
    notifyOnStreak: true,
    notifyOnNotes: true
  }
};

export const initialCycles: CycleRecord[] = [
  {
    id: 'cycle-1',
    startDate: '2026-09-01',
    endDate: '2026-09-05',
    cycleLength: 28,
    periodLength: 5,
    flow: 'sedang',
    pain: 'ringan',
    mood: 'tenang',
    notes: 'Siklus teratur, minum air hangat dan istirahat cukup.'
  },
  {
    id: 'cycle-2',
    startDate: '2026-09-29',
    endDate: '2026-10-03',
    cycleLength: 28,
    periodLength: 5,
    flow: 'sedang',
    pain: 'sedang',
    mood: 'rindu',
    notes: 'Hari pertama kram perut, Savero bawakan kompres hangat.'
  }
];

export const initialIntimateLogs: IntimateLog[] = [
  {
    id: 'intimate-1',
    date: '2026-09-06',
    time: '02:30',
    protection: 'kondom',
    protectionIssue: false,
    mood: 'romantis',
    notes: 'Di Alam Indah Gombel, momen intim yang manis dan aman berdua.',
    pinId: 'pin-5',
    createdAt: '2026-09-06T02:30:00Z'
  },
  {
    id: 'intimate-2',
    date: '2026-09-18',
    time: '22:15',
    protection: 'kondom',
    protectionIssue: false,
    mood: 'hangat',
    notes: 'Malam tenang dan hangat bersama.',
    createdAt: '2026-09-18T22:15:00Z'
  }
];

export const initialMovies: MovieItem[] = [];
export const initialActors: ActorItem[] = [];
export const initialCollections: MovieCollection[] = [];
export const initialTvSeries: TvSeries[] = [];

export const initialWishlistPlaces: WishlistPlace[] = [
  {
    id: 'wplace-1',
    name: 'Kofitiere Semarang',
    category: 'kafe',
    area: 'Peleburan / Erlangga',
    budgetEstimate: 'sedang',
    priority: 'tinggi',
    requestedBy: 'Soffie',
    notes: 'Matcha latte-nya terkenal enak dan suasananya teduh buat nugas berdua.',
    tags: ['Matcha', 'Nugas', 'Cozy'],
    createdAt: '2026-09-02'
  },
  {
    id: 'wplace-2',
    name: 'Spiegel Bar & Bistro Kota Lama',
    category: 'restoran',
    area: 'Kota Lama Semarang',
    budgetEstimate: 'mewah',
    priority: 'tinggi',
    requestedBy: 'Savero',
    notes: 'Bangunan heritage Eropa yang estetik buat kencan formal atau perayaan milestone.',
    tags: ['Heritage', 'Kota Lama', 'Fine Dining'],
    createdAt: '2026-09-05'
  },
  {
    id: 'wplace-3',
    name: 'Pantai Marina Sunset',
    category: 'pantai',
    area: 'Tawangsari Semarang Barat',
    budgetEstimate: 'murah',
    priority: 'sedang',
    requestedBy: 'Berdua',
    notes: 'Duduk di tanggul sore-sore sambil makan jagung bakar melihat matahari terbenam.',
    tags: ['Sunset', 'Angin Laut', 'Santai'],
    createdAt: '2026-09-12'
  },
  {
    id: 'wplace-4',
    name: 'XXI The Premiere DP Mall',
    category: 'bioskop',
    area: 'Jl. Pemuda Semarang',
    budgetEstimate: 'mewah',
    priority: 'tinggi',
    requestedBy: 'Berdua',
    notes: 'Nonton film terbaru dengan sofa rebah empuk dan selimut tebal berdua.',
    tags: ['Cinema', 'Comfort', 'Premiere'],
    createdAt: '2026-09-15'
  }
];

export const initialWishlistDrinks: WishlistDrink[] = [
  {
    id: 'wdrink-1',
    name: 'Ceremonial Iced Matcha Latte',
    type: 'matcha',
    venueName: 'Kofitiere',
    price: 38000,
    forWhom: 'Soffie',
    status: 'sudah_coba',
    rating: 5,
    tastingNotes: 'Umami kuat, rasa manis seimbang, tidak pahit grassy. Juara 1 favorit Soffie!',
    createdAt: '2026-09-08'
  },
  {
    id: 'wdrink-2',
    name: 'V60 Gayo Natural Single Origin',
    type: 'kopi',
    venueName: 'Kafe Dekat Unika',
    price: 32000,
    forWhom: 'Savero',
    status: 'sudah_coba',
    rating: 5,
    tastingNotes: 'Notes buah berry dan acidity lembut. Kopi favorit Savero saat begadang tugas hukum.',
    createdAt: '2026-03-25'
  },
  {
    id: 'wdrink-3',
    name: 'Strawberry Matcha Cloud',
    type: 'matcha',
    venueName: 'Semesta Cafe Pleburan',
    price: 35000,
    forWhom: 'Soffie',
    status: 'sudah_coba',
    rating: 4.8,
    tastingNotes: 'Perpaduan selai stroberi asam manis dan matcha kental yang creamy.',
    createdAt: '2026-09-14'
  },
  {
    id: 'wdrink-4',
    name: 'Es Kopi Susu Gula Aren Savero',
    type: 'kopi',
    venueName: 'KONICIPICIP Taichan',
    price: 22000,
    forWhom: 'Savero',
    status: 'sudah_coba',
    rating: 4.7,
    tastingNotes: 'Manis gurih, penyelamat saat nemenin Soffie makan taichan pedas.',
    createdAt: '2026-08-26'
  },
  {
    id: 'wdrink-5',
    name: 'Genmaicha Oat Foam',
    type: 'matcha',
    venueName: 'Kofitiere',
    price: 42000,
    forWhom: 'Soffie',
    status: 'ingin_coba',
    createdAt: '2026-09-20'
  },
  {
    id: 'wdrink-6',
    name: 'Cold Brew Citrus Tonic',
    type: 'kopi',
    venueName: 'Spiegel Bistro',
    price: 45000,
    forWhom: 'Savero',
    status: 'ingin_coba',
    createdAt: '2026-09-22'
  }
];

export const initialBadges: AchievementBadge[] = [
  {
    id: 'badge-1',
    title: 'Kencan Pertama',
    description: 'Mengunjungi tempat kencan pertama resmi berdua (KONICIPICIP Taichan).',
    category: 'cinta',
    tier: 'hati',
    iconType: 'sate',
    isUnlocked: true,
    unlockedAt: '2026-08-26',
    triggerContext: 'KONICIPICIP Sate Taichan Pleburan jam 23.23 WIB'
  },
  {
    id: 'badge-2',
    title: 'Kelelawar Malam',
    description: 'Masih jalan dan menikmati malam di Semarang hingga melewati jam 05.00 pagi.',
    category: 'cinta',
    tier: 'emas',
    iconType: 'jalan',
    isUnlocked: true,
    unlockedAt: '2026-08-27',
    triggerContext: 'Jalan Baru Jangli–Undip sampai jam 05.38 pagi'
  },
  {
    id: 'badge-3',
    title: 'Menginap Pertama',
    description: 'Momen menginap pertama kita berdua di perbukitan Gombel.',
    category: 'cinta',
    tier: 'perak',
    iconType: 'bantal',
    isUnlocked: true,
    unlockedAt: '2026-09-06',
    triggerContext: 'Alam Indah Hotel Gombel',
    isSensitive: true
  },
  {
    id: 'badge-4',
    title: 'Meja Hijau',
    description: 'Simbol dedikasi Savero sebagai calon penegak hukum UNNES.',
    category: 'spesial',
    tier: 'emas',
    iconType: 'palu',
    isUnlocked: true,
    unlockedAt: '2026-08-26',
    triggerContext: 'Hukum UNNES - Keadilan & Kebijaksanaan'
  },
  {
    id: 'badge-5',
    title: 'Jaga Malam',
    description: 'Simbol ketulusan Soffie sebagai bidadari perawat UNDIP.',
    category: 'spesial',
    tier: 'emas',
    iconType: 'stetoskop',
    isUnlocked: true,
    unlockedAt: '2026-08-26',
    triggerContext: 'Keperawatan UNDIP - Kasih & Ketulusan'
  },
  {
    id: 'badge-6',
    title: 'Pecinta Taichan',
    description: 'Mencoba sate taichan favorit berdua di Pleburan.',
    category: 'tempat',
    tier: 'perunggu',
    iconType: 'sate',
    isUnlocked: true,
    unlockedAt: '2026-08-26',
    triggerContext: 'KONICIPICIP Pleburan'
  },
  {
    id: 'badge-7',
    title: 'Raja Jalanan',
    description: 'Menyusuri rute night ride panjang yang tercatat di peta kenangan.',
    category: 'tempat',
    tier: 'perak',
    iconType: 'jalan',
    isUnlocked: true,
    unlockedAt: '2026-08-27',
    triggerContext: 'Rute Jangli-Undip'
  },
  {
    id: 'badge-8',
    title: 'Penjelajah Semarang',
    description: 'Telah menandai 5 tempat kenangan di Kota Semarang.',
    category: 'tempat',
    tier: 'perak',
    iconType: 'pin',
    isUnlocked: true,
    unlockedAt: '2026-09-06',
    progress: { current: 5, target: 15 }
  },
  {
    id: 'badge-9',
    title: 'Ratu Matcha',
    description: 'Soffie mencicipi dan memberi rating minuman matcha favoritnya.',
    category: 'minuman',
    tier: 'perak',
    iconType: 'matcha',
    isUnlocked: true,
    unlockedAt: '2026-09-08',
    progress: { current: 2, target: 10 }
  },
  {
    id: 'badge-10',
    title: 'Raja Kopi',
    description: 'Savero mencicipi dan mengulas kopi seduh manual di Semarang.',
    category: 'minuman',
    tier: 'perak',
    iconType: 'cangkir',
    isUnlocked: true,
    unlockedAt: '2026-08-26',
    progress: { current: 2, target: 10 }
  },
  {
    id: 'badge-11',
    title: 'Duo Seduh',
    description: 'Kombinasi sempurna: Savero secangkir kopi & Soffie segelas matcha.',
    category: 'minuman',
    tier: 'hati',
    iconType: 'cangkir',
    isUnlocked: true,
    unlockedAt: '2026-09-14',
    triggerContext: 'Kombinasi Matcha & Kopi berdua'
  },
  {
    id: 'badge-12',
    title: 'Malam Film',
    description: 'Menonton film pertama berdua sambil berbagi selimut dan cemilan.',
    category: 'film',
    tier: 'perunggu',
    iconType: 'klaper',
    isUnlocked: true,
    unlockedAt: '2026-08-30',
    triggerContext: 'Menonton film bersama'
  },
  {
    id: 'badge-13',
    title: 'Selera Kembar',
    description: 'Savero dan Soffie sama-sama memberi rating bintang 5 pada film yang sama.',
    category: 'film',
    tier: 'emas',
    iconType: 'hati',
    isUnlocked: true,
    unlockedAt: '2026-08-30',
    triggerContext: 'Memberi rating 5/5 pada film yang sama'
  },
  {
    id: 'badge-14',
    title: 'Penggemar Aktor Favorit',
    description: 'Menyukai aktor atau aktris film yang sama.',
    category: 'film',
    tier: 'perak',
    iconType: 'klaper',
    isUnlocked: true,
    unlockedAt: '2026-09-10'
  },
  {
    id: 'badge-15',
    title: '100 Hari Bersama',
    description: 'Melewati 100 hari penuh tawa, cinta, dan perjalanan indah berdua.',
    category: 'cinta',
    tier: 'emas',
    iconType: 'hati',
    isUnlocked: false,
    progress: { current: 49, target: 100 }
  },
  {
    id: 'badge-16',
    title: 'Genap Setahun',
    description: 'Satu tahun anniversary perjalanan Savero & Soffie.',
    category: 'cinta',
    tier: 'hati',
    iconType: 'hati',
    isUnlocked: false,
    isSecret: true,
    progress: { current: 49, target: 365 }
  },
  {
    id: 'badge-17',
    title: 'Kapsul Waktu',
    description: 'Membuka surat cinta rahasia yang terkunci hingga tanggal istimewa.',
    category: 'spesial',
    tier: 'hati',
    iconType: 'hati',
    isUnlocked: false,
    isSecret: true
  }
];

export const initialLetters: LockedLetter[] = [
  {
    id: 'letter-1',
    sender: 'Savero',
    recipient: 'Soffie',
    title: 'Untuk Bidadari Stetoskopku',
    content: `Hai sayang, Soffie Aulia Fatikhasari...\n\nTerima kasih sudah hadir di hidupku. Dari malam pertama di Gacoan, obrolan fajar di kafe Unika, hingga malam berdua di Taichan Pleburan jam 23.23 yang selalu kuingat. Kamu yang selalu sabar dan tulus, bidadari keperawatan yang bikin hatiku selalu pulang.\n\nAku janji akan selalu menjaga dan memperjuangkan kamu, sebagaimana komitmenku dalam hukum dan keadilan: teguh, setia, dan tanpa ragu. Aku sayang kamu selalu, Soffie. ❤️`,
    unlockDate: '2026-08-26',
    isOpened: true,
    themeColor: '#7A1018'
  },
  {
    id: 'letter-2',
    sender: 'Soffie',
    recipient: 'Savero',
    title: 'Untuk Calon Hakim Hatiku',
    content: `Savero tersayang...\n\nMenemani kamu dari malam-malam dingin Semarang, jalan baru Jangli sampai Undip subuh 05.38, adalah hal paling membahagiakan. Kamu selalu bisa bikin aku merasa aman dan dicintai sepenuhnya.\n\nSemoga kita terus saling mendukung, kamu dengan skripsi dan mimpi hukummu, aku dengan stase dan dedikasi keperawatanku. Selamat hari kita, sayang! xoxo 🌿☕`,
    unlockDate: '2026-08-26',
    isOpened: true,
    themeColor: '#BFD8B8'
  },
  {
    id: 'letter-3',
    sender: 'Savero',
    recipient: 'Soffie',
    title: 'Kapsul Waktu: Menuju 100 Hari Berdua',
    content: `Surat ini ditulis untuk dibuka saat kita resmi genap 100 hari bersama!\n\nJika kamu membaca ini, artinya kita telah melewati ratusan jam obrolan, puluhan mangkuk makanan enak, dan cinta yang kian bertambah dalam setiap hembusan nafas. Tetaplah jadi senyum terindah di Semarang untukku ya!`,
    unlockDate: '2026-12-04',
    isOpened: false,
    themeColor: '#D9B26F'
  }
];

export const initialSongs: LoveSong[] = [
  {
    id: 'song-1',
    title: 'City of Stars',
    artist: 'Ryan Gosling, Emma Stone (La La Land)',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    memoryNote: 'Lagu tema saat kita nonton La La Land berdua di kos.',
    audioUrl: 'https://cdn.freesound.org/previews/615/615967_11861866-lq.mp3'
  },
  {
    id: 'song-2',
    title: 'About Time Theme (How Long Will I Love You)',
    artist: 'Jon Boden, Sam Sweeney, Ben Coleman',
    albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    memoryNote: 'Diputar saat night ride Jangli–Undip menembus fajar pagi.',
    audioUrl: 'https://cdn.freesound.org/previews/612/612662_11861866-lq.mp3'
  },
  {
    id: 'song-3',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    memoryNote: 'Lagu yang selalu mengingatkan Savero pada cantiknya Soffie.',
    audioUrl: 'https://cdn.freesound.org/previews/573/573381_11861866-lq.mp3'
  }
];
