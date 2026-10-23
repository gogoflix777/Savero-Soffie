import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ManagedImage } from '../common/ManagedImage';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
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
  ListFilter,
  CheckCircle,
  Bookmark,
  Trash2,
  Flame,
  Shuffle,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Check,
  Grid,
  LayoutGrid,
  Compass,
  Award,
  Popcorn,
  X
} from 'lucide-react';
import { CloseButton } from '../common/CloseButton';
import {
  MovieItem,
  MovieNightPlan,
  ActorItem,
  MovieCollection,
  TvSeries,
  MemoryPin,
  AppSettings
} from '../../types';
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

type DiscoverCategory = 'trending' | 'now_playing' | 'top_rated' | 'tv_popular' | 'person_popular';

interface TmdbExtraMediaInfo {
  youtubeKey: string | null;
  recommendations: TmdbSearchResult[];
  personCredits: TmdbSearchResult[];
  tagline?: string;
}

const SNACK_PRESETS = [
  '🍿 Popcorn Caramel & Matcha Latte',
  '🥟 Dimsum Hangat & Es Kopi Susu',
  '🍕 Pizza Melted & Lemon Tea',
  '🍜 Ramyeon Pedas & Susu Strawberry',
  '🍦 Ice Cream Sundae & Kentang Goreng'
];

// Helper pemanggil endpoint TMDB langsung (mendukung API Key v3 maupun Bearer Token v4)
async function fetchTmdbDirect<T = any>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const rawKey = getTmdbApiKey()?.trim();
  if (!rawKey) return null;

  const isBearer = rawKey.startsWith('eyJ');
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  if (!isBearer) {
    url.searchParams.set('api_key', rawKey);
  }
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: isBearer
      ? { Authorization: `Bearer ${rawKey}`, accept: 'application/json' }
      : { accept: 'application/json' }
  });

  if (!res.ok) return null;
  return (await res.json()) as T;
}

