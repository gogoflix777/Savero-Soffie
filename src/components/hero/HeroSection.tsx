import React, { CSSProperties, useEffect, useState } from 'react';
import { Compass, Flower2, Heart, Sparkles } from 'lucide-react';
import { InteractiveHeart } from './InteractiveHeart';
import { AppSettings } from '../../types';
import { soundManager } from '../../utils/audio';

interface HeroSectionProps {
  settings: AppSettings;
  onExploreClick: () => void;
  onAddMemoryClick: () => void;
}

interface HeartParticle {
  id: number;
  shape: 'heart' | 'sparkle' | 'flower';
  style: CSSProperties;
}

const particleIcons = {
  heart: Heart,
  sparkle: Sparkles,
  flower: Flower2
};

export const HeroSection: React.FC<HeroSectionProps> = ({ settings, onExploreClick, onAddMemoryClick }) => {
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [heartTapCount, setHeartTapCount] = useState(0);
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);

  useEffect(() => {
    const calculateTime = () => {
      const anniversary = new Date(`${settings.anniversaryDate}T00:00:00`);
      const diff = Math.max(0, Date.now() - anniversary.getTime());
      setTimeTogether({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    };
    calculateTime();
    const interval = window.setInterval(calculateTime, 1000);
    return () => window.clearInterval(interval);
  }, [settings.anniversaryDate]);

  const handleHeartTap = ({ x, y }: { x: number; y: number }) => {
    setHeartTapCount((count) => count + 1);
    soundManager.playHeart();
    const originX = x || window.innerWidth / 2;
    const originY = y || window.innerHeight * 0.44;
    const burst = Array.from({ length: 9 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 9;
      const distance = 52 + Math.random() * 52;
      const shape = (['heart', 'sparkle', 'flower'] as const)[index % 3];
      return {
        id: Date.now() + index,
        shape,
        style: {
          left: `${originX}px`,
          top: `${originY}px`,
          '--tx': `${Math.cos(angle) * distance}px`,
          '--ty': `${Math.sin(angle) * distance - 32}px`,
          '--rot': `${Math.round((Math.random() - 0.5) * 70)}deg`,
          animationDelay: `${index * 12}ms`
        } as CSSProperties
      };
    });
    setHeartParticles((current) => [...current, ...burst]);
    window.setTimeout(() => {
      setHeartParticles((current) => current.filter((particle) => !burst.some((item) => item.id === particle.id)));
    }, 1050);
  };

  const counters = [
    { label: 'Hari', value: timeTogether.days },
    { label: 'Jam', value: timeTogether.hours },
    { label: 'Menit', value: timeTogether.minutes },
    { label: 'Detik', value: timeTogether.seconds }
  ];

  return (
    <section className="relative overflow-hidden bg-[#fffaf0] px-5 pb-8 pt-7 transition-colors dark:bg-[#21151a] sm:pb-12 sm:pt-8">
      <div className="pointer-events-none absolute -left-20 top-1/3 h-44 w-44 rounded-full bg-rose-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-16 h-48 w-48 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="relative z-10 mx-auto flex max-w-[560px] flex-col items-center text-center">
        <h1 className="mb-1 font-script text-[43px] leading-tight text-[#bd5b76] drop-shadow-sm dark:text-[#f0a8b7] sm:text-5xl">cerita kita</h1>
        <p className="mx-auto mb-2 max-w-[500px] px-1 font-sans-clean text-[15px] leading-[1.5] text-[#43252d] dark:text-rose-50/85 sm:mb-3 sm:text-base">
          “Dari malam pertama di Mie Gacoan hingga subuh berkabut di jalan baru Jangli–Undip, ini adalah ruang perjalanan cinta kita di Semarang.”
        </p>

        <div className="relative mb-0 mt-0 flex h-[250px] w-full max-w-[500px] items-center justify-center sm:h-[300px]">
          <Sparkles className="hero-sparkle hero-sparkle-one" aria-hidden="true" />
          <Sparkles className="hero-sparkle hero-sparkle-two" aria-hidden="true" />
          <Sparkles className="hero-sparkle hero-sparkle-three" aria-hidden="true" />
          <Flower2 className="hero-flower hero-flower-one" aria-hidden="true" />
          <Flower2 className="hero-flower hero-flower-two" aria-hidden="true" />
          <Heart className="hero-tiny-heart hero-tiny-heart-one" aria-hidden="true" fill="currentColor" />
          <Heart className="hero-tiny-heart hero-tiny-heart-two" aria-hidden="true" fill="currentColor" />
          <span className="hero-petal" aria-hidden="true" />
          <span className="hero-cloud hero-cloud-left" aria-hidden="true" />
          <span className="hero-cloud hero-cloud-right" aria-hidden="true" />
          <InteractiveHeart onTap={handleHeartTap} className="!h-[205px] !w-[230px] sm:!h-[235px] sm:!w-[260px]" />
        </div>
        <p className="mb-4 -mt-1 font-sans-clean text-[11px] font-semibold text-[#80646a] dark:text-rose-100/75" aria-live="polite">
          Ketuk hati untuk mengirim cinta <span className="font-bold text-[#a94761] dark:text-rose-200">{heartTapCount}×</span>
        </p>

        <div className="mb-5 flex items-center justify-center gap-2 sm:mb-6 sm:gap-3">
          {counters.map(({ label, value }) => (
            <div key={label} className="hero-count-card flex h-[76px] w-[clamp(56px,12vw,68px)] flex-col items-center justify-center rounded-[1.35rem] bg-[#f9dce1] sm:h-[78px] sm:w-[72px]">
              <span className="font-sans-clean text-[27px] font-extrabold leading-none text-[#501522] dark:text-rose-100 sm:text-3xl">{value}</span>
              <span className="mt-1 font-sans-clean text-[12px] leading-none text-[#501522] dark:text-rose-100/80 sm:text-xs">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex w-full max-w-[500px] flex-col items-center justify-center gap-3 sm:gap-4">
          <button type="button" onClick={onExploreClick} className="clay-action-button flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full border border-[#ad4b63] bg-[#d46480] px-5 py-3 font-sans-clean text-[15px] font-bold tracking-wide text-white shadow-[0_5px_0_#9d4058,0_8px_15px_rgba(128,43,61,.17)] transition-all hover:-translate-y-0.5 hover:bg-[#ca5875] active:translate-y-1 active:shadow-none sm:text-base">
            <Compass className="h-5 w-5" /><span>JELAJAHI PETA KENANGAN</span>
          </button>
          <button type="button" onClick={onAddMemoryClick} className="clay-action-button flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full border-[3px] border-[#c76b80] bg-[#fff1f2] px-5 py-3 font-sans-clean text-[15px] font-bold tracking-wide text-[#501522] shadow-[0_3px_8px_rgba(128,43,61,.12)] transition-all hover:-translate-y-0.5 hover:bg-rose-100 active:scale-[.98] dark:bg-white/5 dark:text-rose-100 sm:text-base">
            <Heart className="h-5 w-5 fill-[#df7890] text-[#c76b80]" /><span>TAMBAH KENANGAN BARU</span>
          </button>
        </div>
      </div>

      {heartParticles.map(({ id, shape, style }) => {
        const ParticleIcon = particleIcons[shape];
        return <ParticleIcon key={id} className={`heart-burst-particle heart-burst-${shape}`} style={style} aria-hidden="true" />;
      })}
    </section>
  );
};
