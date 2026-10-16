import { CoupleProfile, DailyCheckin, DailyHeartProgress, MeetingConfirmation, StreakRestore } from '../types';
import { supabase } from './supabase';

export const getJakartaDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(date);

export async function getBoundProfile(): Promise<CoupleProfile | null> {
  if (!supabase) return null;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return null;
  const { data, error } = await supabase.from('couple_profiles').select('profile_name').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return (data?.profile_name as CoupleProfile | undefined) ?? null;
}

export async function getAppAdminStatus(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_app_admin');
  if (error) throw error;
  if (typeof data !== 'boolean') throw new Error('Status admin dari Supabase tidak valid.');
  return data;
}

export async function claimProfile(profile: CoupleProfile): Promise<CoupleProfile> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.rpc('claim_couple_profile', { requested_profile: profile });
  if (error) throw error;
  return data as CoupleProfile;
}

export async function loadCoupleDaily() {
  if (!supabase) return { logs: [] as DailyCheckin[], restores: [] as StreakRestore[], meetings: [] as MeetingConfirmation[] };
  const [logsResult, restoresResult, meetingsResult] = await Promise.all([
    supabase.from('daily_checkins').select('*').order('log_date', { ascending: false }).limit(500),
    supabase.from('streak_restores').select('missed_date,restored_by,restored_at').order('restored_at', { ascending: false }).limit(50),
    supabase.from('meeting_confirmations').select('*').order('meeting_date', { ascending: false }).limit(100)
  ]);
  if (logsResult.error) throw logsResult.error;
  if (restoresResult.error) throw restoresResult.error;
  if (meetingsResult.error) throw meetingsResult.error;
  const logs = (logsResult.data ?? []) as DailyCheckin[];
  const logsWithPhoto = await Promise.all(logs.map(async (log) => {
    if (!log.photo_path || new Date(log.expires_at).getTime() <= Date.now() || !supabase) return { ...log, photo_url: null };
    const { data, error } = await supabase.storage.from('daily-diary').createSignedUrl(log.photo_path, 60 * 60);
    if (error) throw error;
    return { ...log, photo_url: data?.signedUrl ?? null };
  }));
  return {
    logs: logsWithPhoto,
    restores: (restoresResult.data ?? []) as StreakRestore[],
    meetings: (meetingsResult.data ?? []) as MeetingConfirmation[]
  };
}

export async function loadProfileHeartProgress(): Promise<Record<CoupleProfile, number>> {
  if (!supabase) return { Savero: 0, Soffie: 0 };
  const today = getJakartaDate();
  const { data, error } = await supabase
    .from('profile_daily_heart_progress')
    .select('profile, progress_date, percentage')
    .eq('progress_date', today);
  if (error) throw error;
  const progress: Record<CoupleProfile, number> = { Savero: 0, Soffie: 0 };
  const rows: Array<{ profile: string; percentage: number | string }> = data ?? [];
  for (const row of rows) {
    if (row.profile === 'Savero' || row.profile === 'Soffie') {
      const percentage = Number(row.percentage);
      if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        throw new Error(`Persentase hati ${row.profile} tidak valid.`);
      }
      progress[row.profile] = percentage;
    }
  }
  return progress;
}

export async function loadDailyHeartProgress(): Promise<DailyHeartProgress[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profile_daily_heart_progress')
    .select('profile, progress_date, percentage')
    .order('progress_date', { ascending: false })
    .limit(500);
  if (error) throw error;
  const rows: Array<{ profile: unknown; progress_date: unknown; percentage: unknown }> = data ?? [];
  return rows.flatMap((row) => {
    if (row.profile !== 'Savero' && row.profile !== 'Soffie') return [];
    if (typeof row.progress_date !== 'string') throw new Error('Tanggal progres hati harian tidak valid.');
    const percentage = Number(row.percentage);
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      throw new Error(`Persentase hati harian ${row.profile} tidak valid.`);
    }
    return [{ profile: row.profile, progress_date: row.progress_date, percentage }];
  });
}

export async function loadMeetingFillProgress(): Promise<Record<CoupleProfile, number>> {
  if (!supabase) return { Savero: 0, Soffie: 0 };
  const today = getJakartaDate();
  const { data, error } = await supabase
    .from('meeting_fill_progress')
    .select('profile, progress_date, percentage');
  if (error) throw error;
  const progress: Record<CoupleProfile, number> = { Savero: 0, Soffie: 0 };
  for (const row of data ?? []) {
    const profileName: unknown = row.profile;
    if (profileName !== 'Savero' && profileName !== 'Soffie') continue;
    const profile: CoupleProfile = profileName;
    if (row.progress_date !== today) continue;
    const percentage = Number(row.percentage);
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      throw new Error(`Progres konfirmasi ${profile} tidak valid.`);
    }
    progress[profile] = percentage;
  }
  return progress;
}

export async function saveMyMeetingFillProgress(percentage: number): Promise<number> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new RangeError('Persentase pengisian harus berada di antara 0 dan 100.');
  }
  const { data, error } = await supabase.rpc('set_my_meeting_fill_progress', {
    requested_percentage: percentage
  });
  if (error) throw error;
  const savedPercentage = Number(data);
  if (!Number.isFinite(savedPercentage) || savedPercentage < 0 || savedPercentage > 100) {
    throw new Error('Supabase tidak mengembalikan progres konfirmasi yang valid.');
  }
  return savedPercentage;
}

