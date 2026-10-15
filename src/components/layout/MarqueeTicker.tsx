import React from 'react';
import { Heart } from 'lucide-react';
import { MemoryPin } from '../../types';

interface MarqueeTickerProps {
  pins: MemoryPin[];
  onPinClick: (pin: MemoryPin) => void;
}

export const MarqueeTicker: React.FC<MarqueeTickerProps> = ({ pins, onPinClick }) => {
  const places = pins.filter((pin) => pin.status === 'visited');
  const repeatedPlaces = places.length > 1 ? [...places, ...places] : places;

  return (
    <div className="ticker-ribbon-3d select-none overflow-hidden py-3.5 text-[#43121b] dark:text-rose-50 sm:py-3">
      <div className="animate-marquee flex items-center gap-5 whitespace-nowrap font-sans-clean text-sm font-semibold tracking-normal sm:text-base">
        {repeatedPlaces.length ? repeatedPlaces.map((pin, index) => (
          <div key={`${pin.id}-${index}`} className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onPinClick(pin)}
              className="ticker-place-link rounded-full px-2 py-1 transition hover:-translate-y-0.5 hover:text-[#a34961] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94761] dark:hover:text-rose-200"
              aria-label={`Lihat ${pin.title} di peta`}
            >
              {pin.title}
            </button>
            <Heart aria-hidden="true" className="inline-block h-4 w-4 flex-shrink-0 fill-[#cc6e84] text-[#cc6e84] dark:fill-rose-300 dark:text-rose-300" />
          </div>
        )) : <span className="px-4">Tambahkan kenangan untuk melihat jejak kalian di sini.</span>}
      </div>
    </div>
  );
};
