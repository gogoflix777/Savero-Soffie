import React, { useState, useMemo } from 'react';
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
  ExternalLink,
  X
} from 'lucide-react';
import { MovieItem, ActorItem, MovieCollection, TvSeries, MemoryPin, AppSettings } from '../../types';
import { initialTvSeries } from '../../data/initialData';
import { appStorage } from '../../utils/storage';
import { HeartRating } from '../common/AnimatedIcons';

interface MoviesSectionProps {
  movies: MovieItem[];
  actors: ActorItem[];
  collections: MovieCollection[];
  pins: MemoryPin[];
  settings: AppSettings;
  onAddMovie: (movie: MovieItem) => void;
  onUpdateMovie: (movie: MovieItem) => void;
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

  // Movie Night Planner State
  const [plannedMovieTitle, setPlannedMovieTitle] = useState('Oppenheimer');
  const [plannedDate, setPlannedDate] = useState('2026-10-18T20:30');
  const [plannedSnack, setPlannedSnack] = useState('Sate Taichan Pleburan + Popcorn Manis');
  const [plannedDrink, setPlannedDrink] = useState('Iced Matcha Latte Soffie & Kopi V60 Savero');

  // Perform search on TMDB
  const handleTmdbSearch = async () => {
    if (!searchQuery.trim()) return;
    const apiKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_TMDB_API_KEY || settings.tmdbApiKey;

    if (!apiKey) {
      // Offline / Keyless filter through existing catalogue
      return;
    }

    try {
      setIsSearchingTmdb(true);
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=id-ID&query=${encodeURIComponent(
          searchQuery
        )}&page=1`
      );
      if (res.ok) {
        const data = await res.json();
        const mapped: MovieItem[] = (data.results || []).slice(0, 8).map((m: any) => ({
          id: 'tmdb-' + m.id,
          tmdbId: m.id,
          title: m.title || m.original_title,
          year: m.release_date ? new Date(m.release_date).getFullYear() : 2026,
          posterUrl: m.poster_path
            ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80',
          backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : undefined,
          genres: ['Film'],
          overview: m.overview || 'Sinopsis film belum tersedia.',
          tmdbRating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 7.5,
          status: 'watchlist'
        }));
        setTmdbSearchResults(mapped);
      }
    } catch (err) {
      console.error('TMDB Search Error:', err);
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  // Filtered & Sorted Movies
  const filteredMovies = useMemo(() => {
    return movies
      .filter((m) => {
        if (movieFilter === 'all') return true;
        return m.status === movieFilter;
      })
      .filter((m) => {
        if (!searchQuery) return true;
        return m.title.toLowerCase().includes(searchQuery.toLowerCase());
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
  }, [movies, movieFilter, sortBy, searchQuery]);

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
          <div className="flex items-center space-x-1.5 bg-white/50 dark:bg-black/30 p-1.5 rounded-2xl border border-[#7A1018]/15 text-xs font-sans-clean font-bold">
            <button
              onClick={() => setActiveTab('film')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'film' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Film ({movies.length})
            </button>
            <button
              onClick={() => setActiveTab('serial')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'serial' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Serial TV ({tvSeriesList.length})
            </button>
            <button
              onClick={() => setActiveTab('aktor')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'aktor' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Aktor ({actors.length})
            </button>
            <button
              onClick={() => setActiveTab('koleksi')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'koleksi' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Franchise ({collections.length})
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'planner' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Movie Night
            </button>
          </div>
        </div>

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
                  placeholder="Cari judul film atau TMDB..."
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
                      <img src={m.posterUrl} alt={m.title} className="w-full h-36 object-cover rounded-lg mb-2" />
                      <div>
                        <div className="text-xs font-bold text-[#3B0A0F] dark:text-[#EFE6DA] line-clamp-1">
                          {m.title}
                        </div>
                        <div className="text-[10px] text-gray-500">{m.year}</div>
                      </div>
                      <button
                        onClick={() => {
                          onAddMovie(m);
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
                      <img
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
                          <span>{movie.year}</span>
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

              <button
                onClick={() => {
                  const title = prompt('Judul serial TV baru:');
                  if (!title) return;
                  const total = Number(prompt('Jumlah total episode:') || '16');
                  const newSeries: TvSeries = {
                    id: 'series-' + Date.now(),
                    title,
                    posterUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&q=80',
                    totalSeasons: 1,
                    totalEpisodes: total,
                    watchedEpisodes: 0,
                    status: 'watching'
                  };
                  const updated = [newSeries, ...tvSeriesList];
                  setTvSeriesList(updated);
                  appStorage.saveTvSeries(updated);
                }}
                className="px-4 py-2 bg-[#7A1018] text-[#EFE6DA] text-xs font-sans-clean font-bold rounded-xl shadow hover:bg-[#5e0a11] transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Serial Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tvSeriesList.map((series) => {
                const pct = Math.round((series.watchedEpisodes / series.totalEpisodes) * 100);
                const isCompleted = series.watchedEpisodes >= series.totalEpisodes;

                return (
                  <div
                    key={series.id}
                    className="bg-white/70 dark:bg-black/30 rounded-2xl p-5 border border-[#7A1018]/15 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full h-44 rounded-xl overflow-hidden mb-3 bg-black/10">
                        <img src={series.posterUrl} alt={series.title} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-sans-clean font-bold tracking-widest uppercase text-[#7A1018] dark:text-[#F4B6C2]">
                          {series.totalSeasons} Season
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {actors.map((actor) => (
              <div
                key={actor.id}
                className="bg-white/60 dark:bg-black/30 rounded-2xl overflow-hidden border border-[#7A1018]/15 shadow-sm p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-56 rounded-xl overflow-hidden mb-3 shadow-inner">
                    <img src={actor.photoUrl} alt={actor.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-serif-title font-bold text-base text-[#3B0A0F] dark:text-[#EFE6DA]">
                    {actor.name}
                  </h4>
                  <div className="text-[10px] text-gray-500 font-sans-clean mb-2">
                    {actor.birthPlace || 'Pemeran Film'}
                  </div>
                  <p className="text-xs font-editorial text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
                    {actor.biography}
                  </p>
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
                      {m.title} ({m.year})
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
                  <button
                    type="button"
                    onClick={() => setSelectedMovie(null)}
                    className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-black dark:hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                  <img
                    src={selectedMovie.posterUrl}
                    alt={selectedMovie.title}
                    className="w-36 h-52 object-cover rounded-xl shadow-md mx-auto sm:mx-0"
                  />
                  <div className="flex-1 space-y-2 text-xs font-sans-clean">
                    <h4 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                      {selectedMovie.title} ({selectedMovie.year})
                    </h4>
                    <p className="font-editorial text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedMovie.overview}
                    </p>

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
