import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Lock,
  Sparkles,
  Share2,
  Filter,
  CheckCircle,
  ExternalLink,
  RotateCw,
  Eye,
  Info,
  Coffee,
  Clapperboard,
  Scale,
  Stethoscope,
  UtensilsCrossed,
  MapPin,
  BedDouble,
  FerrisWheel,
  Heart,
  Route,
  Trophy,
  ChevronRight,
  Flame
} from 'lucide-react';
import { AchievementBadge, BadgeTier, AppSettings } from '../../types';
import { soundManager } from '../../utils/audio';
import { Medal3DCanvas } from './Medal3DCanvas';
import { AnimatedHeart, AnimatedSparkles } from '../common/AnimatedIcons';

interface TrophyCabinetProps {
  badges: AchievementBadge[];
  settings: AppSettings;
  onUnlockBadge?: (badgeId: string) => void;
}

const TIER_COLORS: Record<BadgeTier, { bg: string; border: string; text: string; ribbon: string; label: string }> = {
  perunggu: {
    bg: 'bg-amber-800/15',
    border: 'border-amber-700',
    text: 'text-amber-800 dark:text-amber-300',
    ribbon: 'from-amber-700 to-amber-900',
    label: 'Tier Perunggu'
  },
  perak: {
    bg: 'bg-slate-300/25',
    border: 'border-slate-400',
    text: 'text-slate-700 dark:text-slate-200',
    ribbon: 'from-slate-400 to-slate-600',
    label: 'Tier Perak'
  },
  emas: {
    bg: 'bg-[#D9B26F]/20',
    border: 'border-[#D9B26F]',
    text: 'text-[#9c782e] dark:text-[#D9B26F]',
    ribbon: 'from-[#D9B26F] to-[#b3883a]',
    label: 'Tier Emas'
  },
  hati: {
    bg: 'bg-gradient-to-tr from-[#7A1018]/20 via-[#F4B6C2]/30 to-[#D9B26F]/30',
    border: 'border-[#7A1018]',
    text: 'text-[#7A1018] dark:text-[#F4B6C2]',
    ribbon: 'from-[#7A1018] via-[#F4B6C2] to-[#D9B26F]',
    label: 'Tier Hati Holografik'
  }
};

export const renderBadgeIcon = (iconType: string, className = 'w-7 h-7') => {
  switch (iconType) {
    case 'cangkir':
      return <Coffee className={className} />;
    case 'matcha':
      return <Sparkles className={`${className} text-emerald-600`} />;
    case 'klaper':
      return <Clapperboard className={className} />;
    case 'palu':
      return <Scale className={className} />;
    case 'stetoskop':
      return <Stethoscope className={className} />;
    case 'sate':
      return <UtensilsCrossed className={className} />;
    case 'pin':
      return <MapPin className={className} />;
    case 'bantal':
      return <BedDouble className={className} />;
    case 'bianglala':
      return <FerrisWheel className={className} />;
    case 'hati':
      return <Heart className={`${className} fill-current text-[#7A1018] dark:text-[#F4B6C2]`} />;
    case 'jalan':
      return <Route className={className} />;
    default:
      return <Trophy className={className} />;
  }
};

