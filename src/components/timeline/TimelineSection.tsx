import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ManagedImage } from '../common/ManagedImage';
import { Calendar, Clock, ExternalLink, Heart, MapPin, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { MemoryPin, AppSettings } from '../../types';
import { CloseButton } from '../common/CloseButton';

interface TimelineSectionProps {
  pins: MemoryPin[];
  settings: AppSettings;
  onOpenPinInMap: (pin: MemoryPin) => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ pins, settings, onOpenPinInMap }) => {
  const [selectedPin, setSelectedPin] = useState<MemoryPin | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const visiblePins = pins
    .filter((pin) => !(settings.isGuestMode && pin.isSensitive))
    .sort((a, b) => {
      const cmp = a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const displayedPins = isExpanded ? visiblePins : visiblePins.slice(0, 3);
  const hasMore = visiblePins.length > 3;

  return (
    <section className="timeline-clay-section border-b border-[#7A1018]/15 px-3 py-6 sm:px-6 sm:py-8 transition-colors">
      <div className="mx-auto max-w-2xl">
        {/* Compact Header */}
        <header className="mb-4 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-1.5 text-[10px] font-sans-clean font-bold uppercase tracking-wider text-[#a94761] dark:text-rose-200">
              <Clock className="w-3 h-3 text-[#a94761] dark:text-rose-200" />
              <span>Garis Waktu Kisah</span>
            </div>
            <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#43252d] dark:text-rose-50 leading-tight">
              Linimasa Kenangan
            </h2>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#7A1018]/10 text-[#7A1018] dark:bg-rose-950/60 dark:text-rose-300">
              {visiblePins.length} Momen
            </span>

            {/* Sort Toggle Button */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-sans-clean font-semibold bg-white/70 dark:bg-black/40 text-[#6b3140] dark:text-rose-200 border border-[#7A1018]/15 hover:bg-[#7A1018] hover:text-[#EFE6DA] transition shadow-xs flex items-center space-x-1"
              title={sortOrder === 'asc' ? 'Urutan: Terlama ke Terbaru' : 'Urutan: Terbaru ke Terlama'}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span className="hidden sm:inline">{sortOrder === 'asc' ? 'Terlama' : 'Terbaru'}</span>
            </button>
          </div>
        </header>

        {visiblePins.length ? (
          <div className="timeline-track relative space-y-2.5 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-[2.5px] before:rounded-full before:bg-gradient-to-b before:from-[#d87991] before:via-[#edb6c2] before:to-[#f7dfe4] before:content-[''] dark:before:from-[#dc8297] dark:before:via-[#754652] dark:before:to-[#49353d]">
            {displayedPins.map((pin, index) => (
              <div key={pin.id} className="relative pl-9 sm:pl-11">
                {/* Compact 3D Timeline Node */}
                <div className="timeline-node-3d absolute left-[5px] top-3.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-white shadow-xs dark:border-[#2b2226]">
                  {index === 0 && sortOrder === 'asc' ? (
                    <Heart className="h-2.5 w-2.5 fill-current" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>

                {/* Compact Timeline Memory Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPin(pin)}
                  className="timeline-memory-card clay-interactive w-full rounded-2xl border border-[#ead1d2] bg-white/80 p-2.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#d58b9b] hover:bg-white dark:border-white/10 dark:bg-[#2b2226] dark:hover:border-[#9e6271] sm:p-3 shadow-xs"
                  aria-label={`Buka detail kenangan ${pin.title}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Compact Thumbnail Photo */}
                    {pin.photos[0] ? (
                      <ManagedImage
                        src={pin.photos[0]}
                        alt={pin.title}
                        loading="lazy"
                        className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl object-cover shadow-xs"
                      />
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-[#a94761]">
                        <Heart className="h-6 w-6 opacity-40" />
                      </div>
                    )}

                    {/* Content Area */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center justify-between gap-1.5">
                        <span className="timeline-category-chip rounded-md bg-[#f5e0e2] px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[#a94761] dark:bg-[#49353d] dark:text-rose-200">
                          {pin.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6b3140] dark:text-rose-200">
                          <Calendar className="h-2.5 w-2.5 text-[#a94761]" />
                          <span>{pin.date}</span>
                        </span>
                      </div>

                      <h3 className="truncate font-sans-clean text-xs sm:text-sm font-extrabold text-[#43252d] dark:text-rose-50 mb-0.5" title={pin.title}>
                        {pin.title}
                      </h3>

                      <p className="line-clamp-1 text-[11px] leading-snug text-[#5c2432] dark:text-rose-200/90 mb-1">
                        {pin.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#a94761] dark:text-rose-200 pt-0.5 border-t border-[#ead1d2]/50 dark:border-white/5">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{pin.time || 'Kenangan'}</span>
                        </span>
                        <span className="font-bold hover:underline">Lihat detail ↗</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}

            {/* Expand / Collapse Button if more than 3 pins */}
            {hasMore && (
              <div className="pt-2 text-center pl-9 sm:pl-11">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-4 py-1.5 rounded-full text-xs font-sans-clean font-bold bg-white/90 dark:bg-[#2b2226] text-[#7A1018] dark:text-[#F4B6C2] border border-[#7A1018]/25 hover:bg-[#7A1018] hover:text-white dark:hover:bg-[#7A1018] transition shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Ciutkan Linimasa</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Lihat Semua ({visiblePins.length} Momen)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="clay-surface rounded-2xl px-6 py-6 text-center text-xs text-[#6b3140] dark:text-rose-200">
            Belum ada kenangan untuk ditampilkan di linimasa.
          </div>
        )}
      </div>

      {/* Modal: Full Memory Pin Detail */}
      {selectedPin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setSelectedPin(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeline-detail-title"
            className="clay-dialog timeline-detail-dialog relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#ead1d2] bg-[#fffdf9] p-5 shadow-2xl dark:border-white/10 dark:bg-[#2b2226] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <CloseButton onClick={() => setSelectedPin(null)} label="Tutup detail" className="absolute right-3 top-3" />
            <div className="mb-2 flex items-center gap-2 pr-12 text-xs font-semibold text-[#a94761] dark:text-rose-200">
              <Calendar className="h-4 w-4" />
              {selectedPin.date}
              {selectedPin.time ? ` · ${selectedPin.time}` : ''}
            </div>
            <h3 id="timeline-detail-title" className="mb-3 pr-8 font-sans-clean text-xl font-extrabold text-[#43252d] dark:text-rose-50">
              {selectedPin.title}
            </h3>
            {selectedPin.photos[0] && (
              <ManagedImage
                src={selectedPin.photos[0]}
                alt={selectedPin.title}
                className="mb-4 max-h-64 w-full rounded-2xl object-cover shadow-md"
              />
            )}
            <p className="text-sm leading-relaxed text-[#4a1e28] dark:text-rose-100">{selectedPin.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedPin.tags.map((tag) => (
                <span
                  key={tag}
                  className="timeline-category-chip rounded-full bg-[#f5e0e2] px-2.5 py-1 text-[10px] font-semibold text-[#a94761] dark:bg-[#49353d] dark:text-rose-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#ead1d2] pt-4 dark:border-white/10">
              <span className="text-xs text-[#6b3140] dark:text-rose-200">Ditambahkan oleh {selectedPin.addedBy}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenPinInMap(selectedPin);
                    setSelectedPin(null);
                  }}
                  className="clay-action-button inline-flex items-center gap-1.5 rounded-xl bg-[#c85f79] px-3 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Lihat di peta
                </button>
                {selectedPin.mapUrl && (
                  <a
                    href={selectedPin.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="clay-action-button inline-flex items-center gap-1.5 rounded-xl border border-[#ead1d2] bg-white px-3 py-2 text-xs font-bold text-[#a94761] dark:border-white/10 dark:bg-[#352a2f] dark:text-rose-200"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
