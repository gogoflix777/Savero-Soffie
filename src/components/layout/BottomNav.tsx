import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
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
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleTabClick = (id: string) => {
    soundManager.playTap();
    onSelectSection(id);
  };

  // Scroll active tab into view smoothly on mobile if needed
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector(`[data-tab-id="${activeSection}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeSection]);

  return (
    <nav
      aria-label="Navigasi Utama Aplikasi"
      className="pointer-events-none fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-sm sm:max-w-md"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div
        ref={containerRef}
        className="bottom-dock-3d pointer-events-auto flex items-center justify-around gap-1 p-1.5 sm:p-2"
      >
        {visibleItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              data-tab-id={item.id}
              onClick={() => handleTabClick(item.id)}
              className="group relative flex h-11 flex-1 sm:h-12 items-center justify-center rounded-full transition-transform duration-150 active:scale-90 focus:outline-hidden"
              title={item.label}
              aria-label={item.label}
            >
              {/* Active Tab 3D Clay Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavTabIndicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="bottom-dock-active-pill"
                />
              )}

              {/* Animated Icon */}
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1], y: -0.5 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.28, type: 'spring', stiffness: 400 }}
                className={`relative z-10 transition-colors duration-200 ${
                  isActive
                    ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
                    : 'text-[#7e293c] hover:text-[#521322] dark:text-rose-200/75 dark:group-hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 stroke-[2.2]" />
              </motion.div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

