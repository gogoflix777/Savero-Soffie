import {
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
  allowAlcoholCategory: false,
  tmdbApiKey: ''
};

export const initialPins: MemoryPin[] = [
  {
    id: 'pin-1',
    title: 'Pertemuan Pertama: Mie Gacoan',
    date: '2026-03-24',
    time: '20:15',
    description: 'Pertemuan awal cerita kita berdua. Suasana ramai Mie Gacoan Semarang dengan tawa dan obrolan pertama yang tidak terlupakan.',
    photos: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'
    ],
    rating: 5,
    tags: ['Pertama Kali', 'Mie Gacoan', 'Awal Cerita', 'Semarang'],
    category: 'restoran',
    lat: -7.004128,
    lng: 110.419234,
    mapUrl: 'https://maps.app.goo.gl/YVWJqrZoqhJp6ZXs5?g_st=iw',
    status: 'visited',
    addedBy: 'Berdua',
    isSensitive: false
  },
  {
    id: 'pin-2',
    title: 'Pindah Ngobrol: Kafe Dekat Unika',
    date: '2026-03-25',
    time: '01:30',
    description: 'Melanjutkan obrolan sampai dini hari di kafe hangat dekat kampus Unika Soegijapranata Bendan Dhuwur. Kopi pertama dan percakapan mendalam.',
    photos: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80'
    ],
    rating: 5,
    tags: ['Kafe Unika', 'Dini Hari', 'Kopi', 'Ngobrol Santai'],
    category: 'kafe',
    lat: -7.018241,
    lng: 110.407632,
    mapUrl: 'https://maps.app.goo.gl/hUEKGe5DZ5jh51fz9?g_st=iw',
    status: 'visited',
    addedBy: 'Berdua',
    isSensitive: false
  },
  {
    id: 'pin-3',
    title: 'Kencan Berdua Pertama: KONICIPICIP Taichan Pleburan',
    date: '2026-08-26',
    time: '23:23',
    description: 'Pertama kali resmi keluar berdua! Menikmati sate taichan gurih pedas di Pleburan jam 23.23 malam. Titik tolak hari jadian kita yang penuh debar.',
    photos: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
      'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80'
    ],
    rating: 5,
    tags: ['Kencan Pertama', 'Hari Jadian', 'Taichan Pleburan', 'Malam Romantis'],
    category: 'restoran',
    lat: -6.9957834,
    lng: 110.423215,
    mapUrl: 'http://google.com/maps/place/KONICIPICIP+sate+taichan+semarang+PLEBURAN/@-6.9957834,110.423215,17z/data=!3m1!4b1!4m6!3m5!1s0x2e708b8a726ddc57:0x4111b05b0bbccff1!8m2!3d-6.9957834!4d110.423215!16s%2Fg%2F11jjpqjcpp',
    status: 'visited',
    addedBy: 'Berdua',
    isSensitive: false
  },
  {
    id: 'pin-4',
    title: 'Night Ride: Jalan Baru Jangli – Undip Sampai Subuh',
    date: '2026-08-27',
    time: '05:38',
    description: 'Menyusuri jalanan malam Semarang dari Jangli sampai tembusan kampus Tembalang Undip. Angin dingin, jalan sepi, dan pemandangan sunrise fajar jam 05.38 pagi.',
    photos: [
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&q=80'
    ],
    rating: 5,
    tags: ['Night Ride', 'Jangli-Undip', 'Subuh', 'Sunrise', 'Rute Spesial'],
    category: 'jalan',
    lat: -7.0375,
    lng: 110.4335,
    mapUrl: 'https://maps.google.com/?q=-7.0375,110.4335',
    status: 'visited',
    addedBy: 'Berdua',
    isSensitive: false,
    isRoute: true,
    routeCoords: [
      [-7.0250, 110.4280],
      [-7.0310, 110.4310],
      [-7.0375, 110.4335],
      [-7.0440, 110.4370],
      [-7.0520, 110.4410]
    ]
  },
  {
    id: 'pin-5',
    title: 'Menginap Pertama: Alam Indah Hotel Gombel',
    date: '2026-09-06',
    time: '02:00',
    description: 'Motel pertama kita di perbukitan Gombel, Jl. Setia Budi No. 12, Gombel, Ngesrep Banyumanik (~200m dari Gombel Golf Course). View bukit Semarang malam hari dan kehangatan privat berdua.',
    photos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'
    ],
    rating: 5,
    tags: ['Menginap Pertama', 'Gombel', 'Privat', 'Malam Berdua'],
    category: 'motel',
    lat: -7.0289,
    lng: 110.4245,
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Alam+Indah+Hotel+Gombel+Semarang',
    status: 'visited',
    addedBy: 'Berdua',
    isSensitive: true
  },
  {
    id: 'pin-6',
    title: 'Rumah Savero',
    date: '2026-04-10',
    time: '14:00',
    description: 'Rumah Savero di Semarang. Ruang hangat keluarga dan tempat istirahat anak Hukum UNNES.',
    photos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'],
    rating: 5,
    tags: ['Rumah Savero', 'Keluarga', 'Semarang'],
    category: 'rumah',
    lat: -7.0012,
    lng: 110.3950,
    mapUrl: 'https://share.google/z1owJXRhPZkB6OMHC',
    status: 'visited',
    addedBy: 'Savero',
    isSensitive: true
  },
  {
    id: 'pin-7',
    title: 'Rumah Soffie',
    date: '2026-04-18',
    time: '16:00',
    description: 'Rumah Soffie di Semarang. Tempat penuh kenyamanan bidadari Keperawatan UNDIP.',
    photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'],
    rating: 5,
    tags: ['Rumah Soffie', 'Keluarga', 'Semarang'],
    category: 'rumah',
    lat: -6.9880,
    lng: 110.4350,
    mapUrl: 'https://maps.app.goo.gl/zEY72KjjhbJMTxPh8?g_st=iw',
    status: 'visited',
    addedBy: 'Soffie',
    isSensitive: true
  },
  {
    id: 'pin-8',
    title: 'Kos Soffie: Jalan Turus Asri III',
    date: '2026-05-02',
    time: '19:00',
    description: 'Kos Soffie di dekat kampus Undip Tembalang. Tempat singgah tugas stase keperawatan dan tempat jemputan Savero.',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
    rating: 5,
    tags: ['Kos Soffie', 'Tembalang', 'UNDIP', 'Turus Asri'],
    category: 'kos',
    lat: -7.057831,
    lng: 110.447910,
    mapUrl: 'https://maps.apple.com/?ll=-7.057831,110.447910&q=Jalan%20Turus%20Asri%20III&t=m',
    status: 'visited',
    addedBy: 'Soffie',
    isSensitive: true
  }
];

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

