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
import { appStorage } from '../../utils/storage';
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
  actors: ActorItem[];
  collections: MovieCollection[];
  pins: MemoryPin[];
  settings: AppSettings;
  onAddMovie: (movie: MovieItem) => void;
  onUpdateMovie: (movie: MovieItem) => void;
  onUpdateActor: (actor: ActorItem) => void;
  onAddActor: (actor: ActorItem) => void;
  onToggleActorLike: (actorId: string, likedBy: 'Savero' | 'Soffie' | 'Berdua') => void;
}

export const MoviesSection: React.FC<MoviesSectionProps> = ({
  movies,
  actors,
  collections,
  pins,
  settings,
  onAddMovie,
  onUpdateMovie,
  onUpdateActor,
  onAddActor,
  onToggleActorLike
}) => {
  const [activeTab, setActiveTab] = useState<'film' | 'serial' | 'aktor' | 'koleksi' | 'planner'>('film');
  const [tvSeriesList, setTvSeriesList] = useState<TvSeries[]>(() => appStorage.getTvSeries());
  const [movieFilter, setMovieFilter] = useState<'all' | 'together' | 'savero' | 'soffie' | 'separate' | 'watchlist'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [selectedActor, setSelectedActor] = useState<ActorItem | null>(null);

  // TMDB Live Search State
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [tmdbSearchResults, setTmdbSearchResults] = useState<MovieItem[]>([]);
  const hasTmdbKey = Boolean(getTmdbApiKey());
  const allTmdbMetadataReady = movies.every((movie) => movie.tmdbMetadataFetched)
    && actors.every((actor) => actor.tmdbMetadataFetched)
    && tvSeriesList.every((series) => series.tmdbMetadataFetched);
  const hydrationStarted = useRef(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<TmdbSearchResult[]>([]);
  const [catalogKind, setCatalogKind] = useState<'tv' | 'person' | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [metadataSyncState, setMetadataSyncState] = useState<'loading' | 'ready' | 'missing-key' | 'error'>(
    hasTmdbKey ? (allTmdbMetadataReady ? 'ready' : 'loading') : 'missing-key'
  );

  useEffect(() => {
    if (!hasTmdbKey) {
      setMetadataSyncState('missing-key');
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
            const metadata = await getMovieByTitle(movie.title);
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
            const metadata = await getPersonByName(actor.name);
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
        Promise.all(tvSeriesList.map(async (series) => {
          if (series.tmdbMetadataFetched) return series;
          try {
            const metadata = await getTvByTitle(series.title);
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
      if (JSON.stringify(seriesMetadata) !== JSON.stringify(tvSeriesList)) {
        setTvSeriesList(seriesMetadata);
        appStorage.saveTvSeries(seriesMetadata);
      }
      setMetadataSyncState(metadataLoadFailed ? 'error' : 'ready');
    };

    void refreshMetadata().catch((error) => {
      console.error('TMDB metadata sync failed:', error);
      setMetadataSyncState('error');
    });
  }, [hasTmdbKey, allTmdbMetadataReady]);

  const handleCatalogSearch = async (kind: 'tv' | 'person') => {
    const query = catalogQuery.trim();
    if (!query || !hasTmdbKey) return;
    setCatalogLoading(true);
    setCatalogError('');
    setCatalogKind(kind);
    setCatalogResults([]);
    try {
      setCatalogResults(await searchTmdb(kind, query));
    } catch (error) {
      console.error('Catalog search failed:', error);
      setCatalogError('Pencarian belum berhasil. Coba lagi sebentar.');
    } finally {
      setCatalogLoading(false);
    }
  };

  const addCatalogTv = async (result: TmdbSearchResult) => {
    try {
      const metadata = await getTvFromTmdb(result.id);
      const freshSeries = {
        ...mapTvSearchResult(result),
        ...metadata,
        tmdbMetadataFetched: true,
        watchedEpisodes: 0,
        status: 'watching' as const
      };
      const updated = [freshSeries, ...tvSeriesList.filter((series) => series.tmdbId !== result.id)];
      setTvSeriesList(updated);
      appStorage.saveTvSeries(updated);
      setCatalogResults((items) => items.filter((item) => item.id !== result.id));
    } catch (error) {
      console.error('Could not load series details:', error);
      setCatalogError('Detail serial belum tersedia. Coba lagi sebentar.');
    }
  };

  const addCatalogPerson = async (result: TmdbSearchResult) => {
    try {
      const metadata = await getPersonFromTmdb(result.id);
      const freshActor = { ...mapPersonSearchResult(result), ...metadata, tmdbMetadataFetched: true, likedBy: 'Berdua' as const };
      if (!actors.some((actor) => actor.tmdbId === result.id)) {
        onAddActor(freshActor);
      }
      setCatalogResults((items) => items.filter((item) => item.id !== result.id));
    } catch (error) {
      console.error('Could not load actor details:', error);
      setCatalogError('Detail aktor belum tersedia. Coba lagi sebentar.');
    }
  };

  // Movie Night Planner State
  const [plannedMovieTitle, setPlannedMovieTitle] = useState('Oppenheimer');
  const [plannedDate, setPlannedDate] = useState('2026-10-18T20:30');
  const [plannedSnack, setPlannedSnack] = useState('Sate Taichan Pleburan + Popcorn Manis');
  const [plannedDrink, setPlannedDrink] = useState('Iced Matcha Latte Soffie & Kopi V60 Savero');

  const normalizeText = (value?: string) => (value ?? '').toLowerCase().trim();

  // Search using TMDB only
  const handleTmdbSearch = async () => {
    const query = normalizeText(searchQuery);
    if (!query) {
      setTmdbSearchResults([]);
      return;
    }

    const apiKey = getTmdbApiKey();
    if (!apiKey) {
      setTmdbSearchResults([]);
      return;
    }

    try {
      setIsSearchingTmdb(true);
      const results = await searchTmdb('movie', query);
      const mapped: MovieItem[] = results.slice(0, 8).map((movie: TmdbSearchResult) =>
        mapMovieSearchResult(movie)
      );

      setTmdbSearchResults(mapped);
    } catch (err) {
      console.error('TMDB Search Error:', err);
      setTmdbSearchResults([]);
    } finally {
      setIsSearchingTmdb(false);
    }
  };

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

    const trimmedQuery = normalizeText(searchQuery);
    if (trimmedQuery && tmdbSearchResults.length > 0) {
      return tmdbSearchResults;
    }

    return localList;
  }, [movies, movieFilter, sortBy, searchQuery, tmdbSearchResults, metadataSyncState]);

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
              Serial TV ({tvSeriesList.length})
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
        {metadataSyncState === 'error' && (
          <p className="mb-4 rounded-2xl bg-rose-100/70 px-4 py-3 text-xs text-[#75414c] dark:bg-white/5 dark:text-rose-100/70" role="status">Sebagian detail belum tersedia. Koleksi dan catatan kalian tetap aman.</p>
        )}

        {/* Tab 1: Film List */}
        {activeTab === 'film' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-[#7A1018]/15 flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTmdbSearch()}
                  placeholder={'Cari judul film atau kategori lokal...'}
                  className="w-full pl-9 pr-20 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20 text-xs font-sans-clean focus:outline-none focus:ring-1 focus:ring-[#7A1018]"
                />
                <button
                  type="button"
                  onClick={handleTmdbSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#7A1018] text-[#EFE6DA] text-[10px] font-bold rounded-lg uppercase tracking-wider"
                >
                  Cari
                </button>
              </div>

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

            {/* TMDB Live Search Results if Any */}
            {tmdbSearchResults.length > 0 && (
              <div className="bg-[#7A1018]/5 dark:bg-white/5 p-4 rounded-2xl border border-[#7A1018]/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-sans-clean font-bold tracking-widest text-[#7A1018] dark:text-[#F4B6C2] uppercase">
                    Hasil Pencarian TMDB ({tmdbSearchResults.length})
                  </h4>
                  <button
                    onClick={() => setTmdbSearchResults([])}
                    className="text-[11px] text-gray-500 hover:text-black font-bold"
                  >
                    Tutup Hasil
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {tmdbSearchResults.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white dark:bg-black/40 rounded-xl overflow-hidden border border-[#7A1018]/15 shadow-sm p-2 flex flex-col justify-between"
                    >
                      {m.posterUrl ? <ManagedImage src={m.posterUrl} alt={m.title} className="w-full h-36 object-cover rounded-lg mb-2" /> : <div className="w-full h-36 rounded-lg mb-2 bg-[#7A1018]/10 flex items-center justify-center text-xs text-center p-2">Poster belum tersedia di TMDB</div>}
                      <div>
                        <div className="text-xs font-bold text-[#3B0A0F] dark:text-[#EFE6DA] line-clamp-1">
                          {m.title}
                        </div>
                        <div className="text-[10px] text-gray-500">{m.year || 'Tahun belum tersedia'}</div>
                      </div>
                      <button
                        onClick={async () => {
                          const details = m.tmdbId ? await getMovieFromTmdb(m.tmdbId) : {};
                          onAddMovie({ ...m, ...details, tmdbMetadataFetched: true, status: 'watchlist' });
                          setTmdbSearchResults((prev) => prev.filter((p) => p.id !== m.id));
                        }}
                        className="mt-2 w-full py-1 bg-[#7A1018] text-[#EFE6DA] text-[10px] font-bold rounded uppercase tracking-wider hover:bg-[#5e0a11]"
                      >
                        + Tambah
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      <ManagedImage
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

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
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TMDB Attribution as required */}
            <div className="text-center pt-6 pb-2 text-[10px] text-gray-500 font-sans-clean border-t border-[#7A1018]/10">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </div>
          </div>
        )}

        {/* Tab: Serial TV & Episode Tracker */}
        {activeTab === 'serial' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-[#7A1018]/15">
              <div>
                <h3 className="font-serif-title text-xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                  Pelacak Episode Serial TV Bersama
                </h3>
                <p className="text-xs text-gray-500 font-sans-clean">
                  Catat kemajuan tontonan maraton drama dan serial favorit Savero & Soffie.
                </p>
              </div>

              <div className="flex w-full sm:w-auto gap-2">
                <input
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleCatalogSearch('tv')}
                  placeholder="Cari serial di TMDB"
                  className="min-w-0 flex-1 sm:w-56 px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20 text-xs"
                />
                <button onClick={() => handleCatalogSearch('tv')} disabled={catalogLoading} className="px-4 py-2 bg-[#7A1018] text-[#EFE6DA] text-xs font-bold rounded-xl disabled:opacity-50">
                  {catalogLoading ? 'Memuat…' : 'Cari serial'}
                </button>
              </div>
            </div>

            {catalogError && <p className="text-xs text-red-700 dark:text-red-300">{catalogError}</p>}
            {catalogKind === 'tv' && catalogResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {catalogResults.map((result) => {
                  const series = mapTvSearchResult(result);
                  return <div key={result.id} className="p-2 bg-white/70 dark:bg-black/30 rounded-xl">
                    {series.posterUrl ? <ManagedImage src={series.posterUrl} alt={series.title} className="w-full h-36 object-cover rounded-lg mb-2" /> : <div className="w-full h-36 rounded-lg mb-2 bg-[#7A1018]/10 flex items-center justify-center text-xs text-center p-2">Poster belum tersedia di TMDB</div>}
                    <p className="text-xs font-bold line-clamp-2">{series.title}</p>
                    <button onClick={() => addCatalogTv(result)} className="mt-2 w-full py-2 rounded-lg bg-[#7A1018] text-white text-xs">Tambah serial</button>
                  </div>;
                })}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tvSeriesList.map((series) => {
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
                            isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isCompleted ? 'Tamat Nonton' : 'Sedang Ditonton'}
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
                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-xs font-sans-clean font-bold">
                          <span>Episode {series.watchedEpisodes} dari {series.totalEpisodes}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#7A1018] to-[#F4B6C2] rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Interactive Episode Counter Buttons */}
                    <div className="flex items-center space-x-2 pt-3 border-t border-[#7A1018]/10 text-xs font-sans-clean">
                      <button
                        onClick={() => {
                          const newCount = Math.max(0, series.watchedEpisodes - 1);
                          const updated = tvSeriesList.map((s) =>
                            s.id === series.id ? { ...s, watchedEpisodes: newCount } : s
                          );
                          setTvSeriesList(updated);
                          appStorage.saveTvSeries(updated);
                        }}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 rounded-lg font-bold"
                      >
                        -1 Ep
                      </button>

                      <button
                        onClick={() => {
                          const newCount = Math.min(series.totalEpisodes, series.watchedEpisodes + 1);
                          const updated = tvSeriesList.map((s) =>
                            s.id === series.id ? { ...s, watchedEpisodes: newCount } : s
                          );
                          setTvSeriesList(updated);
                          appStorage.saveTvSeries(updated);
                        }}
                        className="flex-1 py-1.5 bg-[#7A1018] hover:bg-[#5e0a11] text-white rounded-lg font-bold text-center"
                      >
                        +1 Episode Selesai
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Aktor & Aktris */}
        {activeTab === 'aktor' && (
          <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleCatalogSearch('person')}
              placeholder="Cari nama aktor di TMDB"
              className="w-full sm:max-w-sm px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20 text-xs"
            />
            <button onClick={() => handleCatalogSearch('person')} disabled={catalogLoading} className="px-4 py-2 bg-[#7A1018] text-white text-xs font-bold rounded-xl disabled:opacity-50">
              {catalogLoading ? 'Memuat…' : 'Cari aktor'}
            </button>
            {catalogError && <p className="self-center text-xs text-red-700 dark:text-red-300">{catalogError}</p>}
          </div>

          {catalogKind === 'person' && catalogResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {catalogResults.map((result) => {
                const person = mapPersonSearchResult(result);
                const alreadyAdded = actors.some((actor) => actor.tmdbId === result.id);
                return <div key={result.id} className="p-2 bg-white/70 dark:bg-black/30 rounded-xl">
                  {person.photoUrl ? <ManagedImage src={person.photoUrl} alt={person.name} className="w-full h-36 object-cover rounded-lg mb-2" /> : <div className="w-full h-36 rounded-lg mb-2 bg-[#7A1018]/10 flex items-center justify-center text-xs text-center p-2">Foto belum tersedia di TMDB</div>}
                  <p className="text-xs font-bold line-clamp-2">{person.name}</p>
                  <button onClick={() => addCatalogPerson(result)} disabled={alreadyAdded} className="mt-2 w-full py-2 rounded-lg bg-[#7A1018] text-white text-xs disabled:opacity-50">{alreadyAdded ? 'Sudah tersimpan' : 'Tambah aktor'}</button>
                </div>;
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
                      onClick={() => onToggleActorLike(actor.id, 'Savero')}
                      className={`p-1.5 rounded-lg text-xs font-bold ${
                        actor.likedBy === 'Savero'
                          ? 'bg-[#C9A58B] text-black'
                          : 'bg-gray-100 dark:bg-white/10 hover:bg-[#C9A58B]/30'
                      }`}
                      title="Disukai Savero"
                    >
                      S
                    </button>
                    <button
                      onClick={() => onToggleActorLike(actor.id, 'Soffie')}
                      className={`p-1.5 rounded-lg text-xs font-bold ${
                        actor.likedBy === 'Soffie'
                          ? 'bg-[#BFD8B8] text-black'
                          : 'bg-gray-100 dark:bg-white/10 hover:bg-[#BFD8B8]/30'
                      }`}
                      title="Disukai Soffie"
                    >
                      F
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
                  value={plannedMovieTitle}
                  onChange={(e) => setPlannedMovieTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.title}>
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
                  {plannedMovieTitle}
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
                        <option value="together">Nonton Bareng Berdua</option>
                        <option value="savero">Savero Sudah Nonton</option>
                        <option value="soffie">Soffie Sudah Nonton</option>
                        <option value="separate">Keduanya Terpisah</option>
                        <option value="watchlist">Masuk Watchlist</option>
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
