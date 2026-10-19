import { MovieNightPlan } from '../types';
import { supabase } from './supabase';

interface MovieNightPlanRow {
  id: string;
  movie_id?: string | null;
  movie_title: string;
  poster_url?: string | null;
  scheduled_at: string;
  snacks?: string | null;
  drinks?: string | null;
  planned_by: string;
  confirmed_by_savero: boolean;
  confirmed_by_soffie: boolean;
  status: string;
  payload: unknown;
  created_at?: string;
  updated_at?: string;
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi untuk menyinkronkan jadwal Movie Night.');
  return supabase;
}

function parseMovieNightPlan(payload: unknown, fallbackRow?: Partial<MovieNightPlanRow>): MovieNightPlan {
  if (payload && typeof payload === 'object') {
    const p = payload as Partial<MovieNightPlan>;
    return {
      id: p.id || fallbackRow?.id || `mnp-${Date.now()}`,
      movieId: p.movieId || fallbackRow?.movie_id || undefined,
      movieTitle: p.movieTitle || fallbackRow?.movie_title || 'Film Kencan',
      posterUrl: p.posterUrl || fallbackRow?.poster_url || undefined,
      scheduledAt: p.scheduledAt || fallbackRow?.scheduled_at || new Date().toISOString(),
      snacks: p.snacks || fallbackRow?.snacks || undefined,
      drinks: p.drinks || fallbackRow?.drinks || undefined,
      plannedBy: (p.plannedBy || fallbackRow?.planned_by || 'Berdua') as 'Savero' | 'Soffie' | 'Berdua',
      confirmedBySavero: Boolean(p.confirmedBySavero ?? fallbackRow?.confirmed_by_savero),
      confirmedBySoffie: Boolean(p.confirmedBySoffie ?? fallbackRow?.confirmed_by_soffie),
      status: (p.status || fallbackRow?.status || 'confirmed') as MovieNightPlan['status'],
      createdAt: p.createdAt || fallbackRow?.created_at || new Date().toISOString(),
      updatedAt: p.updatedAt || fallbackRow?.updated_at || new Date().toISOString()
    };
  }

  return {
    id: fallbackRow?.id || `mnp-${Date.now()}`,
    movieId: fallbackRow?.movie_id || undefined,
    movieTitle: fallbackRow?.movie_title || 'Film Kencan',
    posterUrl: fallbackRow?.poster_url || undefined,
    scheduledAt: fallbackRow?.scheduled_at || new Date().toISOString(),
    snacks: fallbackRow?.snacks || undefined,
    drinks: fallbackRow?.drinks || undefined,
    plannedBy: (fallbackRow?.planned_by || 'Berdua') as 'Savero' | 'Soffie' | 'Berdua',
    confirmedBySavero: Boolean(fallbackRow?.confirmed_by_savero),
    confirmedBySoffie: Boolean(fallbackRow?.confirmed_by_soffie),
    status: (fallbackRow?.status || 'confirmed') as MovieNightPlan['status'],
    createdAt: fallbackRow?.created_at || new Date().toISOString(),
    updatedAt: fallbackRow?.updated_at || new Date().toISOString()
  };
}

export async function loadMovieNightPlan(): Promise<MovieNightPlan | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('movie_night_plans')
    .select('*')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Jadwal movie night gagal dimuat dari Supabase: ${error.message}`);
  }

  const rows = (data ?? []) as MovieNightPlanRow[];
  if (!rows.length) return null;

  return parseMovieNightPlan(rows[0].payload, rows[0]);
}

export async function saveMovieNightPlan(plan: MovieNightPlan): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('movie_night_plans').upsert({
    id: plan.id,
    movie_id: plan.movieId || null,
    movie_title: plan.movieTitle,
    poster_url: plan.posterUrl || null,
    scheduled_at: plan.scheduledAt,
    snacks: plan.snacks || null,
    drinks: plan.drinks || null,
    planned_by: plan.plannedBy || 'Berdua',
    confirmed_by_savero: Boolean(plan.confirmedBySavero),
    confirmed_by_soffie: Boolean(plan.confirmedBySoffie),
    status: plan.status || 'confirmed',
    payload: plan,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });

  if (error) {
    throw new Error(`Jadwal movie night gagal disimpan ke Supabase: ${error.message}`);
  }
}

export async function deleteMovieNightPlan(planId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('movie_night_plans')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', planId);

  if (error) {
    throw new Error(`Jadwal movie night gagal dibatalkan di Supabase: ${error.message}`);
  }
}
