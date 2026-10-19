import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ManagedImage } from '../common/ManagedImage';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  Search,
  Heart,
  Star,
  Users,
  Calendar,
  Sparkles,
  Plus,
  Play,
  Tv,
  Layers,
  Clapperboard,
  ArrowUpDown,
  ListFilter,
  CheckCircle,
  X,
  Bookmark
} from 'lucide-react';
import { CloseButton } from '../common/CloseButton';
import { MovieItem, MovieNightPlan, ActorItem, MovieCollection, TvSeries, MemoryPin, AppSettings } from '../../types';
import { HeartRating } from '../common/AnimatedIcons';
import { getTmdbApiKey } from '../../config/env';
import {
  getMovieByTitle,
  getMovieFromTmdb,
  getPersonByName,
  getPersonFromTmdb,
  getTvByTitle,
  getTvFromTmdb,
  mapMovieSearchResult,
  mapPersonSearchResult,
  mapTvSearchResult,
  searchTmdb,
  TmdbSearchResult
} from '../../services/tmdbService';
import { soundManager } from '../../utils/audio';

interface MoviesSectionProps {
  movies: MovieItem[];
  tvSeries: TvSeries[];
  actors: ActorItem[];
  catalogSyncError: string | null;
  collections: MovieCollection[];
  pins: MemoryPin[];
  settings: AppSettings;
  activeProfile: 'Savero' | 'Soffie';
  movieNightPlan?: MovieNightPlan | null;
  onSaveMovieNightPlan?: (plan: MovieNightPlan | null) => void;
  onNavigateToHome?: () => void;
  onAddMovie: (movie: MovieItem) => Promise<void>;
  onUpdateMovie: (movie: MovieItem) => Promise<void>;
  onRemoveMovie: (movie: MovieItem) => Promise<void>;
  onAddTvSeries: (series: TvSeries) => Promise<void>;
  onUpdateTvSeries: (series: TvSeries) => Promise<void>;
  onRemoveTvSeries: (series: TvSeries) => Promise<void>;
  onUpdateActor: (actor: ActorItem) => Promise<void>;
  onAddActor: (actor: ActorItem) => Promise<void>;
  onToggleActorLike: (actorId: string, likedBy: 'Savero' | 'Soffie' | 'Berdua') => Promise<void>;
}

