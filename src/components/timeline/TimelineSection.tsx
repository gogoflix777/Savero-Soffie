import React, { useState } from 'react';
import { ManagedImage } from '../common/ManagedImage';
import { Calendar, Clock, ExternalLink, Heart, MapPin } from 'lucide-react';
import { MemoryPin, AppSettings } from '../../types';
import { CloseButton } from '../common/CloseButton';

interface TimelineSectionProps {
  pins: MemoryPin[];
  settings: AppSettings;
  onOpenPinInMap: (pin: MemoryPin) => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ pins, settings, onOpenPinInMap }) => {
  const [selectedPin, setSelectedPin] = useState<MemoryPin | null>(null);
  const visiblePins = pins
    .filter((pin) => !(settings.isGuestMode && pin.isSensitive))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  return (
    <section className="timeline-clay-section border-b border-[#7A1018]/15 px-4 py-12 transition-colors sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center sm:mb-10">
          <span className="mb-1 block font-sans-clean text-[11px] font-bold uppercase tracking-[0.25em] text-[#a94761] dark:text-rose-200">
            Garis waktu kisah
          </span>
          <h2 className="font-sans-clean text-3xl font-extrabold tracking-tight text-[#43252d] dark:text-rose-50 sm:text-4xl">
            Linimasa Kenangan
          </h2>
          <p className="mt-1 text-sm text-[#80646a] dark:text-rose-100/70 sm:text-base">
            Setiap tempat menyimpan satu bab perjalanan kalian.
          </p>
        </header>

        {visiblePins.length ? (
          <div className="timeline-track relative space-y-4 before:absolute before:bottom-5 before:left-[18px] before:top-5 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-[#d87991] before:via-[#edb6c2] before:to-[#f7dfe4] before:content-[''] dark:before:from-[#dc8297] dark:before:via-[#754652] dark:before:to-[#49353d] sm:space-y-5">
            {visiblePins.map((pin, index) => (
              <div key={pin.id} className="relative pl-11 sm:pl-14">
                <div className="timeline-node-3d absolute left-[7px] top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-white shadow-md dark:border-[#2b2226]">
                  {index === 0 ? <Heart className="h-3 w-3 fill-current" /> : <span className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPin(pin)}
                  className="timeline-memory-card clay-interactive w-full rounded-[1.4rem] border border-[#ead1d2] bg-white/75 p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#d58b9b] hover:bg-white dark:border-white/10 dark:bg-[#2b2226] dark:hover:border-[#9e6271] sm:p-4"
                  aria-label={`Buka detail kenangan ${pin.title}`}
                >
                  <div className="flex items-start gap-3">
                    {pin.photos[0] && (
                      <ManagedImage src={pin.photos[0]} alt="" loading="lazy" className="h-[76px] w-[76px] shrink-0 rounded-2xl object-cover shadow-inner sm:h-24 sm:w-24" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="timeline-category-chip rounded-full bg-[#f5e0e2] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#a94761] dark:bg-[#49353d] dark:text-rose-200">
                          {pin.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#80646a] dark:text-rose-100/65">
                          <Calendar className="h-3 w-3" />{pin.date}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 font-sans-clean text-sm font-extrabold text-[#43252d] dark:text-rose-50 sm:text-base">{pin.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#80646a] dark:text-rose-100/70">{pin.description}</p>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#a94761] dark:text-rose-200">
                        <Clock className="h-3 w-3" />{pin.time || 'Kenangan bersama'}<span className="px-1">·</span>Lihat detail
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="clay-surface rounded-3xl px-6 py-10 text-center text-sm text-[#80646a] dark:text-rose-100/70">
            Belum ada kenangan untuk ditampilkan di linimasa.
          </div>
        )}
      </div>

      {selectedPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-5" onClick={() => setSelectedPin(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="timeline-detail-title" className="clay-dialog timeline-detail-dialog relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#ead1d2] bg-[#fffdf9] p-5 shadow-2xl dark:border-white/10 dark:bg-[#2b2226] sm:p-6" onClick={(event) => event.stopPropagation()}>
            <CloseButton onClick={() => setSelectedPin(null)} label="Tutup detail" className="absolute right-3 top-3" />
            <div className="mb-2 flex items-center gap-2 pr-12 text-xs font-semibold text-[#a94761] dark:text-rose-200">
              <Calendar className="h-4 w-4" />{selectedPin.date}{selectedPin.time ? ` · ${selectedPin.time}` : ''}
            </div>
            <h3 id="timeline-detail-title" className="mb-3 pr-8 font-sans-clean text-xl font-extrabold text-[#43252d] dark:text-rose-50">{selectedPin.title}</h3>
            {selectedPin.photos[0] && <ManagedImage src={selectedPin.photos[0]} alt={selectedPin.title} className="mb-4 max-h-64 w-full rounded-2xl object-cover shadow-md" />}
            <p className="text-sm leading-relaxed text-[#63464e] dark:text-rose-100/80">{selectedPin.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedPin.tags.map((tag) => <span key={tag} className="timeline-category-chip rounded-full bg-[#f5e0e2] px-2.5 py-1 text-[10px] font-semibold text-[#a94761] dark:bg-[#49353d] dark:text-rose-200">#{tag}</span>)}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#ead1d2] pt-4 dark:border-white/10">
              <span className="text-xs text-[#80646a] dark:text-rose-100/70">Ditambahkan oleh {selectedPin.addedBy}</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { onOpenPinInMap(selectedPin); setSelectedPin(null); }} className="clay-action-button inline-flex items-center gap-1.5 rounded-xl bg-[#c85f79] px-3 py-2 text-xs font-bold text-white">
                  <MapPin className="h-3.5 w-3.5" />Lihat di peta
                </button>
                {selectedPin.mapUrl && <a href={selectedPin.mapUrl} target="_blank" rel="noopener noreferrer" className="clay-action-button inline-flex items-center gap-1.5 rounded-xl border border-[#ead1d2] bg-white px-3 py-2 text-xs font-bold text-[#a94761] dark:border-white/10 dark:bg-[#352a2f] dark:text-rose-200"><ExternalLink className="h-3.5 w-3.5" />Buka Maps</a>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
