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
  Clock,
  Sparkles,
  CheckCircle,
  Plus,
  Play,
  ListOrdered,
  Eye,
  Coffee,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { CloseButton } from '../common/CloseButton';
import { MovieItem, ActorItem, MovieCollection, TvSeries, MemoryPin, AppSettings } from '../../types';
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

interface MoviesSectionProps {
  movies: MovieItem[];
  tvSeries: TvSeries[];
  actors: ActorItem[];
  catalogSyncError: string | null;
  collections: MovieCollection[];
  pins: MemoryPin[];
  settings: AppSettings;
  activeProfile: 'Savero' | 'Soffie';
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
  pins,
  settings,
  activeProfile,
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
        if (JSON.stringify(movie) !== JSON.stringify(movies[index])) onUpdateMovie(movie);
      });
      actorMetadata.forEach((actor, index) => {
        if (JSON.stringify(actor) !== JSON.stringify(actors[index])) onUpdateActor(actor);
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
      setSelectedCatalogResult(null);
      setSelectedCatalogDetails(null);
    } catch (error) {
      setCatalogActionError(error instanceof Error ? error.message : 'Item gagal ditambahkan ke daftar bersama.');
    } finally {
      setAddingCatalogId(null);
    }
  };

  // Movie Night Planner State
  const [plannedMovieId, setPlannedMovieId] = useState('');
  const [plannedDate, setPlannedDate] = useState('2026-10-18T20:30');
  const [plannedSnack, setPlannedSnack] = useState('Sate Taichan Pleburan + Popcorn Manis');
  const [plannedDrink, setPlannedDrink] = useState('Iced Matcha Latte Soffie & Kopi V60 Savero');
  const plannedMovie = movies.find((movie) => movie.id === plannedMovieId) ?? movies[0];

  // Filtered & Sorted Movies
  const filteredMovies = useMemo(() => {
    const localList = movies
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

    return localList;
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
    <section id="film-aktor" className="py-12 px-4 bg-[#EFE6DA] dark:bg-[#1a0507] border-b border-[#7A1018]/15 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] mb-1">
              <Film className="w-3.5 h-3.5" />
              <span>SINEMA & FILMOGRAFI</span>
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
              Film, Aktor & Movie Night
            </h2>
            <p className="font-editorial italic text-xs sm:text-sm text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 mt-0.5">
              Koleksi tontonan berdua Savero & Soffie, rating hati terpisah, dan target maraton serial.
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex max-w-full items-center space-x-1.5 overflow-x-auto rounded-2xl border border-rose-200/70 bg-white/65 p-1.5 text-xs font-sans-clean font-bold scrollbar-none dark:border-white/10 dark:bg-white/5">
            <button
              onClick={() => setActiveTab('film')}
              className={`shrink-0 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'film' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Film ({movies.length})
            </button>
            <button
              onClick={() => setActiveTab('serial')}
              className={`shrink-0 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'serial' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Serial TV ({tvSeries.length})
            </button>
            <button
              onClick={() => setActiveTab('aktor')}
              className={`shrink-0 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'aktor' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Aktor ({actors.length})
            </button>
            <button
              onClick={() => setActiveTab('koleksi')}
              className={`shrink-0 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'koleksi' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Franchise ({collections.length})
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`shrink-0 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'planner' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Movie Night
            </button>
          </div>
        </div>

        {metadataSyncState === 'loading' && (
          <p className="mb-4 text-xs text-[#956d74] dark:text-rose-100/60" role="status">Koleksi tersimpan tetap bisa dilihat selagi detail terbaru dimuat.</p>
        )}
        {metadataSyncState === 'missing-key' && (
          <p className="mb-4 rounded-2xl bg-amber-100/70 px-4 py-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100" role="alert">
            TMDB belum dikonfigurasi. Tambahkan <code>VITE_TMDB_API_KEY</code> ke file <code>.env</code> dan mulai ulang aplikasi agar pencarian film, poster, dan detail metadata aktif.
          </p>
        )}
        {metadataSyncState === 'error' && (
          <p className="mb-4 rounded-2xl bg-rose-100/70 px-4 py-3 text-xs text-[#75414c] dark:bg-white/5 dark:text-rose-100/70" role="status">Sebagian detail belum tersedia. Koleksi dan catatan kalian tetap aman.</p>
        )}

        <div className="mb-6 rounded-2xl border border-[#7A1018]/15 bg-white/60 p-4 dark:bg-black/20">
          <div className="mb-3">
            <h3 className="font-sans-clean text-sm font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">Cari di TMDB</h3>
            <p className="mt-0.5 text-xs text-[#6e5156] dark:text-rose-100/65">Pilih jenis katalog lalu ketik; hasil diperbarui otomatis.</p>
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCatalogSearch(catalogType);
            }}
          >
            <select
              value={catalogType}
              onChange={(event) => {
                setCatalogType(event.target.value as 'movie' | 'tv' | 'person');
                setCatalogResults([]);
                setCatalogKind(null);
                setCatalogError('');
              }}
              className="rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2.5 text-sm text-[#3B0A0F] dark:bg-black/30 dark:text-[#EFE6DA] sm:w-44"
              aria-label="Jenis katalog TMDB"
            >
              <option value="movie">Film</option>
              <option value="tv">Serial TV</option>
              <option value="person">Aktor</option>
            </select>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder={catalogType === 'person' ? 'Nama aktor atau aktris' : catalogType === 'tv' ? 'Judul serial TV' : 'Judul film'}
                className="w-full rounded-xl border border-[#7A1018]/20 bg-white py-2.5 pl-9 pr-3 text-sm text-[#3B0A0F] dark:bg-black/30 dark:text-[#EFE6DA]"
                aria-label={`Cari ${catalogType === 'person' ? 'aktor' : catalogType === 'tv' ? 'serial TV' : 'film'} di TMDB`}
              />
            </div>
            <span className="inline-flex min-h-10 items-center justify-center gap-2 px-2 text-xs font-semibold text-[#7A1018] dark:text-[#F4B6C2]" role="status" aria-live="polite">
              <Search className="h-4 w-4" aria-hidden="true" />
              {catalogLoading ? 'Mencari…' : 'Otomatis'}
            </span>
          </form>
          {catalogError && <p className="mt-3 text-xs text-red-700 dark:text-red-300" role="status">{catalogError}</p>}
          {catalogSyncError && <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200" role="alert">Sinkronisasi Supabase gagal: {catalogSyncError}. Jalankan migration 202610170007_shared_tmdb_catalog.sql dan pastikan akun sudah terpasang sebagai anggota pasangan.</p>}
          {wishlistActionError && <p className="mt-3 text-xs text-red-700 dark:text-red-300" role="alert">{wishlistActionError}</p>}
          {catalogKind && catalogResults.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A1018] dark:text-[#F4B6C2]">
                  Hasil {catalogKind === 'movie' ? 'film' : catalogKind === 'tv' ? 'serial' : 'aktor'} · {catalogResults.length}
                </h4>
                <button type="button" onClick={() => setCatalogResults([])} className="text-xs font-semibold text-[#6e5156] hover:text-[#7A1018] dark:text-rose-100/65">
                  Bersihkan
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {catalogResults.map((result) => {
                  const isMovie = catalogKind === 'movie';
                  const isTv = catalogKind === 'tv';
                  const movie = isMovie ? mapMovieSearchResult(result) : null;
                  const series = isTv ? mapTvSearchResult(result) : null;
                  const person = !isMovie && !isTv ? mapPersonSearchResult(result) : null;
                  const title = movie?.title ?? series?.title ?? person?.name ?? 'Hasil TMDB';
                  const image = movie?.posterUrl ?? series?.posterUrl ?? person?.photoUrl ?? '';
                  const year = movie?.year ?? (result.first_air_date ? Number(result.first_air_date.slice(0, 4)) : undefined);
                  const alreadyAdded = isMovie
                    ? movies.some((item) => item.tmdbId === result.id)
                    : isTv
                      ? tvSeries.some((item) => item.tmdbId === result.id)
                      : actors.some((item) => item.tmdbId === result.id);

                  return (
                    <button
                      key={`${catalogKind}-${result.id}`}
                      type="button"
                      onClick={() => void openCatalogResult(catalogKind, result)}
                      className="group overflow-hidden rounded-xl border border-[#7A1018]/15 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1018] dark:bg-[#2a1015]"
                    >
                      <div className="relative aspect-[2/3] bg-[#7A1018]/5 dark:bg-white/5">
                        {image
                          ? <ManagedImage src={image} alt={title} className={`h-full w-full ${isMovie || isTv ? 'object-cover' : 'object-cover object-top'}`} />
                          : <div className="flex h-full items-center justify-center p-3 text-center text-xs text-[#6e5156] dark:text-rose-100/65">{isMovie || isTv ? 'Poster tidak tersedia' : 'Foto tidak tersedia'}</div>}
                        {alreadyAdded && <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[9px] font-bold text-white">Sudah ditambahkan</span>}
                      </div>
                      <div className="p-2.5">
                        <p className="line-clamp-2 min-h-9 text-xs font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">{title}</p>
                        {year && <p className="mt-0.5 text-[10px] text-gray-500">{year}</p>}
                        <p className="mt-2 text-[10px] font-semibold text-[#7A1018] dark:text-[#F4B6C2]">Ketuk poster untuk detail</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedCatalogResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-sm sm:p-6"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedCatalogResult(null);
                  setSelectedCatalogDetails(null);
                  setCatalogActionError('');
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-[#7A1018]/20 bg-[#EFE6DA] shadow-2xl dark:bg-[#250709]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tmdb-detail-title"
              >
                <div className="flex items-start justify-between gap-3 border-b border-[#7A1018]/15 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A1018] dark:text-[#F4B6C2]">
                      TMDB · {selectedCatalogResult.kind === 'movie' ? 'Film' : selectedCatalogResult.kind === 'tv' ? 'Serial TV' : 'Aktor'}
                    </p>
                    <h3 id="tmdb-detail-title" className="mt-1 text-lg font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                      {selectedTitle}
                    </h3>
                  </div>
                  <CloseButton onClick={() => {
                    setSelectedCatalogResult(null);
                    setSelectedCatalogDetails(null);
                    setCatalogActionError('');
                  }} />
                </div>

                <div className="max-h-[calc(100dvh-190px)] overflow-y-auto p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="mx-auto h-56 w-40 shrink-0 overflow-hidden rounded-2xl bg-[#7A1018]/10 sm:mx-0">
                      {selectedPoster
                        ? <ManagedImage src={selectedPoster} alt={selectedTitle} className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[#6e5156] dark:text-rose-100/65">Gambar belum tersedia</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      {catalogDetailsLoading && <p className="mb-2 text-xs text-[#6e5156] dark:text-rose-100/65" role="status">Memuat detail dari TMDB…</p>}
                      {selectedCatalogDetails && 'year' in selectedCatalogDetails && selectedCatalogDetails.year && (
                        <p className="mb-2 text-xs text-[#6e5156] dark:text-rose-100/65">
                          {selectedCatalogDetails.year}
                          {selectedCatalogDetails.tmdbRating !== undefined ? ` · Rating TMDB ${selectedCatalogDetails.tmdbRating.toFixed(1)}` : ''}
                          {selectedCatalogDetails.durationMinutes ? ` · ${selectedCatalogDetails.durationMinutes} menit` : ''}
                        </p>
                      )}
                      {selectedCatalogDetails && 'totalSeasons' in selectedCatalogDetails && (
                        <p className="mb-2 text-xs text-[#6e5156] dark:text-rose-100/65">
                          {selectedCatalogDetails.totalSeasons} season · {selectedCatalogDetails.totalEpisodes} episode
                          {selectedCatalogDetails.tmdbRating !== undefined ? ` · Rating TMDB ${selectedCatalogDetails.tmdbRating.toFixed(1)}` : ''}
                        </p>
                      )}
                      {selectedCatalogDetails && 'birthDate' in selectedCatalogDetails && selectedCatalogDetails.birthDate && (
                        <p className="mb-2 text-xs text-[#6e5156] dark:text-rose-100/65">
                          {selectedCatalogDetails.birthDate}{selectedCatalogDetails.birthPlace ? ` · ${selectedCatalogDetails.birthPlace}` : ''}
                        </p>
                      )}
                      {!!selectedGenres?.length && (
                        <p className="mb-2 text-xs text-[#6e5156] dark:text-rose-100/65">{selectedGenres.join(' · ')}</p>
                      )}
                      <p className="text-sm leading-relaxed text-[#3B0A0F]/85 dark:text-[#EFE6DA]/85">
                        {selectedOverview || (catalogDetailsLoading ? '' : 'Sinopsis atau biografi belum tersedia di TMDB.')}
                      </p>
                      {!!selectedCast?.length && <p className="mt-3 text-xs text-[#6e5156] dark:text-rose-100/65">Pemeran: {selectedCast.slice(0, 6).join(', ')}</p>}
                      {!!selectedCredits?.length && <p className="mt-3 text-xs text-[#6e5156] dark:text-rose-100/65">Filmografi: {selectedCredits.slice(0, 5).join(', ')}</p>}
                    </div>
                  </div>
                  {catalogActionError && <p className="mt-4 rounded-xl bg-red-100 px-3 py-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200" role="alert">{catalogActionError}</p>}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-[#7A1018]/15 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatalogResult(null);
                      setSelectedCatalogDetails(null);
                      setCatalogActionError('');
                    }}
                    className="rounded-xl border border-[#7A1018]/20 px-4 py-2.5 text-sm font-semibold text-[#6e5156] transition hover:bg-[#7A1018]/5 dark:text-rose-100/75"
                  >
                    Tutup
                  </button>
                  {selectedInWishlist && (savedSelectedMovie || savedSelectedSeries) ? (
                    <button
                      type="button"
                      disabled={addingCatalogId === selectedCatalogResult.result.id}
                      onClick={async () => {
                        setAddingCatalogId(selectedCatalogResult.result.id);
                        setCatalogActionError('');
                        try {
                          if (savedSelectedMovie) await onRemoveMovie(savedSelectedMovie);
                          else if (savedSelectedSeries) await onRemoveTvSeries(savedSelectedSeries);
                          setSelectedCatalogResult(null);
                          setSelectedCatalogDetails(null);
                        } catch (error) {
                          setCatalogActionError(error instanceof Error ? error.message : 'Wishlist gagal dihapus.');
                        } finally {
                          setAddingCatalogId(null);
                        }
                      }}
                      className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/40"
                    >
                      {addingCatalogId === selectedCatalogResult.result.id ? 'Menghapus…' : 'Hapus dari wishlist'}
                    </button>
                  ) : selectedAlreadySaved ? (
                    <span className="rounded-xl bg-[#7A1018]/10 px-4 py-2.5 text-center text-sm font-semibold text-[#7A1018] dark:text-[#F4B6C2]">Sudah ada di koleksi</span>
                  ) : (
                    <button
                      type="button"
                      disabled={catalogDetailsLoading || !selectedCatalogDetails || addingCatalogId === selectedCatalogResult.result.id}
                      onClick={() => void saveSelectedCatalogResult()}
                      className="rounded-xl bg-[#7A1018] px-5 py-2.5 text-sm font-bold text-[#EFE6DA] shadow-sm transition hover:bg-[#5e0a11] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addingCatalogId === selectedCatalogResult.result.id
                        ? 'Menyimpan…'
                        : selectedCatalogResult.kind === 'person' ? 'Simpan aktor' : 'Tambah ke wishlist'}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 1: Film List */}
        {activeTab === 'film' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-[#7A1018]/15 flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans-clean">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'together', label: 'Ditonton Berdua' },
                  { id: 'savero', label: 'Savero' },
                  { id: 'soffie', label: 'Soffie' },
                  { id: 'watchlist', label: 'Watchlist' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setMovieFilter(f.id as any)}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      movieFilter === f.id
                        ? 'bg-[#7A1018] text-white shadow-sm'
                        : 'bg-white/40 dark:bg-white/5 hover:bg-white/80 text-[#3B0A0F] dark:text-[#EFE6DA]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2 text-xs font-sans-clean">
                <span className="text-gray-500 font-bold uppercase text-[10px]">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-[#7A1018]/20 font-medium"
                >
                  <option value="date">Tanggal Nonton</option>
                  <option value="rating">Rating Tertinggi</option>
                  <option value="title">Judul (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Movies Posters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMovies.map((movie) => {
                const isTogether = movie.status === 'together';
                const isSavero = movie.status === 'savero';
                const isSoffie = movie.status === 'soffie';

                return (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="group relative bg-white/70 dark:bg-black/30 rounded-2xl overflow-hidden border border-[#7A1018]/20 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    {/* Poster with Aspect Ratio */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/10">
                      {movie.posterUrl
                        ? <ManagedImage
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        : <div className="flex h-full items-center justify-center p-3 text-center text-xs text-[#6e5156] dark:text-rose-100/70">Poster belum tersedia di TMDB</div>}

                      {/* Status Badges on Poster (avatar S, avatar F, heart berdua) as required */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {isTogether && (
                          <span
                            className="w-6 h-6 rounded-full bg-[#7A1018] text-white flex items-center justify-center shadow-md border border-white/20"
                            title="Ditonton Berdua"
                          >
                            <Heart className="w-3.5 h-3.5 fill-[#F4B6C2] text-[#F4B6C2]" />
                          </span>
                        )}
                        {isSavero && (
                          <span
                            className="w-6 h-6 rounded-full bg-[#C9A58B] text-[#3B0A0F] font-bold flex items-center justify-center text-[10px] shadow-md border border-white"
                            title="Savero Sudah Nonton"
                          >
                            S
                          </span>
                        )}
                        {isSoffie && (
                          <span
                            className="w-6 h-6 rounded-full bg-[#BFD8B8] text-[#3B0A0F] font-bold flex items-center justify-center text-[10px] shadow-md border border-white"
                            title="Soffie Sudah Nonton"
                          >
                            F
                          </span>
                        )}
                        {movie.status === 'watchlist' && (
                          <span
                            className="px-2 py-0.5 rounded-full bg-black/70 text-[#EFE6DA] text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs"
                            title="Masuk Watchlist"
                          >
                            Wishlist
                          </span>
                        )}
                      </div>

                      {/* TMDB Rating Badge */}
                      {movie.tmdbRating && (
                        <div className="absolute top-2 right-2 bg-black/70 text-[#D9B26F] text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center space-x-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{movie.tmdbRating}</span>
                        </div>
                      )}
                    </div>

                    {/* Movie Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif-title font-bold text-xs sm:text-sm text-[#3B0A0F] dark:text-[#EFE6DA] line-clamp-1 group-hover:text-[#7A1018] dark:group-hover:text-[#F4B6C2] transition-colors">
                          {movie.title}
                        </h4>
                        <div className="text-[10px] text-gray-500 font-sans-clean mt-0.5 flex items-center justify-between">
                          <span>{movie.year || 'Tahun tidak tersedia'}</span>
                          {movie.addedBy && <span className="text-[#a94761] dark:text-rose-200">oleh {movie.addedBy}</span>}
                        </div>
                      </div>

                      {/* Ratings Preview */}
                      <div className="mt-2 pt-2 border-t border-[#7A1018]/10 text-[10px] font-sans-clean flex items-center justify-between text-gray-600 dark:text-gray-400">
                        {movie.ratingSavero ? (
                          <div className="flex items-center space-x-1" title="Rating Savero">
                            <span className="font-bold text-[9px]">S:</span>
                            <HeartRating rating={movie.ratingSavero} size={9} />
                          </div>
                        ) : null}
                        {movie.ratingSoffie ? (
                          <div className="flex items-center space-x-1" title="Rating Soffie">
                            <span className="font-bold text-[9px]">F:</span>
                            <HeartRating rating={movie.ratingSoffie} size={9} />
                          </div>
                        ) : null}
                      </div>
                      {movie.status === 'watchlist' && (
                        <button
                          type="button"
                          disabled={removingWishlistId === movie.tmdbId}
                          onClick={async (event) => {
                            event.stopPropagation();
                            if (!movie.tmdbId) return;
                            setRemovingWishlistId(movie.tmdbId);
                            setWishlistActionError('');
                            try {
                              await onRemoveMovie(movie);
                            } catch (error) {
                              setWishlistActionError(error instanceof Error ? error.message : 'Wishlist gagal dihapus.');
                            } finally {
                              setRemovingWishlistId(null);
                            }
                          }}
                          className="mt-2 w-full rounded-lg border border-red-300 px-2 py-1.5 text-[10px] font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/40"
                        >
                          {removingWishlistId === movie.tmdbId ? 'Menghapus…' : 'Hapus dari wishlist'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!filteredMovies.length && (
              <p className="rounded-2xl border border-dashed border-[#7A1018]/25 px-4 py-8 text-center text-sm text-[#6e5156] dark:text-rose-100/70">
                Belum ada film tersimpan. Cari judul di TMDB, lalu tambahkan ke watchlist.
              </p>
            )}

          </div>
        )}

        {/* Tab: Serial TV & Episode Tracker */}
        {activeTab === 'serial' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif-title text-xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                Pelacak Episode Serial TV Bersama
              </h3>
              <p className="text-xs text-gray-500 font-sans-clean">
                Catat kemajuan tontonan serial favorit Savero & Soffie. Cari serial melalui kotak pencarian TMDB di atas.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {!tvSeries.length && (
                <p className="md:col-span-3 rounded-2xl border border-dashed border-[#7A1018]/25 px-4 py-8 text-center text-sm text-[#6e5156] dark:text-rose-100/70">
                  Belum ada serial tersimpan. Cari serial di TMDB untuk menambahkannya.
                </p>
              )}
              {tvSeries.map((series) => {
                const pct = series.totalEpisodes ? Math.round((series.watchedEpisodes / series.totalEpisodes) * 100) : 0;
                const isCompleted = series.watchedEpisodes >= series.totalEpisodes;

                return (
                  <div
                    key={series.id}
                    className="bg-white/70 dark:bg-black/30 rounded-2xl p-5 border border-[#7A1018]/15 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full h-44 rounded-xl overflow-hidden mb-3 bg-black/10">
                        {series.posterUrl ? <ManagedImage src={series.posterUrl} alt={series.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">Poster belum tersedia di TMDB</div>}
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-sans-clean font-bold tracking-widest uppercase text-[#7A1018] dark:text-[#F4B6C2]">
                          {series.totalSeasons} Season · {series.totalEpisodes} episode
                        </span>
                        <span
                          className={`text-[9px] font-sans-clean font-bold uppercase px-2 py-0.5 rounded-full ${
                            series.status === 'watchlist'
                              ? 'bg-amber-100 text-amber-800'
                              : isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {series.status === 'watchlist' ? 'Wishlist' : isCompleted ? 'Tamat Nonton' : 'Sedang Ditonton'}
                        </span>
                      </div>

                      <h4 className="font-serif-title font-bold text-lg text-[#3B0A0F] dark:text-[#EFE6DA] mb-1">
                        {series.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 mb-2">
                        {series.firstAirDate ? `Tayang perdana ${series.firstAirDate}` : ''}
                        {series.tmdbRating !== undefined ? ` · Rating TMDB ${series.tmdbRating.toFixed(1)}` : ''}
                        {series.genres?.length ? ` · ${series.genres.join(', ')}` : ''}
                      </p>
                      {series.overview && <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">{series.overview}</p>}
                      {!!series.cast?.length && <p className="text-[10px] text-gray-500 mb-3">Pemeran: {series.cast.slice(0, 4).join(', ')}</p>}
                      {series.notes && (
                        <p className="text-xs font-editorial italic text-gray-600 dark:text-gray-400 mb-3">
                          "{series.notes}"
                        </p>
                      )}

                      {/* Progress Bar */}
                      {series.status !== 'watchlist' && (
                        <div className="mb-4 space-y-1">
                          <div className="flex justify-between text-xs font-sans-clean font-bold">
                            <span>Episode {series.watchedEpisodes} dari {series.totalEpisodes}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#7A1018] to-[#F4B6C2] transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Interactive Episode Counter Buttons */}
                    {series.status === 'watchlist' ? (
                      <div className="flex gap-2 border-t border-[#7A1018]/10 pt-3 text-xs font-sans-clean">
                        <button
                          type="button"
                          onClick={() => void onUpdateTvSeries({ ...series, status: 'watching' }).catch((error) => setWishlistActionError(error instanceof Error ? error.message : 'Serial gagal diperbarui.'))}
                          className="flex-1 rounded-lg bg-[#7A1018] px-3 py-2 font-bold text-white hover:bg-[#5e0a11]"
                        >
                          Mulai nonton
                        </button>
                        <button
                          type="button"
                          disabled={removingWishlistId === series.tmdbId}
                          onClick={async () => {
                            if (!series.tmdbId) return;
                            setRemovingWishlistId(series.tmdbId);
                            setWishlistActionError('');
                            try {
                              await onRemoveTvSeries(series);
                            } catch (error) {
                              setWishlistActionError(error instanceof Error ? error.message : 'Wishlist gagal dihapus.');
                            } finally {
                              setRemovingWishlistId(null);
                            }
                          }}
                          className="rounded-lg border border-red-300 px-3 py-2 font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/40"
                        >
                          {removingWishlistId === series.tmdbId ? 'Menghapus…' : 'Hapus'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 border-t border-[#7A1018]/10 pt-3 text-xs font-sans-clean">
                        <button
                          onClick={() => void onUpdateTvSeries({ ...series, watchedEpisodes: Math.max(0, series.watchedEpisodes - 1) }).catch((error) => setWishlistActionError(error instanceof Error ? error.message : 'Progres serial gagal disimpan.'))}
                          className="rounded-lg bg-gray-200 px-3 py-1.5 font-bold hover:bg-gray-300 dark:bg-gray-800"
                        >
                          -1 Ep
                        </button>
                        <button
                          onClick={() => void onUpdateTvSeries({ ...series, watchedEpisodes: Math.min(series.totalEpisodes, series.watchedEpisodes + 1) }).catch((error) => setWishlistActionError(error instanceof Error ? error.message : 'Progres serial gagal disimpan.'))}
                          className="flex-1 rounded-lg bg-[#7A1018] py-1.5 text-center font-bold text-white hover:bg-[#5e0a11]"
                        >
                          +1 Episode Selesai
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Aktor & Aktris */}
        {activeTab === 'aktor' && (
          <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {!actors.length && (
              <p className="sm:col-span-2 md:col-span-4 rounded-2xl border border-dashed border-[#7A1018]/25 px-4 py-8 text-center text-sm text-[#6e5156] dark:text-rose-100/70">
                Belum ada aktor tersimpan. Cari nama aktor di TMDB untuk melihat profil dan filmografinya.
              </p>
            )}
            {actors.map((actor) => (
              <div
                key={actor.id}
                className="bg-white/60 dark:bg-black/30 rounded-2xl overflow-hidden border border-[#7A1018]/15 shadow-sm p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-56 rounded-xl overflow-hidden mb-3 shadow-inner bg-[#7A1018]/10">
                    {actor.photoUrl ? <ManagedImage src={actor.photoUrl} alt={actor.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">Foto belum tersedia di TMDB</div>}
                  </div>
                  <h4 className="font-serif-title font-bold text-base text-[#3B0A0F] dark:text-[#EFE6DA]">
                    {actor.name}
                  </h4>
                  <div className="text-[10px] text-gray-500 font-sans-clean mb-2">
                    {actor.birthPlace || 'Pemeran Film'}
                  </div>
                  {actor.birthDate && <div className="text-[10px] text-gray-500 mb-2">Lahir {actor.birthDate}</div>}
                  <p className="text-xs font-editorial text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
                    {actor.biography}
                  </p>
                  {!!actor.topMovies?.length && <p className="text-[10px] text-gray-500 line-clamp-2">Film/serial: {actor.topMovies.slice(0, 4).join(', ')}</p>}
                </div>

                <div className="pt-3 border-t border-[#7A1018]/10 flex items-center justify-between">
                  <span className="text-[10px] font-sans-clean text-[#7A1018] dark:text-[#F4B6C2] font-bold uppercase">
                    Disukai: {actor.likedBy}
                  </span>

                  {/* Suka Toggle Button */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onToggleActorLike(actor.id, 'Berdua')}
                      className={`p-1.5 rounded-lg text-xs flex items-center justify-center ${
                        actor.likedBy === 'Berdua'
                          ? 'bg-[#7A1018] text-white'
                          : 'bg-gray-100 dark:bg-white/10 hover:bg-[#F4B6C2]/30 text-[#7A1018]'
                      }`}
                      title="Disukai Berdua"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => onToggleActorLike(actor.id, activeProfile)}
                      className={`p-1.5 rounded-lg text-xs font-bold ${actor.likedBy === activeProfile ? (activeProfile === 'Savero' ? 'bg-[#C9A58B] text-black' : 'bg-[#BFD8B8] text-black') : 'bg-gray-100 dark:bg-white/10 hover:bg-[#F4B6C2]/30'}`}
                      title={`Disukai ${activeProfile}`}
                    >
                      {activeProfile === 'Savero' ? 'S' : 'F'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}

        {/* Tab 3: Franchise & Koleksi Film */}
        {activeTab === 'koleksi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {!collections.length && (
                <p className="md:col-span-3 rounded-2xl border border-dashed border-[#7A1018]/25 px-4 py-8 text-center text-sm text-[#6e5156] dark:text-rose-100/70">
                  Belum ada koleksi franchise tersimpan.
                </p>
              )}
              {collections.map((col) => {
                // Calculate progress
                const totalTitles = col.movieTitles.length;
                const watchedCount = col.movieTitles.filter((title) =>
                  movies.some((m) => m.title.toLowerCase().includes(title.toLowerCase()) && m.status === 'together')
                ).length;
                const progressPct = Math.round((watchedCount / totalTitles) * 100);

                return (
                  <div
                    key={col.id}
                    className="bg-white/70 dark:bg-black/30 rounded-2xl p-5 border border-[#7A1018]/15 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-sans-clean font-bold tracking-widest uppercase text-[#7A1018] dark:text-[#F4B6C2]">
                          KOLEKSI FRANCHISE
                        </span>
                        {col.isTargetThisYear && (
                          <span className="text-[9px] font-sans-clean font-bold bg-[#D9B26F] text-[#3B0A0F] px-2 py-0.5 rounded-full uppercase">
                            Target Tahun Ini
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif-title text-lg font-bold text-[#3B0A0F] dark:text-[#EFE6DA] mb-1">
                        {col.name}
                      </h4>
                      <p className="text-xs font-editorial text-gray-600 dark:text-gray-400 mb-4">
                        {col.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between text-xs font-sans-clean font-bold">
                          <span>{watchedCount} dari {totalTitles} ditonton berdua</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#7A1018] to-[#F4B6C2] rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Titles list */}
                      <ul className="text-xs font-sans-clean space-y-1 text-gray-700 dark:text-gray-300">
                        {col.movieTitles.map((title, i) => (
                          <li key={i} className="flex items-center space-x-1.5">
                            <span className="text-[10px] text-gray-400">{i + 1}.</span>
                            <span>{title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => alert(`Target "${col.name}" telah disimpan sebagai wishlist kencan maraton tahun 2026!`)}
                      className="mt-6 w-full py-2 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] text-xs font-sans-clean font-bold rounded-xl uppercase tracking-wider transition"
                    >
                      Jadikan Target Tahun Ini
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Movie Night Planner */}
        {activeTab === 'planner' && (
          <div className="max-w-2xl mx-auto bg-white/70 dark:bg-black/30 rounded-3xl p-6 border border-[#7A1018]/15 shadow-md">
            <div className="text-center mb-6">
              <span className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] block mb-1">
                KENCAN BIOSKOP & KOS
              </span>
              <h3 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                Movie Night Planner
              </h3>
              <p className="font-editorial italic text-xs text-gray-600 dark:text-gray-400 mt-1">
                Pilih film, jadwal waktu, camilan dan minuman favorit untuk malam romantis berdua.
              </p>
            </div>

            <div className="space-y-4 text-xs font-sans-clean">
              <div>
                <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                  Pilih Film Target
                </label>
                <select
                  value={plannedMovie?.id ?? ''}
                  onChange={(e) => setPlannedMovieId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                >
                  {!movies.length && <option value="">Tambahkan film dari TMDB terlebih dahulu</option>}
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}{m.year ? ` (${m.year})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                  Tanggal & Waktu Nonton
                </label>
                <input
                  type="datetime-local"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                  Camilan Favorit
                </label>
                <input
                  type="text"
                  value={plannedSnack}
                  onChange={(e) => setPlannedSnack(e.target.value)}
                  placeholder="Taichan Pleburan, Popcorn karamel, dll..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                  Minuman Peneman
                </label>
                <input
                  type="text"
                  value={plannedDrink}
                  onChange={(e) => setPlannedDrink(e.target.value)}
                  placeholder="Iced Matcha Soffie & Kopi Savero..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#7A1018] text-[#EFE6DA] text-center mt-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D9B26F] block mb-1">
                  AGENDA KENCAN NONTON
                </span>
                <h4 className="font-serif-title text-xl font-bold text-white mb-2">
                  {plannedMovie?.title ?? 'Pilih film dari koleksi TMDB'}
                </h4>
                <p className="text-xs text-[#EFE6DA]/80">
                  {plannedDate.replace('T', ' Pukul ')} WIB • Bersama Soffie & Savero
                </p>
                <div className="mt-3 flex items-center justify-center space-x-3 text-xs text-[#F4B6C2]">
                  <span className="inline-flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#D9B26F]" />
                    <span>Camilan: {plannedSnack}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <Coffee className="w-3 h-3 text-[#BFD8B8]" />
                    <span>Minuman: {plannedDrink}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Movie Detail & Status Editor */}
        <AnimatePresence>
          {selectedMovie && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 25 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 25 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="bg-[#EFE6DA] dark:bg-[#250709] max-w-xl w-full rounded-3xl p-6 border border-[#7A1018]/30 shadow-2xl my-8"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#7A1018]/15 mb-4">
                  <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                    Detail Film & Catatan Kencan
                  </h3>
                  <CloseButton onClick={() => setSelectedMovie(null)} />
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                    {selectedMovie.posterUrl ? <ManagedImage
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                      className="w-36 h-52 object-cover rounded-xl shadow-md mx-auto sm:mx-0"
                    /> : <div className="w-36 h-52 rounded-xl bg-[#7A1018]/10 flex items-center justify-center text-center text-xs p-3 mx-auto sm:mx-0">Poster belum tersedia di TMDB</div>}
                  <div className="flex-1 space-y-2 text-xs font-sans-clean">
                    <h4 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                      {selectedMovie.title}{selectedMovie.year ? ` (${selectedMovie.year})` : ''}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      {selectedMovie.tmdbRating !== undefined ? `Rating TMDB ${selectedMovie.tmdbRating.toFixed(1)}` : ''}
                      {selectedMovie.durationMinutes ? ` · ${selectedMovie.durationMinutes} menit` : ''}
                      {selectedMovie.genres.length ? ` · ${selectedMovie.genres.join(', ')}` : ''}
                    </p>
                    <p className="font-editorial text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedMovie.overview}
                    </p>
                    {!!selectedMovie.cast?.length && <p className="text-[11px] text-gray-500">Pemeran: {selectedMovie.cast.join(', ')}</p>}
                    {selectedMovie.trailerUrl && <a href={selectedMovie.trailerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#7A1018] dark:text-[#F4B6C2] font-bold"><Play className="w-3.5 h-3.5" /> Trailer YouTube</a>}

                    <div className="pt-2">
                      <label className="block font-bold text-[#3B0A0F] dark:text-[#EFE6DA] mb-1">
                        Status Nonton:
                      </label>
                      <select
                        value={selectedMovie.status}
                        onChange={(e) =>
                          setSelectedMovie({ ...selectedMovie, status: e.target.value as any })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-[#7A1018]/20"
                      >
                        <option value="together">Sudah ditonton berdua</option>
                        <option value={activeProfile.toLowerCase()}>{`Sudah ditonton sendiri (${activeProfile})`}</option>
                        <option value="watchlist">Rencana ditonton berdua</option>
                        {selectedMovie.status === 'separate' && <option value="separate">Sudah ditonton terpisah</option>}
                        {selectedMovie.status === (activeProfile === 'Savero' ? 'soffie' : 'savero') && <option value={selectedMovie.status}>{`Sudah ditonton sendiri (${activeProfile === 'Savero' ? 'Soffie' : 'Savero'})`}</option>}
                      </select>
                    </div>

                    {/* Rating Savero & Soffie */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="font-bold block mb-1">Rating Savero:</span>
                        <HeartRating
                          rating={selectedMovie.ratingSavero || 0}
                          interactive={true}
                          size={18}
                          onChange={(val) => setSelectedMovie({ ...selectedMovie, ratingSavero: val })}
                        />
                      </div>
                      <div>
                        <span className="font-bold block mb-1">Rating Soffie:</span>
                        <HeartRating
                          rating={selectedMovie.ratingSoffie || 0}
                          interactive={true}
                          size={18}
                          onChange={(val) => setSelectedMovie({ ...selectedMovie, ratingSoffie: val })}
                        />
                      </div>
                    </div>

                    {/* Notes & Reactions */}
                    <div className="pt-2">
                      <label className="block font-bold mb-1">Catatan Bebas / Kesan Film:</label>
                      <textarea
                        rows={2}
                        value={selectedMovie.notes || ''}
                        onChange={(e) => setSelectedMovie({ ...selectedMovie, notes: e.target.value })}
                        placeholder="Apa yang bikin berkesan saat nonton film ini..."
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-[#7A1018]/20 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-[#7A1018]/15 mt-4 font-sans-clean text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedMovie(null)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateMovie(selectedMovie);
                      setSelectedMovie(null);
                    }}
                    className="px-5 py-2 bg-[#7A1018] text-[#EFE6DA] rounded-xl font-bold hover:bg-[#5e0a11]"
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