export async function saveAdminMeetingFillProgress(profile: CoupleProfile, percentage: number): Promise<number> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new RangeError('Persentase pengisian harus berada di antara 0 dan 100.');
  }
  const { data, error } = await supabase.rpc('admin_set_meeting_fill_progress', {
    requested_profile: profile,
    requested_percentage: percentage
  });
  if (error) throw error;
  const savedPercentage = Number(data);
  if (!Number.isFinite(savedPercentage) || savedPercentage < 0 || savedPercentage > 100) {
    throw new Error('Supabase tidak mengembalikan progres konfirmasi admin yang valid.');
  }
  return savedPercentage;
}

export async function saveMyHeartProgress(percentage: number): Promise<number> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new RangeError('Persentase hati harus berada di antara 0 dan 100.');
  }
  const { data, error } = await supabase.rpc('set_my_heart_progress', {
    requested_percentage: percentage
  });
  if (error) throw error;
  const savedPercentage = Number(data);
  if (!Number.isFinite(savedPercentage) || savedPercentage < 0 || savedPercentage > 100) {
    throw new Error('Supabase tidak mengembalikan progres hati yang valid.');
  }
  return savedPercentage;
}

export async function saveAdminHeartProgress(profile: CoupleProfile, percentage: number): Promise<number> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new RangeError('Persentase hati harus berada di antara 0 dan 100.');
  }
  const { data, error } = await supabase.rpc('admin_set_profile_heart_progress', {
    requested_profile: profile,
    requested_percentage: percentage
  });
  if (error) throw error;
  const savedPercentage = Number(data);
  if (!Number.isFinite(savedPercentage) || savedPercentage < 0 || savedPercentage > 100) {
    throw new Error('Supabase tidak mengembalikan progres hati admin yang valid.');
  }
  return savedPercentage;
}

export async function saveDailyCheckin(input: {
  profile: CoupleProfile;
  expression: string;
  rating: number;
  diaryText: string;
  photo?: Blob | null;
  adminMode?: boolean;
}) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Masuk ke akun terlebih dahulu.');
  const logDate = getJakartaDate();
  let dataOwnerId = user.id;
  if (input.adminMode) {
    const { data: owner, error: ownerError } = await supabase
      .from('couple_profiles')
      .select('user_id')
      .eq('profile_name', input.profile)
      .single();
    if (ownerError) throw ownerError;
    dataOwnerId = owner.user_id;
  }
  const { data: previous, error: previousError } = await supabase
    .from('daily_checkins')
    .select('photo_path')
    .eq('user_id', dataOwnerId)
    .eq('log_date', logDate)
    .maybeSingle();
  if (previousError) throw previousError;

  let photoPath = previous?.photo_path ?? null;
  if (input.photo) {
    const extensionByMime: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' };
    const extension = extensionByMime[input.photo.type];
    if (!extension) throw new Error(`Format foto ${input.photo.type || 'tidak diketahui'} tidak didukung.`);
    photoPath = `${user.id}/${logDate}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('daily-diary').upload(photoPath, input.photo, { contentType: input.photo.type, cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
  }

  const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('daily_checkins').upsert({
    user_id: dataOwnerId,
    profile: input.profile,
    log_date: logDate,
    expression: input.expression,
    rating: input.rating,
    diary_text: input.diaryText.trim() || null,
    photo_path: photoPath,
    expires_at: expiresAt
  }, { onConflict: 'user_id,log_date' }).select('*').single();
  if (error) {
    if (input.photo && photoPath) await supabase.storage.from('daily-diary').remove([photoPath]);
    throw error;
  }
  if (previous?.photo_path && input.photo && previous.photo_path !== photoPath) {
    await supabase.storage.from('daily-diary').remove([previous.photo_path]);
  }
  let photo_url: string | null = null;
  if (photoPath) {
    const { data: signed, error: signedUrlError } = await supabase.storage.from('daily-diary').createSignedUrl(photoPath, 60 * 60);
    if (signedUrlError) throw signedUrlError;
    photo_url = signed?.signedUrl ?? null;
  }
  return { ...(data as DailyCheckin), photo_url };
}

export async function restoreStreak() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await supabase.rpc('restore_couple_streak');
  if (error) throw error;
}

export async function confirmMeeting(profile?: CoupleProfile, adminMode = false) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  if (adminMode) {
    if (!profile) throw new Error('Pilih profil yang akan dikonfirmasi.');
    const { data, error } = await supabase.rpc('admin_confirm_meeting', { requested_profile: profile });
    if (error) throw error;
    return data as MeetingConfirmation;
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Masuk ke akun terlebih dahulu.');
  const { data: boundProfile, error: profileError } = await supabase.from('couple_profiles').select('profile_name').eq('user_id', user.id).single();
  if (profileError) throw profileError;
  const { data, error } = await supabase.from('meeting_confirmations').upsert({
    user_id: user.id,
    profile: boundProfile.profile_name,
    meeting_date: getJakartaDate()
  }, { onConflict: 'user_id,meeting_date' }).select('*').single();
  if (error) throw error;
  return data as MeetingConfirmation;
}

export async function cancelMeetingConfirmation(profile?: CoupleProfile, adminMode = false): Promise<void> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  if (adminMode) {
    if (!profile) throw new Error('Pilih profil yang konfirmasinya akan dibatalkan.');
    const { error } = await supabase.rpc('admin_cancel_meeting_confirmation', {
      requested_profile: profile
    });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.rpc('cancel_my_meeting_confirmation');
  if (error) throw error;
}
