import React from 'react';
import { AppSettings } from '../../types';

interface IntroSectionProps {
  settings: AppSettings;
}

export const IntroSection: React.FC<IntroSectionProps> = ({ settings }) => {
  return (
    <section className="bg-[#7A1018] text-[#EFE6DA] py-16 px-4 relative overflow-hidden border-b border-[#3B0A0F]">
      {/* Decorative ambient background accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F4B6C2]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#D9B26F]/10 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#D9B26F] block mb-2">
            BAB SATU • AWAL SEGALANYA
          </span>
          <h2 className="font-serif-title text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
            Perkenalan Dua Hati
          </h2>
          <div className="font-script text-2xl sm:text-3xl text-[#F4B6C2]">
            dua dunia yang bertaut di sudut Semarang
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Polaroid Photos with slight tilt & cream border */}
          <div className="flex items-center justify-center space-x-[-24px] sm:space-x-[-36px] py-4">
            {/* Savero's Polaroid */}
            <div className="transform -rotate-6 hover:rotate-0 transition-transform duration-300 w-44 sm:w-56 bg-[#EFE6DA] p-3 rounded shadow-2xl border border-black/10">
              <div className="w-full h-48 sm:h-64 overflow-hidden rounded bg-[#C9A58B]/30 flex items-center justify-center relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80"
                  alt="Savero Pramudika Arya Wibowo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-[#7A1018]/80 text-[#EFE6DA] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Hukum UNNES
                </div>
              </div>
              <div className="pt-3 pb-1 text-center font-script text-xl text-[#3B0A0F]">
                Savero
              </div>
            </div>

            {/* Soffie's Polaroid */}
            <div className="transform rotate-6 hover:rotate-0 transition-transform duration-300 w-44 sm:w-56 bg-[#EFE6DA] p-3 rounded shadow-2xl border border-black/10 z-10">
              <div className="w-full h-48 sm:h-64 overflow-hidden rounded bg-[#BFD8B8]/30 flex items-center justify-center relative">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80"
                  alt="Soffie Aulia Fatikhasari"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-[#7A1018]/80 text-[#EFE6DA] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Keperawatan UNDIP
                </div>
              </div>
              <div className="pt-3 pb-1 text-center font-script text-xl text-[#3B0A0F]">
                Soffie
              </div>
            </div>
          </div>

          {/* Romantic Story Narrative & Calligraphy Signature */}
          <div className="space-y-4 text-[#EFE6DA]/90 font-editorial text-base sm:text-lg leading-relaxed">
            <p>
              Ada keindahan tersendiri saat seorang calon penegak hukum yang terbiasa dengan argumen tegas dan pasal-pasal keadilan, luluh di hadapan kelembutan seorang mahasiswi keperawatan yang terbiasa merawat dengan kasih dan ketulusan hati.
            </p>
            <p>
              Dimulai dari tatap muka di riuhnya malam Mie Gacoan Semarang pada 24 Maret 2026, berlanjut ke kopi fajar di kafe Unika, hingga malam sakral 26 Agustus 2026 di Taichan Pleburan saat dua hati memutuskan untuk saling menggenggam tangan.
            </p>
            <p>
              Situs ini diciptakan khusus sebagai ruang privat, abadi, dan tanpa batas untuk menyimpan setiap jejak langkah, tawa, film larut malam, impian, dan rasa cinta kita berdua di Kota Semarang.
            </p>

            {/* Signature "xoxo, S & S" as specified */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="block text-xs font-sans-clean font-semibold tracking-widest text-[#D9B26F] uppercase">
                  DARI SEMARANG DENGAN CINTA
                </span>
                <span className="text-xs text-[#EFE6DA]/60 font-sans-clean">
                  Savero & Soffie • Selamanya
                </span>
              </div>
              <div className="font-script text-3xl sm:text-4xl text-[#F4B6C2]">
                xoxo, S & S
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
