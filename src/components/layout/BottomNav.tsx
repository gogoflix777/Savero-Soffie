import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Home,
  MapPin,
  HeartPulse,
  Sparkles,
  Film,
  Award,
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
    { id: 'piala', label: 'Medali 3D', icon: Award },
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
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#EFE6DA]/95 dark:bg-[#1a0507]/95 backdrop-blur-xl border-t border-[#7A1018]/15 shadow-2xl transition-colors duration-300 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div
        ref={containerRef}
        className="max-w-lg mx-auto flex items-center justify-between px-2 pt-1.5 overflow-x-auto scrollbar-none"
      >
        {visibleItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              data-tab-id={item.id}
              onClick={() => handleTabClick(item.id)}
              className="relative flex flex-col items-center justify-center py-1 px-2 min-w-[50px] sm:min-w-[58px] min-h-[46px] rounded-2xl transition-all duration-200 group focus:outline-hidden"
              title={item.label}
            >
              {/* Active Tab Glow & Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavTabIndicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-[#7A1018] dark:bg-[#7A1018]/90 rounded-2xl shadow-md -z-10"
                />
              )}

              {/* Animated Icon */}
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1], y: -2 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`transition-colors duration-200 ${
                  isActive
                    ? 'text-[#F4B6C2]'
                    : 'text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 group-hover:text-[#7A1018] dark:group-hover:text-[#F4B6C2]'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </motion.div>

              {/* Tiny Mobile Label */}
              <span
                className={`text-[10px] font-sans-clean font-semibold tracking-tight mt-0.5 transition-colors duration-200 truncate max-w-[62px] ${
                  isActive
                    ? 'text-[#EFE6DA] font-bold'
                    : 'text-[#3B0A0F]/65 dark:text-[#EFE6DA]/65 group-hover:text-[#3B0A0F] dark:group-hover:text-white'
                }`}
              >
                {item.label}
              </span>

              {/* Tiny active pip dot */}
              {isActive && (
                <motion.span
                  layoutId="bottomNavActiveDot"
                  className="w-1 h-1 rounded-full bg-[#D9B26F] mt-0.5"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
