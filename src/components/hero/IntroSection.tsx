import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, RotateCcw } from 'lucide-react';
import { AppSettings } from '../../types';
import { getManagedPhotoUrl } from '../../lib/supabase';
import { soundManager } from '../../utils/audio';

interface IntroSectionProps {
  settings: AppSettings;
}

const saveroProfilePhoto =
  'https://scontent.cdninstagram.com/v/t51.2885-19/296301338_1323455861760195_6131353476101218620_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=100&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=MxSs-zudAHgQ7kNvwGnLsAW&_nc_oc=AdrQVqZxtxkRohdsbJiawUOWS9CzAu6ttQstAlwk-53AUfTHeaU7N6-QJJUz_4K4BxE&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_ss=7b689&oh=00_AQMvkB2-b-Xm9UKCLYutz_8_-bvyxLblpX5IrNPCgmDXPw&oe=6AD64304';
const soffieProfilePhoto =
  'https://scontent.cdninstagram.com/v/t51.82787-19/652001432_18013647809820522_221030891397855465_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=105&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=7wYiSONEqDcQ7kNvwFzsbz1&_nc_oc=AdrH3loWCVRdgZC09vDFRi5aly3IuQyUgrM9_Zp1dG4QF58anMcmAP98rPBBNxSMhj8&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_gid=z9m4nPWAN8tkno0H5k_PPg&_nc_ss=7b689&oh=00_AQP-buprgswtDCJuuBeLM2w6HM1H4x967n3aV2E-czH4Ew&oe=6AD660B2';

