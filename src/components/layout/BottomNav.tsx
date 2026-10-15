import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Home,
  MapPin,
  HeartPulse,
  Sparkles,
  Film,
  Heart,
  Clock
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
      className="bottom-dock-3d fixed bottom-0 left-0 right-0 z-40 rounded-t-[24px] border-t border-[#f6c4ca] bg-[#f2a0ad] shadow-[0_-5px_20px_rgba(136,50,66,.15)] transition-colors duration-300 pb-[max(0.45rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#542b37]"
    >
      <div
        ref={containerRef}
        className="mx-auto flex max-w-lg items-center justify-between gap-1 px-2 pt-1.5 overflow-x-auto scrollbar-none"
      >
        {visibleItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              data-tab-id={item.id}
              onClick={() => handleTabClick(item.id)}
              className="relative flex min-h-[62px] min-w-[58px] flex-1 flex-col items-center justify-center rounded-[20px] px-2 py-1 transition-all duration-200 group focus:outline-hidden sm:min-w-[64px]"
              title={item.label}
            >
              {/* Active Tab Glow & Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavTabIndicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-x-1 inset-y-0 rounded-[20px] bg-[#ffe1e5] shadow-[0_3px_10px_rgba(130,48,64,.12)] -z-10 dark:bg-[#a94860]"
                />
              )}

              {/* Animated Icon */}
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1], y: -2 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`transition-colors duration-200 ${
                  isActive
                    ? 'text-[#963f55]'
                    : 'text-[#9a6870] dark:text-rose-100/60 group-hover:text-[#c35f78] dark:group-hover:text-rose-200'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </motion.div>

              {/* Tiny Mobile Label */}
              <span
                  className={`mt-0.5 max-w-[62px] truncate font-sans-clean text-[10px] font-semibold tracking-tight transition-colors duration-200 ${
                  isActive
                    ? 'font-bold text-[#42151e]'
                    : 'text-[#51212a] dark:text-rose-100/75 group-hover:text-[#57202c] dark:group-hover:text-white'
                }`}
              >
                {item.label}
              </span>

            </button>
          );
        })}
      </div>
    </nav>
  );
};
