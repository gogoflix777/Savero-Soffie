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

const DRAG_THRESHOLD_PX = 7;

export const BottomNav: React.FC<BottomNavProps> = ({
  activeSection,
  onSelectSection,
  settings
}) => {
  const dockRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pulseTimeoutRef = useRef<number | null>(null);

  const pointerStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    isSliding: boolean;
    currentTabId: string;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    isSliding: false,
    currentTabId: activeSection
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isLensActive, setIsLensActive] = useState(false);
  const [isBarPulsing, setIsBarPulsing] = useState(false);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  const metricsRef = useRef({
    trackWidth: 328,
    baseTabWidth: 65,
    activeLensWidth: 80
  });

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

  // Motion values untuk posisi tengah kapsul & progres pembesaran lensa
  const centerX = useMotionValue(34);
  const springCenterX = useSpring(centerX, {
    stiffness: isDragging ? 680 : 420,
    damping: isDragging ? 38 : 30,
    mass: 0.55
  });

  const lensProgress = useMotionValue(0);
  const springLensProgress = useSpring(lensProgress, {
    stiffness: 460,
    damping: 30,
    mass: 0.5
  });

  // Sinkronisasi variabel optik CSS secara real-time 60/120fps tanpa re-render React
  const applyOpticalVariables = useCallback(() => {
    const dockEl = dockRef.current;
    if (!dockEl) return;

    const cx = springCenterX.get();
    const progress = Math.max(0, Math.min(1, springLensProgress.get()));
    const { trackWidth, baseTabWidth, activeLensWidth } = metricsRef.current;

    const currentLensW = baseTabWidth + (activeLensWidth - baseTabWidth) * progress;
    const lensLeft = cx - currentLensW / 2;

    // Efek Liquid Squash & Stretch berdasarkan kecepatan gerak horizontal
    const velocity = springCenterX.getVelocity();
    const speedFactor = Math.min(Math.abs(velocity) / 1400, 0.16);
    const stretchX = 1 + speedFactor;
    const squashY = 1 - speedFactor * 0.42;

    dockEl.style.setProperty('--lens-cx', `${cx.toFixed(2)}px`);
    dockEl.style.setProperty('--lens-left', `${lensLeft.toFixed(2)}px`);
    dockEl.style.setProperty('--lens-width', `${currentLensW.toFixed(2)}px`);
    dockEl.style.setProperty('--inner-shift-x', `${(-lensLeft).toFixed(2)}px`);
    dockEl.style.setProperty('--track-width', `${trackWidth.toFixed(2)}px`);
    dockEl.style.setProperty('--lens-progress', `${progress.toFixed(3)}`);
    dockEl.style.setProperty('--pill-scale-x', `${stretchX.toFixed(3)}`);
    dockEl.style.setProperty('--pill-scale-y', `${squashY.toFixed(3)}`);
  }, [springCenterX, springLensProgress]);

  useEffect(() => {
    const unsubX = springCenterX.on('change', applyOpticalVariables);
    const unsubLens = springLensProgress.on('change', applyOpticalVariables);
    return () => {
      unsubX();
      unsubLens();
    };
  }, [springCenterX, springLensProgress, applyOpticalVariables]);

  // Ukur posisi tab menggunakan koordinat lokal trackRef (bebas distorsi scaleX)
  const syncToSection = useCallback(
    (sectionId: string, immediate = false) => {
      const trackEl = trackRef.current;
      if (!trackEl) return;

      const tW = trackEl.clientWidth;
      const btn = trackEl.querySelector<HTMLElement>(`[data-tab-id="${sectionId}"]`);
      if (!btn || tW === 0) return;

      const bW = btn.offsetWidth;
      const aW = Math.max(72, Math.min(bW + 16, 92));
      const cx = btn.offsetLeft + bW / 2;

      metricsRef.current = {
        trackWidth: tW,
        baseTabWidth: bW,
        activeLensWidth: aW
      };

      if (immediate) {
        centerX.jump(cx);
      } else {
        centerX.set(cx);
      }
      applyOpticalVariables();
    },
    [centerX, applyOpticalVariables]
  );

  // Sinkronisasi saat section aktif atau jumlah tab berubah
  useEffect(() => {
    if (!pointerStateRef.current.active) {
      syncToSection(activeSection, false);
      pointerStateRef.current.currentTabId = activeSection;
    }
  }, [activeSection, visibleItems.length, syncToSection]);

  // Pantau ukuran layar/kontainer dengan ResizeObserver agar selalu responsif di mobile
  useEffect(() => {
    const trackEl = trackRef.current;
    if (!trackEl) return;

    syncToSection(activeSection, true);

    const observer = new ResizeObserver(() => {
      const targetId = pointerStateRef.current.active
        ? pointerStateRef.current.currentTabId
        : activeSection;
      syncToSection(targetId, true);
    });

    observer.observe(trackEl);
    return () => observer.disconnect();
  }, [activeSection, syncToSection]);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  const triggerBarPulse = useCallback(
    (keepAlive = false) => {
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
      setIsBarPulsing(true);
      setIsLensActive(true);
      lensProgress.set(1);

      if (!keepAlive) {
        pulseTimeoutRef.current = window.setTimeout(() => {
          lensProgress.set(0);
          setIsBarPulsing(false);
          setIsLensActive(false);
        }, 320);
      }
    },
    [lensProgress]
  );

  // Cari tab terdekat dan koordinat lokal dari posisi jari/pointer
  const resolvePointerTarget = useCallback(
    (clientX: number) => {
      const trackEl = trackRef.current;
      if (!trackEl) return null;

      const rect = trackEl.getBoundingClientRect();
      const tW = trackEl.clientWidth || rect.width;
      const scaleRatio = rect.width > 0 ? tW / rect.width : 1;
      const relX = (clientX - rect.left) * scaleRatio;

      const buttons = Array.from(trackEl.querySelectorAll<HTMLElement>('[data-tab-id]'));
      if (!buttons.length) return null;

      let closestId = activeSection;
      let closestCenter = relX;
      let minDistance = Infinity;

      for (const btn of buttons) {
        const btnCx = btn.offsetLeft + btn.offsetWidth / 2;
        const dist = Math.abs(relX - btnCx);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = btn.dataset.tabId || activeSection;
          closestCenter = btnCx;
        }
      }

      const halfTab = metricsRef.current.baseTabWidth / 2;
      const clampedCx = Math.max(halfTab - 4, Math.min(tW - halfTab + 4, relX));

      return {
        closestId,
        closestCenter,
        clampedCx
      };
    },
    [activeSection]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const hit = resolvePointerTarget(e.clientX);
    if (!hit) return;

    pointerStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      isSliding: false,
      currentTabId: hit.closestId
    };

    setDragTargetId(hit.closestId);
    triggerBarPulse(true);

    // Langsung arahkan kapsul ke tengah tombol yang disentuh (bebas jitter)
    centerX.set(hit.closestCenter);

    // Buka halaman seketika saat tombol disentuh (0ms delay di mobile)
    onSelectSection(hit.closestId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerStateRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    const deltaX = Math.abs(e.clientX - state.startX);

    // Hanya aktifkan mode slide jika pergeseran jari melewati threshold (7px)
    if (!state.isSliding) {
      if (deltaX < DRAG_THRESHOLD_PX) return;
      state.isSliding = true;
      setIsDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Abaikan jika pointer capture tidak tersedia
      }
    }

    const hit = resolvePointerTarget(e.clientX);
    if (!hit) return;

    centerX.set(hit.clampedCx);

    if (hit.closestId !== state.currentTabId) {
      state.currentTabId = hit.closestId;
      setDragTargetId(hit.closestId);
      onSelectSection(hit.closestId);
    }
  };

  const finishInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerStateRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Abaikan
    }

    const finalId = state.currentTabId || activeSection;
    state.active = false;
    state.pointerId = null;
    state.isSliding = false;

    setIsDragging(false);
    setDragTargetId(null);

    if (finalId !== activeSection) {
      onSelectSection(finalId);
    }

    // Snap mulus tepat ke tengah tab tujuan
    syncToSection(finalId, false);

    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current);
    }
    pulseTimeoutRef.current = window.setTimeout(() => {
      lensProgress.set(0);
      setIsLensActive(false);
      setIsBarPulsing(false);
    }, 200);
  };

  const highlightedId = dragTargetId || activeSection;

  const renderTabContent = (item: NavTabItem, isHighlighted: boolean, isLensLayer = false) => {
    const Icon = item.icon;
    return (
      <div className="flex flex-col items-center justify-center gap-[2px]">
        <Icon
          className={`h-[20px] w-[20px] transition-transform duration-200 sm:h-[21px] sm:w-[21px] ${
            isLensLayer
              ? 'stroke-[2.6]'
              : isHighlighted
              ? 'stroke-[2.5] wa-tab-icon-active scale-110 -translate-y-[0.5px]'
              : 'stroke-[2] wa-tab-icon-idle scale-100'
          }`}
        />
        <span
          className={`text-[9.5px] font-extrabold leading-none tracking-tight transition-all duration-200 sm:text-[10px] ${
            isLensLayer
              ? 'opacity-95'
              : isHighlighted
              ? 'wa-tab-icon-active opacity-100'
              : 'wa-tab-icon-idle opacity-75'
          }`}
        >
          {item.label}
        </span>
      </div>
    );
  };

  return (
    <nav
      aria-label="Navigasi Utama Aplikasi"
      className="pointer-events-none fixed left-1/2 z-40 w-[calc(100%-24px)] max-w-[376px] -translate-x-1/2 select-none sm:max-w-[400px]"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
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
              scale="11"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Main Liquid Glass Navbar Container */}
      <motion.div
        ref={dockRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        animate={{
          scaleX: isBarPulsing ? 1.02 : 1,
          scaleY: isBarPulsing ? 1.04 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 520,
          damping: 28,
          mass: 0.55
        }}
        className={`wa-liquid-glass-dock pointer-events-auto relative flex h-[58px] items-center justify-between px-1.5 sm:h-[60px] ${
          isBarPulsing ? 'is-pulsating' : ''
        } ${isLensActive ? 'is-lens-open' : ''}`}
      >
        {/* Inner Reference Track: 1 Sistem Koordinat Presisi untuk Tombol & Lensa */}
        <div ref={trackRef} className="relative flex h-full w-full items-center justify-between">
          {/* === LAYER 1: IKON & LABEL DASAR === */}
          <div className="wa-base-icons-track relative z-10 flex h-full w-full items-center justify-between">
            {visibleItems.map((item) => {
              const isHighlighted = highlightedId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-tab-id={item.id}
                  onClick={(e) => {
                    // Hanya untuk navigasi keyboard (Enter / Space) karena touch/mouse sudah ditangani instan saat pointerdown
                    if (e.detail === 0) {
                      triggerBarPulse(false);
                      syncToSection(item.id, false);
                      onSelectSection(item.id);
                    }
                  }}
                  className="wa-glass-tab-btn relative flex h-full flex-1 items-center justify-center"
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isHighlighted ? 'page' : undefined}
                >
                  {renderTabContent(item, isHighlighted, false)}
                </button>
              );
            })}
          </div>

          {/* === LAYER 2: KAPSUL IDLE & GELEMBUNG LENSA KACA OVERFLOW === */}
          <div
            className={`wa-liquid-glass-pill ${
              isLensActive ? 'is-lens-active' : 'is-pill-idle'
            }`}
            aria-hidden="true"
          >
            {/* Proyeksi Optik di Dalam Lensa (Tetap Ter-mount agar Bebas Lag saat Tap di Mobile) */}
            <div className="wa-lens-optical-viewport">
              <span className="wa-lens-pole-meniscus wa-lens-pole-top" />
              <span className="wa-lens-pole-meniscus wa-lens-pole-bottom" />

              {/* CHANNEL 1: Bias Cahaya Cyan/Biru */}
              <div className="wa-lens-refracted-track wa-chromatic-cyan-layer">
                {visibleItems.map((item) => (
                  <div
                    key={`cyan-${item.id}`}
                    className="flex h-full flex-1 items-center justify-center"
                  >
                    {renderTabContent(item, true, true)}
                  </div>
                ))}
              </div>

              {/* CHANNEL 2: Bias Cahaya Oranye/Amber */}
              <div className="wa-lens-refracted-track wa-chromatic-amber-layer">
                {visibleItems.map((item) => (
                  <div
                    key={`amber-${item.id}`}
                    className="flex h-full flex-1 items-center justify-center"
                  >
                    {renderTabContent(item, true, true)}
                  </div>
                ))}
              </div>

              {/* CHANNEL 3: Inti Ikon Utama yang Diperbesar & Dilengkungkan */}
              <div className="wa-lens-refracted-track wa-chromatic-core-layer">
                {visibleItems.map((item) => (
                  <div
                    key={`core-${item.id}`}
                    className="flex h-full flex-1 items-center justify-center"
                  >
                    {renderTabContent(item, true, true)}
                  </div>
                ))}
              </div>

              <span className="wa-lens-prismatic-rim" />
              <span className="wa-lens-specular-shell" />
            </div>
          </div>
        </div>
      </motion.div>
    </nav>
  );
};
