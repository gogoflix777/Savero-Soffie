import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import {
  Home,
  HeartPulse,
  Sparkles,
  Film,
  Heart
} from 'lucide-react';
import { AppSettings } from '../../types';
import { soundManager } from '../../utils/audio';

interface BottomNavProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  settings: AppSettings;
}

interface NavTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  sensitive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeSection,
  onSelectSection,
  settings
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastHoveredIdRef = useRef<string>(activeSection);
  const pulseTimeoutRef = useRef<number | null>(null);

  // State interaksi: aktif saat di-tap maupun saat di-slide
  const [isDragging, setIsDragging] = useState(false);
  const [isLensActive, setIsLensActive] = useState(false);
  const [isBarPulsing, setIsBarPulsing] = useState(false);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const [trackWidth, setTrackWidth] = useState<number>(340);
  const [baseTabWidth, setBaseTabWidth] = useState<number>(68);

  const navItems: NavTabItem[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'siklus', label: 'Siklus', icon: HeartPulse, sensitive: true },
    { id: 'wishlist', label: 'Wishlist', icon: Sparkles },
    { id: 'film', label: 'Film', icon: Film },
    { id: 'romantis', label: 'Romantis', icon: Heart }
  ];

  const visibleItems = navItems.filter((item) => {
    if (settings.isGuestMode && item.sensitive) return false;
    return true;
  });

  // Ukuran lensa kaca saat mode gelembung aktif (lebih lebar & overflow atas-bawah)
  const activeLensWidth = Math.max(76, baseTabWidth + 16);

  // Motion value untuk titik tengah horizontal lensa (Center X)
  const centerX = useMotionValue(36);
  const springCenterX = useSpring(centerX, {
    stiffness: isDragging ? 720 : 420,
    damping: isDragging ? 38 : 30,
    mass: 0.65
  });

  // Sinkronisasi variabel CSS secara real-time 60fps untuk efek refraksi & masking optik
  const updateOpticalVariables = useCallback(
    (cx: number, tWidth: number, lWidth: number) => {
      const el = trackRef.current;
      if (!el) return;
      const lensLeft = cx - lWidth / 2;
      el.style.setProperty('--lens-cx', `${cx}px`);
      el.style.setProperty('--lens-left', `${lensLeft}px`);
      el.style.setProperty('--lens-width', `${lWidth}px`);
      el.style.setProperty('--inner-shift-x', `${-lensLeft}px`);
      el.style.setProperty('--track-width', `${tWidth}px`);
    },
    []
  );

  useEffect(() => {
    const unsubscribe = springCenterX.on('change', (latestCx) => {
      const currentLensW = isLensActive ? activeLensWidth : baseTabWidth;
      updateOpticalVariables(latestCx, trackWidth, currentLensW);
    });
    return () => unsubscribe();
  }, [springCenterX, isLensActive, activeLensWidth, baseTabWidth, trackWidth, updateOpticalVariables]);

  // Ukur posisi tab aktif
  const syncToSection = useCallback(
    (sectionId: string, immediate = false) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const btn = el.querySelector<HTMLElement>(`[data-tab-id="${sectionId}"]`);
      if (!btn) return;

      const tW = rect.width;
      const bW = btn.offsetWidth;
      const cx = btn.offsetLeft + bW / 2;

      setTrackWidth(tW);
      setBaseTabWidth(bW);

      if (immediate) {
        centerX.jump(cx);
      } else {
        centerX.set(cx);
      }
      updateOpticalVariables(
        cx,
        tW,
        isLensActive ? Math.max(76, bW + 16) : bW
      );
    },
    [centerX, isLensActive, updateOpticalVariables]
  );

  useEffect(() => {
    if (!isDragging) {
      syncToSection(activeSection);
      lastHoveredIdRef.current = activeSection;
    }
  }, [activeSection, visibleItems.length, isDragging, syncToSection]);

  useEffect(() => {
    const onResize = () => syncToSection(activeSection, true);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [activeSection, syncToSection]);

  // Picu efek pulsating & kilau putih pada bar saat di-tap atau di-slide
  const triggerBarPulse = (keepAlive = false) => {
    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
    setIsBarPulsing(true);
    setIsLensActive(true);

    if (!keepAlive) {
      pulseTimeoutRef.current = window.setTimeout(() => {
        setIsBarPulsing(false);
        setIsLensActive(false);
      }, 360);
    }
  };

  // Hitung posisi lensa & tab terdekat dari koordinat jari
  const updateFromPointerX = (clientX: number, switchSection = true) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const buttons = Array.from(el.querySelectorAll<HTMLElement>('[data-tab-id]'));
    if (!buttons.length) return;

    const relX = clientX - rect.left;
    const halfLens = activeLensWidth / 2;
    // Izinkan gelembung sedikit melampaui ujung dalam bar dengan mulus
    const clampedCx = Math.max(halfLens - 6, Math.min(rect.width - halfLens + 6, relX));
    centerX.set(clampedCx);

    let closestId = activeSection;
    let minDistance = Infinity;

    for (const btn of buttons) {
      const btnCx = btn.offsetLeft + btn.offsetWidth / 2;
      const dist = Math.abs(relX - btnCx);
      if (dist < minDistance) {
        minDistance = dist;
        closestId = btn.dataset.tabId || activeSection;
      }
    }

    setDragTargetId(closestId);

    if (closestId !== lastHoveredIdRef.current) {
      lastHoveredIdRef.current = closestId;
      soundManager.playTap();
      if (switchSection) {
        onSelectSection(closestId);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    soundManager.playTap();
    setIsDragging(true);
    triggerBarPulse(true);
    updateFromPointerX(e.clientX, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromPointerX(e.clientX, true);
  };

  const finishInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const finalId = dragTargetId || lastHoveredIdRef.current || activeSection;
    setIsDragging(false);
    setDragTargetId(null);

    if (finalId !== activeSection) {
      onSelectSection(finalId);
    }

    // Biarkan efek lensa & bar pulse mereda dengan mulus setelah jari dilepas
    pulseTimeoutRef.current = window.setTimeout(() => {
      setIsLensActive(false);
      setIsBarPulsing(false);
    }, 220);

    // Kembalikan pusat kapsul tepat ke tengah ikon terpilih
    requestAnimationFrame(() => {
      const el = trackRef.current;
      if (!el) return;
      const btn = el.querySelector<HTMLElement>(`[data-tab-id="${finalId}"]`);
      if (btn) {
        centerX.set(btn.offsetLeft + btn.offsetWidth / 2);
      }
    });
  };

  const highlightedId = isDragging && dragTargetId ? dragTargetId : activeSection;

  return (
    <nav
      aria-label="Navigasi Utama Aplikasi"
      className="pointer-events-none fixed left-1/2 z-40 w-[calc(100%-28px)] max-w-[360px] -translate-x-1/2 select-none sm:max-w-[390px]"
      style={{ bottom: 'max(0.85rem, env(safe-area-inset-bottom, 0.85rem))' }}
    >
      {/* Filter Optik SVG untuk Efek Lengkung Lensa Cembung (Spherical Barrel Warp) */}
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <radialGradient id="wa-lens-sphere-map" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(128, 128, 128)" />
            <stop offset="55%" stopColor="rgb(142, 114, 128)" />
            <stop offset="85%" stopColor="rgb(185, 70, 128)" />
            <stop offset="100%" stopColor="rgb(245, 15, 128)" />
          </radialGradient>
          <filter
            id="wa-liquid-barrel-warp"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><defs><radialGradient id='g' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='rgb(128,128,128)'/><stop offset='60%' stop-color='rgb(148,108,128)'/><stop offset='100%' stop-color='rgb(230,25,128)'/></radialGradient></defs><rect width='120' height='80' fill='url(%23g)'/></svg>"
              result="sphereMap"
              preserveAspectRatio="none"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="sphereMap"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Main Liquid Glass Navbar Container (Overflow Visible agar Gelembung Menonjol Keluar) */}
      <motion.div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        animate={{
          scaleX: isBarPulsing ? 1.028 : 1,
          scaleY: isBarPulsing ? 1.055 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 520,
          damping: 24,
          mass: 0.6
        }}
        className={`wa-liquid-glass-dock pointer-events-auto relative flex h-[54px] items-center justify-between px-1.5 ${
          isBarPulsing ? 'is-pulsating' : ''
        } ${isLensActive ? 'is-lens-open' : ''}`}
      >
        {/* === LAYER 1: IKON DASAR (Otomatis Terlubangi di Bawah Lensa Saat Lensa Aktif) === */}
        <div className="wa-base-icons-track relative z-10 flex h-full w-full items-center justify-between">
          {visibleItems.map((item) => {
            const isHighlighted = highlightedId === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                data-tab-id={item.id}
                onClick={() => {
                  if (!isDragging) {
                    triggerBarPulse(false);
                    if (activeSection !== item.id) {
                      onSelectSection(item.id);
                    }
                  }
                }}
                className="wa-glass-tab-btn relative flex h-full flex-1 items-center justify-center"
                title={item.label}
                aria-label={item.label}
                aria-current={isHighlighted ? 'page' : undefined}
              >
                <Icon
                  className={`h-[22px] w-[22px] transition-all duration-200 sm:h-[23px] sm:w-[23px] ${
                    isHighlighted
                      ? 'stroke-[2.5] wa-tab-icon-active scale-105'
                      : 'stroke-[2] wa-tab-icon-idle'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* === LAYER 2: INDIKATOR KAPSUL IDLE & GELEMBUNG LENSA KACA OVERFLOW === */}
        <div
          className={`wa-liquid-glass-pill ${
            isLensActive ? 'is-lens-active' : 'is-pill-idle'
          }`}
          aria-hidden="true"
        >
          {/* Proyeksi Optik di Dalam Lensa (Hanya Aktif Saat Di-Tap / Di-Slide) */}
          {isLensActive && (
            <div className="wa-lens-optical-viewport">
              {/* Pembiasan Batas Atas & Bawah Bar di Kutub Lensa (Meniscus Poles) */}
              <span className="wa-lens-pole-meniscus wa-lens-pole-top" />
              <span className="wa-lens-pole-meniscus wa-lens-pole-bottom" />

              {/* CHANNEL 1: Bias Cahaya Cyan/Biru (Magnifikasi Lebih Tinggi -> Muncul di Tepi Luar) */}
              <div className="wa-lens-refracted-track wa-chromatic-cyan-layer">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={`cyan-${item.id}`}
                      className="flex h-full flex-1 items-center justify-center"
                    >
                      <Icon className="h-[23px] w-[23px] stroke-[2.7]" />
                    </div>
                  );
                })}
              </div>

              {/* CHANNEL 2: Bias Cahaya Oranye/Kuning (Magnifikasi Lebih Rendah -> Muncul di Tepi Dalam) */}
              <div className="wa-lens-refracted-track wa-chromatic-amber-layer">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={`amber-${item.id}`}
                      className="flex h-full flex-1 items-center justify-center"
                    >
                      <Icon className="h-[23px] w-[23px] stroke-[2.7]" />
                    </div>
                  );
                })}
              </div>

              {/* CHANNEL 3: Inti Ikon Utama yang Diperbesar & Dilengkungkan (Barrel Warped Core) */}
              <div className="wa-lens-refracted-track wa-chromatic-core-layer">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={`core-${item.id}`}
                      className="flex h-full flex-1 items-center justify-center"
                    >
                      <Icon className="h-[23px] w-[23px] stroke-[2.65]" />
                    </div>
                  );
                })}
              </div>

              {/* Cincin Refraksi Prisma Tepi Kaca & Kilau Kaca Cembung */}
              <span className="wa-lens-prismatic-rim" />
              <span className="wa-lens-specular-shell" />
            </div>
          )}
        </div>
      </motion.div>
    </nav>
  );
};
