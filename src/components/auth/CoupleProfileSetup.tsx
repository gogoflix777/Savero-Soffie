import { useState } from 'react';
import { motion } from 'motion/react';
import { Flower2, Heart, LoaderCircle, Sparkles } from 'lucide-react';
import { CoupleProfile } from '../../types';
import { claimProfile } from '../../lib/coupleDaily';
import { soundManager } from '../../utils/audio';

interface CoupleProfileSetupProps {
  onComplete: (profile: CoupleProfile) => void;
}

export const CoupleProfileSetup: React.FC<CoupleProfileSetupProps> = ({ onComplete }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const choose = async (profile: CoupleProfile) => {
    soundManager.playTap();
    setBusy(true);
    setError('');
    try {
      onComplete(await claimProfile(profile));
      soundManager.playSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Profil gagal dipasangkan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-[120] grid min-h-full place-items-center overflow-y-auto bg-[#fff5f0] p-4 text-[#57202c] dark:bg-[#1c1116] dark:text-rose-50 sm:p-6">
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-24 top-[14%] h-72 w-72 rounded-full bg-[#f4b6c2]/35 blur-3xl dark:bg-[#9e3b58]/20" />
      <div className="absolute -right-24 bottom-[8%] h-80 w-80 rounded-full bg-[#f3d6c0]/55 blur-3xl dark:bg-[#7e5361]/20" />
      <motion.div className="absolute left-[14%] top-[23%] text-[#df8ba0]/60 dark:text-rose-200/30" animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}><Heart className="h-8 w-8 fill-current" /></motion.div>
      <motion.div className="absolute right-[15%] top-[27%] text-[#d6aa78]/70 dark:text-amber-200/35" animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}><Sparkles className="h-8 w-8" /></motion.div>
      <motion.div className="absolute bottom-[16%] left-[19%] text-[#d69aa9]/60 dark:text-rose-100/25" animate={{ y: [0, -9, 0], rotate: [0, -12, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}><Flower2 className="h-7 w-7" /></motion.div>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative my-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-[#e8c7c7] bg-[linear-gradient(145deg,#fffdf9_0%,#fff4f1_58%,#f9e8e8_100%)] p-6 text-center shadow-[10px_14px_30px_rgba(95,48,57,.16),inset_2px_3px_8px_rgba(255,255,255,.95),inset_-3px_-4px_9px_rgba(190,122,135,.12)] dark:border-[#68414d] dark:bg-[linear-gradient(145deg,#38252c_0%,#2d1c23_58%,#26171d_100%)] dark:shadow-[10px_14px_32px_rgba(0,0,0,.35),inset_2px_3px_8px_rgba(255,220,229,.06),inset_-3px_-4px_9px_rgba(0,0,0,.18)] sm:p-9"
    >
      <motion.div className="relative mx-auto mb-3 grid h-24 w-24 place-items-center rounded-[2rem] bg-[#fff8f2] shadow-[5px_7px_12px_rgba(111,65,70,.16),inset_2px_3px_6px_white,inset_-2px_-3px_6px_rgba(205,154,150,.2)] dark:bg-[#432d35] dark:shadow-[5px_7px_12px_rgba(0,0,0,.25),inset_2px_3px_6px_rgba(255,220,229,.08),inset_-2px_-3px_6px_rgba(0,0,0,.2)]" animate={{ y: [0, -4, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
        <img src="/logo/logo%20couple%203d.webp" alt="" loading="lazy" decoding="async" className="h-20 w-20 object-contain drop-shadow-md" />
      </motion.div>
      <Heart className="mx-auto mb-2 h-5 w-5 fill-rose-400 text-rose-400" />
      <h1 className="font-script text-3xl text-[#a64e68] drop-shadow-sm dark:text-[#f0a8b7]">Pilih profil akun</h1>
      <p className="mb-6 mt-2 text-sm leading-relaxed text-[#80646a] dark:text-rose-100/70">Pilih profilmu untuk mengikat akun ini. Pilihan ini menjaga log harian dan konfirmasi tetap sesuai pemiliknya.</p>
      <div className="grid grid-cols-2 gap-4">
        {(['Savero', 'Soffie'] as const).map((profile, index) => <motion.button
          key={profile}
          type="button"
          disabled={busy}
          onClick={() => void choose(profile)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 + index * 0.1, duration: 0.35 }}
          whileHover={{ y: -4, scale: 1.025 }}
          whileTap={{ scale: 0.97 }}
          className="group rounded-[1.5rem] border border-[#e7ceca] bg-[linear-gradient(145deg,#fffaf5,#f8e9e5)] p-4 shadow-[5px_7px_12px_rgba(111,65,70,.12),inset_2px_3px_6px_white,inset_-2px_-3px_6px_rgba(205,154,150,.16)] transition-colors hover:border-[#d48a99] disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-[linear-gradient(145deg,#402c33,#302128)] dark:shadow-[5px_7px_12px_rgba(0,0,0,.22),inset_2px_3px_6px_rgba(255,220,229,.06)] dark:hover:border-rose-200/30"
        >
          <motion.span className="mx-auto mb-3 grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-[#fffaf7] bg-[#f8e4e2] shadow-[0_5px_12px_rgba(128,66,81,.2),inset_2px_3px_5px_rgba(255,255,255,.7)] dark:border-[#59404a] dark:bg-[#3d2830]" whileHover={{ rotate: index === 0 ? -4 : 4, scale: 1.06 }}>
            <img src={`/characters/expressions/${profile.toLowerCase()}/${profile === 'Savero' ? 'bahagia' : 'gemas-sayang'}.webp`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
          </motion.span>
          <span className="block text-base font-extrabold text-[#70414d] dark:text-rose-100">{profile}</span>
          <span className="mt-1 block text-[11px] font-semibold text-[#a17b7e] dark:text-rose-100/55">Pilih profil ini</span>
        </motion.button>)}
      </div>
      {busy && <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-xs font-bold text-[#9a6870] shadow-inner dark:bg-white/5 dark:text-rose-100/70"><LoaderCircle className="h-4 w-4 animate-spin" /> Memasangkan profil…</p>}
      {error && <p role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700 dark:border-rose-300/20 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
    </motion.div>
  </div>;
};
