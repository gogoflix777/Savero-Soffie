import React, { useState } from 'react';
import { LockKeyhole, Mail, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const SupabaseLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) setError('Email atau kata sandi tidak cocok. Pastikan akun sudah dibuat di Supabase.');
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#fff7f1] px-5 py-8 dark:bg-[#21151a]">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[2rem] border border-rose-200 bg-white/90 p-7 shadow-xl dark:border-white/10 dark:bg-[#2d2025]">
        <img src="/logo/logo%20couple%203d.png" alt="Savero dan Soffie" className="mx-auto mb-3 h-20 w-20 object-contain" />
        <Heart className="mx-auto mb-2 h-5 w-5 fill-rose-400 text-rose-400" />
        <h1 className="text-center text-xl font-extrabold text-[#57202c] dark:text-rose-100">Masuk ke ruang kita</h1>
        <p className="mb-6 mt-1 text-center text-sm text-[#9a6870] dark:text-rose-200/70">Gunakan akun Supabase untuk melanjutkan.</p>
        <label className="mb-3 block text-sm font-semibold">Email
          <span className="mt-1 flex items-center gap-2 rounded-xl border border-rose-200 px-3 dark:border-white/15"><Mail className="h-4 w-4 opacity-50" /><input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="min-h-11 w-full bg-transparent outline-none" /></span>
        </label>
        <label className="mb-4 block text-sm font-semibold">Kata sandi
          <span className="mt-1 flex items-center gap-2 rounded-xl border border-rose-200 px-3 dark:border-white/15"><LockKeyhole className="h-4 w-4 opacity-50" /><input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="min-h-11 w-full bg-transparent outline-none" /></span>
        </label>
        {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="min-h-12 w-full rounded-xl bg-[#c95c78] font-bold text-white disabled:opacity-60">{busy ? 'Memeriksa…' : 'Masuk'}</button>
      </form>
    </div>
  );
};
