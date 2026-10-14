import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Calendar, Clock, MapPin, Eye, ExternalLink } from 'lucide-react';
import { MemoryPin, AppSettings } from '../../types';

interface TimelineSectionProps {
  pins: MemoryPin[];
  settings: AppSettings;
  onOpenPinInMap: (pin: MemoryPin) => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  pins,
  settings,
  onOpenPinInMap
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPin, setSelectedPin] = useState<MemoryPin | null>(null);

  // Filter sensitive pins if in guest mode
  const visiblePins = pins
    .filter((pin) => !(settings.isGuestMode && pin.isSensitive))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-14 px-4 bg-[#EFE6DA] dark:bg-[#1a0507] border-b border-[#7A1018]/15 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] block mb-1">
            GARIS WAKTU KISAH
          </span>
          <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
            Timeline Horizontal Bercabang
          </h2>
          <p className="font-editorial italic text-sm sm:text-base text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 mt-1">
            Setiap cabang menorehkan babak baru perjalanan Savero & Soffie
          </p>
        </div>

        {/* Horizontal Branching Timeline Area */}
        <div className="relative bg-white/40 dark:bg-black/20 rounded-3xl p-6 border border-[#7A1018]/10 shadow-inner backdrop-blur-sm">
          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-none py-12 px-6"
            tabIndex={0}
            role="region"
            aria-label="Timeline horizontal kisah cinta"
          >
            <div className="relative min-w-max flex items-center h-80">
              {/* Central Horizontal Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#7A1018]/30 dark:bg-[#F4B6C2]/30 rounded-full" />

              {/* Start Point Marker */}
              <div className="relative z-10 flex flex-col items-center mr-10">
                <div className="w-5 h-5 rounded-full bg-[#7A1018] ring-4 ring-[#F4B6C2] shadow flex items-center justify-center text-white text-[9px] font-bold">
                  ★
                </div>
                <span className="absolute top-7 text-[10px] font-sans-clean font-bold tracking-widest text-[#7A1018] dark:text-[#F4B6C2] uppercase whitespace-nowrap">
                  TITIK AWAL
                </span>
              </div>

              {/* Branching Nodes */}
              <div className="flex items-center space-x-16 sm:space-x-24">
                {visiblePins.map((pin, index) => {
                  const isUp = index % 2 === 0; // Alternating branches (up and down)

                  return (
                    <div
                      key={pin.id}
                      className="relative flex flex-col items-center group cursor-pointer"
                      onClick={() => setSelectedPin(pin)}
                    >
                      {/* Central Point on Line */}
                      <div className="w-4 h-4 rounded-full bg-[#7A1018] border-2 border-white dark:border-[#3B0A0F] shadow transition-transform group-hover:scale-125 z-10" />

                      {/* Branch Stem & Card (Top or Bottom) */}
                      <div
                        className={`absolute flex flex-col items-center transition-all duration-300 ${
                          isUp
                            ? 'bottom-4 pb-2 group-hover:-translate-y-1'
                            : 'top-4 pt-2 group-hover:translate-y-1'
                        }`}
                      >
                        {/* Connecting Vertical Stem */}
                        <div
                          className={`w-0.5 bg-[#7A1018]/40 dark:bg-[#F4B6C2]/40 ${
                            isUp ? 'order-2 h-10' : 'order-1 h-10'
                          }`}
                        />

                        {/* Node Card at tip of branch */}
                        <div
                          className={`w-48 sm:w-56 p-3 rounded-xl bg-white dark:bg-[#2b080b] border border-[#7A1018]/20 shadow-md hover:shadow-lg transition-all ${
                            isUp ? 'order-1' : 'order-2'
                          }`}
                        >
                          {/* Locked Heart Icon & Category Badge */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="inline-flex items-center space-x-1 text-[9px] font-sans-clean font-bold tracking-widest uppercase text-[#7A1018] dark:text-[#F4B6C2] bg-[#7A1018]/10 dark:bg-white/10 px-2 py-0.5 rounded-full">
                              <Heart className="w-2.5 h-2.5 fill-[#7A1018] text-[#7A1018] dark:fill-[#F4B6C2] dark:text-[#F4B6C2]" />
                              <span>{pin.category}</span>
                            </span>
                            <span className="text-[10px] font-sans-clean font-semibold text-[#3B0A0F]/60 dark:text-[#EFE6DA]/60">
                              {pin.date}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-serif-title font-bold text-xs sm:text-sm text-[#3B0A0F] dark:text-[#EFE6DA] line-clamp-1">
                            {pin.title}
                          </h4>

                          {/* Short preview note */}
                          <p className="text-[11px] font-editorial text-[#3B0A0F]/80 dark:text-[#EFE6DA]/80 line-clamp-2 mt-1">
                            {pin.description}
                          </p>

                          {/* Time & Action */}
                          <div className="mt-2 pt-1 border-t border-[#7A1018]/10 flex items-center justify-between text-[10px] font-sans-clean">
                            <span className="text-[#7A1018] dark:text-[#F4B6C2] font-medium flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{pin.time || 'Semarang'}</span>
                            </span>
                            <span className="text-[#3B0A0F]/60 dark:text-[#EFE6DA]/60 uppercase tracking-widest text-[9px] font-bold">
                              DETAIL &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Left-Right Arrow Navigation Buttons as required */}
          <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-[#7A1018]/10">
            <button
              onClick={() => handleScroll('left')}
              className="p-2.5 rounded-full bg-[#7A1018] text-[#EFE6DA] hover:bg-[#5e0a11] shadow transition active:scale-95"
              aria-label="Geser timeline ke kiri"
              title="Geser ke kiri"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-sans-clean font-semibold tracking-widest text-[#7A1018] dark:text-[#F4B6C2] uppercase">
              GESER HORIZONTAL
            </span>
            <button
              onClick={() => handleScroll('right')}
              className="p-2.5 rounded-full bg-[#7A1018] text-[#EFE6DA] hover:bg-[#5e0a11] shadow transition active:scale-95"
              aria-label="Geser timeline ke kanan"
              title="Geser ke kanan"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal for detailed memory preview if selected */}
        {selectedPin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#EFE6DA] dark:bg-[#250709] max-w-lg w-full rounded-2xl p-6 border border-[#7A1018]/30 shadow-2xl relative overflow-hidden">
              <button
                onClick={() => setSelectedPin(null)}
                className="absolute top-4 right-4 text-xs font-sans-clean font-bold uppercase tracking-wider bg-[#7A1018] text-white px-2.5 py-1 rounded-full hover:bg-black transition"
              >
                ✕ Tutup
              </button>

              <div className="flex items-center space-x-2 text-[11px] font-sans-clean font-bold tracking-widest uppercase text-[#7A1018] dark:text-[#F4B6C2] mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{selectedPin.date} {selectedPin.time ? `• ${selectedPin.time}` : ''}</span>
              </div>

              <h3 className="font-serif-title text-xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA] mb-2">
                {selectedPin.title}
              </h3>

              {selectedPin.photos && selectedPin.photos.length > 0 && (
                <div className="w-full h-48 rounded-xl overflow-hidden mb-3 shadow-inner">
                  <img
                    src={selectedPin.photos[0]}
                    alt={selectedPin.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p className="font-editorial text-sm sm:text-base text-[#3B0A0F]/90 dark:text-[#EFE6DA]/90 leading-relaxed mb-4">
                {selectedPin.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedPin.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-sans-clean bg-[#7A1018]/10 dark:bg-white/10 text-[#7A1018] dark:text-[#F4B6C2] px-2 py-0.5 rounded-md font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#7A1018]/15">
                <span className="text-xs font-sans-clean text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70">
                  Ditambahkan oleh: <strong>{selectedPin.addedBy}</strong>
                </span>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      onOpenPinInMap(selectedPin);
                      setSelectedPin(null);
                    }}
                    className="px-3 py-1.5 bg-[#7A1018] text-[#EFE6DA] text-xs font-sans-clean font-bold rounded-lg hover:bg-[#5e0a11] transition flex items-center space-x-1"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Lihat di Peta</span>
                  </button>

                  {selectedPin.mapUrl && (
                    <a
                      href={selectedPin.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white/60 dark:bg-black/40 text-[#7A1018] dark:text-[#F4B6C2] text-xs font-sans-clean font-bold rounded-lg border border-[#7A1018]/30 hover:bg-white transition flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Maps</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