export const initialMovies: MovieItem[] = [
  {
    id: 'mov-1',
    tmdbId: 313369,
    title: 'La La Land',
    year: 2016,
    posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkVJb0Rf0.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/qJeU7KM4nR29v2qK4tqO7uQn2G.jpg',
    genres: ['Romance', 'Comedy', 'Drama', 'Music'],
    durationMinutes: 128,
    overview: 'Mia, seorang calon aktris, dan Sebastian, musisi jazz yang berdedikasi, berjuang memenuhi kebutuhan di kota yang terkenal menghancurkan harapan dan mematahkan hati.',
    tmdbRating: 7.9,
    status: 'together',
    watchedDate: '2026-08-30',
    venuePinId: 'pin-8',
    ratingSavero: 5,
    ratingSoffie: 5,
    notes: 'Soundtrack City of Stars bikin terhanyut. Film favorit kencan malam kita di kos.',
    emojiReaction: '✨😭❤️'
  },
  {
    id: 'mov-2',
    tmdbId: 122906,
    title: 'About Time',
    year: 2013,
    posterUrl: 'https://image.tmdb.org/t/p/w500/iL8bJ7qV05m98r0CsmWb2aE8V4f.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/jG2lqR5h33aF1oI7WkUeFz42b.jpg',
    genres: ['Drama', 'Romance', 'Fantasy'],
    durationMinutes: 123,
    overview: 'Pada usia 21 tahun, Tim mengetahui bahwa pria di keluarganya dapat melakukan perjalanan melintasi waktu. Ia memutuskan untuk membuat dunianya lebih baik dengan mencari pacar.',
    tmdbRating: 8.0,
    status: 'together',
    watchedDate: '2026-09-10',
    ratingSavero: 5,
    ratingSoffie: 5,
    notes: 'Pelajaran berharga tentang menikmati setiap detik bersama orang tersayang.',
    emojiReaction: '⏳❤️🥹'
  },
  {
    id: 'mov-3',
    tmdbId: 19995,
    title: 'Avatar',
    year: 2009,
    posterUrl: 'https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg',
    genres: ['Action', 'Adventure', 'Fantasy', 'Sci-Fi'],
    durationMinutes: 162,
    overview: 'Di dunia alien Pandora hidup suku Na vi, makhluk yang tampak primitif namun sangat berevolusi.',
    tmdbRating: 7.6,
    status: 'together',
    watchedDate: '2026-09-15',
    ratingSavero: 4,
    ratingSoffie: 4,
    notes: 'Visual spektakuler, nonton sambil cemil taichan.',
    emojiReaction: '🌿💙'
  },
  {
    id: 'mov-4',
    tmdbId: 157336,
    title: 'Interstellar',
    year: 2014,
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    durationMinutes: 169,
    overview: 'Petualangan melintasi lubang cacing untuk memastikan kelangsungan hidup umat manusia di planet lain.',
    tmdbRating: 8.4,
    status: 'savero',
    ratingSavero: 5,
    notes: 'Savero sangat suka teori relativitas waktu dan soundtrack Hans Zimmer.',
    emojiReaction: '🌌🪐'
  },
  {
    id: 'mov-5',
    tmdbId: 508442,
    title: 'Soul',
    year: 2020,
    posterUrl: 'https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIiv9I08RiAhGIvXd.jpg',
    genres: ['Animation', 'Comedy', 'Drama', 'Music'],
    durationMinutes: 100,
    overview: 'Seorang pianis jazz New York menemukan dirinya di alam peralihan antara kehidupan dan akhirat.',
    tmdbRating: 8.1,
    status: 'soffie',
    ratingSoffie: 5,
    notes: 'Soffie terharu banget melihat makna hidup dari hal-hal kecil seperti daun yang jatuh.',
    emojiReaction: '🍂🎹'
  },
  {
    id: 'mov-6',
    tmdbId: 872585,
    title: 'Oppenheimer',
    year: 2023,
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    genres: ['Drama', 'History'],
    durationMinutes: 180,
    overview: 'Kisah fisikawan J. Robert Oppenheimer yang memimpin Proyek Manhattan.',
    tmdbRating: 8.1,
    status: 'watchlist',
    notes: 'Target movie night marathon akhir pekan ini berdua!'
  }
];

