create or replace function public.cancel_my_meeting_confirmation()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bound_profile text;
  today_date date := public.jakarta_today();
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  select profile_name into bound_profile
  from public.couple_profiles
  where user_id = auth.uid();
  if bound_profile is null then raise exception 'Profil akun belum terhubung.'; end if;

  delete from public.meeting_confirmations
  where user_id = auth.uid()
    and profile = bound_profile
    and meeting_date = today_date;

  update public.meeting_fill_progress
  set percentage = 0, updated_at = now()
  where profile = bound_profile
    and progress_date = today_date;
end;
$$;
revoke all on function public.cancel_my_meeting_confirmation() from public, anon;
grant execute on function public.cancel_my_meeting_confirmation() to authenticated;

create or replace function public.admin_cancel_meeting_confirmation(requested_profile text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_owner uuid;
  today_date date := public.jakarta_today();
begin
  if not public.is_app_admin() then raise exception 'Akses admin diperlukan.'; end if;
  if requested_profile not in ('Savero', 'Soffie') then raise exception 'Profil tidak valid.'; end if;
  select user_id into profile_owner
  from public.couple_profiles
  where profile_name = requested_profile;
  if profile_owner is null then raise exception 'Akun pemilik profil belum terhubung.'; end if;

  delete from public.meeting_confirmations
  where user_id = profile_owner
    and profile = requested_profile
    and meeting_date = today_date;

  update public.meeting_fill_progress
  set percentage = 0, updated_at = now()
  where profile = requested_profile
    and progress_date = today_date;
end;
$$;
revoke all on function public.admin_cancel_meeting_confirmation(text) from public, anon;
grant execute on function public.admin_cancel_meeting_confirmation(text) to authenticated;