function extractYoutubeKey(urlOrKey?: string): string | null {
  if (!urlOrKey) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrKey)) return urlOrKey;
  const match = urlOrKey.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
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
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'film' | 'serial' | 'aktor' | 'koleksi' | 'planner'>('film');
  const [movieFilter, setMovieFilter] = useState<'all' | 'together' | 'savero' | 'soffie' | 'watchlist'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('Semua');
  const [localFilterQuery, setLocalFilterQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');
  const [compactGrid, setCompactGrid] = useState<boolean>(true); // 3 cols on mobile when compact

  // Modals for Saved Items
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<TvSeries | null>(null);
  const [selectedActor, setSelectedActor] = useState<ActorItem | null>(null);
  const [showInlineTrailer, setShowInlineTrailer] = useState<boolean>(false);

  // TMDB Search & Live Discovery States
  const hasTmdbKey = Boolean(getTmdbApiKey());
  const allTmdbMetadataReady =
    movies.every((movie) => movie.tmdbMetadataFetched) &&
    actors.every((actor) => actor.tmdbMetadataFetched) &&
    tvSeries.every((series) => series.tmdbMetadataFetched);
  const hydrationStarted = useRef(false);

  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogType, setCatalogType] = useState<'movie' | 'tv' | 'person'>('movie');
  const [catalogResults, setCatalogResults] = useState<TmdbSearchResult[]>([]);
  const [catalogKind, setCatalogKind] = useState<'movie' | 'tv' | 'person' | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [addingCatalogId, setAddingCatalogId] = useState<number | null>(null);
  const catalogSearchRequest = useRef(0);

  // TMDB Discover Feed States
  const [showDiscoverFeed, setShowDiscoverFeed] = useState<boolean>(true);
  const [discoverCategory, setDiscoverCategory] = useState<DiscoverCategory>('trending');
  const [discoverItems, setDiscoverItems] = useState<TmdbSearchResult[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState<boolean>(false);

  // TMDB Modal & Extra Details (Trailer, Similar, Credits)
  const [selectedCatalogResult, setSelectedCatalogResult] = useState<{
    kind: 'movie' | 'tv' | 'person';
    result: TmdbSearchResult;
  } | null>(null);
  const [selectedCatalogDetails, setSelectedCatalogDetails] = useState<MovieItem | TvSeries | ActorItem | null>(null);
  const [catalogDetailsLoading, setCatalogDetailsLoading] = useState(false);
  const [catalogActionError, setCatalogActionError] = useState('');
  const [extraTmdbInfo, setExtraTmdbInfo] = useState<TmdbExtraMediaInfo>({
    youtubeKey: null,
    recommendations: [],
    personCredits: []
  });
  const [extraInfoLoading, setExtraInfoLoading] = useState<boolean>(false);

  // Gacha / Random Movie Picker State
  const [isSpinningRandom, setIsSpinningRandom] = useState<boolean>(false);

  const [metadataSyncState, setMetadataSyncState] = useState<'loading' | 'ready' | 'missing-key' | 'error'>(
    hasTmdbKey ? (allTmdbMetadataReady ? 'ready' : 'loading') : 'missing-key'
  );

  // 1. Hydrate Metadata Otomatis dari TMDB
  const triggerMetadataRefresh = useCallback(async (forceAll = false) => {
    if (!hasTmdbKey) {
      setMetadataSyncState('missing-key');
      return;
    }
    setMetadataSyncState('loading');
    let metadataLoadFailed = false;

    const [movieMetadata, actorMetadata, seriesMetadata] = await Promise.all([
      Promise.all(
        movies.map(async (movie) => {
          if (movie.tmdbMetadataFetched && !forceAll) return movie;
          try {
            const metadata = movie.tmdbId
              ? await getMovieFromTmdb(movie.tmdbId)
              : await getMovieByTitle(movie.title);
            if (!metadata) metadataLoadFailed = true;
            return metadata
              ? { ...movie, ...metadata, tmdbMetadataFetched: true, status: movie.status }
              : movie;
          } catch {
            metadataLoadFailed = true;
            return movie;
          }
        })
      ),
      Promise.all(
        actors.map(async (actor) => {
          if (actor.tmdbMetadataFetched && !forceAll) return actor;
          try {
            const metadata = actor.tmdbId
              ? await getPersonFromTmdb(actor.tmdbId)
              : await getPersonByName(actor.name);
            if (!metadata) metadataLoadFailed = true;
            return metadata
              ? { ...actor, ...metadata, tmdbMetadataFetched: true, likedBy: actor.likedBy }
              : actor;
          } catch {
            metadataLoadFailed = true;
            return actor;
          }
        })
      ),
      Promise.all(
        tvSeries.map(async (series) => {
          if (series.tmdbMetadataFetched && !forceAll) return series;
          try {
            const metadata = series.tmdbId
              ? await getTvFromTmdb(series.tmdbId)
              : await getTvByTitle(series.title);
            if (!metadata) metadataLoadFailed = true;
            return metadata
              ? {
                  ...series,
                  ...metadata,
                  tmdbMetadataFetched: true,
                  watchedEpisodes: Math.min(
                    series.watchedEpisodes,
                    metadata.totalEpisodes ?? series.totalEpisodes
                  ),
                  status: series.status,
                  notes: series.notes
                }
              : series;
          } catch {
            metadataLoadFailed = true;
            return series;
          }
        })
      )
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
  }, [hasTmdbKey, movies, actors, tvSeries, onUpdateMovie, onUpdateActor, onUpdateTvSeries]);

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
    void triggerMetadataRefresh(false);
  }, [hasTmdbKey, allTmdbMetadataReady, movies.length, actors.length, tvSeries.length, triggerMetadataRefresh]);

  // 2. Fetch TMDB Discover / Trending Feed
  useEffect(() => {
    if (!hasTmdbKey || !showDiscoverFeed) return;
    let alive = true;
    const loadDiscover = async () => {
      setDiscoverLoading(true);
      try {
        let endpoint = '/trending/movie/week';
        let params: Record<string, string> = { language: 'id-ID' };

        if (discoverCategory === 'trending') {
          endpoint = '/trending/movie/week';
        } else if (discoverCategory === 'now_playing') {
          endpoint = '/movie/now_playing';
          params = { language: 'id-ID', region: 'ID' };
        } else if (discoverCategory === 'top_rated') {
          endpoint = '/movie/top_rated';
        } else if (discoverCategory === 'tv_popular') {
          endpoint = '/trending/tv/week';
        } else if (discoverCategory === 'person_popular') {
          endpoint = '/person/popular';
        }

        let data = await fetchTmdbDirect<{ results?: TmdbSearchResult[] }>(endpoint, params);
        if (!data?.results?.length) {
          data = await fetchTmdbDirect<{ results?: TmdbSearchResult[] }>(endpoint, { language: 'en-US' });
        }
        if (alive && data?.results) {
          setDiscoverItems(data.results.slice(0, 14));
        }
      } catch (err) {
        console.warn('Gagal memuat feed TMDB Discover:', err);
      } finally {
        if (alive) setDiscoverLoading(false);
      }
    };
    void loadDiscover();
    return () => {
      alive = false;
    };
  }, [hasTmdbKey, showDiscoverFeed, discoverCategory]);

  // 3. Fetch Extra TMDB Info (Videos / Recommendations / Credits) saat Modal dibuka
  const loadExtraTmdbData = useCallback(async (kind: 'movie' | 'tv' | 'person', tmdbId?: number, existingTrailer?: string) => {
    setShowInlineTrailer(false);
    const fallbackKey = extractYoutubeKey(existingTrailer);
    setExtraTmdbInfo({
      youtubeKey: fallbackKey,
      recommendations: [],
      personCredits: []
    });

    if (!hasTmdbKey || !tmdbId) return;
    setExtraInfoLoading(true);
    try {
      if (kind === 'movie' || kind === 'tv') {
        const [videosRes, recRes] = await Promise.all([
          fetchTmdbDirect<{ results?: Array<{ key: string; site: string; type: string; official?: boolean }> }>(
            `/${kind}/${tmdbId}/videos`,
            { language: 'en-US' }
          ),
          fetchTmdbDirect<{ results?: TmdbSearchResult[] }>(`/${kind}/${tmdbId}/recommendations`, {
            language: 'en-US'
          })
        ]);

        const ytVideos = (videosRes?.results || []).filter((v) => v.site === 'YouTube');
        const bestTrailer =
          ytVideos.find((v) => v.type === 'Trailer' && v.official) ||
          ytVideos.find((v) => v.type === 'Trailer') ||
          ytVideos[0];

        setExtraTmdbInfo({
          youtubeKey: bestTrailer?.key || fallbackKey,
          recommendations: (recRes?.results || []).slice(0, 8),
          personCredits: []
        });
      } else if (kind === 'person') {
        const creditsRes = await fetchTmdbDirect<{ cast?: TmdbSearchResult[] }>(
          `/person/${tmdbId}/movie_credits`,
          { language: 'en-US' }
        );
        const sortedCast = (creditsRes?.cast || [])
          .filter((c) => c.poster_path)
          .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
          .slice(0, 10);

        setExtraTmdbInfo({
          youtubeKey: null,
          recommendations: [],
          personCredits: sortedCast
        });
      }
    } catch (err) {
      console.warn('Gagal memuat info tambahan TMDB:', err);
    } finally {
      setExtraInfoLoading(false);
    }
  }, [hasTmdbKey]);

  // Trigger extra info when local movie/series/actor modal opens
  useEffect(() => {
    if (selectedMovie) {
      void loadExtraTmdbData('movie', selectedMovie.tmdbId, selectedMovie.trailerUrl);
    }
  }, [selectedMovie?.id, selectedMovie?.tmdbId, loadExtraTmdbData]);

  useEffect(() => {
    if (selectedSeries) {
      void loadExtraTmdbData('tv', selectedSeries.tmdbId);
    }
  }, [selectedSeries?.id, selectedSeries?.tmdbId, loadExtraTmdbData]);

  useEffect(() => {
    if (selectedActor) {
      void loadExtraTmdbData('person', selectedActor.tmdbId);
    }
  }, [selectedActor?.id, selectedActor?.tmdbId, loadExtraTmdbData]);

  // 4. Pencarian Katalog TMDB
  const handleCatalogSearch = async (kind: 'movie' | 'tv' | 'person', customQuery?: string) => {
    const query = (customQuery ?? catalogQuery).trim();
    if (!query) {
      catalogSearchRequest.current += 1;
      setCatalogResults([]);
      setCatalogKind(null);
      setCatalogError('');
      return;
    }
    if (!hasTmdbKey) {
      setCatalogError('TMDB API key belum dikonfigurasi di .env (VITE_TMDB_API_KEY).');
      return;
    }
    setCatalogLoading(true);
    setCatalogError('');
    setCatalogKind(kind);
    const requestId = ++catalogSearchRequest.current;
    try {
      const results = await searchTmdb(kind, query);
      if (requestId !== catalogSearchRequest.current) return;
      setCatalogResults(results);
      if (!results.length) setCatalogError(`"${query}" tidak ditemukan di TMDB.`);
    } catch (error) {
      if (requestId !== catalogSearchRequest.current) return;
      setCatalogError(error instanceof Error ? `Pencarian TMDB gagal: ${error.message}` : 'Pencarian TMDB gagal.');
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
    const timeout = window.setTimeout(() => void handleCatalogSearch(catalogType), 320);
    return () => window.clearTimeout(timeout);
  }, [catalogQuery, catalogType, hasTmdbKey]);

  const openCatalogResult = async (kind: 'movie' | 'tv' | 'person', result: TmdbSearchResult) => {
    soundManager.playTap();
    setSelectedCatalogResult({ kind, result });
    setSelectedCatalogDetails(null);
    setCatalogDetailsLoading(true);
    setCatalogActionError('');
    void loadExtraTmdbData(kind, result.id);

    try {
      const details =
        kind === 'movie'
          ? { ...mapMovieSearchResult(result), ...(await getMovieFromTmdb(result.id)) }
          : kind === 'tv'
          ? { ...mapTvSearchResult(result), ...(await getTvFromTmdb(result.id)) }
          : { ...mapPersonSearchResult(result), ...(await getPersonFromTmdb(result.id)) };
      setSelectedCatalogDetails(details);
    } catch (error) {
      setCatalogActionError(error instanceof Error ? error.message : 'Detail dari TMDB gagal dimuat.');
    } finally {
      setCatalogDetailsLoading(false);
    }
  };

  const quickAddFromTmdb = async (
    kind: 'movie' | 'tv' | 'person',
    result: TmdbSearchResult,
    targetStatus: 'watchlist' | 'together' = 'watchlist'
  ) => {
    soundManager.playTap();
    setAddingCatalogId(result.id);
    setCatalogActionError('');
    try {
      if (kind === 'movie') {
        const full = { ...mapMovieSearchResult(result), ...(await getMovieFromTmdb(result.id)) };
        await onAddMovie({
          ...full,
          id: `tmdb-${result.id}`,
          tmdbId: result.id,
          status: targetStatus,
          watchedDate: targetStatus === 'together' ? new Date().toISOString().slice(0, 10) : undefined,
          addedBy: activeProfile,
          tmdbMetadataFetched: true
        });
      } else if (kind === 'tv') {
        const full = { ...mapTvSearchResult(result), ...(await getTvFromTmdb(result.id)) };
        await onAddTvSeries({
          ...full,
          id: `series-tmdb-${result.id}`,
          tmdbId: result.id,
          watchedEpisodes: 0,
          status: targetStatus === 'together' ? 'watching' : 'watchlist',
          tmdbMetadataFetched: true
        });
      } else {
        const full = { ...mapPersonSearchResult(result), ...(await getPersonFromTmdb(result.id)) };
        await onAddActor({
          ...full,
          id: `actor-tmdb-${result.id}`,
          tmdbId: result.id,
          likedBy: activeProfile,
          tmdbMetadataFetched: true
        });
      }
      soundManager.playSuccess();
    } catch (err) {
      setCatalogActionError(err instanceof Error ? err.message : 'Gagal menambahkan dari TMDB.');
    } finally {
      setAddingCatalogId(null);
    }
  };

  const saveSelectedCatalogResult = async (targetStatus: 'watchlist' | 'together' = 'watchlist') => {
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
          status: targetStatus,
          watchedDate: targetStatus === 'together' ? new Date().toISOString().slice(0, 10) : undefined,
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
          status: targetStatus === 'together' ? 'watching' : 'watchlist',
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

  // 5. Random Watchlist Gacha ("Bingung Nonton Apa?")
  const handlePickRandomMovie = () => {
    const pool = movies.filter((m) => m.status === 'watchlist');
    const sourcePool = pool.length > 0 ? pool : movies;
    if (!sourcePool.length) return;

    soundManager.playTap();
    setIsSpinningRandom(true);
    window.setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * sourcePool.length);
      const chosen = sourcePool[randomIndex];
      setIsSpinningRandom(false);
      soundManager.playSuccess();
      setSelectedMovie(chosen);
    }, 480);
  };

  // 6. Movie Night Planner State
  const getDynamicDefaultDate = () => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T20:00`;
  };

  const [plannedMovieId, setPlannedMovieId] = useState<string>(
    movieNightPlan?.movieId || movies[0]?.id || ''
  );
  const [plannedDate, setPlannedDate] = useState<string>(
    movieNightPlan?.scheduledAt || getDynamicDefaultDate()
  );
  const [plannedSnack, setPlannedSnack] = useState<string>(movieNightPlan?.snacks || '');
  const [plannedDrink, setPlannedDrink] = useState<string>(movieNightPlan?.drinks || '');
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
    setConfirmNotice('🎉 Jadwal kencan nonton berhasil dikonfirmasi! Tersinkron ke Beranda.');
    setTimeout(() => setConfirmNotice(null), 6000);
  };

  const handleCancelPlan = () => {
    soundManager.playPop();
    onSaveMovieNightPlan?.(null);
    setConfirmNotice('Jadwal kencan nonton telah dibatalkan.');
    setTimeout(() => setConfirmNotice(null), 3500);
  };

  const handleQuickPlanMovie = (movie: MovieItem) => {
    soundManager.playTap();
    setPlannedMovieId(movie.id);
    setSelectedMovie(null);
    setActiveTab('planner');
  };

  // 7. Statistik & Filter Koleksi Lokal
  const cinemaStats = useMemo(() => {
    const watchedTogether = movies.filter((m) => m.status === 'together').length;
    const watchlistCount =
      movies.filter((m) => m.status === 'watchlist').length +
      tvSeries.filter((s) => s.status === 'watchlist').length;
    const ratedMovies = movies.filter((m) => (m.ratingSavero || 0) > 0 || (m.ratingSoffie || 0) > 0);
    const avgCoupleRating = ratedMovies.length
      ? (
          ratedMovies.reduce((acc, m) => {
            const r1 = m.ratingSavero || m.ratingSoffie || 0;
            const r2 = m.ratingSoffie || m.ratingSavero || 0;
            return acc + (r1 + r2) / 2;
          }, 0) / ratedMovies.length
        ).toFixed(1)
      : '5.0';

    return { watchedTogether, watchlistCount, avgCoupleRating };
  }, [movies, tvSeries]);

  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach((m) => (m.genres || []).forEach((g) => genreSet.add(g)));
    return ['Semua', ...Array.from(genreSet).slice(0, 10)];
  }, [movies]);

  const filteredMovies = useMemo(() => {
    const q = localFilterQuery.trim().toLowerCase();
    return movies
      .filter((m) => {
        if (movieFilter !== 'all' && m.status !== movieFilter) return false;
        if (selectedGenre !== 'Semua' && !(m.genres || []).includes(selectedGenre)) return false;
        if (q && !m.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'rating') {
          const aRate = Math.max(a.ratingSavero || 0, a.ratingSoffie || 0, (a.tmdbRating || 0) / 2);
          const bRate = Math.max(b.ratingSavero || 0, b.ratingSoffie || 0, (b.tmdbRating || 0) / 2);
          return bRate - aRate;
        }
        return (b.watchedDate || '0').localeCompare(a.watchedDate || '0');
      });
  }, [movies, movieFilter, selectedGenre, localFilterQuery, sortBy]);

  // Helpers for Catalog Modal
  const selectedResult = selectedCatalogResult?.result;
  const selectedIsMovie = selectedCatalogResult?.kind === 'movie';
  const selectedIsTv = selectedCatalogResult?.kind === 'tv';
  const selectedTitle = selectedCatalogDetails
    ? 'title' in selectedCatalogDetails
      ? selectedCatalogDetails.title
      : selectedCatalogDetails.name
    : selectedResult?.title || selectedResult?.name || '';
  const selectedPoster = selectedCatalogDetails
    ? 'posterUrl' in selectedCatalogDetails
      ? selectedCatalogDetails.posterUrl
      : selectedCatalogDetails.photoUrl
    : selectedIsMovie || selectedIsTv
    ? selectedResult?.poster_path
      ? `https://image.tmdb.org/t/p/w500${selectedResult.poster_path}`
      : ''
    : selectedResult?.profile_path
    ? `https://image.tmdb.org/t/p/w500${selectedResult.profile_path}`
    : '';
  const selectedBackdrop =
    selectedCatalogDetails && 'backdropUrl' in selectedCatalogDetails && selectedCatalogDetails.backdropUrl
      ? selectedCatalogDetails.backdropUrl
      : selectedResult?.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${selectedResult.backdrop_path}`
      : '';
  const selectedOverview =
    selectedCatalogDetails && 'overview' in selectedCatalogDetails
      ? selectedCatalogDetails.overview
      : selectedCatalogDetails && 'biography' in selectedCatalogDetails
      ? selectedCatalogDetails.biography
      : '';
  const selectedGenres =
    selectedCatalogDetails && 'genres' in selectedCatalogDetails ? selectedCatalogDetails.genres || [] : [];
  const selectedCast =
    selectedCatalogDetails && 'cast' in selectedCatalogDetails ? selectedCatalogDetails.cast || [] : [];
  const savedSelectedMovie =
    selectedResult && selectedIsMovie ? movies.find((item) => item.tmdbId === selectedResult.id) : undefined;
  const savedSelectedSeries =
    selectedResult && selectedIsTv ? tvSeries.find((item) => item.tmdbId === selectedResult.id) : undefined;
  const savedSelectedActor =
    selectedResult && selectedCatalogResult?.kind === 'person'
      ? actors.find((item) => item.tmdbId === selectedResult.id)
      : undefined;
  const selectedAlreadySaved = Boolean(savedSelectedMovie || savedSelectedSeries || savedSelectedActor);

  const discoverKind: 'movie' | 'tv' | 'person' =
    discoverCategory === 'tv_popular'
      ? 'tv'
      : discoverCategory === 'person_popular'
      ? 'person'
      : 'movie';

  return (
    <section
      id="film-aktor"
      className="min-h-[75vh] bg-[#fffaf0] px-3 py-4 transition-colors dark:bg-[#21151a] sm:px-5 sm:py-8"
    >
      <div className="mx-auto max-w-5xl space-y-3">
        {/* 1. COMPACT HEADER + STATS PILLS + RANDOM PICKER */}
        <div className="clay-card-3d relative overflow-hidden rounded-[1.75rem] p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/90 px-2.5 py-0.5 text-[9px] font-black tracking-[0.14em] uppercase text-[#b84661] dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
                <Film className="h-2.5 w-2.5" />
                <span>RUANG SINEMA & TMDB</span>
              </div>
              <h2 className="truncate text-lg font-black tracking-tight text-[#4a1623] dark:text-rose-50 sm:text-2xl">
                Film & Movie Night
              </h2>
              <p className="line-clamp-1 text-[11px] font-semibold text-[#8c5a67] dark:text-rose-300/80 sm:text-xs">
                Eksplorasi katalog TMDB, rating berdua, & rencana nonton 🎬🍿
              </p>

              {/* Compact Summary Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[9.5px] font-extrabold text-[#7a2037] dark:bg-white/10 dark:text-rose-200">
                  <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
                  {cinemaStats.watchedTogether} Nonton Berdua
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9.5px] font-extrabold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                  <Bookmark className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                  {cinemaStats.watchlistCount} Watchlist
                </span>
                <button
                  type="button"
                  onClick={handlePickRandomMovie}
                  disabled={!movies.length || isSpinningRandom}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] px-2.5 py-0.5 text-[9.5px] font-black text-white shadow-2xs transition active:scale-95 disabled:opacity-50"
                  title="Pilih acak film dari Watchlist untuk malam ini"
                >
                  <Shuffle className={`h-2.5 w-2.5 ${isSpinningRandom ? 'animate-spin' : ''}`} />
                  <span>{isSpinningRandom ? 'Mengacak...' : 'Acak Tontonan'}</span>
                </button>
              </div>
            </div>

            <div className="shrink-0">
              <img
                src="/characters/berdua/Cozy Chibi Cinema Date.webp"
                alt="Cozy Chibi Cinema Date"
                className="h-20 w-20 sm:h-28 sm:w-28 object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {metadataSyncState === 'missing-key' && (
          <p className="rounded-2xl bg-amber-100/80 px-3 py-2 text-[10px] font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            TMDB API key belum dikonfigurasi. Tambahkan <code>VITE_TMDB_API_KEY</code> ke file <code>.env</code> agar fitur penuh TMDB aktif.
          </p>
        )}
        {catalogSyncError && (
          <p className="rounded-2xl bg-rose-100/80 px-3 py-2 text-[10px] font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            Sinkronisasi katalog: {catalogSyncError}
          </p>
        )}

        {/* 2. TMDB SMART HUB (SEARCH + LIVE TRENDING/NOW PLAYING CAROUSEL) */}
        <div className="clay-card-3d rounded-[1.6rem] p-2.5 sm:p-3.5">
          {/* Top Bar: Search Type & Toggle Explore */}
          <div className="mb-2 flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white shadow-2xs">
                <Clapperboard className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11.5px] font-black text-[#4a1623] dark:text-rose-50">
                TMDB Explorer
              </span>
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  void triggerMetadataRefresh(true);
                }}
                title="Segarkan metadata TMDB"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8.5px] font-black text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
              >
                <RefreshCw
                  className={`h-2.5 w-2.5 ${metadataSyncState === 'loading' || catalogLoading ? 'animate-spin' : ''}`}
                />
                <span>{catalogLoading ? 'Mencari...' : 'Live TMDB'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
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
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold transition-all active:scale-95 ${
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

              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setShowDiscoverFeed((prev) => !prev);
                }}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold transition-all ${
                  showDiscoverFeed
                    ? 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-200'
                    : 'clay-subcard-3d text-[#8c4f60]'
                }`}
                title="Tampilkan/Sembunyikan Rekomendasi Populer TMDB"
              >
                <Compass className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">Eksplor</span>
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
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
              placeholder={`Ketik judul ${
                catalogType === 'person' ? 'aktor/aktris' : catalogType === 'tv' ? 'serial TV / drakor' : 'film bioskop'
              } di TMDB...`}
              className="h-9 w-full rounded-full border border-rose-200/80 bg-white/95 py-1 pl-8 pr-8 text-[11px] font-bold text-[#4a1623] shadow-inner placeholder:text-[#8c4f60]/55 focus:border-rose-400 focus:outline-none dark:border-white/10 dark:bg-black/30 dark:text-rose-50"
            />
            {catalogQuery && (
              <button
                type="button"
                onClick={() => setCatalogQuery('')}
                className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-rose-100 text-[10px] font-black text-rose-600 hover:bg-rose-200 dark:bg-white/10 dark:text-rose-200"
              >
                ✕
              </button>
            )}
          </form>

          {catalogError && (
            <p className="mt-1.5 text-[10px] font-bold text-red-600 dark:text-red-300">{catalogError}</p>
          )}

          {/* Live Search Results */}
          <AnimatePresence>
            {catalogKind && catalogResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2.5 overflow-hidden border-t border-rose-200/40 pt-2.5 dark:border-white/10"
              >
                <div className="mb-1.5 flex items-center justify-between text-[9.5px] font-black uppercase text-[#8c4f60] dark:text-rose-300">
                  <span>Hasil Pencarian TMDB ({catalogResults.length})</span>
                  <button
                    type="button"
                    onClick={() => setCatalogResults([])}
                    className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] hover:bg-rose-500/20"
                  >
                    Tutup Hasil
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
                  {catalogResults.map((result) => {
                    const isMovie = catalogKind === 'movie';
                    const isTv = catalogKind === 'tv';
                    const mappedMovie = isMovie ? mapMovieSearchResult(result) : null;
                    const mappedSeries = isTv ? mapTvSearchResult(result) : null;
                    const mappedPerson = !isMovie && !isTv ? mapPersonSearchResult(result) : null;
                    const title = mappedMovie?.title ?? mappedSeries?.title ?? mappedPerson?.name ?? '';
                    const image = mappedMovie?.posterUrl ?? mappedSeries?.posterUrl ?? mappedPerson?.photoUrl ?? '';
                    const year =
                      mappedMovie?.year ??
                      (result.first_air_date ? Number(result.first_air_date.slice(0, 4)) : undefined);
                    const alreadySaved =
                      (isMovie && movies.some((m) => m.tmdbId === result.id)) ||
                      (isTv && tvSeries.some((s) => s.tmdbId === result.id)) ||
                      (!isMovie && !isTv && actors.some((a) => a.tmdbId === result.id));

                    return (
                      <div
                        key={result.id}
                        onClick={() => void openCatalogResult(catalogKind, result)}
                        className="clay-subcard-3d group relative w-24 sm:w-28 shrink-0 cursor-pointer overflow-hidden rounded-2xl p-1.5 text-left transition-transform hover:-translate-y-0.5"
                      >
                        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-black/10">
                          {image ? (
                            <ManagedImage src={image} alt={title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center p-1 text-center text-[8.5px] text-gray-400">
                              No Poster
                            </div>
                          )}
                          {result.vote_average ? (
                            <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[8px] font-black text-amber-300 backdrop-blur-xs">
                              <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                              {result.vote_average.toFixed(1)}
                            </span>
                          ) : null}

                          {/* Quick Add Button */}
                          <button
                            type="button"
                            disabled={alreadySaved || addingCatalogId === result.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!alreadySaved) void quickAddFromTmdb(catalogKind, result, 'watchlist');
                            }}
                            title={alreadySaved ? 'Sudah tersimpan' : 'Tambah cepat ke Koleksi'}
                            className={`absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition active:scale-90 ${
                              alreadySaved
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white hover:scale-105'
                            }`}
                          >
                            {alreadySaved ? (
                              <Check className="h-3 w-3 stroke-[3]" />
                            ) : (
                              <Plus className="h-3 w-3 stroke-[3]" />
                            )}
                          </button>
                        </div>
                        <div className="mt-1 px-0.5">
                          <p className="line-clamp-1 text-[9.5px] font-black text-[#4a1623] dark:text-rose-50">
                            {title}
                          </p>
                          <span className="text-[8px] font-bold text-[#8c4f60] dark:text-rose-200/70">
                            {year || (catalogKind === 'person' ? 'Aktor' : 'TMDB')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TMDB Live Discover Feed (Trending / Now Playing / Top Rated / Popular TV) */}
          <AnimatePresence>
            {showDiscoverFeed && !catalogResults.length && hasTmdbKey && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2.5 overflow-hidden border-t border-rose-200/40 pt-2 dark:border-white/10"
              >
                <div className="mb-2 flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'trending', label: '🔥 Trending', icon: Flame },
                      { id: 'now_playing', label: '🍿 Bioskop', icon: Popcorn },
                      { id: 'top_rated', label: '⭐ Top Rated', icon: Award },
                      { id: 'tv_popular', label: '📺 Serial Hits', icon: Tv },
                      { id: 'person_popular', label: '🎭 Aktor Hits', icon: Users }
                    ].map((cat) => {
                      const active = discoverCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            soundManager.playTap();
                            setDiscoverCategory(cat.id as DiscoverCategory);
                          }}
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold transition-all ${
                            active
                              ? 'bg-[#4a1623] text-white dark:bg-rose-400 dark:text-[#210710]'
                              : 'bg-rose-500/10 text-[#6e2438] hover:bg-rose-500/20 dark:bg-white/5 dark:text-rose-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {discoverLoading ? (
                  <div className="flex gap-2 overflow-x-hidden py-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-36 w-24 shrink-0 animate-pulse rounded-2xl bg-rose-200/40 dark:bg-white/5"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                    {discoverItems.map((item) => {
                      const title = item.title || item.name || 'TMDB';
                      const imgPath =
                        discoverKind === 'person' ? item.profile_path : item.poster_path;
                      const imgUrl = imgPath ? `https://image.tmdb.org/t/p/w342${imgPath}` : '';
                      const year = (item.release_date || item.first_air_date || '').slice(0, 4);
                      const alreadySaved =
                        (discoverKind === 'movie' && movies.some((m) => m.tmdbId === item.id)) ||
                        (discoverKind === 'tv' && tvSeries.some((s) => s.tmdbId === item.id)) ||
                        (discoverKind === 'person' && actors.some((a) => a.tmdbId === item.id));

                      return (
                        <div
                          key={item.id}
                          onClick={() => void openCatalogResult(discoverKind, item)}
                          className="clay-subcard-3d group relative w-22 sm:w-26 shrink-0 cursor-pointer overflow-hidden rounded-2xl p-1 text-left transition-transform hover:-translate-y-0.5"
                        >
                          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-black/10">
                            {imgUrl ? (
                              <ManagedImage
                                src={imgUrl}
                                alt={title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center p-1 text-[8px] text-gray-400">
                                No Image
                              </div>
                            )}

                            {item.vote_average ? (
                              <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-black/65 px-1 py-0.5 text-[7.5px] font-black text-amber-300 backdrop-blur-xs">
                                <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                                {item.vote_average.toFixed(1)}
                              </span>
                            ) : null}

                            <button
                              type="button"
                              disabled={alreadySaved || addingCatalogId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!alreadySaved) void quickAddFromTmdb(discoverKind, item, 'watchlist');
                              }}
                              title={alreadySaved ? 'Sudah ada di koleksi' : 'Tambah Cepat'}
                              className={`absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full shadow-md transition active:scale-90 ${
                                alreadySaved
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white'
                              }`}
                            >
                              {alreadySaved ? (
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              ) : (
                                <Plus className="h-2.5 w-2.5 stroke-[3]" />
                              )}
                            </button>
                          </div>
                          <div className="mt-1 px-0.5">
                            <p className="line-clamp-1 text-[9px] font-black text-[#4a1623] dark:text-rose-50">
                              {title}
                            </p>
                            {year && (
                              <span className="block text-[7.5px] font-bold text-[#8c4f60] dark:text-rose-200/65">
                                {year}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. SMOOTH SEGMENTED NAVIGATION TABS */}
        <LayoutGroup id="movies-section-tabs">
          <div className="clay-pill-dock-3d grid grid-cols-5 gap-0.5 rounded-full p-1 w-full">
            {[
              { id: 'film', label: 'Film', count: movies.length, icon: Film },
              { id: 'serial', label: 'Serial', count: tvSeries.length, icon: Tv },
              { id: 'aktor', label: 'Aktor', count: actors.length, icon: Users },
              { id: 'koleksi', label: 'Koleksi', count: collections.length, icon: Layers },
              { id: 'planner', label: 'Nonton', icon: Calendar }
            ].map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab(tab.id as any);
                  }}
                  className={`relative flex items-center justify-center gap-1 rounded-full py-1.5 px-1 text-[9.5px] sm:text-[11px] font-extrabold transition-colors z-10 ${
                    active
                      ? 'text-white'
                      : 'text-[#753546] hover:text-[#4a1623] dark:text-rose-200/80'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="active-cinema-tab-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] shadow-xs"
                    />
                  )}
                  <Icon className="hidden h-3 w-3 sm:inline" />
                  <span className="truncate">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[8px] ${active ? 'opacity-90' : 'opacity-70'}`}>
                      ({tab.count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* 4. TAB CONTENT */}
        <AnimatePresence mode="wait">
          {/* ==================== TAB 1: FILM LIST ==================== */}
          {activeTab === 'film' && (
            <motion.div
              key="tab-film"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-2.5"
            >
              {/* Compact Filter, Local Search, Sort & Grid Density Bar */}
              <div className="clay-subcard-3d flex flex-col gap-2 rounded-2xl p-2">
                <div className="flex items-center justify-between gap-1.5">
                  {/* Status Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'together', label: 'Berdua' },
                      { id: 'savero', label: 'Savero' },
                      { id: 'soffie', label: 'Soffie' },
                      { id: 'watchlist', label: 'Wishlist' }
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
                          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold transition-all active:scale-95 ${
                            active
                              ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs'
                              : 'bg-rose-500/10 text-[#6e2438] hover:bg-rose-500/15 dark:bg-white/5 dark:text-rose-100'
                          }`}
                        >
                          {f.id === 'together' && (
                            <div className="flex items-center -space-x-1.5">
                              <img
                                src="/characters/expressions/savero/bahagia.webp"
                                alt=""
                                className="h-3 w-3 rounded-full object-cover object-top scale-125"
                              />
                              <img
                                src="/characters/expressions/soffie/gemas-sayang.webp"
                                alt=""
                                className="h-3 w-3 rounded-full object-cover object-top scale-125"
                              />
                            </div>
                          )}
                          {f.id === 'savero' && (
                            <img
                              src="/characters/expressions/savero/bahagia.webp"
                              alt="Savero"
                              className="h-3 w-3 rounded-full object-cover object-top scale-125"
                            />
                          )}
                          {f.id === 'soffie' && (
                            <img
                              src="/characters/expressions/soffie/gemas-sayang.webp"
                              alt="Soffie"
                              className="h-3 w-3 rounded-full object-cover object-top scale-125"
                            />
                          )}
                          {f.id === 'watchlist' && <Bookmark className="h-2.5 w-2.5 fill-current" />}
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Controls: Sort + Compact 3-Col Toggle */}
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-extrabold text-[#7a3444] shadow-2xs dark:bg-white/10 dark:text-rose-200">
                      <ListFilter className="h-2.5 w-2.5 text-rose-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="cursor-pointer bg-transparent text-[9px] font-extrabold text-[#4a1623] focus:outline-none dark:text-rose-50"
                      >
                        <option value="date" className="dark:bg-[#2b0c16]">Terbaru</option>
                        <option value="rating" className="dark:bg-[#2b0c16]">Rating</option>
                        <option value="title" className="dark:bg-[#2b0c16]">A-Z</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setCompactGrid((p) => !p);
                      }}
                      title={compactGrid ? 'Tampilan 2 Kolom Besar' : 'Tampilan 3 Kolom Compact'}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[#7a3444] shadow-2xs dark:bg-white/10 dark:text-rose-200 sm:hidden"
                    >
                      {compactGrid ? (
                        <Grid className="h-3 w-3" />
                      ) : (
                        <LayoutGrid className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Second Row: Genre Chips + Quick Local Filter */}
                <div className="flex items-center justify-between gap-2 border-t border-rose-200/30 pt-1.5 dark:border-white/5">
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {availableGenres.map((genre) => {
                      const active = selectedGenre === genre;
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => setSelectedGenre(genre)}
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-extrabold transition ${
                            active
                              ? 'bg-[#4a1623] text-white dark:bg-rose-300 dark:text-[#210710]'
                              : 'text-[#8c4f60] hover:bg-rose-500/10 dark:text-rose-200/75'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-28 sm:w-40 shrink-0">
                    <input
                      type="text"
                      value={localFilterQuery}
                      onChange={(e) => setLocalFilterQuery(e.target.value)}
                      placeholder="Filter judul..."
                      className="h-6 w-full rounded-full border border-rose-200/60 bg-white/80 px-2.5 text-[9px] font-bold text-[#4a1623] placeholder:text-[#8c4f60]/50 focus:outline-none dark:border-white/10 dark:bg-black/25 dark:text-rose-100"
                    />
                  </div>
                </div>
              </div>

              {/* Poster Grid */}
              <div
                className={`grid gap-2 sm:gap-3 ${
                  compactGrid
                    ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                }`}
              >
                {filteredMovies.map((movie) => {
                  const isTogether = movie.status === 'together';
                  const isSavero = movie.status === 'savero';
                  const isSoffie = movie.status === 'soffie';
                  const coupleAvg =
                    movie.ratingSavero && movie.ratingSoffie
                      ? ((movie.ratingSavero + movie.ratingSoffie) / 2).toFixed(1)
                      : movie.ratingSavero || movie.ratingSoffie || null;

                  return (
                    <motion.div
                      layout
                      key={movie.id}
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedMovie(movie);
                      }}
                      className="clay-card-3d content-auto-card group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[1.25rem] p-1.5 transition-transform duration-200 hover:-translate-y-1"
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[1rem] bg-black/10 shadow-inner">
                        {movie.posterUrl ? (
                          <ManagedImage
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-2 text-center text-[9px] text-gray-400">
                            No Poster
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

                        {/* Top Left Status Chibi */}
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                          {isTogether && (
                            <div
                              className="flex items-center -space-x-1.5 drop-shadow-md"
                              title="Ditonton Berdua"
                            >
                              <div className="h-5 w-5 overflow-hidden rounded-full border border-white bg-amber-50">
                                <img
                                  src="/characters/expressions/savero/bahagia.webp"
                                  alt="Savero"
                                  className="h-full w-full object-cover object-top scale-125"
                                />
                              </div>
                              <div className="h-5 w-5 overflow-hidden rounded-full border border-white bg-rose-50">
                                <img
                                  src="/characters/expressions/soffie/gemas-sayang.webp"
                                  alt="Soffie"
                                  className="h-full w-full object-cover object-top scale-125"
                                />
                              </div>
                            </div>
                          )}
                          {isSavero && (
                            <div
                              className="h-5 w-5 overflow-hidden rounded-full border border-white bg-emerald-50 shadow-xs"
                              title="Ditonton Savero"
                            >
                              <img
                                src="/characters/expressions/savero/bahagia.webp"
                                alt="Savero"
                                className="h-full w-full object-cover object-top scale-125"
                              />
                            </div>
                          )}
                          {isSoffie && (
                            <div
                              className="h-5 w-5 overflow-hidden rounded-full border border-white bg-rose-50 shadow-xs"
                              title="Ditonton Soffie"
                            >
                              <img
                                src="/characters/expressions/soffie/gemas-sayang.webp"
                                alt="Soffie"
                                className="h-full w-full object-cover object-top scale-125"
                              />
                            </div>
                          )}
                          {movie.status === 'watchlist' && (
                            <span className="flex h-4.5 items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-1.5 text-[7px] font-black uppercase text-white shadow-xs">
                              <Bookmark className="h-2 w-2 fill-current" />
                              <span>Watch</span>
                            </span>
                          )}
                        </div>

                        {/* Top Right TMDB Rating */}
                        {movie.tmdbRating ? (
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[8px] font-black text-amber-300 backdrop-blur-xs">
                            <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                            <span>{movie.tmdbRating.toFixed(1)}</span>
                          </div>
                        ) : null}

                        {/* Bottom Left Couple Heart Rating */}
                        {coupleAvg && (
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-rose-600/85 px-1.5 py-0.5 text-[8px] font-black text-white backdrop-blur-xs">
                            <Heart className="h-2 w-2 fill-white" />
                            <span>{coupleAvg}</span>
                          </div>
                        )}
                      </div>

                      <div className="px-1 pt-1.5 pb-0.5 text-left">
                        <h4 className="line-clamp-1 text-[10.5px] sm:text-[11.5px] font-black text-[#4a1623] group-hover:text-rose-600 dark:text-rose-50">
                          {movie.title}
                        </h4>
                        <div className="mt-0.5 flex items-center justify-between text-[8.5px] font-bold text-[#8c4f60] dark:text-rose-200/70">
                          <span>{movie.year || 'Film'}</span>
                          {movie.genres?.[0] && (
                            <span className="truncate max-w-[60%] opacity-80">{movie.genres[0]}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filteredMovies.length === 0 && (
                <div className="clay-card-3d rounded-[1.8rem] p-7 text-center">
                  <Film className="mx-auto mb-2 h-7 w-7 text-rose-400" />
                  <h4 className="text-xs font-black text-[#4a1623] dark:text-rose-50">
                    Tidak ada film yang cocok
                  </h4>
                  <p className="mt-0.5 text-[10.5px] text-[#8c4f60] dark:text-rose-200/75">
                    Coba ubah filter atau klik film dari bar TMDB Explorer di atas.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== TAB 2: SERIAL TV ==================== */}
          {activeTab === 'serial' && (
            <motion.div
              key="tab-serial"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {tvSeries.length === 0 ? (
                <div className="clay-card-3d rounded-[1.8rem] p-7 text-center">
                  <Tv className="mx-auto mb-2 h-7 w-7 text-rose-400" />
                  <h4 className="text-xs font-black text-[#4a1623] dark:text-rose-50">
                    Belum ada serial TV
                  </h4>
                  <p className="mt-0.5 text-[10.5px] text-[#8c4f60] dark:text-rose-200/75">
                    Pilih kategori "📺 Serial Hits" di atas atau cari judul serial favorit kalian.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {tvSeries.map((series) => {
                    const pct = series.totalEpisodes
                      ? Math.min(100, Math.round((series.watchedEpisodes / series.totalEpisodes) * 100))
                      : 0;
                    const isCompleted =
                      series.totalEpisodes > 0 && series.watchedEpisodes >= series.totalEpisodes;

                    return (
                      <div
                        key={series.id}
                        onClick={() => {
                          soundManager.playTap();
                          setSelectedSeries(series);
                        }}
                        className="clay-card-3d group flex cursor-pointer flex-col justify-between rounded-[1.5rem] p-3 transition hover:-translate-y-0.5"
                      >
                        <div className="flex gap-3">
                          <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-black/10 shadow-sm">
                            {series.posterUrl ? (
                              <ManagedImage
                                src={series.posterUrl}
                                alt={series.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] text-gray-400">
                                No Poster
                              </div>
                            )}
                            {series.tmdbRating ? (
                              <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[7.5px] font-black text-amber-300">
                                <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                                {series.tmdbRating.toFixed(1)}
                              </span>
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[8.5px] font-black uppercase text-rose-600 dark:text-rose-300">
                                {series.totalSeasons} Season • {series.totalEpisodes} Ep
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase ${
                                  series.status === 'watchlist'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : isCompleted
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {series.status === 'watchlist'
                                  ? 'Wishlist'
                                  : isCompleted
                                  ? 'Tamat'
                                  : 'Nonton'}
                              </span>
                            </div>

                            <h4 className="mt-0.5 line-clamp-1 text-sm font-black text-[#4a1623] dark:text-rose-50">
                              {series.title}
                            </h4>
                            <p className="mt-0.5 line-clamp-2 text-[10px] font-medium text-[#6b3140] dark:text-rose-200/80">
                              {series.overview || 'Klik untuk lihat detail serial & trailer.'}
                            </p>

                            {series.status !== 'watchlist' && (
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-[9.5px] font-extrabold text-[#4a1623] dark:text-rose-50">
                                  <span>
                                    Ep {series.watchedEpisodes} / {series.totalEpisodes || '?'}
                                  </span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-200/60 dark:bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className="mt-2.5 flex items-center gap-1.5 border-t border-rose-200/40 pt-2 dark:border-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {series.status === 'watchlist' ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void onUpdateTvSeries({ ...series, status: 'watching' })
                                }
                                className="flex-1 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] py-1.5 text-[10.5px] font-extrabold text-white shadow-2xs active:scale-95"
                              >
                                Mulai Nonton Berdua
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Hapus serial "${series.title}"?`)) {
                                    soundManager.playClose();
                                    void onRemoveTvSeries(series);
                                  }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void onUpdateTvSeries({
                                    ...series,
                                    watchedEpisodes: Math.max(0, series.watchedEpisodes - 1)
                                  })
                                }
                                className="clay-subcard-3d rounded-full px-2.5 py-1 text-[10px] font-extrabold text-[#7a3444] dark:text-rose-200"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void onUpdateTvSeries({
                                    ...series,
                                    watchedEpisodes: series.totalEpisodes
                                      ? Math.min(series.totalEpisodes, series.watchedEpisodes + 1)
                                      : series.watchedEpisodes + 1
                                  })
                                }
                                className="flex-1 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] py-1 text-[10px] font-extrabold text-white shadow-2xs active:scale-95"
                              >
                                +1 Episode
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Hapus serial "${series.title}"?`)) {
                                    soundManager.playClose();
                                    void onRemoveTvSeries(series);
                                  }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== TAB 3: AKTOR FAVORIT ==================== */}
          {activeTab === 'aktor' && (
            <motion.div
              key="tab-aktor"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {actors.length === 0 ? (
                <div className="clay-card-3d rounded-[1.8rem] p-7 text-center">
                  <Users className="mx-auto mb-2 h-7 w-7 text-rose-400" />
                  <h4 className="text-xs font-black text-[#4a1623] dark:text-rose-50">
                    Belum ada aktor favorit
                  </h4>
                  <p className="mt-0.5 text-[10.5px] text-[#8c4f60] dark:text-rose-200/75">
                    Pilih tab "🎭 Aktor Hits" di atas atau cari aktor kesukaan kalian di TMDB.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 sm:gap-3">
                  {actors.map((actor) => (
                    <div
                      key={actor.id}
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedActor(actor);
                      }}
                      className="clay-card-3d group flex cursor-pointer flex-col justify-between rounded-[1.4rem] p-2 transition hover:-translate-y-0.5"
                    >
                      <div>
                        <div className="relative mb-1.5 aspect-[3/4] w-full overflow-hidden rounded-[1rem] bg-black/10">
                          {actor.photoUrl ? (
                            <ManagedImage
                              src={actor.photoUrl}
                              alt={actor.name}
                              className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[9px] text-gray-400">
                              No Photo
                            </div>
                          )}
                        </div>
                        <h4 className="line-clamp-1 text-[10.5px] sm:text-xs font-black text-[#4a1623] dark:text-rose-50">
                          {actor.name}
                        </h4>
                        <p className="line-clamp-1 text-[8.5px] font-semibold text-[#8c4f60] dark:text-rose-200/70">
                          {actor.topMovies?.[0] || actor.birthPlace || 'Klik lihat filmografi'}
                        </p>
                      </div>

                      <div
                        className="mt-2 flex items-center justify-between border-t border-rose-200/40 pt-1.5 dark:border-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[8.5px] font-black text-[#5c2432] dark:text-rose-100">
                          {actor.likedBy || 'Berdua'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playPop();
                            const nextLikedBy =
                              actor.likedBy === 'Berdua'
                                ? 'Savero'
                                : actor.likedBy === 'Savero'
                                ? 'Soffie'
                                : 'Berdua';
                            void onToggleActorLike(actor.id, nextLikedBy);
                          }}
                          className="clay-subcard-3d flex h-5 items-center gap-0.5 rounded-full px-1.5 text-rose-500 active:scale-90"
                          title="Ganti penyuka"
                        >
                          <Heart className="h-2.5 w-2.5 fill-rose-500" />
                          <span className="text-[7.5px] font-extrabold">Ganti</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== TAB 4: KOLEKSI FRANCHISE ==================== */}
          {activeTab === 'koleksi' && (
            <motion.div
              key="tab-koleksi"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {collections.map((col) => {
                const total = col.movieTitles.length;
                const watched = col.movieTitles.filter((t) =>
                  movies.some(
                    (m) => m.title.toLowerCase().includes(t.toLowerCase()) && m.status === 'together'
                  )
                ).length;
                const pct = total ? Math.round((watched / total) * 100) : 0;

                return (
                  <div
                    key={col.id}
                    className="clay-card-3d flex flex-col justify-between rounded-[1.6rem] p-3.5"
                  >
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-300">
                          Franchise Marathon
                        </span>
                        {col.isTargetThisYear && (
                          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[8px] font-black text-amber-950 uppercase">
                            Target
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-[#4a1623] dark:text-rose-50">
                        {col.name}
                      </h4>
                      <p className="mt-0.5 text-[10.5px] font-semibold text-[#8c4f60] dark:text-rose-200/80">
                        {col.description}
                      </p>

                      <div className="my-2.5 space-y-1">
                        <div className="flex justify-between text-[10px] font-extrabold text-[#4a1623] dark:text-rose-50">
                          <span>
                            {watched} / {total} Ditonton Berdua
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-200/60 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <ul className="space-y-1 text-[10.5px] font-semibold text-[#6b3140] dark:text-rose-100/85">
                        {col.movieTitles.map((t, idx) => {
                          const matchedMovie = movies.find((m) =>
                            m.title.toLowerCase().includes(t.toLowerCase())
                          );
                          const isDone = matchedMovie?.status === 'together';

                          return (
                            <li
                              key={idx}
                              className="flex items-center justify-between gap-1.5 rounded-lg bg-white/50 px-2 py-1 dark:bg-white/5"
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-black ${
                                    isDone
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                  }`}
                                >
                                  {isDone ? '✓' : idx + 1}
                                </span>
                                <span className={`truncate ${isDone ? 'line-through opacity-70' : ''}`}>
                                  {t}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedMovie) {
                                    setSelectedMovie(matchedMovie);
                                  } else {
                                    setCatalogType('movie');
                                    setCatalogQuery(t);
                                    void handleCatalogSearch('movie', t);
                                  }
                                }}
                                className="shrink-0 text-[8.5px] font-extrabold text-rose-600 hover:underline dark:text-rose-300"
                              >
                                {matchedMovie ? 'Detail' : 'Cari TMDB'}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ==================== TAB 5: MOVIE NIGHT PLANNER ==================== */}
          {activeTab === 'planner' && (
            <motion.div
              key="tab-planner"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="clay-card-3d mx-auto max-w-lg rounded-[2rem] p-4 sm:p-5 text-left"
            >
              <div className="mb-3 text-center">
                <span className="text-[9px] font-black tracking-[0.18em] uppercase text-rose-500 dark:text-rose-300">
                  TIKET KENCAN NONTON
                </span>
                <h3 className="text-lg font-black text-[#4a1623] dark:text-rose-50">
                  Movie Night Planner
                </h3>
              </div>

              {/* Active Plan Status Banner */}
              {movieNightPlan && movieNightPlan.status === 'confirmed' && (
                <div className="mb-3.5 flex items-center justify-between rounded-2xl border border-emerald-400/40 bg-emerald-50/80 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <span className="block text-[8px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                        JADWAL AKTIF DI BERANDA
                      </span>
                      <span className="block truncate text-[11px] font-extrabold text-[#2a131b] dark:text-rose-100">
                        {movieNightPlan.movieTitle}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelPlan}
                    className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-[9px] font-black text-red-600 hover:bg-red-500/25 dark:text-red-300"
                  >
                    Batalkan
                  </button>
                </div>
              )}

              <div className="space-y-3 text-xs">
                {/* Target Movie Selector */}
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold text-[#4a1623] dark:text-rose-100">
                    Pilih Film dari Koleksi / Watchlist
                  </label>
                  <select
                    value={plannedMovie?.id ?? ''}
                    onChange={(e) => setPlannedMovieId(e.target.value)}
                    className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 text-[11px] font-bold text-[#4a1623] focus:outline-none dark:border-white/15 dark:bg-[#1f070f] dark:text-rose-100"
                  >
                    {!movies.length && <option value="">Tambahkan film terlebih dahulu</option>}
                    {movies.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.status === 'watchlist' ? '🔖 ' : '🎬 '}
                        {m.title} ({m.year || 'Film'})
                      </option>
                    ))}
                  </select>

                  {plannedMovie && (
                    <div className="mt-2 flex items-center gap-2.5 rounded-2xl border border-rose-200/50 bg-white/75 p-2 dark:border-white/10 dark:bg-black/20">
                      <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-black/10">
                        {plannedMovie.posterUrl && (
                          <ManagedImage
                            src={plannedMovie.posterUrl}
                            alt={plannedMovie.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11.5px] font-black text-[#4a1623] dark:text-rose-50">
                          {plannedMovie.title}
                        </p>
                        <p className="text-[9.5px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                          {plannedMovie.year || 'Film'}{' '}
                          {plannedMovie.tmdbRating ? `• ⭐ ${plannedMovie.tmdbRating.toFixed(1)}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date & Time */}
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold text-[#4a1623] dark:text-rose-100">
                    Waktu Nonton Berdua
                  </label>
                  <input
                    type="datetime-local"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 text-[11px] font-bold text-[#4a1623] focus:outline-none dark:border-white/15 dark:bg-[#1f070f] dark:text-rose-100"
                  />
                </div>

                {/* Snacks & Quick Presets */}
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold text-[#4a1623] dark:text-rose-100">
                    Camilan & Minuman
                  </label>
                  <input
                    type="text"
                    value={plannedSnack}
                    onChange={(e) => setPlannedSnack(e.target.value)}
                    placeholder="Popcorn Caramel & Matcha Latte"
                    className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 text-[11px] font-bold text-[#4a1623] focus:outline-none dark:border-white/15 dark:bg-[#1f070f] dark:text-rose-100"
                  />
                  <div className="mt-1.5 flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    {SNACK_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPlannedSnack(preset)}
                        className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[8.5px] font-bold text-[#6e2438] hover:bg-rose-500/20 dark:bg-white/10 dark:text-rose-200"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Planned By */}
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold text-[#4a1623] dark:text-rose-100">
                    Direncanakan Oleh
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Berdua', 'Savero', 'Soffie'] as const).map((p) => {
                      const active = plannedBy === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            soundManager.playTap();
                            setPlannedBy(p);
                          }}
                          className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-2 text-[10px] font-extrabold border transition ${
                            active
                              ? 'bg-rose-500/15 border-rose-400 text-rose-600 dark:bg-rose-500/25 dark:text-rose-200'
                              : 'border-rose-200/50 bg-white/60 text-[#6e2438] dark:border-white/10 dark:bg-white/5 dark:text-rose-200'
                          }`}
                        >
                          <span>{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmPlan}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] py-2.5 text-xs font-black text-white shadow-md transition active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Konfirmasi Jadwal Kencan Nonton</span>
                </button>

                {confirmNotice && (
                  <div className="mt-2 flex flex-col items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-2.5 text-center text-[10.5px] font-extrabold text-emerald-800 dark:text-emerald-200">
                    <span>{confirmNotice}</span>
                    {onNavigateToHome && (
                      <button
                        type="button"
                        onClick={onNavigateToHome}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-[9.5px] font-black text-white"
                      >
                        Lihat di Beranda →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================
            MODAL 1: TMDB CATALOG RESULT DETAIL (DENGAN TRAILER, CAST & REKOMENDASI)
           ======================================================================== */}
        <AnimatePresence>
          {selectedCatalogResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-black/75 p-2 sm:p-4 backdrop-blur-md"
              onClick={() => setSelectedCatalogResult(null)}
            >
              <motion.div
                initial={{ scale: 0.94, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 24 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="clay-card-3d relative my-auto max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[2rem] p-4 text-left shadow-2xl scrollbar-none"
              >
                <CloseButton
                  onClick={() => setSelectedCatalogResult(null)}
                  className="absolute right-3 top-3 z-30"
                />

                {/* Backdrop Banner */}
                {selectedBackdrop && (
                  <div className="relative -mx-4 -mt-4 mb-3 h-36 overflow-hidden rounded-t-[2rem] bg-black/30">
                    <ManagedImage
                      src={selectedBackdrop}
                      alt={selectedTitle}
                      className="h-full w-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#fffaf0] via-transparent to-black/30 dark:from-[#2c0d18]" />
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="h-36 w-24 shrink-0 overflow-hidden rounded-2xl bg-black/10 shadow-md">
                    {selectedPoster ? (
                      <ManagedImage
                        src={selectedPoster}
                        alt={selectedTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-2 text-[9px]">
                        No Poster
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[8.5px] font-black uppercase text-rose-600 dark:bg-rose-400/20 dark:text-rose-300">
                      TMDB Verified
                    </span>
                    <h3 className="mt-1 text-sm sm:text-base font-black text-[#4a1623] dark:text-rose-50">
                      {selectedTitle}
                    </h3>

                    {catalogDetailsLoading && (
                      <p className="text-[10px] font-bold text-rose-400">Memuat metadata TMDB...</p>
                    )}

                    {selectedCatalogDetails && 'year' in selectedCatalogDetails && (
                      <p className="mt-0.5 text-[10px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                        {selectedCatalogDetails.year || 'TMDB'}
                        {selectedCatalogDetails.tmdbRating
                          ? ` • ⭐ ${selectedCatalogDetails.tmdbRating.toFixed(1)}`
                          : ''}
                        {'durationMinutes' in selectedCatalogDetails &&
                        selectedCatalogDetails.durationMinutes
                          ? ` • ⏱️ ${selectedCatalogDetails.durationMinutes}m`
                          : ''}
                      </p>
                    )}

                    {/* Genres */}
                    {selectedGenres.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {selectedGenres.slice(0, 4).map((g) => (
                          <span
                            key={g}
                            className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[8px] font-extrabold text-[#6e2438] dark:bg-white/10 dark:text-rose-200"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Trailer Button */}
                    {extraTmdbInfo.youtubeKey && (
                      <button
                        type="button"
                        onClick={() => setShowInlineTrailer((prev) => !prev)}
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[9.5px] font-black text-white shadow-xs active:scale-95"
                      >
                        <Play className="h-2.5 w-2.5 fill-white" />
                        <span>{showInlineTrailer ? 'Tutup Trailer' : 'Putar Trailer'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline YouTube Trailer Player */}
                {showInlineTrailer && extraTmdbInfo.youtubeKey && (
                  <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-md">
                    <iframe
                      src={`https://www.youtube.com/embed/${extraTmdbInfo.youtubeKey}?autoplay=1`}
                      title="TMDB Official Trailer"
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Overview / Biography */}
                <p className="mt-3 text-[11px] font-medium leading-relaxed text-[#5c2432] dark:text-rose-100/85">
                  {selectedOverview || 'Sinopsis / biografi belum tersedia di TMDB.'}
                </p>

                {/* Cast List */}
                {selectedCast.length > 0 && (
                  <div className="mt-3 border-t border-rose-200/40 pt-2.5 dark:border-white/10">
                    <span className="mb-1.5 block text-[9.5px] font-black uppercase text-[#8c4f60] dark:text-rose-300">
                      Pemeran Utama (Klik untuk cari di TMDB)
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {selectedCast.slice(0, 8).map((c: any, idx) => {
                        const actorName = typeof c === 'string' ? c : (c?.name || '');
                        const actorPhoto = typeof c === 'object' && c !== null ? c.photoUrl : undefined;
                        const actorChar = typeof c === 'object' && c !== null ? c.character : undefined;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedCatalogResult(null);
                              setCatalogType('person');
                              setCatalogQuery(actorName);
                              void handleCatalogSearch('person', actorName);
                            }}
                            className="clay-subcard-3d flex shrink-0 items-center gap-1.5 rounded-xl p-1 pr-2 text-left"
                          >
                            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-black/10 text-[#8c4f60]">
                              {actorPhoto ? (
                                <ManagedImage
                                  src={actorPhoto}
                                  alt={actorName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Users className="h-3.5 w-3.5 text-rose-500" />
                              )}
                            </div>
                            <div className="max-w-[90px]">
                              <p className="truncate text-[9px] font-black text-[#4a1623] dark:text-rose-50">
                                {actorName}
                              </p>
                              {actorChar && (
                                <p className="truncate text-[7.5px] text-[#8c4f60] dark:text-rose-200/70">
                                  {actorChar}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Person Credits (Jika sedang melihat Aktor) */}
                {extraTmdbInfo.personCredits.length > 0 && (
                  <div className="mt-3 border-t border-rose-200/40 pt-2.5 dark:border-white/10">
                    <span className="mb-1.5 block text-[9.5px] font-black uppercase text-[#8c4f60] dark:text-rose-300">
                      Filmografi Populer TMDB
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {extraTmdbInfo.personCredits.map((credit) => (
                        <button
                          key={credit.id}
                          type="button"
                          onClick={() => void openCatalogResult('movie', credit)}
                          className="clay-subcard-3d w-20 shrink-0 rounded-xl p-1 text-left"
                        >
                          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-black/10">
                            {credit.poster_path && (
                              <ManagedImage
                                src={`https://image.tmdb.org/t/p/w342${credit.poster_path}`}
                                alt={credit.title || ''}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <p className="mt-1 line-clamp-1 text-[8.5px] font-black text-[#4a1623] dark:text-rose-50">
                            {credit.title || credit.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations from TMDB */}
                {extraTmdbInfo.recommendations.length > 0 && (
                  <div className="mt-3 border-t border-rose-200/40 pt-2.5 dark:border-white/10">
                    <span className="mb-1.5 block text-[9.5px] font-black uppercase text-[#8c4f60] dark:text-rose-300">
                      Rekomendasi Serupa di TMDB
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {extraTmdbInfo.recommendations.map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() =>
                            void openCatalogResult(selectedIsTv ? 'tv' : 'movie', rec)
                          }
                          className="clay-subcard-3d w-20 shrink-0 rounded-xl p-1 text-left"
                        >
                          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-black/10">
                            {rec.poster_path && (
                              <ManagedImage
                                src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`}
                                alt={rec.title || rec.name || ''}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <p className="mt-1 line-clamp-1 text-[8.5px] font-black text-[#4a1623] dark:text-rose-50">
                            {rec.title || rec.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {catalogActionError && (
                  <p className="mt-2 text-[10px] font-bold text-red-600">{catalogActionError}</p>
                )}

                {/* Action Footer */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-rose-200/50 pt-3 dark:border-white/10">
                  {selectedAlreadySaved ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-[10.5px] font-black text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Sudah Ada di Koleksi Kalian
                    </span>
                  ) : (
                    <>
                      {selectedCatalogResult.kind === 'movie' && (
                        <button
                          type="button"
                          disabled={
                            catalogDetailsLoading ||
                            addingCatalogId === selectedCatalogResult.result.id
                          }
                          onClick={() => void saveSelectedCatalogResult('together')}
                          className="clay-subcard-3d rounded-full px-3.5 py-2 text-[10.5px] font-extrabold text-[#6e2438] dark:text-rose-100 active:scale-95"
                        >
                          + Sudah Ditonton Berdua
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={
                          catalogDetailsLoading ||
                          addingCatalogId === selectedCatalogResult.result.id
                        }
                        onClick={() => void saveSelectedCatalogResult('watchlist')}
                        className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] px-4 py-2 text-[10.5px] font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.75]" />
                        <span>
                          {addingCatalogId
                            ? 'Menyimpan...'
                            : selectedCatalogResult.kind === 'person'
                            ? 'Simpan Aktor Favorit'
                            : 'Tambah ke Wishlist'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================
            MODAL 2: SAVED MOVIE DETAIL & EDITOR (DENGAN TRAILER & REKOMENDASI TMDB)
           ======================================================================== */}
        <AnimatePresence>
          {selectedMovie && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-black/75 p-2 sm:p-4 backdrop-blur-md"
              onClick={() => setSelectedMovie(null)}
            >
              <motion.div
                initial={{ scale: 0.94, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 24 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="clay-card-3d relative my-auto max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[2rem] p-4 text-left shadow-2xl scrollbar-none"
              >
                <CloseButton
                  onClick={() => setSelectedMovie(null)}
                  className="absolute right-3 top-3 z-30"
                />

                {selectedMovie.backdropUrl && (
                  <div className="relative -mx-4 -mt-4 mb-3 h-32 overflow-hidden rounded-t-[2rem] bg-black/30">
                    <ManagedImage
                      src={selectedMovie.backdropUrl}
                      alt={selectedMovie.title}
                      className="h-full w-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#fffaf0] via-transparent to-black/30 dark:from-[#2c0d18]" />
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="h-36 w-24 shrink-0 overflow-hidden rounded-2xl bg-black/10 shadow-md">
                    {selectedMovie.posterUrl ? (
                      <ManagedImage
                        src={selectedMovie.posterUrl}
                        alt={selectedMovie.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[9px]">
                        No Poster
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pr-6">
                    <h3 className="text-sm sm:text-base font-black text-[#4a1623] dark:text-rose-50">
                      {selectedMovie.title}
                    </h3>
                    <p className="text-[10px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                      {selectedMovie.year || 'Film'}
                      {selectedMovie.tmdbRating ? ` • ⭐ ${selectedMovie.tmdbRating.toFixed(1)}` : ''}
                      {selectedMovie.durationMinutes ? ` • ⏱️ ${selectedMovie.durationMinutes}m` : ''}
                    </p>

                    {selectedMovie.genres && selectedMovie.genres.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedMovie.genres.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[8px] font-extrabold text-[#6e2438] dark:bg-white/10 dark:text-rose-200"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {extraTmdbInfo.youtubeKey && (
                        <button
                          type="button"
                          onClick={() => setShowInlineTrailer((prev) => !prev)}
                          className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[9px] font-black text-white shadow-2xs active:scale-95"
                        >
                          <Play className="h-2.5 w-2.5 fill-white" />
                          <span>{showInlineTrailer ? 'Tutup Trailer' : 'Trailer'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleQuickPlanMovie(selectedMovie)}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[9px] font-black text-amber-900 dark:text-amber-200 active:scale-95"
                      >
                        <Calendar className="h-2.5 w-2.5" />
                        <span>Jadwalkan Nonton</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Trailer */}
                {showInlineTrailer && extraTmdbInfo.youtubeKey && (
                  <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-md">
                    <iframe
                      src={`https://www.youtube.com/embed/${extraTmdbInfo.youtubeKey}?autoplay=1`}
                      title={selectedMovie.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                <p className="mt-2.5 line-clamp-3 text-[10.5px] font-medium leading-relaxed text-[#5c2432] dark:text-rose-100/85">
                  {selectedMovie.overview || 'Sinopsis belum tersedia.'}
                </p>

                {/* Editor Status, Tanggal & Rating Berdua */}
                <div className="mt-3 space-y-2.5 border-t border-rose-200/50 pt-2.5 text-xs dark:border-white/10">
                  <div>
                    <label className="mb-1 block text-[10.5px] font-extrabold text-[#4a1623] dark:text-rose-100">
                      Status Nonton
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'together', label: 'Berdua' },
                        { id: 'savero', label: 'Savero' },
                        { id: 'soffie', label: 'Soffie' },
                        { id: 'watchlist', label: 'Wishlist' }
                      ].map((st) => {
                        const active = selectedMovie.status === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              soundManager.playTap();
                              setSelectedMovie({
                                ...selectedMovie,
                                status: st.id as any,
                                watchedDate:
                                  st.id !== 'watchlist' && !selectedMovie.watchedDate
                                    ? new Date().toISOString().slice(0, 10)
                                    : selectedMovie.watchedDate
                              });
                            }}
                            className={`rounded-xl py-1.5 px-1.5 text-[9.5px] font-extrabold border transition active:scale-95 ${
                              active
                                ? 'bg-rose-500/20 border-rose-400 text-rose-600 dark:bg-rose-500/30 dark:text-rose-200'
                                : 'border-rose-200/50 bg-white/60 text-[#6e2438] dark:border-white/10 dark:bg-white/5 dark:text-rose-200'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-rose-200/50 bg-rose-50/50 p-2 dark:border-white/10 dark:bg-white/5">
                      <div className="mb-1 flex items-center gap-1">
                        <img
                          src="/characters/expressions/savero/bahagia.webp"
                          alt="Savero"
                          className="h-4 w-4 rounded-full object-cover object-top"
                        />
                        <span className="text-[9.5px] font-black text-[#4a1623] dark:text-rose-100">
                          Rating Savero
                        </span>
                      </div>
                      <HeartRating
                        rating={selectedMovie.ratingSavero || 0}
                        interactive
                        size={15}
                        onChange={(val) =>
                          setSelectedMovie({ ...selectedMovie, ratingSavero: val })
                        }
                      />
                    </div>

                    <div className="rounded-2xl border border-rose-200/50 bg-rose-50/50 p-2 dark:border-white/10 dark:bg-white/5">
                      <div className="mb-1 flex items-center gap-1">
                        <img
                          src="/characters/expressions/soffie/gemas-sayang.webp"
                          alt="Soffie"
                          className="h-4 w-4 rounded-full object-cover object-top"
                        />
                        <span className="text-[9.5px] font-black text-[#4a1623] dark:text-rose-100">
                          Rating Soffie
                        </span>
                      </div>
                      <HeartRating
                        rating={selectedMovie.ratingSoffie || 0}
                        interactive
                        size={15}
                        onChange={(val) =>
                          setSelectedMovie({ ...selectedMovie, ratingSoffie: val })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="mb-0.5 block text-[10px] font-extrabold">
                        Tanggal Ditonton
                      </label>
                      <input
                        type="date"
                        value={selectedMovie.watchedDate || ''}
                        onChange={(e) =>
                          setSelectedMovie({ ...selectedMovie, watchedDate: e.target.value })
                        }
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-2.5 py-1.5 text-[10.5px] font-bold text-[#4a1623] dark:border-white/15 dark:bg-[#1f070f] dark:text-rose-100"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-extrabold">
                        Catatan & Kesan Singkat
                      </label>
                      <input
                        type="text"
                        value={selectedMovie.notes || ''}
                        onChange={(e) =>
                          setSelectedMovie({ ...selectedMovie, notes: e.target.value })
                        }
                        placeholder="Seru banget bagian akhir..."
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-2.5 py-1.5 text-[10.5px] font-bold text-[#4a1623] dark:border-white/15 dark:bg-[#1f070f] dark:text-rose-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Rekomendasi Serupa dari TMDB */}
                {extraTmdbInfo.recommendations.length > 0 && (
                  <div className="mt-3 border-t border-rose-200/40 pt-2.5 dark:border-white/10">
                    <span className="mb-1.5 block text-[9px] font-black uppercase text-[#8c4f60] dark:text-rose-300">
                      Rekomendasi Film Serupa (TMDB)
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {extraTmdbInfo.recommendations.map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            setSelectedMovie(null);
                            void openCatalogResult('movie', rec);
                          }}
                          className="clay-subcard-3d w-18 shrink-0 rounded-xl p-1 text-left"
                        >
                          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-black/10">
                            {rec.poster_path && (
                              <ManagedImage
                                src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`}
                                alt={rec.title || ''}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[8px] font-black text-[#4a1623] dark:text-rose-50">
                            {rec.title}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-rose-200/50 pt-3 dark:border-white/10">
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Hapus "${selectedMovie.title}" dari koleksi?`)) {
                        soundManager.playClose();
                        await onRemoveMovie(selectedMovie);
                        setSelectedMovie(null);
                      }
                    }}
                    className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-[10.5px] font-extrabold text-red-600 dark:bg-red-950/40 dark:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Hapus</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMovie(null)}
                      className="clay-subcard-3d rounded-full px-3.5 py-1.5 text-[10.5px] font-extrabold text-[#7a3444] dark:text-rose-200"
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
                      className="rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] px-4 py-1.5 text-[10.5px] font-extrabold text-white shadow-md active:scale-95"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================
            MODAL 3: SAVED TV SERIES DETAIL & EPISODE TRACKER
           ======================================================================== */}
        <AnimatePresence>
          {selectedSeries && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-black/75 p-2 sm:p-4 backdrop-blur-md"
              onClick={() => setSelectedSeries(null)}
            >
              <motion.div
                initial={{ scale: 0.94, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 24 }}
                onClick={(e) => e.stopPropagation()}
                className="clay-card-3d relative my-auto max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[2rem] p-4 text-left shadow-2xl scrollbar-none"
              >
                <CloseButton
                  onClick={() => setSelectedSeries(null)}
                  className="absolute right-3 top-3 z-30"
                />

                <div className="flex gap-3">
                  <div className="h-32 w-22 shrink-0 overflow-hidden rounded-2xl bg-black/10 shadow-md">
                    {selectedSeries.posterUrl && (
                      <ManagedImage
                        src={selectedSeries.posterUrl}
                        alt={selectedSeries.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <span className="text-[9px] font-black uppercase text-rose-500">
                      {selectedSeries.totalSeasons} Season • {selectedSeries.totalEpisodes} Episode
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-[#4a1623] dark:text-rose-50">
                      {selectedSeries.title}
                    </h3>
                    {extraTmdbInfo.youtubeKey && (
                      <button
                        type="button"
                        onClick={() => setShowInlineTrailer((p) => !p)}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[9px] font-black text-white"
                      >
                        <Play className="h-2.5 w-2.5 fill-white" />
                        <span>{showInlineTrailer ? 'Tutup Trailer' : 'Trailer Serial'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {showInlineTrailer && extraTmdbInfo.youtubeKey && (
                  <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${extraTmdbInfo.youtubeKey}?autoplay=1`}
                      title={selectedSeries.title}
                      className="h-full w-full"
                      allowFullScreen
                    />
                  </div>
                )}

                <p className="mt-2.5 text-[10.5px] font-medium leading-relaxed text-[#5c2432] dark:text-rose-100/85">
                  {selectedSeries.overview || 'Sinopsis serial belum tersedia.'}
                </p>

                <div className="mt-3 space-y-2.5 border-t border-rose-200/50 pt-2.5 text-xs dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold">Progres Episode:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSeries({
                            ...selectedSeries,
                            watchedEpisodes: Math.max(0, selectedSeries.watchedEpisodes - 1)
                          })
                        }
                        className="clay-subcard-3d h-7 w-7 rounded-full font-black"
                      >
                        -
                      </button>
                      <span className="text-xs font-black">
                        {selectedSeries.watchedEpisodes} / {selectedSeries.totalEpisodes}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSeries({
                            ...selectedSeries,
                            watchedEpisodes: Math.min(
                              selectedSeries.totalEpisodes || 999,
                              selectedSeries.watchedEpisodes + 1
                            )
                          })
                        }
                        className="clay-subcard-3d h-7 w-7 rounded-full font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-0.5 block text-[10px] font-extrabold">
                      Catatan Serial Berdua
                    </label>
                    <input
                      type="text"
                      value={selectedSeries.notes || ''}
                      onChange={(e) =>
                        setSelectedSeries({ ...selectedSeries, notes: e.target.value })
                      }
                      placeholder="Episode favorit..."
                      className="w-full rounded-xl border border-rose-200/80 bg-white px-2.5 py-1.5 text-[10.5px] font-bold text-[#4a1623] dark:border-white/15 dark:bg-[#1f070f] dark:text-rose-100"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-rose-200/50 pt-3 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playSuccess();
                      void onUpdateTvSeries(selectedSeries);
                      setSelectedSeries(null);
                    }}
                    className="rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] px-4 py-1.5 text-[10.5px] font-extrabold text-white shadow-md"
                  >
                    Simpan Serial
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================
            MODAL 4: SAVED ACTOR DETAIL & TMDB FILMOGRAPHY
           ======================================================================== */}
        <AnimatePresence>
          {selectedActor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-black/75 p-2 sm:p-4 backdrop-blur-md"
              onClick={() => setSelectedActor(null)}
            >
              <motion.div
                initial={{ scale: 0.94, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 24 }}
                onClick={(e) => e.stopPropagation()}
                className="clay-card-3d relative my-auto max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[2rem] p-4 text-left shadow-2xl scrollbar-none"
              >
                <CloseButton
                  onClick={() => setSelectedActor(null)}
                  className="absolute right-3 top-3 z-30"
                />

                <div className="flex gap-3">
                  <div className="h-28 w-22 shrink-0 overflow-hidden rounded-2xl bg-black/10 shadow-md">
                    {selectedActor.photoUrl && (
                      <ManagedImage
                        src={selectedActor.photoUrl}
                        alt={selectedActor.name}
                        className="h-full w-full object-cover object-top"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[8.5px] font-black uppercase text-rose-600 dark:text-rose-300">
                      Disukai oleh {selectedActor.likedBy || 'Berdua'}
                    </span>
                    <h3 className="mt-1 text-base font-black text-[#4a1623] dark:text-rose-50">
                      {selectedActor.name}
                    </h3>
                    {selectedActor.birthPlace && (
                      <p className="text-[9.5px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                        📍 {selectedActor.birthPlace}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-2.5 line-clamp-4 text-[10.5px] font-medium leading-relaxed text-[#5c2432] dark:text-rose-100/85">
                  {selectedActor.biography || 'Biografi aktor dari TMDB.'}
                </p>

                {extraTmdbInfo.personCredits.length > 0 && (
                  <div className="mt-3 border-t border-rose-200/40 pt-2.5 dark:border-white/10">
                    <span className="mb-1.5 block text-[9.5px] font-black uppercase text-[#8c4f60] dark:text-rose-300">
                      Film yang Dibintangi (Klik untuk Tambah ke Wishlist)
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {extraTmdbInfo.personCredits.map((credit) => (
                        <button
                          key={credit.id}
                          type="button"
                          onClick={() => {
                            setSelectedActor(null);
                            void openCatalogResult('movie', credit);
                          }}
                          className="clay-subcard-3d w-20 shrink-0 rounded-xl p-1 text-left"
                        >
                          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-black/10">
                            {credit.poster_path && (
                              <ManagedImage
                                src={`https://image.tmdb.org/t/p/w342${credit.poster_path}`}
                                alt={credit.title || ''}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <p className="mt-1 line-clamp-1 text-[8.5px] font-black text-[#4a1623] dark:text-rose-50">
                            {credit.title || credit.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};