export const initialActors: ActorItem[] = [
  {
    id: 'act-1',
    name: 'Emma Stone',
    photoUrl: 'https://image.tmdb.org/t/p/w500/cZ8a3Q7vG1m3rY8uPq4X2e8L4t.jpg',
    birthDate: '1988-11-06',
    birthPlace: 'Scottsdale, Arizona, USA',
    biography: 'Aktris pemenang Oscar yang memukau lewat La La Land, Poor Things, dan The Amazing Spider-Man.',
    likedBy: 'Berdua',
    topMovies: ['La La Land', 'Cruella', 'Easy A', 'Poor Things']
  },
  {
    id: 'act-2',
    name: 'Ryan Gosling',
    photoUrl: 'https://image.tmdb.org/t/p/w500/lyUyVARQKhGxaxy0FbPJCQRpiaW.jpg',
    birthDate: '1980-11-12',
    birthPlace: 'London, Ontario, Canada',
    biography: 'Aktor karismatik yang membintangi La La Land, Drive, Blade Runner 2049, dan The Notebook.',
    likedBy: 'Berdua',
    topMovies: ['La La Land', 'The Notebook', 'Drive', 'Blade Runner 2049']
  },
  {
    id: 'act-3',
    name: 'Cillian Murphy',
    photoUrl: 'https://image.tmdb.org/t/p/w500/iOKW49Y93nF5p8CgmU45J3kC6hA.jpg',
    birthDate: '1976-05-25',
    birthPlace: 'Douglas, Cork, Ireland',
    biography: 'Aktor brilian pemeran Thomas Shelby di Peaky Blinders dan J. Robert Oppenheimer.',
    likedBy: 'Savero',
    topMovies: ['Oppenheimer', 'Peaky Blinders', 'Inception', 'Dunkirk']
  },
  {
    id: 'act-4',
    name: 'Rachel McAdams',
    photoUrl: 'https://image.tmdb.org/t/p/w500/2fec7wN4wE9rXU062m8oN7P2y.jpg',
    birthDate: '1978-11-17',
    birthPlace: 'London, Ontario, Canada',
    biography: 'Ratu film romantis mempesona lewat About Time, The Notebook, dan The Vow.',
    likedBy: 'Soffie',
    topMovies: ['About Time', 'The Notebook', 'The Vow', 'Midnight in Paris']
  }
];