export const MoviesSection: React.FC<MoviesSectionProps> = ({
  movies,
  tvSeries,
  actors,
  catalogSyncError,
  collections,
  activeProfile,
  movieNightPlan,
  onSaveMovieNightPlan,
  onNavigateToHome,
  onAddMovie,
  onRemoveMovie,
  onAddTvSeries,
  onUpdateTvSeries,
  onRemoveTvSeries,
  onUpdateMovie,
  onUpdateActor,
  onAddActor,
  onToggleActorLike
}) => {
  const [activeTab, setActiveTab] = useState<'film' | 'serial' | 'aktor' | 'koleksi' | 'planner'>('film');
  const [movieFilter, setMovieFilter] = useState<'all' | 'together' | 'savero' | 'soffie' | 'separate' | 'watchlist'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);

  const hasTmdbKey = Boolean(getTmdbApiKey());
  const allTmdbMetadataReady = movies.every((movie) => movie.tmdbMetadataFetched)
    && actors.every((actor) => actor.tmdbMetadataFetched)
    && tvSeries.every((series) => series.tmdbMetadataFetched);
  const hydrationStarted = useRef(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogType, setCatalogType] = useState<'movie' | 'tv' | 'person'>('movie');
  const [catalogResults, setCatalogResults] = useState<TmdbSearchResult[]>([]);
  const [catalogKind, setCatalogKind] = useState<'movie' | 'tv' | 'person' | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [addingCatalogId, setAddingCatalogId] = useState<number | null>(null);
  const catalogSearchRequest = useRef(0);
  const [selectedCatalogResult, setSelectedCatalogResult] = useState<{ kind: 'movie' | 'tv' | 'person'; result: TmdbSearchResult } | null>(null);
  const [selectedCatalogDetails, setSelectedCatalogDetails] = useState<MovieItem | TvSeries | ActorItem | null>(null);
  const [catalogDetailsLoading, setCatalogDetailsLoading] = useState(false);
  const [catalogActionError, setCatalogActionError] = useState('');
  const [removingWishlistId, setRemovingWishlistId] = useState<number | null>(null);
  const [wishlistActionError, setWishlistActionError] = useState('');
  const [metadataSyncState, setMetadataSyncState] = useState<'loading' | 'ready' | 'missing-key' | 'error'>(
    hasTmdbKey ? (allTmdbMetadataReady ? 'ready' : 'loading') : 'missing-key'
  );

  useEffect(() => {
    if (!hasTmdbKey) {
      setMetadataSyncState('missing-key');
      return;
    }
    if (!movies.length && !actors.length && !tvSeries.length) {
      setMetadataSyncState('ready');
      return;
    }
    if (allTmdbMetadataReady) {
      setMetadataSyncState('ready');
      hydrationStarted.current = true;
      return;
    }
    if (hydrationStarted.current) return;
    hydrationStarted.current = true;
    const refreshMetadata = async () => {
      let metadataLoadFailed = false;
      const [movieMetadata, actorMetadata, seriesMetadata] = await Promise.all([
        Promise.all(movies.map(async (movie) => {
          if (movie.tmdbMetadataFetched) return movie;
          try {
            const metadata = movie.tmdbId
              ? await getMovieFromTmdb(movie.tmdbId)
              : await getMovieByTitle(movie.title);
            if (!metadata) metadataLoadFailed = true;
            return metadata
              ? { ...movie, ...metadata, tmdbMetadataFetched: true, status: movie.status }
              : { ...movie, posterUrl: '', backdropUrl: undefined, genres: [], overview: '', tmdbRating: undefined, durationMinutes: undefined, cast: [], trailerUrl: undefined };
          } catch (error) {
            metadataLoadFailed = true;
            console.warn(`TMDB gagal memuat film: ${movie.title}`, error);
            return { ...movie, posterUrl: '', backdropUrl: undefined, genres: [], overview: '', tmdbRating: undefined, durationMinutes: undefined, cast: [], trailerUrl: undefined };
          }
        })),
        Promise.all(actors.map(async (actor) => {
          if (actor.tmdbMetadataFetched) return actor;
          try {
            const metadata = actor.tmdbId
              ? await getPersonFromTmdb(actor.tmdbId)
              : await getPersonByName(actor.name);
            if (!metadata) metadataLoadFailed = true;
            return metadata
              ? { ...actor, ...metadata, tmdbMetadataFetched: true, likedBy: actor.likedBy }
              : { ...actor, photoUrl: '', birthDate: undefined, birthPlace: undefined, biography: '', topMovies: [] };
          } catch (error) {
            metadataLoadFailed = true;
            console.warn(`TMDB gagal memuat aktor: ${actor.name}`, error);
            return { ...actor, photoUrl: '', birthDate: undefined, birthPlace: undefined, biography: '', topMovies: [] };
          }
        })),
        Promise.all(tvSeries.map(async (series) => {
          if (series.tmdbMetadataFetched) return series;
          try {
            const metadata = series.tmdbId
              ? await getTvFromTmdb(series.tmdbId)
              : await getTvByTitle(series.title);
            if (!metadata) metadataLoadFailed = true;
            return metadata
              ? { ...series, ...metadata, tmdbMetadataFetched: true, watchedEpisodes: Math.min(series.watchedEpisodes, metadata.totalEpisodes ?? series.totalEpisodes), status: series.status, notes: series.notes }
              : { ...series, posterUrl: '', overview: '', totalSeasons: 0, totalEpisodes: 0, genres: [], tmdbRating: undefined, cast: [] };
          } catch (error) {
            metadataLoadFailed = true;
            console.warn(`TMDB gagal memuat serial: ${series.title}`, error);
            return { ...series, posterUrl: '', overview: '', totalSeasons: 0, totalEpisodes: 0, genres: [], tmdbRating: undefined, cast: [] };
          }
        }))
      ]);

      movieMetadata.forEach((movie, index) => {
        if (JSON.stringify(movie) !== JSON.stringify(movies[index])) void onUpdateMovie(movie);
      });
      actorMetadata.forEach((actor, index) => {
        if (JSON.stringify(actor) !== JSON.stringify(actors[index])) void onUpdateActor(actor);
      });
      seriesMetadata.forEach((series, index) => {
        if (JSON.stringify(series) !== JSON.stringify(tvSeries[index])) void onUpdateTvSeries(series);
      });
      setMetadataSyncState(metadataLoadFailed ? 'error' : 'ready');
    };

    void refreshMetadata().catch((error) => {
      console.error('TMDB metadata sync failed:', error);
      setMetadataSyncState('error');
    });
  }, [hasTmdbKey, allTmdbMetadataReady]);

  const handleCatalogSearch = async (kind: 'movie' | 'tv' | 'person') => {
    soundManager.playTap();
    const query = catalogQuery.trim();
    if (!query) {
      catalogSearchRequest.current += 1;
      setCatalogResults([]);
      setCatalogKind(null);
      setCatalogError(kind === 'movie' ? 'Masukkan judul film untuk mencari di TMDB.' : kind === 'tv' ? 'Masukkan judul serial untuk mencari di TMDB.' : 'Masukkan nama aktor untuk mencari di TMDB.');
      return;
    }
    if (!hasTmdbKey) {
      setCatalogError('TMDB API key belum dikonfigurasi. Tambahkan VITE_TMDB_API_KEY di .env lalu mulai ulang aplikasi.');
      return;
    }
    setCatalogLoading(true);
    setCatalogError('');
    setCatalogKind(kind);
    setCatalogResults([]);
    const requestId = ++catalogSearchRequest.current;
    try {
      const results = await searchTmdb(kind, query);
      if (requestId !== catalogSearchRequest.current) return;
      setCatalogResults(results);
      if (!results.length) setCatalogError('Tidak ditemukan di TMDB.');
    } catch (error) {
      if (requestId !== catalogSearchRequest.current) return;
      console.error('Catalog search failed:', error);
      setCatalogError(error instanceof Error ? `Pencarian TMDB gagal: ${error.message}` : 'Pencarian TMDB gagal. Coba lagi sebentar.');
    } finally {
      if (requestId === catalogSearchRequest.current) setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (!catalogQuery.trim()) {
      catalogSearchRequest.current += 1;
      setCatalogResults([]);
      setCatalogKind(null);
      setCatalogError('');
      setCatalogLoading(false);
      return;
    }
    const timeout = window.setTimeout(() => void handleCatalogSearch(catalogType), 350);
    return () => window.clearTimeout(timeout);
  }, [catalogQuery, catalogType, hasTmdbKey]);

  const openCatalogResult = async (kind: 'movie' | 'tv' | 'person', result: TmdbSearchResult) => {
    soundManager.playTap();
    setSelectedCatalogResult({ kind, result });
    setSelectedCatalogDetails(null);
    setCatalogDetailsLoading(true);
    setCatalogActionError('');
    try {
      const details = kind === 'movie'
        ? { ...mapMovieSearchResult(result), ...await getMovieFromTmdb(result.id) }
        : kind === 'tv'
          ? { ...mapTvSearchResult(result), ...await getTvFromTmdb(result.id) }
          : { ...mapPersonSearchResult(result), ...await getPersonFromTmdb(result.id) };
      setSelectedCatalogDetails(details);
    } catch (error) {
      console.error('Could not load TMDB details:', error);
      setCatalogActionError(error instanceof Error ? error.message : 'Detail dari TMDB gagal dimuat.');
    } finally {
      setCatalogDetailsLoading(false);
    }
  };

  const saveSelectedCatalogResult = async () => {
    if (!selectedCatalogResult || !selectedCatalogDetails) return;
    const { kind, result } = selectedCatalogResult;
    setAddingCatalogId(result.id);
    setCatalogActionError('');
    try {
      if (kind === 'movie') {
        await onAddMovie({
          ...(selectedCatalogDetails as MovieItem),
          id: `tmdb-${result.id}`,
          tmdbId: result.id,
          status: 'watchlist',
          addedBy: activeProfile,
          tmdbMetadataFetched: true
        });
      } else if (kind === 'tv') {
        const details = selectedCatalogDetails as TvSeries;
        await onAddTvSeries({
          ...details,
          id: `series-tmdb-${result.id}`,
          tmdbId: result.id,
          watchedEpisodes: 0,
          status: 'watchlist',
          tmdbMetadataFetched: true
        });
      } else {
        await onAddActor({
          ...(selectedCatalogDetails as ActorItem),
          id: `actor-tmdb-${result.id}`,
          tmdbId: result.id,
          likedBy: activeProfile,
          tmdbMetadataFetched: true
        });
      }
      soundManager.playSuccess();
      setSelectedCatalogResult(null);
      setSelectedCatalogDetails(null);
    } catch (error) {
      setCatalogActionError(error instanceof Error ? error.message : 'Item gagal ditambahkan ke daftar bersama.');
    } finally {
      setAddingCatalogId(null);
    }
  };

  // Dynamic default date (e.g. today at 20:00) without hardcoded dates
  const getDynamicDefaultDate = () => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T20:00`;
  };

  // Movie Night Planner State - Fully dynamic from Supabase / Props
  const [plannedMovieId, setPlannedMovieId] = useState<string>(
    movieNightPlan?.movieId || movies[0]?.id || ''
  );
  const [plannedDate, setPlannedDate] = useState<string>(
    movieNightPlan?.scheduledAt || getDynamicDefaultDate()
  );
  const [plannedSnack, setPlannedSnack] = useState<string>(
    movieNightPlan?.snacks || ''
  );
  const [plannedDrink, setPlannedDrink] = useState<string>(
    movieNightPlan?.drinks || ''
  );
  const [plannedBy, setPlannedBy] = useState<'Savero' | 'Soffie' | 'Berdua'>(
    movieNightPlan?.plannedBy || activeProfile || 'Berdua'
  );
  const [confirmNotice, setConfirmNotice] = useState<string | null>(null);

  useEffect(() => {
    if (movieNightPlan) {
      if (movieNightPlan.movieId) setPlannedMovieId(movieNightPlan.movieId);
      if (movieNightPlan.scheduledAt) setPlannedDate(movieNightPlan.scheduledAt);
      if (movieNightPlan.snacks) setPlannedSnack(movieNightPlan.snacks);
      if (movieNightPlan.drinks) setPlannedDrink(movieNightPlan.drinks);
      if (movieNightPlan.plannedBy) setPlannedBy(movieNightPlan.plannedBy);
    }
  }, [movieNightPlan]);

  const plannedMovie = movies.find((movie) => movie.id === plannedMovieId) ?? movies[0];

  const handleConfirmPlan = () => {
    const targetMovie = movies.find((m) => m.id === plannedMovieId) ?? movies[0];
    const newPlan: MovieNightPlan = {
      id: movieNightPlan?.id || `mnp-${Date.now()}`,
      movieId: targetMovie?.id || '',
      movieTitle: targetMovie?.title || 'Film Kencan',
      posterUrl: targetMovie?.posterUrl,
      scheduledAt: plannedDate,
      snacks: plannedSnack,
      drinks: plannedDrink,
      plannedBy: plannedBy,
      confirmedBySavero: true,
      confirmedBySoffie: true,
      status: 'confirmed',
      createdAt: movieNightPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    soundManager.playSuccess();
    onSaveMovieNightPlan?.(newPlan);
    setConfirmNotice('🎉 Jadwal kencan nonton berhasil dikonfirmasi! Hasilnya sekarang terlihat di Beranda.');
    setTimeout(() => setConfirmNotice(null), 7000);
  };

  const handleCancelPlan = () => {
    soundManager.playPop();
    onSaveMovieNightPlan?.(null);
    setConfirmNotice('Jadwal kencan nonton telah dibatalkan.');
    setTimeout(() => setConfirmNotice(null), 3500);
  };

  const filteredMovies = useMemo(() => {
    return movies
      .filter((m) => {
        if (movieFilter === 'all') return true;
        return m.status === movieFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'rating') {
          const aRate = Math.max(a.ratingSavero || 0, a.ratingSoffie || 0, a.tmdbRating || 0);
          const bRate = Math.max(b.ratingSavero || 0, b.ratingSoffie || 0, b.tmdbRating || 0);
          return bRate - aRate;
        }
        return (b.watchedDate || '0').localeCompare(a.watchedDate || '0');
      });
  }, [movies, movieFilter, sortBy]);

  const selectedResult = selectedCatalogResult?.result;
  const selectedIsMovie = selectedCatalogResult?.kind === 'movie';
  const selectedIsTv = selectedCatalogResult?.kind === 'tv';
  const selectedTitle = selectedCatalogDetails
    ? 'title' in selectedCatalogDetails ? selectedCatalogDetails.title : selectedCatalogDetails.name
    : selectedResult?.title || selectedResult?.name || '';
  const selectedPoster = selectedCatalogDetails
    ? 'posterUrl' in selectedCatalogDetails ? selectedCatalogDetails.posterUrl : selectedCatalogDetails.photoUrl
    : selectedIsMovie ? selectedResult?.poster_path ? `https://image.tmdb.org/t/p/w500${selectedResult.poster_path}` : ''
      : selectedIsTv ? selectedResult?.poster_path ? `https://image.tmdb.org/t/p/w500${selectedResult.poster_path}` : ''
        : selectedResult?.profile_path ? `https://image.tmdb.org/t/p/w500${selectedResult.profile_path}` : '';
  const selectedOverview = selectedCatalogDetails && 'overview' in selectedCatalogDetails
    ? selectedCatalogDetails.overview
    : selectedCatalogDetails && 'biography' in selectedCatalogDetails ? selectedCatalogDetails.biography : '';
  const selectedGenres = selectedCatalogDetails && 'genres' in selectedCatalogDetails ? selectedCatalogDetails.genres : [];
  const selectedCast = selectedCatalogDetails && 'cast' in selectedCatalogDetails ? selectedCatalogDetails.cast : [];
  const selectedCredits = selectedCatalogDetails && 'topMovies' in selectedCatalogDetails ? selectedCatalogDetails.topMovies ?? [] : [];
  const savedSelectedMovie = selectedResult && selectedIsMovie ? movies.find((item) => item.tmdbId === selectedResult.id) : undefined;
  const savedSelectedSeries = selectedResult && selectedIsTv ? tvSeries.find((item) => item.tmdbId === selectedResult.id) : undefined;
  const selectedAlreadySaved = Boolean(savedSelectedMovie || savedSelectedSeries || (selectedResult && selectedCatalogResult?.kind === 'person' && actors.some((item) => item.tmdbId === selectedResult.id)));
  const selectedInWishlist = savedSelectedMovie?.status === 'watchlist' || savedSelectedSeries?.status === 'watchlist';

  return (
    <section id="film-aktor" className="min-h-[70vh] bg-[#fffaf0] px-3.5 py-5 transition-colors dark:bg-[#21151a] sm:px-5 sm:py-9">
      <div className="mx-auto max-w-5xl">
        {/* COMPACT HEADER WITH CHIBI & 3D CLAY TABS */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/80 px-2.5 py-0.5 text-[9.5px] font-bold tracking-[0.16em] uppercase text-[#b84661] shadow-2xs backdrop-blur-xs dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <Film className="h-3 w-3" />
                <span>SINEMA & FILMOGRAFI</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-[#4a1623] dark:text-rose-50 sm:text-3xl">
                Film & Movie Night
              </h2>
              <p className="text-xs text-[#8c5a67] dark:text-rose-300/80 sm:text-sm">
                Koleksi film, serial favorit, dan rencana kencan nonton kita berdua 🎬🍿
              </p>
            </div>
            <div className="shrink-0">
              <img
                src="/characters/berdua/Cozy Chibi Cinema Date.png"
                alt="Cozy Chibi Cinema Date"
                className="h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          </div>

          <div className="clay-pill-dock-3d grid grid-cols-5 gap-0.5 sm:gap-1 rounded-full p-1 w-full max-w-md">
            {[
              { id: 'film', label: 'Film', count: movies.length },
              { id: 'serial', label: 'Serial', count: tvSeries.length },
              { id: 'aktor', label: 'Aktor', count: actors.length },
              { id: 'koleksi', label: 'Koleksi', count: collections.length },
              { id: 'planner', label: 'Nonton' }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center justify-center gap-0.5 rounded-full py-1 sm:py-1.5 px-1 sm:px-2 text-[9.5px] sm:text-[10.5px] font-extrabold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-xs'
                      : 'text-[#753546] hover:text-[#4a1623] dark:text-rose-200/80'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  {tab.count !== undefined && <span className="text-[8.5px] opacity-80">({tab.count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {metadataSyncState === 'missing-key' && (
          <p className="mb-3 rounded-2xl bg-amber-100/70 px-3.5 py-2 text-[10.5px] font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            TMDB API key belum dikonfigurasi. Tambahkan <code>VITE_TMDB_API_KEY</code> ke file <code>.env</code> agar poster & sinopsis aktif.
          </p>
        )}
        {catalogSyncError && (
          <p className="mb-3 rounded-2xl bg-rose-100/70 px-3.5 py-2 text-[10.5px] font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            Sinkronisasi katalog gagal: {catalogSyncError}
          </p>
        )}

        {/* COMPACT & CLEAN TMDB SEARCH HUB */}
        <div className="clay-card-3d mb-3 rounded-2xl p-2.5 sm:p-3">
          <div className="mb-2 flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white shadow-2xs">
                <Clapperboard className="h-3 w-3" />
              </span>
              <h3 className="text-xs font-black text-[#4a1623] dark:text-rose-50">
                Cari TMDB
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                {catalogLoading ? 'Mencari...' : 'Aktif'}
              </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'movie', label: 'Film', icon: Film },
                { id: 'tv', label: 'Serial', icon: Tv },
                { id: 'person', label: 'Aktor', icon: Users }
              ].map((type) => {
                const active = catalogType === type.id;
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setCatalogType(type.id as any);
                      setCatalogResults([]);
                      setCatalogKind(null);
                      setCatalogError('');
                    }}
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-extrabold transition-all active:scale-95 ${
                      active
                        ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs'
                        : 'clay-subcard-3d text-[#6e2438] dark:text-rose-100'
                    }`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              void handleCatalogSearch(catalogType);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-rose-400" />
            <input
              type="text"
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder={`Cari judul ${catalogType === 'person' ? 'aktor' : catalogType === 'tv' ? 'serial' : 'film'}...`}
              className="h-8 w-full rounded-full border border-rose-200/80 bg-white/90 py-1 pl-8 pr-7 text-[10.5px] font-bold text-[#4a1623] shadow-inner placeholder:text-[#8c4f60]/55 focus:border-rose-400 focus:outline-none dark:border-white/10 dark:bg-black/30 dark:text-rose-50 dark:placeholder:text-rose-200/40"
            />
            {catalogQuery && (
              <button
                type="button"
                onClick={() => setCatalogQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600 text-xs"
              >
                ✕
              </button>
            )}
          </form>

          {catalogError && <p className="mt-1.5 text-[10.5px] font-bold text-red-600 dark:text-red-300">{catalogError}</p>}
          {wishlistActionError && <p className="mt-1.5 text-[10.5px] font-bold text-red-600 dark:text-red-300">{wishlistActionError}</p>}

          {catalogKind && catalogResults.length > 0 && (
            <div className="mt-2.5 border-t border-rose-200/40 pt-2.5 dark:border-white/10">
              <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase text-[#8c4f60] dark:text-rose-300">
                <span>Hasil TMDB ({catalogResults.length})</span>
                <button type="button" onClick={() => setCatalogResults([])} className="hover:underline">Tutup</button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {catalogResults.map((result) => {
                  const isMovie = catalogKind === 'movie';
                  const isTv = catalogKind === 'tv';
                  const movie = isMovie ? mapMovieSearchResult(result) : null;
                  const series = isTv ? mapTvSearchResult(result) : null;
                  const person = !isMovie && !isTv ? mapPersonSearchResult(result) : null;
                  const title = movie?.title ?? series?.title ?? person?.name ?? '';
                  const image = movie?.posterUrl ?? series?.posterUrl ?? person?.photoUrl ?? '';
                  const year = movie?.year ?? (result.first_air_date ? Number(result.first_air_date.slice(0, 4)) : undefined);

                  return (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => void openCatalogResult(catalogKind, result)}
                      className="clay-subcard-3d group relative flex flex-col overflow-hidden rounded-2xl p-1.5 text-left transition hover:scale-102"
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-black/10">
                        {image ? (
                          <ManagedImage src={image} alt={title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center p-1 text-[9px] text-gray-400">No Image</div>
                        )}
                      </div>
                      <div className="p-1">
                        <p className="line-clamp-1 text-[10px] font-black text-[#4a1623] dark:text-rose-50">{title}</p>
                        {year && <span className="text-[8.5px] text-gray-500">{year}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* TMDB ITEM DETAILS MODAL */}
        <AnimatePresence>
          {selectedCatalogResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-md"
              onClick={() => setSelectedCatalogResult(null)}
            >
              <motion.div
                initial={{ scale: 0.92, y: 18 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 18 }}
                onClick={(e) => e.stopPropagation()}
                className="clay-card-3d relative my-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[2.4rem] p-5 text-left shadow-2xl scrollbar-none"
              >
                <CloseButton onClick={() => setSelectedCatalogResult(null)} className="absolute right-3.5 top-3.5 z-20" />

                <div className="flex flex-col gap-3.5 sm:flex-row">
                  <div className="mx-auto h-48 w-32 shrink-0 overflow-hidden rounded-2xl bg-black/10 shadow-md sm:mx-0">
                    {selectedPoster ? <ManagedImage src={selectedPoster} alt={selectedTitle} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center p-2 text-xs">No Poster</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-600 dark:bg-rose-400/20 dark:text-rose-300">
                      TMDB Verified
                    </span>
                    <h3 className="mt-1 text-base font-black text-[#4a1623] dark:text-rose-50 sm:text-lg">{selectedTitle}</h3>
                    {catalogDetailsLoading && <p className="text-[10.5px] text-rose-400">Memuat detail...</p>}
                    {selectedCatalogDetails && 'year' in selectedCatalogDetails && (
                      <p className="text-[10.5px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                        {selectedCatalogDetails.year} {selectedCatalogDetails.tmdbRating ? `• ⭐ ${selectedCatalogDetails.tmdbRating.toFixed(1)}` : ''}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-4 text-[11px] font-medium leading-relaxed text-[#5c2432] dark:text-rose-100/85">
                      {selectedOverview || 'Sinopsis belum tersedia.'}
                    </p>
                  </div>
                </div>

                {catalogActionError && <p className="mt-3 text-[11px] font-bold text-red-600">{catalogActionError}</p>}

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-rose-200/50 pt-3 dark:border-white/10">
                  {selectedInWishlist && (savedSelectedMovie || savedSelectedSeries) ? (
                    <button
                      type="button"
                      disabled={addingCatalogId === selectedCatalogResult.result.id}
                      onClick={async () => {
                        setAddingCatalogId(selectedCatalogResult.result.id);
                        try {
                          if (savedSelectedMovie) await onRemoveMovie(savedSelectedMovie);
                          else if (savedSelectedSeries) await onRemoveTvSeries(savedSelectedSeries);
                          setSelectedCatalogResult(null);
                        } catch (err) {
                          setCatalogActionError(err instanceof Error ? err.message : 'Gagal menghapus');
                        } finally {
                          setAddingCatalogId(null);
                        }
                      }}
                      className="rounded-full bg-red-600 px-4 py-2 text-xs font-extrabold text-white shadow-md"
                    >
                      Hapus dari Wishlist
                    </button>
                  ) : selectedAlreadySaved ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Sudah ada di koleksi</span>
                  ) : (
                    <button
                      type="button"
                      disabled={catalogDetailsLoading || addingCatalogId === selectedCatalogResult.result.id}
                      onClick={() => void saveSelectedCatalogResult()}
                      className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] px-5 py-2 text-xs font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.75]" />
                      <span>{addingCatalogId ? 'Menyimpan...' : 'Tambah ke Wishlist'}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: FILM LIST (Compact Mobile Grid) */}
        {activeTab === 'film' && (
          <div className="space-y-3">
            {/* Filter & Sort Bar */}
            <div className="clay-subcard-3d flex items-center justify-between gap-1.5 rounded-full p-1.5 shadow-2xs">
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'together', label: 'Berdua' },
                  { id: 'savero', label: 'Savero' },
                  { id: 'soffie', label: 'Soffie' },
                  { id: 'watchlist', label: 'Watchlist' }
                ].map((f) => {
                  const active = movieFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setMovieFilter(f.id as any);
                      }}
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition-all active:scale-95 ${
                        active
                          ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs'
                          : 'bg-rose-500/10 text-[#6e2438] hover:bg-rose-500/15 dark:bg-white/5 dark:text-rose-100'
                      }`}
                    >
                      {f.id === 'together' && (
                        <div className="flex items-center -space-x-1.5">
                          <img
                            src="/characters/expressions/savero/bahagia.png"
                            alt=""
                            className="h-3.5 w-3.5 rounded-full object-cover object-top scale-125"
                          />
                          <img
                            src="/characters/expressions/soffie/gemas-sayang.png"
                            alt=""
                            className="h-3.5 w-3.5 rounded-full object-cover object-top scale-125"
                          />
                        </div>
                      )}
                      {f.id === 'savero' && (
                        <img
                          src="/characters/expressions/savero/bahagia.png"
                          alt="Savero"
                          className="h-3.5 w-3.5 rounded-full object-cover object-top scale-125"
                        />
                      )}
                      {f.id === 'soffie' && (
                        <img
                          src="/characters/expressions/soffie/gemas-sayang.png"
                          alt="Soffie"
                          className="h-3.5 w-3.5 rounded-full object-cover object-top scale-125"
                        />
                      )}
                      {f.id === 'watchlist' && <Bookmark className="h-2.5 w-2.5 fill-current" />}
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sort Pill with ListFilter icon */}
              <div className="flex items-center gap-1 rounded-full bg-white/80 dark:bg-white/10 px-2 py-0.5 text-[9.5px] font-extrabold text-[#7a3444] dark:text-rose-200 shrink-0 shadow-2xs">
                <ListFilter className="h-2.5 w-2.5 text-rose-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-extrabold text-[#4a1623] focus:outline-none dark:text-rose-50 cursor-pointer text-[9.5px]"
                >
                  <option value="date" className="dark:bg-[#2b0c16]">Tanggal</option>
                  <option value="rating" className="dark:bg-[#2b0c16]">Rating</option>
                  <option value="title" className="dark:bg-[#2b0c16]">Judul</option>
                </select>
              </div>
            </div>

            {/* Poster Grid (2 cols mobile, 4-6 cols desktop) */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-3.5">
              {filteredMovies.map((movie) => {
                const isTogether = movie.status === 'together';
                const isSavero = movie.status === 'savero';
                const isSoffie = movie.status === 'soffie';

                return (
                  <div
                    key={movie.id}
                    onClick={() => {
                      soundManager.playTap();
                      setSelectedMovie(movie);
                    }}
                    className="clay-card-3d group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[1.4rem] p-2 transition-all duration-300 hover:-translate-y-1 shadow-2xs hover:shadow-md"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[1.1rem] bg-black/10 shadow-inner">
                      {movie.posterUrl ? (
                        <ManagedImage
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-gray-400">No Poster</div>
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />

                      {/* Top Status badges: Chibi Head / Avatars */}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                        {isTogether && (
                          <div className="flex items-center -space-x-1.5 drop-shadow-md" title="Ditonton Berdua">
                            <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-amber-50 shadow-xs dark:border-[#200508]">
                              <img
                                src="/characters/expressions/savero/bahagia.png"
                                alt="Savero"
                                className="h-full w-full object-cover object-top scale-125"
                              />
                            </div>
                            <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-rose-50 shadow-xs dark:border-[#200508]">
                              <img
                                src="/characters/expressions/soffie/gemas-sayang.png"
                                alt="Soffie"
                                className="h-full w-full object-cover object-top scale-125"
                              />
                            </div>
                          </div>
                        )}
                        {isSavero && (
                          <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-emerald-50 shadow-md dark:border-[#200508]" title="Ditonton Savero">
                            <img
                              src="/characters/expressions/savero/bahagia.png"
                              alt="Savero"
                              className="h-full w-full object-cover object-top scale-125"
                            />
                          </div>
                        )}
                        {isSoffie && (
                          <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-rose-50 shadow-md dark:border-[#200508]" title="Ditonton Soffie">
                            <img
                              src="/characters/expressions/soffie/gemas-sayang.png"
                              alt="Soffie"
                              className="h-full w-full object-cover object-top scale-125"
                            />
                          </div>
                        )}
                        {movie.status === 'watchlist' && (
                          <span className="flex h-5 items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 text-[7.5px] font-black uppercase text-white shadow-xs">
                            <Bookmark className="h-2 w-2 fill-current" />
                            <span>Wishlist</span>
                          </span>
                        )}
                      </div>

                      {movie.tmdbRating && (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[8.5px] font-black text-amber-300 backdrop-blur-md shadow-xs">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          <span>{movie.tmdbRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-1 pt-1.5 text-left">
                      <h4 className="line-clamp-1 text-[11.5px] sm:text-xs font-black text-[#4a1623] group-hover:text-rose-600 dark:text-rose-50">
                        {movie.title}
                      </h4>
                      <div className="mt-0.5 flex items-center justify-between text-[9px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                        <span>{movie.year || 'Film'}</span>
                        {movie.addedBy && (
                          <div className="flex items-center gap-1" title={`Ditambahkan oleh ${movie.addedBy}`}>
                            <div className="h-4 w-4 overflow-hidden rounded-full border border-white/80 bg-rose-50 shadow-2xs">
                              <img
                                src={
                                  movie.addedBy === 'Savero'
                                    ? '/characters/expressions/savero/bahagia.png'
                                    : '/characters/expressions/soffie/gemas-sayang.png'
                                }
                                alt={movie.addedBy}
                                className="h-full w-full object-cover object-top scale-125"
                              />
                            </div>
                            <span className="text-[8.5px] font-extrabold">{movie.addedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredMovies.length === 0 && (
              <div className="clay-card-3d rounded-[2rem] p-8 text-center">
                <Film className="mx-auto mb-2 h-8 w-8 text-rose-400" />
                <h4 className="text-sm font-black text-[#4a1623] dark:text-rose-50">Belum ada film</h4>
                <p className="mt-0.5 text-xs text-[#8c4f60] dark:text-rose-200/75">Cari judul film di atas untuk mulai menyimpannya.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SERIAL TV */}
        {activeTab === 'serial' && (
          <div className="space-y-3.5">
            {tvSeries.length === 0 ? (
              <div className="clay-card-3d rounded-[2rem] p-8 text-center">
                <Tv className="mx-auto mb-2 h-8 w-8 text-rose-400" />
                <h4 className="text-sm font-black text-[#4a1623] dark:text-rose-50">Belum ada serial TV</h4>
                <p className="mt-0.5 text-xs text-[#8c4f60] dark:text-rose-200/75">Cari serial TV di TMDB untuk melacak episodenya berdua.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tvSeries.map((series) => {
                  const pct = series.totalEpisodes ? Math.round((series.watchedEpisodes / series.totalEpisodes) * 100) : 0;
                  const isCompleted = series.watchedEpisodes >= series.totalEpisodes;

                  return (
                    <div key={series.id} className="clay-card-3d flex flex-col justify-between rounded-[1.8rem] p-4">
                      <div>
                        <div className="relative mb-3 h-36 w-full overflow-hidden rounded-[1.3rem] bg-black/10 shadow-inner">
                          {series.posterUrl ? <ManagedImage src={series.posterUrl} alt={series.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs">No Poster</div>}
                        </div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[9.5px] font-black uppercase text-rose-600 dark:text-rose-300">
                            {series.totalSeasons} Season • {series.totalEpisodes} Episode
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[8.5px] font-extrabold uppercase ${
                            series.status === 'watchlist'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : isCompleted
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {series.status === 'watchlist' ? 'Wishlist' : isCompleted ? 'Tamat' : 'Nonton'}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-[#4a1623] dark:text-rose-50">{series.title}</h4>
                        <p className="mt-1 line-clamp-2 text-[11px] font-medium text-[#6b3140] dark:text-rose-200/80">{series.overview}</p>

                        {series.status !== 'watchlist' && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[11px] font-extrabold text-[#4a1623] dark:text-rose-50">
                              <span>Ep {series.watchedEpisodes} dari {series.totalEpisodes}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-rose-200/60 dark:bg-white/10">
                              <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3.5 flex items-center gap-2 border-t border-rose-200/40 pt-2.5 dark:border-white/10">
                        {series.status === 'watchlist' ? (
                          <button
                            type="button"
                            onClick={() => void onUpdateTvSeries({ ...series, status: 'watching' })}
                            className="w-full rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] py-2 text-xs font-extrabold text-white shadow-xs"
                          >
                            Mulai Nonton Berdua
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => void onUpdateTvSeries({ ...series, watchedEpisodes: Math.max(0, series.watchedEpisodes - 1) })}
                              className="clay-subcard-3d rounded-full px-3 py-1.5 text-xs font-extrabold text-[#7a3444] dark:text-rose-200"
                            >
                              -1 Ep
                            </button>
                            <button
                              type="button"
                              onClick={() => void onUpdateTvSeries({ ...series, watchedEpisodes: Math.min(series.totalEpisodes, series.watchedEpisodes + 1) })}
                              className="flex-1 rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] py-1.5 text-xs font-extrabold text-white shadow-xs"
                            >
                              +1 Episode Selesai
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AKTOR */}
        {activeTab === 'aktor' && (
          <div className="space-y-3.5">
            {actors.length === 0 ? (
              <div className="clay-card-3d rounded-[2rem] p-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-rose-400" />
                <h4 className="text-sm font-black text-[#4a1623] dark:text-rose-50">Belum ada aktor</h4>
                <p className="mt-0.5 text-xs text-[#8c4f60] dark:text-rose-200/75">Cari aktor favorit di TMDB untuk menyimpannya.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {actors.map((actor) => (
                  <div key={actor.id} className="clay-card-3d flex flex-col justify-between rounded-[1.8rtm] p-3.5">
                    <div>
                      <div className="relative mb-2.5 aspect-[3/4] w-full overflow-hidden rounded-[1.3rem] bg-black/10 shadow-inner">
                        {actor.photoUrl ? <ManagedImage src={actor.photoUrl} alt={actor.name} className="h-full w-full object-cover object-top" /> : <div className="flex h-full items-center justify-center text-xs">No Photo</div>}
                      </div>
                      <h4 className="text-sm font-black text-[#4a1623] dark:text-rose-50">{actor.name}</h4>
                      <p className="mt-0.5 line-clamp-2 text-[10.5px] font-medium text-[#6b3140] dark:text-rose-200/80">{actor.biography || actor.birthPlace || 'Aktor'}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-rose-200/40 pt-2.5 dark:border-white/10">
                      <div className="flex items-center gap-1.5" title={`Disukai oleh ${actor.likedBy || 'Berdua'}`}>
                        {actor.likedBy === 'Berdua' ? (
                          <div className="flex items-center -space-x-1.5">
                            <div className="h-5 w-5 overflow-hidden rounded-full border border-white bg-amber-50 shadow-2xs dark:border-[#200508]">
                              <img src="/characters/expressions/savero/bahagia.png" alt="Savero" className="h-full w-full object-cover object-top scale-125" />
                            </div>
                            <div className="h-5 w-5 overflow-hidden rounded-full border border-white bg-rose-50 shadow-2xs dark:border-[#200508]">
                              <img src="/characters/expressions/soffie/gemas-sayang.png" alt="Soffie" className="h-full w-full object-cover object-top scale-125" />
                            </div>
                          </div>
                        ) : actor.likedBy === 'Savero' ? (
                          <div className="h-5 w-5 overflow-hidden rounded-full border border-white bg-emerald-50 shadow-2xs dark:border-[#200508]">
                            <img src="/characters/expressions/savero/bahagia.png" alt="Savero" className="h-full w-full object-cover object-top scale-125" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 overflow-hidden rounded-full border border-white bg-rose-50 shadow-2xs dark:border-[#200508]">
                            <img src="/characters/expressions/soffie/gemas-sayang.png" alt="Soffie" className="h-full w-full object-cover object-top scale-125" />
                          </div>
                        )}
                        <span className="text-[9.5px] font-black text-[#5c2432] dark:text-rose-100">{actor.likedBy || 'Berdua'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playPop();
                            const nextLikedBy = actor.likedBy === 'Berdua' ? 'Savero' : actor.likedBy === 'Savero' ? 'Soffie' : 'Berdua';
                            void onToggleActorLike(actor.id, nextLikedBy);
                          }}
                          className="flex h-6 items-center gap-1 rounded-full px-2 clay-subcard-3d text-rose-500 shadow-2xs hover:scale-105 active:scale-95 transition"
                          title="Klik untuk ganti siapa yang menyukai (Berdua / Savero / Soffie)"
                        >
                          <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                          <span className="text-[8.5px] font-extrabold">Ganti</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: KOLEKSI FRANCHISE */}
        {activeTab === 'koleksi' && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => {
              const total = col.movieTitles.length;
              const watched = col.movieTitles.filter((t) =>
                movies.some((m) => m.title.toLowerCase().includes(t.toLowerCase()) && m.status === 'together')
              ).length;
              const pct = Math.round((watched / total) * 100);

              return (
                <div key={col.id} className="clay-card-3d flex flex-col justify-between rounded-[1.8rem] p-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-300">Franchise</span>
                      {col.isTargetThisYear && (
                        <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[8.5px] font-black text-amber-950 uppercase">Target</span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-[#4a1623] dark:text-rose-50">{col.name}</h4>
                    <p className="mt-1 text-xs font-semibold text-[#8c4f60] dark:text-rose-200/80">{col.description}</p>

                    <div className="my-3 space-y-1">
                      <div className="flex justify-between text-[11px] font-extrabold text-[#4a1623] dark:text-rose-50">
                        <span>{watched} dari {total} film</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-rose-200/60 dark:bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <ul className="space-y-1 text-xs font-semibold text-[#6b3140] dark:text-rose-100/80">
                      {col.movieTitles.map((t, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-[9.5px] font-black text-rose-400">{idx + 1}.</span>
                          <span className="truncate">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert(`Target "${col.name}" tersimpan!`)}
                    className="mt-4 w-full rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] py-2 text-xs font-extrabold text-white shadow-xs"
                  >
                    Jadikan Target Tahun Ini
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 5: MOVIE NIGHT PLANNER */}
        {activeTab === 'planner' && (
          <div className="clay-card-3d mx-auto max-w-lg rounded-[2.2rem] p-5 sm:p-6 text-center">
            <span className="text-[9.5px] font-black tracking-[0.2em] uppercase text-rose-500 dark:text-rose-300">
              KENCAN BIOSKOP & RUMAH
            </span>
            <h3 className="mt-0.5 text-xl font-black text-[#4a1623] dark:text-rose-50">
              Movie Night Planner
            </h3>
            <p className="mt-0.5 mb-4 text-xs font-semibold text-[#8c4f60] dark:text-rose-200/80">
              Atur jadwal, camilan, dan minuman untuk kencan nonton berdua.
            </p>

            {/* Active Plan Indicator Badge */}
            {movieNightPlan && movieNightPlan.status === 'confirmed' && (
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-emerald-400/40 bg-emerald-50/70 p-2.5 text-left dark:border-emerald-500/20 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-2xs">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <span className="block text-[8.5px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                      JADWAL SAAT INI TERKONFIRMASI
                    </span>
                    <span className="block text-[11px] font-extrabold text-[#2a131b] dark:text-rose-100">
                      {movieNightPlan.movieTitle}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelPlan}
                  className="rounded-full bg-red-500/10 px-2.5 py-1 text-[9.5px] font-black text-red-600 hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-300 transition"
                >
                  Batalkan
                </button>
              </div>
            )}

            <div className="space-y-3.5 text-left text-xs">
              {/* Film Target */}
              <div>
                <label className="mb-1 block font-extrabold text-[#4a1623] dark:text-rose-100">Film Target</label>
                <select
                  value={plannedMovie?.id ?? ''}
                  onChange={(e) => setPlannedMovieId(e.target.value)}
                  className="w-full rounded-2xl border border-rose-200/80 bg-white px-3.5 py-2 font-bold text-[#4a1623] dark:border-white/15 dark:bg-[#1f070f] dark:text-rose-100 focus:outline-none focus:border-rose-400"
                >
                  {!movies.length && <option value="">Tambahkan film terlebih dahulu</option>}
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>

                {/* Target Movie Live Preview */}
                {plannedMovie && (
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-rose-200/50 bg-white/70 p-2 shadow-2xs dark:border-white/10 dark:bg-black/20">
                    <div className="h-16 w-11 shrink-0 overflow-hidden rounded-xl bg-black/10 shadow-xs">
                      {plannedMovie.posterUrl ? (
                        <ManagedImage src={plannedMovie.posterUrl} alt={plannedMovie.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[8px] text-gray-400">No Poster</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-[#4a1623] dark:text-rose-50">{plannedMovie.title}</p>
                      <p className="text-[10px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                        {plannedMovie.year || 'Film'} {plannedMovie.tmdbRating ? `• ⭐ ${plannedMovie.tmdbRating.toFixed(1)}` : ''}
                      </p>
                      {plannedMovie.overview && (
                        <p className="mt-0.5 line-clamp-2 text-[9.5px] text-[#6b3140] dark:text-rose-200/60 leading-tight">
                          {plannedMovie.overview}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Jadwal Tanggal & Waktu */}
              <div>
                <label className="mb-1 block font-extrabold text-[#4a1623] dark:text-rose-100">Jadwal Tanggal & Waktu</label>
                <input
                  type="datetime-local"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="w-full rounded-2xl border border-rose-200/80 bg-white px-3.5 py-2 font-bold text-[#4a1623] dark:border-white/15 dark:bg-[#1f070f] dark:text-rose-100 focus:outline-none focus:border-rose-400"
                />
                {/* Formatted Readable Date Helper */}
                {plannedDate && (
                  <p className="mt-1 text-[9.5px] font-bold text-[#8c4f60] dark:text-rose-200/70">
                    📅 {(() => {
                      try {
                        const d = new Date(plannedDate);
                        if (isNaN(d.getTime())) return plannedDate;
                        return new Intl.DateTimeFormat('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(d) + ' WIB';
                      } catch {
                        return plannedDate;
                      }
                    })()}
                  </p>
                )}
              </div>

              {/* Camilan & Minuman */}
              <div>
                <label className="mb-1 block font-extrabold text-[#4a1623] dark:text-rose-100">Camilan & Minuman</label>
                <input
                  type="text"
                  value={plannedSnack}
                  onChange={(e) => setPlannedSnack(e.target.value)}
                  placeholder="Popcorn & Matcha Latte"
                  className="w-full rounded-2xl border border-rose-200/80 bg-white px-3.5 py-2 font-bold text-[#4a1623] dark:border-rose-200/15 dark:bg-[#1f070f] dark:text-rose-100 focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Direncanakan Oleh (Chibi Selection) */}
              <div>
                <label className="mb-1.5 block font-extrabold text-[#4a1623] dark:text-rose-100">Direncanakan Oleh</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Berdua', label: 'Berdua' },
                    { id: 'Savero', label: 'Savero' },
                    { id: 'Soffie', label: 'Soffie' }
                  ].map((p) => {
                    const active = plannedBy === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          soundManager.playTap();
                          setPlannedBy(p.id as any);
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl p-2 font-extrabold text-[10.5px] transition-all active:scale-95 border ${
                          active
                            ? 'bg-rose-500/15 border-rose-400 text-rose-600 dark:bg-rose-500/25 dark:text-rose-300'
                            : 'border-rose-200/50 bg-white/60 text-[#6e2438] hover:bg-rose-50 dark:border-white/10 dark:bg-white/5 dark:text-rose-200'
                        }`}
                      >
                        {p.id === 'Berdua' && (
                          <div className="flex items-center -space-x-1.5">
                            <div className="h-4.5 w-4.5 overflow-hidden rounded-full border border-white bg-amber-50 shadow-2xs">
                              <img src="/characters/expressions/savero/bahagia.png" alt="" className="h-full w-full object-cover object-top scale-125" />
                            </div>
                            <div className="h-4.5 w-4.5 overflow-hidden rounded-full border border-white bg-rose-50 shadow-2xs">
                              <img src="/characters/expressions/soffie/gemas-sayang.png" alt="" className="h-full w-full object-cover object-top scale-125" />
                            </div>
                          </div>
                        )}
                        {p.id === 'Savero' && (
                          <div className="h-4.5 w-4.5 overflow-hidden rounded-full border border-white bg-emerald-50 shadow-2xs">
                            <img src="/characters/expressions/savero/bahagia.png" alt="Savero" className="h-full w-full object-cover object-top scale-125" />
                          </div>
                        )}
                        {p.id === 'Soffie' && (
                          <div className="h-4.5 w-4.5 overflow-hidden rounded-full border border-white bg-rose-50 shadow-2xs">
                            <img src="/characters/expressions/soffie/gemas-sayang.png" alt="Soffie" className="h-full w-full object-cover object-top scale-125" />
                          </div>
                        )}
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TOMBOL KONFIRMASI JADWAL */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmPlan}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] py-3 text-xs font-black text-white shadow-md transition active:scale-95 hover:shadow-lg hover:from-[#ff4866] hover:to-[#c82759]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {movieNightPlan && movieNightPlan.status === 'confirmed'
                      ? 'Perbarui Konfirmasi Jadwal Kencan'
                      : 'Konfirmasi Jadwal Kencan Nonton'}
                  </span>
                </button>
              </div>

              {/* Feedback Alert Notice with link to Home */}
              {confirmNotice && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex flex-col items-center gap-2 rounded-2xl bg-emerald-500/15 p-3 text-center text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-500/30"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{confirmNotice}</span>
                  </div>
                  {onNavigateToHome && (
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        onNavigateToHome();
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1 text-[10.5px] font-black text-white shadow-2xs hover:bg-emerald-700 transition active:scale-95"
                    >
                      <span>Lihat Hasil di Beranda</span>
                      <span>→</span>
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* MOVIE DETAIL MODAL */}
        <AnimatePresence>
          {selectedMovie && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-md"
              onClick={() => setSelectedMovie(null)}
            >
              <motion.div
                initial={{ scale: 0.92, y: 18 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 18 }}
                onClick={(e) => e.stopPropagation()}
                className="clay-card-3d relative my-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[2.4rem] p-5 text-left shadow-2xl scrollbar-none"
              >
                <CloseButton onClick={() => setSelectedMovie(null)} className="absolute right-3.5 top-3.5 z-20" />

                <div className="flex flex-col gap-3.5 sm:flex-row">
                  <div className="mx-auto h-48 w-32 shrink-0 overflow-hidden rounded-2xl bg-black/10 shadow-md sm:mx-0">
                    {selectedMovie.posterUrl ? <ManagedImage src={selectedMovie.posterUrl} alt={selectedMovie.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs">No Poster</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-[#4a1623] dark:text-rose-50 sm:text-lg">{selectedMovie.title}</h3>
                    <p className="text-[10.5px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                      {selectedMovie.year || 'Film'} {selectedMovie.tmdbRating ? `• ⭐ ${selectedMovie.tmdbRating.toFixed(1)}` : ''}
                    </p>
                    <p className="mt-2 line-clamp-4 text-[11px] font-medium leading-relaxed text-[#5c2432] dark:text-rose-100/85">
                      {selectedMovie.overview || 'Sinopsis belum tersedia.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-xs border-t border-rose-200/50 pt-3 dark:border-white/10">
                  <div>
                    <label className="mb-1.5 block font-extrabold text-[#4a1623] dark:text-rose-100">Status Nonton</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { id: 'together', label: 'Berdua', isTogether: true },
                        { id: 'savero', label: 'Savero', isSavero: true },
                        { id: 'soffie', label: 'Soffie', isSoffie: true },
                        { id: 'watchlist', label: 'Wishlist', isWatchlist: true }
                      ].map((st) => {
                        const active = selectedMovie.status === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              soundManager.playTap();
                              setSelectedMovie({ ...selectedMovie, status: st.id as any });
                            }}
                            className={`flex items-center justify-center gap-1.5 rounded-xl p-2 font-extrabold text-[10.5px] transition-all active:scale-95 border ${
                              active
                                ? 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 border-rose-400 text-rose-600 dark:bg-rose-500/30 dark:text-rose-200'
                                : 'border-rose-200/50 bg-white/60 text-[#6e2438] hover:bg-rose-50 dark:border-white/10 dark:bg-white/5 dark:text-rose-200'
                            }`}
                          >
                            {st.isTogether && (
                              <div className="flex items-center -space-x-1.5">
                                <div className="h-4.5 w-4.5 overflow-hidden rounded-full border border-white bg-amber-50 shadow-2xs">
                                  <img src="/characters/expressions/savero/bahagia.png" alt="" className="h-full w-full object-cover object-top scale-125" />
                                </div>
                                <div className="h-4.5 w-4.5 overflow-hidden rounded-full border border-white bg-rose-50 shadow-2xs">
                                  <img src="/characters/expressions/soffie/gemas-sayang.png" alt="" className="h-full w-full object-cover object-top scale-125" />
                                </div>
                              </div>
                            )}
                            {st.isSavero && (
                              <div className="h-4.5 w-4.5 overflow-hidden rounded-full border border-white bg-emerald-50 shadow-2xs">
                                <img src="/characters/expressions/savero/bahagia.png" alt="Savero" className="h-full w-full object-cover object-top scale-125" />
                              </div>
                            )}
                            {st.isSoffie && (
                              <div className="h-4.5 w-4.5 overflow-hidden rounded-full border border-white bg-rose-50 shadow-2xs">
                                <img src="/characters/expressions/soffie/gemas-sayang.png" alt="Soffie" className="h-full w-full object-cover object-top scale-125" />
                              </div>
                            )}
                            {st.isWatchlist && <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />}
                            <span>{st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-rose-200/50 bg-rose-50/50 p-2.5 dark:border-white/10 dark:bg-white/5">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <div className="h-5 w-5 overflow-hidden rounded-full border border-emerald-400 bg-emerald-50 shadow-2xs">
                          <img src="/characters/expressions/savero/bahagia.png" alt="Savero" className="h-full w-full object-cover object-top scale-125" />
                        </div>
                        <span className="text-[10.5px] font-black text-[#4a1623] dark:text-rose-100">Rating Savero</span>
                      </div>
                      <HeartRating rating={selectedMovie.ratingSavero || 0} interactive size={16} onChange={(val) => setSelectedMovie({ ...selectedMovie, ratingSavero: val })} />
                    </div>

                    <div className="rounded-2xl border border-rose-200/50 bg-rose-50/50 p-2.5 dark:border-white/10 dark:bg-white/5">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <div className="h-5 w-5 overflow-hidden rounded-full border border-rose-400 bg-rose-50 shadow-2xs">
                          <img src="/characters/expressions/soffie/gemas-sayang.png" alt="Soffie" className="h-full w-full object-cover object-top scale-125" />
                        </div>
                        <span className="text-[10.5px] font-black text-[#4a1623] dark:text-rose-100">Rating Soffie</span>
                      </div>
                      <HeartRating rating={selectedMovie.ratingSoffie || 0} interactive size={16} onChange={(val) => setSelectedMovie({ ...selectedMovie, ratingSoffie: val })} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-extrabold">Catatan & Kesan Nonton</label>
                    <textarea
                      rows={2}
                      value={selectedMovie.notes || ''}
                      onChange={(e) => setSelectedMovie({ ...selectedMovie, notes: e.target.value })}
                      placeholder="Bagian paling seru..."
                      className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold text-[#4a1623] dark:border-white/15 dark:bg-[#1f070f] dark:text-rose-100"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-rose-200/50 pt-3 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedMovie(null)}
                    className="clay-subcard-3d rounded-full px-4 py-2 font-extrabold text-[#7a3444] dark:text-rose-200"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playSuccess();
                      void onUpdateMovie(selectedMovie);
                      setSelectedMovie(null);
                    }}
                    className="rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] px-5 py-2 font-extrabold text-white shadow-md active:scale-95"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};