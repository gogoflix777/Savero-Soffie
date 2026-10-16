import { ActorItem, MovieItem, TvSeries } from '../types';
import { getTmdbApiKey } from '../config/env';

const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  overview?: string;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbVideo {
  site: string;
  type: string;
  key: string;
}

interface TmdbCredit {
  name?: string;
  title?: string;
  original_title?: string;
  popularity?: number;
}

interface TmdbMovieDetails extends TmdbSearchResult {
  original_title?: string;
  runtime?: number | null;
  genres?: TmdbGenre[];
  videos?: { results?: TmdbVideo[] };
  credits?: { cast?: TmdbCredit[] };
}

interface TmdbTvDetails extends TmdbSearchResult {
  original_name?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: TmdbGenre[];
  credits?: { cast?: TmdbCredit[] };
}

interface TmdbPersonDetails {
  id: number;
  name: string;
  profile_path?: string | null;
  birthday?: string | null;
  place_of_birth?: string | null;
  biography?: string;
  movie_credits?: { cast?: TmdbCredit[] };
  tv_credits?: { cast?: TmdbCredit[] };
}

export const tmdbImage = (path?: string | null, size = 'w500') =>
  path ? `${IMAGE_BASE}/${size}${path}` : '';

export async function tmdbRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = getTmdbApiKey();
  if (!key) throw new Error('Tambahkan VITE_TMDB_API_KEY ke file .env.');

  const query = new URLSearchParams({ api_key: key, language: 'id-ID', ...params });
  const response = await fetch(`${API_BASE}${path}?${query.toString()}`);
  if (!response.ok) throw new Error(`TMDB merespons ${response.status}.`);
  return response.json() as Promise<T>;
}

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export async function searchTmdb(kind: 'movie' | 'tv' | 'person', query: string) {
  const response = await tmdbRequest<{ results?: TmdbSearchResult[] }>(`/search/${kind}`, {
    query,
    include_adult: 'false',
    page: '1'
  });
  return response.results ?? [];
}

export async function getMovieFromTmdb(id: number): Promise<Partial<MovieItem>> {
  const movie = await tmdbRequest<TmdbMovieDetails>(`/movie/${id}`, { append_to_response: 'credits,videos' });
  const trailer = movie.videos?.results?.find((video) => video.site === 'YouTube' && video.type === 'Trailer');
  return {
    tmdbId: movie.id,
    title: movie.title || movie.original_title,
    year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : undefined,
    posterUrl: tmdbImage(movie.poster_path),
    backdropUrl: tmdbImage(movie.backdrop_path, 'original') || undefined,
    genres: (movie.genres ?? []).map((genre) => genre.name),
    durationMinutes: movie.runtime || undefined,
    overview: movie.overview || '',
    tmdbRating: typeof movie.vote_average === 'number' ? Math.round(movie.vote_average * 10) / 10 : undefined,
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
    cast: (movie.credits?.cast ?? []).slice(0, 8).flatMap((person) => person.name ? [person.name] : [])
  };
}

export async function getMovieByTitle(title: string) {
  const results = await searchTmdb('movie', title);
  const normalizedTitle = normalize(title);
  const exact = results.find((item) =>
    [item.title, item.original_title, item.name].some((candidate) => candidate && normalize(candidate) === normalizedTitle)
  );
  return exact ? getMovieFromTmdb(exact.id) : null;
}

export async function getTvFromTmdb(id: number): Promise<Partial<TvSeries>> {
  const show = await tmdbRequest<TmdbTvDetails>(`/tv/${id}`, { append_to_response: 'credits,videos' });
  return {
    tmdbId: show.id,
    title: show.name || show.original_name,
    posterUrl: tmdbImage(show.poster_path),
    totalSeasons: show.number_of_seasons ?? 0,
    totalEpisodes: show.number_of_episodes ?? 0,
    firstAirDate: show.first_air_date || undefined,
    overview: show.overview || '',
    tmdbRating: typeof show.vote_average === 'number' ? Math.round(show.vote_average * 10) / 10 : undefined,
    genres: (show.genres ?? []).map((genre) => genre.name),
    cast: (show.credits?.cast ?? []).slice(0, 8).flatMap((person) => person.name ? [person.name] : [])
  };
}

export async function getTvByTitle(title: string) {
  const results = await searchTmdb('tv', title);
  const normalizedTitle = normalize(title);
  const exact = results.find((item) =>
    [item.name, item.original_name, item.title].some((candidate) => candidate && normalize(candidate) === normalizedTitle)
  );
  return exact ? getTvFromTmdb(exact.id) : null;
}

export async function getPersonFromTmdb(id: number): Promise<Partial<ActorItem>> {
  const person = await tmdbRequest<TmdbPersonDetails>(`/person/${id}`, { append_to_response: 'movie_credits,tv_credits' });
  const credits = [
    ...(person.movie_credits?.cast ?? []),
    ...(person.tv_credits?.cast ?? [])
  ].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  return {
    tmdbId: person.id,
    name: person.name,
    photoUrl: tmdbImage(person.profile_path),
    birthDate: person.birthday || undefined,
    birthPlace: person.place_of_birth || undefined,
    biography: person.biography || '',
    topMovies: credits.slice(0, 6).flatMap((credit) => {
      const title = credit.title || credit.name;
      return title ? [title] : [];
    })
  };
}

export async function getPersonByName(name: string) {
  const results = await searchTmdb('person', name);
  const normalizedName = normalize(name);
  const exact = results.find((item) =>
    [item.name, item.title].some((candidate) => candidate && normalize(candidate) === normalizedName)
  );
  return exact ? getPersonFromTmdb(exact.id) : null;
}

export function mapMovieSearchResult(movie: TmdbSearchResult, status: MovieItem['status'] = 'watchlist'): MovieItem {
  return {
    id: `tmdb-${movie.id}`,
    tmdbId: movie.id,
    title: movie.title || movie.name || 'Film',
    year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : undefined,
    posterUrl: tmdbImage(movie.poster_path),
    backdropUrl: tmdbImage(movie.backdrop_path, 'original') || undefined,
    genres: [],
    overview: movie.overview || '',
    tmdbRating: typeof movie.vote_average === 'number' ? Math.round(movie.vote_average * 10) / 10 : undefined,
    status
  };
}

export function mapTvSearchResult(show: TmdbSearchResult, status: TvSeries['status'] = 'watching'): TvSeries {
  return {
    id: `series-tmdb-${show.id}`,
    tmdbId: show.id,
    title: show.name || show.title || 'Serial TV',
    posterUrl: tmdbImage(show.poster_path),
    totalSeasons: 0,
    totalEpisodes: 0,
    watchedEpisodes: 0,
    status
  };
}

export function mapPersonSearchResult(person: TmdbSearchResult): ActorItem {
  return {
    id: `actor-tmdb-${person.id}`,
    tmdbId: person.id,
    name: person.name || person.title || 'Aktor',
    photoUrl: tmdbImage(person.profile_path),
    likedBy: 'Berdua',
    topMovies: []
  };
}
