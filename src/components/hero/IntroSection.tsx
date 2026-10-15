import React, { useEffect, useState } from 'react';
import { AppSettings } from '../../types';
import { getManagedPhotoUrl } from '../../lib/supabase';

interface IntroSectionProps {
  settings: AppSettings;
}

const saveroProfilePhoto = 'https://scontent.cdninstagram.com/v/t51.2885-19/296301338_1323455861760195_6131353476101218620_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=100&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=MxSs-zudAHgQ7kNvwGnLsAW&_nc_oc=AdrQVqZxtxkRohdsbJiawUOWS9CzAu6ttQstAlwk-53AUfTHeaU7N6-QJJUz_4K4BxE&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_ss=7b689&oh=00_AQMvkB2-b-Xm9UKCLYutz_8_-bvyxLblpX5IrNPCgmDXPw&oe=6AD64304';
const soffieProfilePhoto = 'https://scontent.cdninstagram.com/v/t51.82787-19/652001432_18013647809820522_221030891397855465_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=105&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=7wYiSONEqDcQ7kNvwFzsbz1&_nc_oc=AdrH3loWCVRdgZC09vDFRi5aly3IuQyUgrM9_Zp1dG4QF58anMcmAP98rPBBNxSMhj8&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_gid=z9m4nPWAN8tkno0H5k_PPg&_nc_ss=7b689&oh=00_AQP-buprgswtDCJuuBeLM2w6HM1H4x967n3aV2E-czH4Ew&oe=6AD660B2';

export const IntroSection: React.FC<IntroSectionProps> = ({ settings }) => {
  const [saveroPhoto, setSaveroPhoto] = useState(saveroProfilePhoto);
  const [soffiePhoto, setSoffiePhoto] = useState(soffieProfilePhoto);
  useEffect(() => {
    let active = true;
    void Promise.all([
      getManagedPhotoUrl('profil:savero', saveroProfilePhoto),
      getManagedPhotoUrl('profil:soffie', soffieProfilePhoto)
    ]).then(([savero, soffie]) => { if (active) { setSaveroPhoto(savero); setSoffiePhoto(soffie); } });
    return () => { active = false; };
  }, []);
  return (
    <section className="relative overflow-hidden border-y border-rose-200/70 bg-[#fff5f3] px-4 py-12 text-[#57202c] dark:border-white/10 dark:bg-[#281c21] dark:text-rose-50 sm:py-16">
      {/* Decorative ambient background accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F4B6C2]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#D9B26F]/10 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="mb-2 block font-sans-clean text-[11px] font-bold tracking-[0.2em] uppercase text-[#b46b79] dark:text-rose-200">
            BAB SATU • AWAL SEGALANYA
          </span>
          <h2 className="mb-2 font-sans-clean text-2xl font-extrabold tracking-tight text-[#57202c] dark:text-rose-50 sm:text-4xl">
            Perkenalan Dua Hati
          </h2>
          <div className="font-script text-3xl text-[#c35f78] dark:text-[#f0a8b7] sm:text-4xl">
            dua dunia yang bertaut di sudut Semarang
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Polaroid Photos with slight tilt & cream border */}
          <div className="polaroid-photo-row flex items-center justify-center space-x-[-24px] py-4 sm:space-x-[-36px]">
            {/* Savero's Polaroid */}
            <div className="polaroid-3d transform -rotate-6 hover:rotate-0 transition-transform duration-300 w-44 sm:w-56 bg-[#EFE6DA] p-3 rounded shadow-2xl border border-black/10">
              <div className="w-full h-48 sm:h-64 overflow-hidden rounded bg-[#C9A58B]/30 flex items-center justify-center relative">
                <img
                  src={saveroPhoto}
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
            <div className="polaroid-3d transform rotate-6 hover:rotate-0 transition-transform duration-300 w-44 sm:w-56 bg-[#EFE6DA] p-3 rounded shadow-2xl border border-black/10 z-10">
              <div className="w-full h-48 sm:h-64 overflow-hidden rounded bg-[#BFD8B8]/30 flex items-center justify-center relative">
                <img
                  src={soffiePhoto}
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
          <div className="space-y-4 font-sans-clean text-sm leading-relaxed text-[#75414c] dark:text-rose-50/80 sm:text-base">
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