export const TrophyCabinetSection: React.FC<TrophyCabinetProps> = ({
  badges,
  settings,
  onUnlockBadge
}) => {
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);

  // Featured 3D Showcase Medal on Podium
  const [podiumBadgeId, setPodiumBadgeId] = useState<string>(() => {
    const hati = badges.find((b) => b.tier === 'hati' && b.isUnlocked);
    return hati ? hati.id : badges[0]?.id || 'badge-1';
  });

  // Filter sensitive badges in guest mode as required
  const visibleBadges = badges.filter((b) => {
    if (settings.isGuestMode && b.isSensitive) return false;
    if (filterTier !== 'all' && b.tier !== filterTier) return false;
    if (filterStatus === 'unlocked' && !b.isUnlocked) return false;
    if (filterStatus === 'locked' && b.isUnlocked) return false;
    return true;
  });

  const podiumBadge = badges.find((b) => b.id === podiumBadgeId) || badges[0];
  const unlockedCount = badges.filter((b) => b.isUnlocked && !(settings.isGuestMode && b.isSensitive)).length;

  const triggerHeartConfetti = () => {
    soundManager.playChime();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7A1018', '#F4B6C2', '#D9B26F', '#BFD8B8'],
      shapes: ['circle']
    });
  };

  const handleInspectBadge = (badge: AchievementBadge) => {
    setSelectedBadge(badge);
    setPodiumBadgeId(badge.id);
    if (badge.isUnlocked) {
      soundManager.playChime();
    } else {
      soundManager.playTap();
    }
  };

  return (
    <section id="lemari-piala" className="py-14 px-4 bg-[#EFE6DA] dark:bg-[#160305] border-b border-[#7A1018]/15 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-2 text-[11px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] mb-1">
            <Award className="w-4 h-4 text-[#D9B26F]" />
            <span>LEMARI PIALA & MEDALI 3D</span>
          </div>
          <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
            Medali Pencapaian Kisah Kita
          </h2>
          <p className="font-editorial italic text-xs sm:text-sm text-[#5c2432] dark:text-rose-200 mt-0.5">
            Model medali 3D WebGL dengan material logam beveled, pita tier, ukiran stempel cinta, dan animasi rotasi 360°.
          </p>

          <div className="mt-3 inline-flex items-center space-x-2 bg-white/70 dark:bg-black/30 px-4 py-1.5 rounded-full border border-[#7A1018]/15 text-xs font-sans-clean font-bold text-[#7A1018] dark:text-[#F4B6C2]">
            <AnimatedSparkles className="w-3.5 h-3.5" />
            <span>Terbuka {unlockedCount} dari {visibleBadges.length} Medali</span>
          </div>
        </div>

        {/* 3D Animated Podium Showcase Section */}
        {podiumBadge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-10 max-w-3xl mx-auto bg-gradient-to-b from-white/80 via-[#f8f3eb]/90 to-[#ece2d3]/90 dark:from-[#2a080c] dark:via-[#1e0508] dark:to-[#170305] rounded-3xl p-6 sm:p-8 border-2 border-[#D9B26F]/40 shadow-xl relative overflow-hidden text-center"
          >
            {/* Top Badge Tag */}
            <div className="inline-flex items-center space-x-1.5 bg-[#7A1018] text-[#EFE6DA] px-3 py-1 rounded-full text-[10px] font-sans-clean font-bold uppercase tracking-widest mb-3">
              <Trophy className="w-3 h-3 text-[#D9B26F]" />
              <span>PANGGUNG MEDALI 3D AKTIF: {podiumBadge.title}</span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 my-2">
              {/* 3D Live Animated Medal Canvas */}
              <div className="relative">
                <Medal3DCanvas
                  key={podiumBadge.id}
                  tier={podiumBadge.tier}
                  iconType={podiumBadge.iconType}
                  isUnlocked={podiumBadge.isUnlocked}
                  size={260}
                  interactive={true}
                  autoRotateSpeed={0.015}
                />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans-clean block mt-1">
                  Sentuh / geser medali untuk melihat sisi depan & belakang
                </span>
              </div>

              {/* Medal Detail Card */}
              <div className="text-left max-w-sm space-y-3">
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-sans-clean font-bold tracking-wider uppercase border border-current"
                  style={{ color: podiumBadge.tier === 'hati' ? '#7A1018' : '#9c782e' }}
                >
                  {TIER_COLORS[podiumBadge.tier].label}
                </div>
                <h3 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                  {podiumBadge.title}
                </h3>
                <p className="font-editorial text-sm text-[#5c2432] dark:text-rose-200 leading-relaxed">
                  {podiumBadge.description}
                </p>

                <div className="pt-2 flex flex-wrap gap-2 text-xs font-sans-clean">
                  {podiumBadge.isUnlocked ? (
                    <span className="inline-flex items-center space-x-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-lg font-bold border border-emerald-300">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Terbuka: {podiumBadge.unlockedAt || '26 Agustus 2026'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-lg font-bold border border-amber-300">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Masih Terkunci (Selesaikan Momen Bersama)</span>
                    </span>
                  )}

                  <button
                    onClick={() => triggerHeartConfetti()}
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg font-bold bg-[#7A1018] text-[#EFE6DA] hover:bg-[#5e0a11] transition shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D9B26F]" />
                    <span>Rayakan Medali Ini</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs font-sans-clean">
          <div className="flex rounded-xl bg-white/50 dark:bg-black/30 p-1 border border-[#7A1018]/15 shadow-xs">
            <button
              onClick={() => {
                soundManager.playTap();
                setFilterStatus('all');
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'all' ? 'bg-[#7A1018] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Semua ({badges.length})
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                setFilterStatus('unlocked');
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'unlocked' ? 'bg-[#7A1018] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Terbuka ({unlockedCount})
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                setFilterStatus('locked');
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'locked' ? 'bg-[#7A1018] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Terkunci
            </button>
          </div>

          <div className="flex rounded-xl bg-white/50 dark:bg-black/30 p-1 border border-[#7A1018]/15 shadow-xs">
            {['all', 'hati', 'emas', 'perak', 'perunggu'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  soundManager.playTap();
                  setFilterTier(t);
                }}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition ${
                  filterTier === t ? 'bg-[#7A1018] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {t === 'all' ? 'Semua Tier' : t}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Trophy Showcase Shelves (Rak Bertingkat dengan Depth & Parallax) */}
        <div className="relative bg-gradient-to-b from-[#e8decb] to-[#dfd2be] dark:from-[#230609] dark:to-[#170305] p-6 sm:p-10 rounded-3xl border-2 border-[#7A1018]/25 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
            {visibleBadges.map((badge) => {
              const tierMeta = TIER_COLORS[badge.tier];
              const isLocked = !badge.isUnlocked;
              const isPodiumSelected = podiumBadgeId === badge.id;

              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => handleInspectBadge(badge)}
                  className={`group relative flex flex-col items-center text-center cursor-pointer transition-all duration-300 ${
                    isLocked ? 'opacity-65 hover:opacity-90' : 'opacity-100'
                  }`}
                >
                  {/* Active Podium Indicator Ring */}
                  {isPodiumSelected && (
                    <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-[#7A1018] text-[#EFE6DA] text-[8px] font-sans-clean font-bold tracking-wider uppercase z-20 shadow-xs">
                      Aktif di Panggung
                    </div>
                  )}

                  {/* Medal 3D Clay Base */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                    {/* Ribbon Hanger */}
                    <div
                      className={`absolute -top-3 w-8 h-8 rounded-t-sm bg-gradient-to-b ${tierMeta.ribbon} shadow-sm border-t border-white/30`}
                    />

                    {/* Medal Round Coin (Pastel clay with bevel rim) */}
                    <div
                      className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center p-2 shadow-xl border-4 transition-transform group-hover:scale-110 ${
                        isLocked
                          ? 'bg-gray-300 dark:bg-gray-800 border-gray-400 dark:border-gray-700'
                          : `${tierMeta.bg} ${tierMeta.border} bg-white dark:bg-[#2b080b]`
                      }`}
                    >
                      {/* Holographic Sheen on Tier Hati */}
                      {badge.tier === 'hati' && badge.isUnlocked && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
                      )}

                      {/* Vector Icon */}
                      {isLocked ? (
                        badge.isSecret ? (
                          <span className="font-serif-title font-bold text-xl text-gray-500">???</span>
                        ) : (
                          <Lock className="w-6 h-6 text-gray-500" />
                        )
                      ) : (
                        <div className="text-[#7A1018] dark:text-[#D9B26F] transition-transform group-hover:rotate-12">
                          {renderBadgeIcon(badge.iconType, 'w-8 h-8')}
                        </div>
                      )}

                      {/* Small Star or Tier dot */}
                      {badge.isUnlocked && (
                        <div className="absolute bottom-1 w-2 h-2 rounded-full bg-[#D9B26F] ring-1 ring-white" />
                      )}
                    </div>
                  </div>

                  {/* Medal Stand Plaque on Shelf */}
                  <div className="w-full mt-2 bg-white/70 dark:bg-black/40 px-2 py-1.5 rounded-lg border border-[#7A1018]/15 shadow-xs">
                    <h4 className="font-serif-title font-bold text-xs text-[#3B0A0F] dark:text-[#EFE6DA] line-clamp-1">
                      {isLocked && badge.isSecret ? 'Misteri Terkunci' : badge.title}
                    </h4>
                    <span className="text-[9px] font-sans-clean font-semibold tracking-wider text-gray-500 uppercase block">
                      {tierMeta.label}
                    </span>
                  </div>

                  {/* Progress ring if locked & has progress */}
                  {isLocked && badge.progress && (
                    <div className="mt-1 text-[9px] font-sans-clean text-[#7A1018] dark:text-[#F4B6C2] font-bold">
                      {badge.progress.current}/{badge.progress.target}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Wooden Shelf Baseline */}
          <div className="mt-10 h-3 w-full rounded-full bg-gradient-to-r from-[#9c782e]/40 via-[#D9B26F] to-[#9c782e]/40 shadow-md" />
        </div>

        {/* Modal: Fullscreen 3D Inspection with Rotation Controls */}
        <AnimatePresence>
          {selectedBadge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#EFE6DA] dark:bg-[#250709] max-w-md w-full rounded-3xl p-6 sm:p-8 border-2 border-[#D9B26F]/60 shadow-2xl text-center relative my-8"
              >
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="absolute top-4 right-4 text-xs font-sans-clean font-bold uppercase tracking-wider bg-[#7A1018] text-white px-2.5 py-1 rounded-full hover:bg-black transition"
                >
                  ✕ Tutup
                </button>

                {/* Tier Header */}
                <div className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] mb-1">
                  {TIER_COLORS[selectedBadge.tier].label}
                </div>

                {/* Real 3D Animated WebGL Medal Canvas */}
                <div className="my-2 relative flex flex-col items-center justify-center">
                  <Medal3DCanvas
                    tier={selectedBadge.tier}
                    iconType={selectedBadge.iconType}
                    isUnlocked={selectedBadge.isUnlocked}
                    size={250}
                    interactive={true}
                    autoRotateSpeed={0.015}
                  />
                  <span className="text-[10px] text-gray-500 font-sans-clean mt-1">
                    Geser kursor atau sentuh layar untuk memutar medali 3D
                  </span>
                </div>

                {/* Medal Title & Description */}
                <h3 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA] mt-3">
                  {selectedBadge.title}
                </h3>
                <p className="font-editorial text-sm text-[#5c2432] dark:text-rose-200 mt-1 mb-4 leading-relaxed">
                  {selectedBadge.description}
                </p>

                {/* Status Box */}
                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-black/40 border border-[#7A1018]/15 text-xs font-sans-clean mb-4">
                  {selectedBadge.isUnlocked ? (
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                      <span className="flex items-center space-x-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>Piala Berhasil Dibuka!</span>
                      </span>
                      <span className="text-[11px] font-normal text-gray-500">
                        {selectedBadge.unlockedAt || '26 Agustus 2026'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-bold">
                        <span className="flex items-center space-x-1.5">
                          <Lock className="w-4 h-4" />
                          <span>Masih Terkunci</span>
                        </span>
                        {selectedBadge.progress && (
                          <span className="text-[11px]">
                            {selectedBadge.progress.current} / {selectedBadge.progress.target}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 text-left">
                        Jalani kencan atau tambahkan kenangan untuk membuka medali ini bersama.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-3">
                  {selectedBadge.isUnlocked && (
                    <button
                      onClick={triggerHeartConfetti}
                      className="px-4 py-2 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] rounded-xl font-sans-clean font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-[#D9B26F]" />
                      <span>Rayakan Prestasi</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setPodiumBadgeId(selectedBadge.id);
                      setSelectedBadge(null);
                    }}
                    className="px-4 py-2 bg-white/80 dark:bg-black/40 text-[#7A1018] dark:text-[#F4B6C2] rounded-xl font-sans-clean font-bold text-xs border border-[#7A1018]/20 hover:bg-[#7A1018] hover:text-white transition"
                  >
                    Tampilkan di Podium 3D
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
