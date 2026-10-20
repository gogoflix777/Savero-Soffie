import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Flower2, Heart, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { supabase, supabaseAnonKey } from '../../lib/supabase';
import { soundManager } from '../../utils/audio';

export const SupabaseLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signInWithGoogle = async () => {
    if (!supabase) return;
    soundManager.playTap();
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: supabaseAnonKey ? { apikey: supabaseAnonKey } : undefined
        }
      });
      if (authError) throw authError;
    } catch {
      setError('Login Google gagal dimulai. Periksa konfigurasi Google provider di Supabase.');
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    soundManager.playTap();
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) setError('Email atau kata sandi tidak cocok. Pastikan akun sudah dibuat di Supabase.');
    } catch {
      setError('Tidak dapat menghubungi Supabase. Periksa koneksi internet lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex min-h-full items-center justify-center overflow-y-auto bg-[#fff5f0] px-4 py-8 text-[#57202c] dark:bg-[#1c1116] dark:text-rose-50 sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-[12%] h-72 w-72 rounded-full bg-[#f4b6c2]/35 blur-3xl dark:bg-[#9e3b58]/20" />
        <div className="absolute -right-24 bottom-[8%] h-80 w-80 rounded-full bg-[#f3d6c0]/55 blur-3xl dark:bg-[#7e5361]/20" />
        <motion.div className="absolute left-[12%] top-[22%] text-[#df8ba0]/60 dark:text-rose-200/30" animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}><Heart className="h-8 w-8 fill-current" /></motion.div>
        <motion.div className="absolute right-[14%] top-[27%] text-[#d6aa78]/70 dark:text-amber-200/35" animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}><Sparkles className="h-8 w-8" /></motion.div>
        <motion.div className="absolute bottom-[18%] left-[19%] text-[#d69aa9]/60 dark:text-rose-100/25" animate={{ y: [0, -9, 0], rotate: [0, -12, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}><Flower2 className="h-7 w-7" /></motion.div>
      </div>
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative my-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-[#e8c7c7] bg-[linear-gradient(145deg,#fffdf9_0%,#fff4f1_58%,#f9e8e8_100%)] p-6 shadow-[10px_14px_30px_rgba(95,48,57,.16),inset_2px_3px_8px_rgba(255,255,255,.95),inset_-3px_-4px_9px_rgba(190,122,135,.12)] dark:border-[#68414d] dark:bg-[linear-gradient(145deg,#38252c_0%,#2d1c23_58%,#26171d_100%)] dark:shadow-[10px_14px_32px_rgba(0,0,0,.35),inset_2px_3px_8px_rgba(255,220,229,.06),inset_-3px_-4px_9px_rgba(0,0,0,.18)] sm:p-9"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/40 blur-2xl dark:bg-rose-200/5" />
        <motion.div className="relative mx-auto mb-3 grid h-24 w-24 place-items-center rounded-[2rem] bg-[#fff8f2] shadow-[5px_7px_12px_rgba(111,65,70,.16),inset_2px_3px_6px_white,inset_-2px_-3px_6px_rgba(205,154,150,.2)] dark:bg-[#432d35] dark:shadow-[5px_7px_12px_rgba(0,0,0,.25),inset_2px_3px_6px_rgba(255,220,229,.08),inset_-2px_-3px_6px_rgba(0,0,0,.2)]" animate={{ y: [0, -4, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
          <img src="/logo/logo%20couple%203d.webp" alt="Savero dan Soffie" loading="lazy" decoding="async" className="h-20 w-20 object-contain drop-shadow-md" />
        </motion.div>
        <Heart className="mx-auto mb-2 h-5 w-5 fill-rose-400 text-rose-400" />
        <h1 className="text-center font-script text-3xl text-[#a64e68] drop-shadow-sm dark:text-[#f0a8b7]">Masuk ke ruang kita</h1>
        <p className="mb-6 mt-2 text-center text-sm text-[#80646a] dark:text-rose-100/70">Ruang kecil yang menyimpan cerita kita berdua.</p>
        <motion.button type="button" disabled={busy} onClick={() => void signInWithGoogle()} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="mb-5 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#ead4cf] bg-[#fffdfa] font-bold text-[#57202c] shadow-[4px_5px_9px_rgba(110,68,69,.12),inset_1px_2px_4px_white,inset_-1px_-2px_4px_rgba(190,140,136,.12)] transition-colors hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-[#3b2930] dark:text-rose-50 dark:hover:bg-[#49323a]">
          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
            <path fill="#4285F4" d="M48 24.5c0-1.6-.1-3.1-.4-4.5H24v9h13.5c-.6 3-2.3 5.5-4.8 7.2l7.7 6C44.8 37.8 48 31.7 48 24.5Z" />
            <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.7-6c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.8-4.3-13.7-10.1l-8 6.2C6.4 42.6 14.5 48 24 48Z" />
            <path fill="#FBBC05" d="M10.3 28.4a14.4 14.4 0 0 1 0-8.8l-8-6.2a24 24 0 0 0 0 21.2l8-6.2Z" />
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C36 2.4 30.5 0 24 0 14.5 0 6.4 5.4 2.3 13.4l8 6.2C12.2 13.8 17.6 9.5 24 9.5Z" />
          </svg>
          {busy ? 'Menghubungkan…' : 'Masuk dengan Google'}
        </motion.button>
        <div className="mb-5 flex items-center gap-3 text-xs font-semibold text-[#9a6870] dark:text-rose-200/60">
          <span className="h-px flex-1 bg-[#e7cbca] dark:bg-white/10" />
          atau gunakan email
          <span className="h-px flex-1 bg-[#e7cbca] dark:bg-white/10" />
        </div>
        <label className="mb-4 block text-sm font-bold text-[#69434b] dark:text-rose-100/90">Email
          <span className="mt-1.5 flex items-center gap-3 rounded-2xl border border-[#e4c8c7] bg-[#fffaf7] px-3 shadow-[inset_2px_3px_6px_rgba(109,69,72,.08),inset_-1px_-1px_3px_white] transition focus-within:border-[#ce8292] focus-within:ring-2 focus-within:ring-[#e7a6b2]/30 dark:border-white/10 dark:bg-[#281b21] dark:shadow-[inset_2px_3px_6px_rgba(0,0,0,.2)] dark:focus-within:border-rose-300/50">
            <Mail className="h-4 w-4 shrink-0 text-[#aa7780]" />
            <input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="min-h-12 w-full bg-transparent text-[#57202c] outline-none placeholder:text-[#ab9193] dark:text-rose-50 dark:placeholder:text-rose-100/35" placeholder="nama@email.com" />
          </span>
        </label>
        <label className="mb-5 block text-sm font-bold text-[#69434b] dark:text-rose-100/90">Kata sandi
          <span className="mt-1.5 flex items-center gap-3 rounded-2xl border border-[#e4c8c7] bg-[#fffaf7] px-3 shadow-[inset_2px_3px_6px_rgba(109,69,72,.08),inset_-1px_-1px_3px_white] transition focus-within:border-[#ce8292] focus-within:ring-2 focus-within:ring-[#e7a6b2]/30 dark:border-white/10 dark:bg-[#281b21] dark:shadow-[inset_2px_3px_6px_rgba(0,0,0,.2)] dark:focus-within:border-rose-300/50">
            <LockKeyhole className="h-4 w-4 shrink-0 text-[#aa7780]" />
            <input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="min-h-12 w-full bg-transparent text-[#57202c] outline-none dark:text-rose-50" placeholder="Kata sandi" />
          </span>
        </label>
        {error && <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-300/20 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
        <motion.button type="submit" disabled={busy} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="min-h-12 w-full rounded-2xl bg-gradient-to-br from-[#d77891] to-[#bd506f] font-extrabold text-white shadow-[0_6px_0_#a84360,0_10px_18px_rgba(143,54,77,.2),inset_1px_2px_3px_rgba(255,255,255,.35)] transition disabled:opacity-60 active:translate-y-1 active:shadow-[0_2px_0_#a84360,0_4px_8px_rgba(143,54,77,.18)]">{busy ? 'Memeriksa…' : 'Masuk'}</motion.button>
      </motion.form>
    </div>
  );
};