export const initialCollections: MovieCollection[] = [
  {
    id: 'col-1',
    name: 'Marvel Cinematic Universe (MCU)',
    description: 'Petualangan superhero Marvel dari Iron Man hingga Endgame dan multiverse.',
    movieTitles: ['Iron Man', 'The Avengers', 'Captain America: Winter Soldier', 'Guardians of the Galaxy', 'Avengers: Infinity War', 'Avengers: Endgame', 'Spider-Man: No Way Home'],
    isTargetThisYear: true
  },
  {
    id: 'col-2',
    name: 'Harry Potter Wizarding World',
    description: 'Petualangan magis Hogwarts dari tahun pertama hingga pertempuran Deathly Hallows.',
    movieTitles: ['Sorcerer Stone', 'Chamber of Secrets', 'Prisoner of Azkaban', 'Goblet of Fire', 'Order of the Phoenix', 'Half-Blood Prince', 'Deathly Hallows Pt 1', 'Deathly Hallows Pt 2'],
    isTargetThisYear: false
  },
  {
    id: 'col-3',
    name: 'The Lord of the Rings Trilogy',
    description: 'Karya epik J.R.R. Tolkien tentang perjalanan penghancuran One Ring di Middle-Earth.',
    movieTitles: ['Fellowship of the Ring', 'The Two Towers', 'The Return of the King'],
    isTargetThisYear: true
  }
];

export const initialTvSeries: TvSeries[] = [
  {
    id: 'series-1',
    title: 'Hospital Playlist',
    posterUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80',
    totalSeasons: 2,
    totalEpisodes: 24,
    watchedEpisodes: 18,
    notes: 'Drama medis hangat favorit Soffie. Musiknya bagus dan persahabatannya bikin terharu.',
    status: 'watching'
  },
  {
    id: 'series-2',
    title: 'Peaky Blinders',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
    totalSeasons: 6,
    totalEpisodes: 36,
    watchedEpisodes: 36,
    notes: 'Kharisma Thomas Shelby dan intrik hukum/politik Birmingham favorit Savero.',
    status: 'completed'
  },
  {
    id: 'series-3',
    title: 'House of the Dragon',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80',
    totalSeasons: 2,
    totalEpisodes: 18,
    watchedEpisodes: 10,
    notes: 'Nonton bareng setiap weekend sambil ngemil taichan pedas.',
    status: 'watching'
  }
];

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
    triggerContext: 'La La Land berdua'
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
    triggerContext: 'Rating 5/5 untuk La La Land & About Time'
  },
  {
    id: 'badge-14',
    title: 'Fans Setia Emma Stone',
    description: 'Menyukai artis dan aktris film musikal yang sama.',
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