export const IntroSection: React.FC<IntroSectionProps> = ({ settings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpeningFlap, setIsOpeningFlap] = useState(false);
  const [saveroPhoto, setSaveroPhoto] = useState(saveroProfilePhoto);
  const [soffiePhoto, setSoffiePhoto] = useState(soffieProfilePhoto);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getManagedPhotoUrl('profil:savero', saveroProfilePhoto),
      getManagedPhotoUrl('profil:soffie', soffieProfilePhoto)
    ]).then(([savero, soffie]) => {
      if (active) {
        setSaveroPhoto(savero);
        setSoffiePhoto(soffie);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleOpenEnvelope = () => {
    soundManager.playSuccess();
    setIsOpeningFlap(true);
    setTimeout(() => {
      setIsOpen(true);
      setIsOpeningFlap(false);
    }, 420);
  };

  const handleCloseEnvelope = () => {
    soundManager.playClose();
    setIsOpen(false);
    setIsOpeningFlap(false);
  };

  return (
    <section className="relative overflow-hidden border-y border-rose-200/70 bg-[#fff5f3] px-4 py-8 text-[#57202c] dark:border-white/10 dark:bg-[#1a0810] dark:text-rose-50 sm:py-12">
      {/* Decorative ambient background accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F4B6C2]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#D9B26F]/15 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 flex justify-center">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            /* ==========================================================================
               STATE 1: PURE REALISTIC CLOSED ENVELOPE (NO TEXT CLUTTER, JUST PURE ENVELOPE)
               ========================================================================== */
            <motion.div
              key="closed-envelope"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full flex justify-center py-2 sm:py-4"
            >
              {/* === THE REALISTIC PHYSICAL ENVELOPE === */}
              <div
                onClick={handleOpenEnvelope}
                className="group relative w-full max-w-[590px] aspect-[1.62/1] rounded-[24px] sm:rounded-[28px] cursor-pointer select-none overflow-hidden transition-all duration-300 hover:scale-[1.018] active:scale-[0.99] vintage-envelope-shadow bg-gradient-to-br from-[#FFFBF8] via-[#FDF1EC] to-[#FCE6EE] dark:from-[#2e0c17] dark:via-[#220710] dark:to-[#17040b] border-2 border-[#E5BAC6]/70 dark:border-rose-300/20"
                style={{ perspective: 1100 }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenEnvelope();
                  }
                }}
                aria-label="Buka Surat Cinta Savero & Soffie"
              >
                {/* Vintage Airmail Diagonal Stripe Border Accent (Left Edge) */}
                <div className="absolute top-0 left-0 bottom-0 w-3 sm:w-3.5 bg-[repeating-linear-gradient(45deg,#d95b78,#d95b78_8px,#ffffff_8px,#ffffff_16px,#7a1018_16px,#7a1018_24px)] opacity-75 z-10 rounded-l-[24px]" />

                {/* Inner Dashed Luxury Stitching Frame */}
                <div className="absolute inset-2.5 sm:inset-3.5 rounded-[18px] sm:rounded-[22px] envelope-stitching-border pointer-events-none z-10" />

                {/* Vintage Postal Stamp & Postmark (Top-Right) */}
                <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-15 flex flex-col items-end pointer-events-none">
                  <div className="relative postage-stamp-perforation w-16 h-20 sm:w-19 sm:h-23 rounded-sm p-1.5 flex flex-col justify-between items-center text-center shadow-md transform rotate-2">
                    <span className="text-[7px] sm:text-[7.5px] font-sans-clean font-extrabold tracking-widest text-[#8C2A44] dark:text-rose-300 uppercase">
                      POS CINTA
                    </span>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-100 dark:bg-rose-950/70 border border-rose-300/60 flex items-center justify-center my-0.5 shadow-xs">
                      <Heart className="w-5 h-5 text-[#D95B78] fill-[#D95B78]/40" />
                    </div>
                    <span className="text-[7.5px] sm:text-[8px] font-black text-[#631B2D] dark:text-rose-200">
                      RP 24.03
                    </span>
                  </div>

                  {/* Circular Postmark Cancellation Ink Stamp */}
                  <div className="absolute -bottom-3.5 -left-7 sm:-left-8 w-16 h-16 sm:w-18 sm:h-18 rounded-full border border-black/25 dark:border-white/20 flex flex-col items-center justify-center text-[6.5px] sm:text-[7px] font-sans-clean tracking-wider uppercase text-black/45 dark:text-white/35 transform -rotate-12 pointer-events-none">
                    <span>SEMARANG</span>
                    <span className="font-extrabold text-[7px] text-[#7A1018] dark:text-rose-300">24 • 03 • 26</span>
                    <span>RESMI</span>
                    {/* Cancellation Waves */}
                    <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-8 h-4 border-y border-black/20 dark:border-white/20 opacity-60" />
                  </div>
                </div>

                {/* Recipient Handwritten Address (Center Left) */}
                <div className="absolute bottom-6 left-8 sm:bottom-8 sm:left-10 z-10 max-w-[65%] pointer-events-none">
                  <p className="font-sans-clean text-[10px] sm:text-xs font-bold tracking-widest text-[#964758] dark:text-rose-300/90 uppercase mb-0.5">
                    Kepada yang Terkasih:
                  </p>
                  <p className="font-script text-2xl sm:text-3xl text-[#46121E] dark:text-[#FFE3EA] leading-tight">
                    Soffie Aulia & Savero Pramudika
                  </p>
                  <p className="font-sans-clean text-[11px] sm:text-xs text-[#702F3E] dark:text-rose-200/80 mt-1 flex items-center space-x-1.5">
                    <span>Sudut Indah Kota Semarang, Jawa Tengah</span>
                    <Heart className="w-3 h-3 text-[#D95B78] fill-current inline" />
                  </p>
                </div>

                {/* Authentic Envelope Side & Bottom Creases */}
                <div className="absolute inset-0 pointer-events-none z-5">
                  {/* Left flap fold shadow */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-black/[0.045] to-transparent dark:from-white/[0.02]"
                    style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }}
                  />
                  {/* Right flap fold shadow */}
                  <div
                    className="absolute inset-0 bg-gradient-to-l from-black/[0.045] to-transparent dark:from-white/[0.02]"
                    style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }}
                  />
                  {/* Bottom pocket flap */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/[0.07] via-black/[0.015] to-transparent dark:from-black/45"
                    style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 48%)' }}
                  />
                </div>

                {/* Top Flap (Triangular Lid Folding Downwards) */}
                <motion.div
                  className="absolute inset-x-0 top-0 h-[56%] z-20 origin-top"
                  animate={{
                    rotateX: isOpeningFlap ? -160 : 0
                  }}
                  transition={{
                    duration: 0.42,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    background:
                      'linear-gradient(180deg, rgba(255, 245, 248, 0.99) 0%, rgba(250, 225, 235, 0.96) 85%, rgba(238, 195, 210, 0.94) 100%)',
                    filter: 'drop-shadow(0 10px 14px rgba(70, 10, 25, 0.22))'
                  }}
                >
                  <div className="w-full h-full dark:bg-[#38101e]/98" />
                </motion.div>

                {/* === REALISTIC 3D WAX SEAL (ANIMATED PULSING CENTERPIECE) === */}
                <div className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                  <div className="wax-seal-animated">
                    <motion.div
                      whileHover={{ scale: 1.14 }}
                      whileTap={{ scale: 0.92 }}
                      className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full wax-seal-3d flex items-center justify-center cursor-pointer select-none"
                    >
                      {/* Molten Wax Scalloped Edges (Organic Poured Wax Rim) */}
                      <svg
                        className="absolute inset-[-5px] w-[calc(100%+10px)] h-[calc(100%+10px)] text-[#7F0C21] dark:text-[#680516] pointer-events-none fill-current opacity-70"
                        viewBox="0 0 100 100"
                      >
                        <path d="M50 0 C65 2, 75 12, 85 20 C96 30, 100 45, 98 60 C95 76, 84 88, 70 96 C55 102, 40 98, 25 94 C12 87, 2 75, 1 58 C0 42, 6 28, 18 16 C30 5, 40 -1, 50 0 Z" />
                      </svg>

                      {/* Stamped Golden/Ivory Seal Center Ring */}
                      <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-[#F7C8D4]/70 dark:border-rose-300/45 flex flex-col items-center justify-center shadow-inner bg-gradient-to-br from-[#9E142D] via-[#75071B] to-[#4A010F]">
                        <span className="font-serif-title font-black text-xs sm:text-sm tracking-tight text-[#FFE8EF] drop-shadow-sm">
                          S & S
                        </span>
                        <Heart className="w-3 h-3 text-[#F7C8D4] fill-current -mt-0.5" />
                      </div>

                      {/* Specular Light Reflection Crescent */}
                      <div className="absolute top-2 left-3 w-5 h-2.5 rounded-full bg-white/45 blur-[0.6px] pointer-events-none" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ==========================================================================
               STATE 2: OPENED LOVE LETTER (FULL CONTENT WITH SMOOTH UNROLL ANIMATION)
               ========================================================================== */
            <motion.div
              key="opened-letter"
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 bg-gradient-to-b from-[#FFFDFB] via-[#FFF9F6] to-[#FFF4F0] dark:from-[#28131B] dark:via-[#200D15] dark:to-[#17060D] border-2 border-[#E8BAC6]/80 dark:border-rose-400/25 vintage-envelope-shadow"
            >
              {/* Top Action Bar (Fold / Re-close button) */}
              <div className="flex items-center justify-between pb-6 mb-8 border-b border-rose-200/60 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D95B78] animate-pulse" />
                  <span className="text-[11px] font-sans-clean font-bold tracking-widest uppercase text-[#8C2A44] dark:text-rose-300">
                    WARKAT CINTA TELAH DIBUKA
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEnvelope}
                  className="px-3.5 py-1.5 rounded-full text-xs font-sans-clean font-semibold bg-rose-100 hover:bg-rose-200 text-[#7A1018] dark:bg-rose-950/70 dark:hover:bg-rose-900/80 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  title="Tutup kembali surat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Lipat Kembali Surat</span>
                </button>
              </div>

              {/* Header Title Section */}
              <div className="text-center max-w-2xl mx-auto mb-10">
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

              {/* Main Content Grid: Polaroids & Story */}
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
                        loading="lazy"
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
                        loading="lazy"
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
                    Ada keindahan tersendiri saat seorang calon penegak hukum yang terbiasa dengan
                    argumen tegas dan pasal-pasal keadilan, luluh di hadapan kelembutan seorang
                    mahasiswi keperawatan yang terbiasa merawat dengan kasih dan ketulusan hati.
                  </p>
                  <p>
                    Dimulai dari tatap muka di riuhnya malam Mie Gacoan Semarang pada 24 Maret 2026,
                    berlanjut ke kopi fajar di kafe Unika, hingga malam sakral 26 Agustus 2026 di
                    Taichan Pleburan saat dua hati memutuskan untuk saling menggenggam tangan.
                  </p>
                  <p>
                    Situs ini diciptakan khusus sebagai ruang privat, abadi, dan tanpa batas untuk
                    menyimpan setiap jejak langkah, tawa, film larut malam, impian, dan rasa cinta kita
                    berdua di Kota Semarang.
                  </p>

                  {/* Signature "xoxo, S & S" */}
                  <div className="pt-4 border-t border-rose-200/70 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-sans-clean font-semibold tracking-widest text-[#D9B26F] uppercase">
                        DARI SEMARANG DENGAN CINTA
                      </span>
                      <span className="text-xs text-[#753342] dark:text-[#EFE6DA]/60 font-sans-clean">
                        Savero & Soffie • Selamanya
                      </span>
                    </div>
                    <div className="font-script text-3xl sm:text-4xl text-[#c35f78] dark:text-[#F4B6C2]">
                      xoxo, S & S
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Re-fold Button */}
              <div className="mt-8 pt-6 border-t border-rose-200/60 dark:border-white/10 flex justify-center">
                <button
                  type="button"
                  onClick={handleCloseEnvelope}
                  className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-sans-clean font-bold bg-[#7A1018] hover:bg-[#961924] text-[#FFF5F7] dark:bg-rose-900/90 dark:hover:bg-rose-800 dark:text-rose-100 shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Lipat & Masukkan Kembali ke Amplop</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
