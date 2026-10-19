import { CycleRecord, IntimateLog } from '../types';
import { supabase } from './supabase';

interface CycleRecordRow {
  id: string;
  payload: unknown;
  created_at?: string;
  updated_at?: string;
}

interface IntimateLogRow {
  id: string;
  payload: unknown;
  created_at?: string;
  updated_at?: string;
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi untuk menyinkronkan data siklus.');
  return supabase;
}

function parseCycleRecord(payload: unknown, fallbackId?: string): CycleRecord {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Data siklus Supabase tidak valid.');
  }
  const item = payload as Partial<CycleRecord>;
  const id = item.id || fallbackId;
  if (!id || typeof item.startDate !== 'string' || typeof item.endDate !== 'string') {
    throw new Error('Data siklus Supabase tidak lengkap.');
  }
  return {
    id,
    startDate: item.startDate,
    endDate: item.endDate,
    recordedPeriodEndDate: item.recordedPeriodEndDate || undefined,
    fertileStartDate: item.fertileStartDate || undefined,
    fertileEndDate: item.fertileEndDate || undefined,
    ovulationDate: item.ovulationDate || undefined,
    cycleLength: typeof item.cycleLength === 'number' ? item.cycleLength : 28,
    periodLength: typeof item.periodLength === 'number' ? item.periodLength : 5,
    flow: item.flow || 'sedang',
    pain: item.pain || 'ringan',
    mood: item.mood || 'tenang',
    notes: item.notes || ''
  };
}

function parseIntimateLog(payload: unknown, fallbackId?: string): IntimateLog {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Data keintiman Supabase tidak valid.');
  }
  const item = payload as Partial<IntimateLog>;
  const id = item.id || fallbackId;
  if (!id || typeof item.date !== 'string') {
    throw new Error('Data keintiman Supabase tidak lengkap.');
  }
  return {
    id,
    date: item.date,
    time: item.time || '',
    protection: item.protection || 'kondom',
    protectionIssue: Boolean(item.protectionIssue),
    otherMethodDetails: item.otherMethodDetails || '',
    mood: item.mood || 'romantis',
    notes: item.notes || '',
    pinId: item.pinId || undefined,
    createdAt: item.createdAt || new Date().toISOString()
  };
}

export async function loadCycleRecords(): Promise<CycleRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('cycle_records')
    .select('id, payload, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Data siklus gagal dimuat: ${error.message}`);
  }

  const rows = (data ?? []) as CycleRecordRow[];
  return rows.map((row) => parseCycleRecord(row.payload, row.id));
}

export async function saveCycleRecord(cycle: CycleRecord): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('cycle_records').upsert({
    id: cycle.id,
    payload: cycle,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });

  if (error) throw new Error(`Data siklus gagal disimpan: ${error.message}`);
}

export async function deleteCycleRecord(cycleId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('cycle_records').delete().eq('id', cycleId);
  if (error) throw new Error(`Data siklus gagal dihapus: ${error.message}`);
}

export async function seedCycleRecords(cycles: CycleRecord[]): Promise<void> {
  const client = requireSupabase();
  const rows = cycles.map((cycle) => ({
    id: cycle.id,
    payload: cycle,
    updated_at: new Date().toISOString()
  }));
  const { error } = await client.from('cycle_records').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`Gagal mengisi data siklus awal: ${error.message}`);
}

export async function loadIntimateLogs(): Promise<IntimateLog[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('intimate_logs')
    .select('id, payload, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Data keintiman gagal dimuat: ${error.message}`);
  }

  const rows = (data ?? []) as IntimateLogRow[];
  return rows.map((row) => parseIntimateLog(row.payload, row.id));
}

export async function saveIntimateLog(log: IntimateLog): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('intimate_logs').upsert({
    id: log.id,
    payload: log,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });

  if (error) throw new Error(`Catatan keintiman gagal disimpan: ${error.message}`);
}

export async function deleteIntimateLog(logId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('intimate_logs').delete().eq('id', logId);
  if (error) throw new Error(`Catatan keintiman gagal dihapus: ${error.message}`);
}

export async function seedIntimateLogs(logs: IntimateLog[]): Promise<void> {
  const client = requireSupabase();
  const rows = logs.map((log) => ({
    id: log.id,
    payload: log,
    updated_at: new Date().toISOString()
  }));
  const { error } = await client.from('intimate_logs').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`Gagal mengisi data keintiman awal: ${error.message}`);
}

export async function wipeCycleAndIntimateRecords(): Promise<void> {
  const client = requireSupabase();
  const [cycleRes, intimateRes] = await Promise.all([
    client.from('cycle_records').delete().neq('id', ''),
    client.from('intimate_logs').delete().neq('id', '')
  ]);
  if (cycleRes.error) throw new Error(`Gagal mengosongkan data siklus: ${cycleRes.error.message}`);
  if (intimateRes.error) throw new Error(`Gagal mengosongkan data keintiman: ${intimateRes.error.message}`);
}
