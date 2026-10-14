import React from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  Shield,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Pill,
  Sparkles,
  Smile,
  Zap,
  Flame,
  Coffee,
  HeartPulse,
  HeartHandshake,
  Scale,
  Stethoscope,
  Film,
  Lock,
  Unlock,
  MapPin,
  Compass,
  Trophy,
  Award,
  Calendar,
  Clock,
  ExternalLink,
  RotateCw,
  CupSoda
} from 'lucide-react';

interface AnimatedIconProps {
  className?: string;
  size?: number;
  color?: string;
}

// 1. Pulsing Heart with subtle organic heartbeat rhythm
export const AnimatedHeart: React.FC<AnimatedIconProps & { filled?: boolean }> = ({
  className = 'w-5 h-5',
  size,
  color = '#7A1018',
  filled = true
}) => (
  <motion.div
    animate={{
      scale: [1, 1.15, 1.05, 1.22, 1],
    }}
    transition={{
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut',
      times: [0, 0.15, 0.25, 0.45, 1]
    }}
    className="inline-flex items-center justify-center"
  >
    <Heart
      size={size}
      className={`${className} ${filled ? 'fill-current' : ''}`}
      style={{ color }}
    />
  </motion.div>
);

// 2. Twinkling Sparkles
export const AnimatedSparkles: React.FC<AnimatedIconProps> = ({
  className = 'w-5 h-5',
  size,
  color = '#D9B26F'
}) => (
  <motion.div
    animate={{
      rotate: [0, 15, -15, 0],
      scale: [1, 1.2, 0.9, 1.1, 1]
    }}
    transition={{
      duration: 2.4,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
    className="inline-flex items-center justify-center"
  >
    <Sparkles size={size} className={className} style={{ color }} />
  </motion.div>
);

// 3. Balanced Scales of Justice (Savero - Hukum UNNES)
export const AnimatedScales: React.FC<AnimatedIconProps> = ({
  className = 'w-5 h-5',
  size,
  color = '#D9B26F'
}) => (
  <motion.div
    animate={{
      rotate: [-4, 4, -4]
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
    className="inline-flex items-center justify-center"
  >
    <Scale size={size} className={className} style={{ color }} />
  </motion.div>
);

// 4. Stethoscope with Pulse (Soffie - Keperawatan UNDIP)
export const AnimatedStethoscope: React.FC<AnimatedIconProps> = ({
  className = 'w-5 h-5',
  size,
  color = '#BFD8B8'
}) => (
  <motion.div
    animate={{
      scale: [1, 1.08, 1],
      y: [0, -2, 0]
    }}
    transition={{
      duration: 2.2,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
    className="inline-flex items-center justify-center"
  >
    <Stethoscope size={size} className={className} style={{ color }} />
  </motion.div>
);

// 5. Steaming Coffee
export const AnimatedCoffee: React.FC<AnimatedIconProps> = ({
  className = 'w-5 h-5',
  size,
  color = '#C9A58B'
}) => (
  <motion.div
    whileHover={{ scale: 1.15, rotate: -5 }}
    className="inline-flex items-center justify-center relative"
  >
    <Coffee size={size} className={className} style={{ color }} />
    <motion.span
      animate={{ opacity: [0.2, 0.8, 0], y: [-2, -8, -12], x: [-1, 1, -1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
      className="absolute -top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C9A58B]"
    />
  </motion.div>
);

// 6. Whimsical Matcha Drink
export const AnimatedMatcha: React.FC<AnimatedIconProps> = ({
  className = 'w-5 h-5',
  size,
  color = '#6b905f'
}) => (
  <motion.div
    whileHover={{ scale: 1.15, rotate: 6 }}
    animate={{ y: [0, -2, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    className="inline-flex items-center justify-center"
  >
    <CupSoda size={size} className={className} style={{ color }} />
  </motion.div>
);

// 7. Rotating Film Reel
export const AnimatedFilmReel: React.FC<AnimatedIconProps> = ({
  className = 'w-5 h-5',
  size,
  color = '#7A1018'
}) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
    className="inline-flex items-center justify-center"
  >
    <Film size={size} className={className} style={{ color }} />
  </motion.div>
);

// 8. Shield with Shimmer
export const AnimatedShield: React.FC<AnimatedIconProps & { issue?: boolean }> = ({
  className = 'w-5 h-5',
  size,
  color = '#0d9488',
  issue = false
}) => (
  <motion.div
    animate={issue ? { x: [-2, 2, -2, 2, 0] } : { scale: [1, 1.05, 1] }}
    transition={{ duration: issue ? 0.6 : 2.5, repeat: Infinity }}
    className="inline-flex items-center justify-center"
  >
    {issue ? (
      <AlertTriangle size={size} className={`${className} text-amber-500`} />
    ) : (
      <ShieldCheck size={size} className={className} style={{ color }} />
    )}
  </motion.div>
);

// 9. Floating Compass
export const AnimatedCompass: React.FC<AnimatedIconProps> = ({
  className = 'w-5 h-5',
  size,
  color = '#7A1018'
}) => (
  <motion.div
    animate={{ rotate: [0, -25, 20, -10, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    className="inline-flex items-center justify-center"
  >
    <Compass size={size} className={className} style={{ color }} />
  </motion.div>
);

// 10. Mood Icon Component (Replaces all mood emojis across the app)
export type MoodKey =
  | 'romantis'
  | 'hangat'
  | 'bahagia'
  | 'bersemangat'
  | 'santai'
  | 'rindu'
  | 'tenang';

export const MOOD_DEFINITIONS: Record<
  string,
  { label: string; icon: React.FC<AnimatedIconProps>; color: string; bg: string }
> = {
  romantis: {
    label: 'Romantis & Mesra',
    icon: AnimatedHeart,
    color: '#7A1018',
    bg: 'bg-[#F4B6C2]/30'
  },
  hangat: {
    label: 'Hangat & Dekat',
    icon: ({ className, size }) => (
      <Flame size={size} className={`${className} text-amber-600 fill-amber-200`} />
    ),
    color: '#d97706',
    bg: 'bg-amber-100 dark:bg-amber-950/40'
  },
  bahagia: {
    label: 'Bahagia & Ceria',
    icon: ({ className, size }) => (
      <Smile size={size} className={`${className} text-emerald-600`} />
    ),
    color: '#059669',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40'
  },
  bersemangat: {
    label: 'Penuh Gairah',
    icon: ({ className, size }) => (
      <Zap size={size} className={`${className} text-rose-600 fill-rose-200`} />
    ),
    color: '#e11d48',
    bg: 'bg-rose-100 dark:bg-rose-950/40'
  },
  santai: {
    label: 'Santai & Nyaman',
    icon: AnimatedCoffee,
    color: '#854d0e',
    bg: 'bg-amber-50 dark:bg-amber-900/30'
  },
  rindu: {
    label: 'Mendalam & Rindu',
    icon: ({ className, size }) => (
      <HeartHandshake size={size} className={`${className} text-indigo-600`} />
    ),
    color: '#4f46e5',
    bg: 'bg-indigo-100 dark:bg-indigo-950/40'
  },
  tenang: {
    label: 'Tenang & Damai',
    icon: AnimatedSparkles,
    color: '#0284c7',
    bg: 'bg-sky-100 dark:bg-sky-950/40'
  }
};

export const MoodBadge: React.FC<{ moodKey: string; className?: string }> = ({
  moodKey,
  className = ''
}) => {
  // Normalize if emoji or key
  let key = 'romantis';
  if (moodKey) {
    const lower = moodKey.toLowerCase();
    if (lower.includes('romantis') || lower.includes('🥰') || lower.includes('❤️')) key = 'romantis';
    else if (lower.includes('hangat') || lower.includes('🔥')) key = 'hangat';
    else if (lower.includes('bahagia') || lower.includes('😊') || lower.includes('ceria')) key = 'bahagia';
    else if (lower.includes('semangat') || lower.includes('⚡') || lower.includes('gairah')) key = 'bersemangat';
    else if (lower.includes('santai') || lower.includes('☕') || lower.includes('nyaman')) key = 'santai';
    else if (lower.includes('rindu') || lower.includes('🥺')) key = 'rindu';
    else if (lower.includes('tenang') || lower.includes('✨') || lower.includes('damai')) key = 'tenang';
  }

  const def = MOOD_DEFINITIONS[key] || MOOD_DEFINITIONS.romantis;
  const Icon = def.icon;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-sans-clean font-bold border border-black/5 dark:border-white/10 ${def.bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span style={{ color: def.color }}>{def.label}</span>
    </span>
  );
};

// 11. Pure SVG Heart Rating Bar (No Emojis)
export const HeartRating: React.FC<{
  rating: number;
  max?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
  size?: number;
}> = ({ rating, max = 5, interactive = false, onChange, size = 16 }) => {
  return (
    <div className="inline-flex items-center space-x-1">
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange && onChange(i + 1)}
            className={`transition-transform ${interactive ? 'hover:scale-125 cursor-pointer focus:outline-hidden' : 'cursor-default'}`}
          >
            <Heart
              size={size}
              className={`transition-colors duration-200 ${
                isFilled
                  ? 'fill-[#7A1018] text-[#7A1018] dark:fill-[#F4B6C2] dark:text-[#F4B6C2]'
                  : 'text-gray-300 dark:text-gray-600 fill-none'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
