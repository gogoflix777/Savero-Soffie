import React, { useState, useRef } from 'react';
import { ManagedImage } from '../common/ManagedImage';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Lock,
  Unlock,
  Play,
  Pause,
  Music,
  Image,
  Sparkles,
  Calendar,
  Clock,
  Send,
  Plus,
  Flame,
  Award,
  Volume2,
  VolumeX,
  FileText
} from 'lucide-react';
import { CloseButton } from '../common/CloseButton';
import { LockedLetter, LoveSong, MemoryPin, MovieItem, AppSettings } from '../../types';
import { soundManager } from '../../utils/audio';
import { HeartRating } from '../common/AnimatedIcons';
import { getGeminiApiKey } from '../../config/env';

interface RomanticExtrasProps {
  letters: LockedLetter[];
  songs: LoveSong[];
  pins: MemoryPin[];
  movies: MovieItem[];
  settings: AppSettings;
  onAddLetter: (letter: LockedLetter) => void;
  onOpenLetter: (id: string) => void;
}

export const RomanticExtrasSection: React.FC<RomanticExtrasProps> = ({
  letters,
  songs,
  pins,
  movies,
  settings,
  onAddLetter,
  onOpenLetter
}) => {
  const [activeTab, setActiveTab] = useState<'surat' | 'onthisday' | 'wrapped' | 'galeri' | 'lagu'>('surat');
  const [selectedFlashbackDate, setSelectedFlashbackDate] = useState<string>('2026-08-26');

  // Audio Playback State
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Selected Letter Modal
  const [readingLetter, setReadingLetter] = useState<LockedLetter | null>(null);
  const [isNewLetterOpen, setIsNewLetterOpen] = useState(false);

  // New Letter Form State
  const [letterForm, setLetterForm] = useState<{
    sender: 'Savero' | 'Soffie';
    recipient: 'Savero' | 'Soffie';
    title: string;
    content: string;
    unlockDate: string;
  }>({
    sender: 'Savero',
    recipient: 'Soffie',
    title: '',
    content: '',
    unlockDate: '2026-12-31'
  });

  // Slideshow State
  const allPhotos = pins.flatMap((p) => p.photos).filter(Boolean);
  const [slideshowIdx, setSlideshowIdx] = useState(0);

  // Taste Compatibility Calculation
  const tasteScore = Math.min(
    98,
    88 + (movies.filter((m) => (m.ratingSavero || 5) === (m.ratingSoffie || 5)).length * 3)
  );

  const toggleSongPlay = (song: LoveSong) => {
    if (playingSongId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingSongId(null);
    } else {
      setPlayingSongId(song.id);
      if (audioRef.current && song.audioUrl) {
        audioRef.current.src = song.audioUrl;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleOpenLetter = (letter: LockedLetter) => {
    const today = new Date().toISOString().split('T')[0];
    const isUnlocked = letter.unlockDate <= today || letter.isOpened;

    if (!isUnlocked) {
      soundManager.playTap();
      alert(`Surat ini masih terkunci! Baru dapat dibuka pada tanggal ${letter.unlockDate}. Simpan rasa penasaranmu ya sayang!`);
      return;
    }

    soundManager.playChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#F4B6C2', '#7A1018', '#D9B26F']
    });

    onOpenLetter(letter.id);
    setReadingLetter(letter);
  };

  const handleSaveLetter = (e: React.FormEvent) => {
    e.preventDefault();
    const newL: LockedLetter = {
      id: 'letter-' + Date.now(),
      sender: letterForm.sender,
      recipient: letterForm.recipient,
      title: letterForm.title,
      content: letterForm.content,
      unlockDate: letterForm.unlockDate,
      isOpened: false
    };
    onAddLetter(newL);
    setIsNewLetterOpen(false);
  };

  const handleGenerateLoveNote = async () => {
    const apiKey = getGeminiApiKey();
    if (!apiKey || !letterForm.title.trim()) return;

    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Tulis satu surat singkat romantis dalam bahasa Indonesia, berjudul "${letterForm.title}". Surat itu ditulis dari ${letterForm.sender} untuk ${letterForm.recipient}. Gunakan nada hangat, manis, personal, dan menggambarkan kebahagiaan bersama.`
            }]
          }]
        })
      });

      if (!res.ok) throw new Error('Gemini request failed');
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (text) {
        setLetterForm((prev) => ({ ...prev, content: text.trim() }));
      }
    } catch (error) {
      console.warn('Gemini note generation failed:', error);
    }
  };

  return (
    <section id="romantis-section" className="py-14 px-4 bg-[#EFE6DA] dark:bg-[#1a0507] border-b border-[#7A1018]/15 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Hidden Audio element for "Lagu Kita" */}
        <audio ref={audioRef} onEnded={() => setPlayingSongId(null)} />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RUANG ROMANTIS & NOSTALGIA</span>
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
              Surat Terkunci, Lagu & Wrapped
            </h2>
            <p className="font-editorial italic text-xs sm:text-sm text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 mt-0.5">
              Kapsul waktu pesan rahasia, soundtrack cinta kita, dan kilas balik tahunan Semarang.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white/50 dark:bg-black/30 p-1.5 rounded-2xl border border-[#7A1018]/15 text-xs font-sans-clean font-bold overflow-x-auto max-w-full scrollbar-none">
            <button
              onClick={() => setActiveTab('surat')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'surat' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Surat Terkunci ({letters.length})
            </button>
            <button
              onClick={() => setActiveTab('onthisday')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'onthisday' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              On This Day 📅
            </button>
            <button
              onClick={() => setActiveTab('wrapped')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'wrapped' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Annual Wrapped
            </button>
            <button
              onClick={() => setActiveTab('galeri')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'galeri' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Galeri Slideshow
            </button>
            <button
              onClick={() => setActiveTab('lagu')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'lagu' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Lagu Kita ({songs.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Surat Terkunci (Time-locked Letters) */}
        {activeTab === 'surat' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-sans-clean">
                Surat yang disegel tidak dapat dibuka hingga tanggal yang telah ditentukan.
              </span>
              <button
                onClick={() => setIsNewLetterOpen(true)}
                className="px-4 py-2 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] text-xs font-sans-clean font-bold rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tulis Surat Terkunci</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {letters.map((letter) => {
                const today = new Date().toISOString().split('T')[0];
                const isReady = letter.unlockDate <= today || letter.isOpened;

                return (
                  <div
                    key={letter.id}
                    onClick={() => handleOpenLetter(letter)}
                    className="p-6 rounded-3xl bg-white/70 dark:bg-black/30 border border-[#7A1018]/20 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Wax Seal / Lock Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-md transition-transform group-hover:scale-110 ${
                            isReady
                              ? 'bg-[#7A1018] text-[#D9B26F]'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                          }`}
                        >
                          {isReady ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>

                        <span className="text-[10px] font-sans-clean font-bold uppercase tracking-wider text-gray-500">
                          {isReady ? 'DAPAT DIBUKA' : `TERKUNCI S/D ${letter.unlockDate}`}
                        </span>
                      </div>

                      <div className="text-[10px] font-sans-clean font-bold tracking-widest text-[#7A1018] dark:text-[#F4B6C2] uppercase mb-1">
                        Dari {letter.sender} Untuk {letter.recipient}
                      </div>

                      <h4 className="font-serif-title font-bold text-lg text-[#3B0A0F] dark:text-[#EFE6DA] mb-2">
                        {letter.title}
                      </h4>

                      <p className="font-editorial text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                        {isReady ? letter.content : 'Surat ini disegel rapat dengan gembok cinta...'}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#7A1018]/10 flex items-center justify-between text-xs font-sans-clean">
                      <span className="font-script text-xl text-[#7A1018] dark:text-[#F4B6C2]">
                        xoxo, {letter.sender}
                      </span>
                      <span className="text-[10px] font-bold text-[#7A1018] dark:text-[#F4B6C2] uppercase tracking-wider flex items-center space-x-1">
                        {isReady ? (
                          <span>BACA SURAT &rarr;</span>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-gray-500 mr-1" />
                            <span>MASIH TERKUNCI</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: On This Day (Kilas Balik Kenangan) */}
        {activeTab === 'onthisday' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <span className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] block mb-1">
                KILAS BALIK KENANGAN • ON THIS DAY
              </span>
              <h3 className="font-serif-title text-3xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA] mb-2">
                "Apa Yang Terjadi Pada Hari Ini?"
              </h3>
              <p className="font-editorial italic text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Pilih tanggal bersejarah untuk memutar kembali momen indah yang pernah kita lewati di Semarang.
              </p>
            </div>

            {/* Quick Milestone Date Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-sans-clean">
              {[
                { date: '2026-03-24', label: '24 Mar • Mie Gacoan' },
                { date: '2026-03-25', label: '25 Mar • Kafe Unika Subuh' },
                { date: '2026-08-26', label: '26 Agu • Taichan Pleburan (Jadian)' },
                { date: '2026-08-27', label: '27 Agu • Sunrise Jangli-Undip' },
                { date: '2026-09-06', label: '06 Sep • Alam Indah Hotel Gombel' }
              ].map((m) => (
                <button
                  key={m.date}
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedFlashbackDate(m.date);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
                    selectedFlashbackDate === m.date
                      ? 'bg-[#7A1018] text-[#EFE6DA] shadow-md scale-105'
                      : 'bg-white/70 dark:bg-black/30 hover:bg-white text-[#3B0A0F] dark:text-[#EFE6DA] border border-[#7A1018]/15'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Memory Card for Selected Flashback Date */}
            {(() => {
              const matchedPin = pins.find((p) => p.date === selectedFlashbackDate) || pins[0];

              return (
                <div className="bg-white/80 dark:bg-black/40 rounded-3xl p-6 sm:p-8 border-2 border-[#7A1018]/20 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 bg-[#7A1018] text-[#EFE6DA] px-4 py-1.5 rounded-bl-2xl text-[10px] font-sans-clean font-bold uppercase tracking-widest">
                    FLASHBACK RESMI
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {matchedPin.photos && matchedPin.photos[0] && (
                      <div className="w-full md:w-64 h-56 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                        <ManagedImage
                          src={matchedPin.photos[0]}
                          alt={matchedPin.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-sans-clean font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                        <Clock className="w-4 h-4" />
                        <span>{matchedPin.date} {matchedPin.time ? `• Pukul ${matchedPin.time} WIB` : ''}</span>
                      </div>

                      <h4 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                        {matchedPin.title}
                      </h4>

                      <p className="font-editorial text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed italic">
                        "{matchedPin.description}"
                      </p>

                      <div className="flex items-center space-x-1">
                        <HeartRating rating={matchedPin.rating} size={15} />
                      </div>

                      <div className="pt-3 border-t border-[#7A1018]/15 flex items-center justify-between text-xs font-sans-clean">
                        <span className="text-gray-500">
                          Kategori: <strong>{matchedPin.category}</strong>
                        </span>

                        {matchedPin.mapUrl && (
                          <a
                            href={matchedPin.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] rounded-xl font-bold transition flex items-center space-x-1.5 text-xs shadow"
                          >
                            <span>Buka di Google Maps</span>
                            <Send className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 2: Savero & Soffie Wrapped (Rekap Tahunan Semarang Tanpa Data Intim) */}
        {activeTab === 'wrapped' && (
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#7A1018] to-[#3B0A0F] text-[#EFE6DA] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-[#D9B26F]/30">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F4B6C2]/10 blur-3xl pointer-events-none" />

            <div className="text-center mb-10">
              <span className="text-[10px] font-sans-clean font-bold tracking-[0.3em] uppercase text-[#D9B26F] block mb-1">
                KILAS BALIK TAHUNAN
              </span>
              <h3 className="font-serif-title text-3xl sm:text-5xl font-bold text-white mb-2">
                Savero & Soffie Wrapped
              </h3>
              <p className="font-editorial italic text-sm text-[#EFE6DA]/80">
                Merekam jejak langkah dan momen terbaik dua hati sepanjang tahun 2026 di Semarang.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
                <span className="text-3xl font-serif-title font-bold text-[#F4B6C2] block">
                  {pins.length}
                </span>
                <span className="text-[10px] font-sans-clean font-bold tracking-wider uppercase text-[#EFE6DA]/70">
                  Sudut Kota Dikunjungi
                </span>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
                <span className="text-3xl font-serif-title font-bold text-[#D9B26F] block">
                  {movies.filter((m) => m.status === 'together').length}
                </span>
                <span className="text-[10px] font-sans-clean font-bold tracking-wider uppercase text-[#EFE6DA]/70">
                  Film Ditonton Berdua
                </span>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
                <span className="text-3xl font-serif-title font-bold text-[#BFD8B8] block">
                  {tasteScore}%
                </span>
                <span className="text-[10px] font-sans-clean font-bold tracking-wider uppercase text-[#EFE6DA]/70">
                  Skor Selera Film
                </span>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
                <span className="text-3xl font-serif-title font-bold text-[#F4B6C2] block">
                  100%
                </span>
                <span className="text-[10px] font-sans-clean font-bold tracking-wider uppercase text-[#EFE6DA]/70">
                  Ketulusan Cinta
                </span>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-6 border border-white/10 space-y-3 font-editorial text-base sm:text-lg leading-relaxed">
              <h4 className="font-serif-title font-bold text-xl text-[#D9B26F] mb-1">
                Catatan Manis Tahun 2026:
              </h4>
              <p>
                Dari obrolan pertama di riuhnya Mie Gacoan hingga menembus fajar jam 05.38 pagi di jalan baru Jangli–Undip, tahun ini penuh dengan keberanian untuk saling mencintai dan menjaga.
              </p>
              <p>
                Savero dengan cangkir kopi dan palu hukumnya, Soffie dengan stetoskop dan segelas iced matchanya. Bersama, kita membuktikan bahwa dua dunia yang berbeda bisa menyatu dalam irama paling indah di Kota Semarang.
              </p>
            </div>

            <div className="mt-8 text-center">
              <div className="font-script text-4xl text-[#F4B6C2]">
                Selamanya Bersama, S & S
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Galeri Slideshow Sinematik */}
        {activeTab === 'galeri' && (
          <div className="max-w-3xl mx-auto bg-white/70 dark:bg-black/30 rounded-3xl p-6 border border-[#7A1018]/15 shadow-md">
            <div className="text-center mb-6">
              <span className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] block mb-1">
                GALERI POLAROID SINEMATIK
              </span>
              <h3 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                Slideshow Kenangan Kita
              </h3>
            </div>

            {allPhotos.length > 0 ? (
              <div className="space-y-4">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
                  <ManagedImage
                    src={allPhotos[slideshowIdx]}
                    alt="Kenangan Savero & Soffie"
                    className="w-full h-full object-cover transition-all duration-700"
                  />
                  <div className="absolute bottom-3 left-4 text-white text-xs font-sans-clean bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Foto {slideshowIdx + 1} dari {allPhotos.length}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSlideshowIdx((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                    className="px-4 py-2 bg-[#7A1018] text-[#EFE6DA] text-xs font-bold font-sans-clean rounded-xl"
                  >
                    &larr; Sebelumnya
                  </button>
                  <span className="text-xs font-sans-clean text-gray-500">
                    Geser foto momen indah di Semarang
                  </span>
                  <button
                    onClick={() => setSlideshowIdx((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                    className="px-4 py-2 bg-[#7A1018] text-[#EFE6DA] text-xs font-bold font-sans-clean rounded-xl"
                  >
                    Selanjutnya &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-gray-500">Belum ada foto kenangan yang diunggah.</p>
            )}
          </div>
        )}

        {/* Tab 4: Lagu Kita */}
        {activeTab === 'lagu' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-center mb-6">
              <span className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] block mb-1">
                SOUNDTRACK CINTA
              </span>
              <h3 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                Daftar "Lagu Kita"
              </h3>
            </div>

            {songs.map((song) => {
              const isPlaying = playingSongId === song.id;

              return (
                <div
                  key={song.id}
                  className="p-4 rounded-2xl bg-white/70 dark:bg-black/30 border border-[#7A1018]/15 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <ManagedImage
                      src={song.albumArt}
                      alt={song.title}
                      className="w-14 h-14 rounded-xl object-cover shadow-sm"
                    />
                    <div>
                      <h4 className="font-serif-title font-bold text-sm sm:text-base text-[#3B0A0F] dark:text-[#EFE6DA]">
                        {song.title}
                      </h4>
                      <div className="text-xs text-gray-500 font-sans-clean">{song.artist}</div>
                      {song.memoryNote && (
                        <p className="text-[11px] font-editorial italic text-gray-600 dark:text-gray-400 mt-1">
                          "{song.memoryNote}"
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSongPlay(song)}
                    className={`p-3 rounded-full shadow-md transition ${
                      isPlaying
                        ? 'bg-[#7A1018] text-white animate-pulse'
                        : 'bg-white dark:bg-black/40 text-[#7A1018] hover:bg-[#F4B6C2]/30'
                    }`}
                    title={isPlaying ? 'Jeda Lagu' : 'Putar Lagu'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Read Locked Letter */}
        <AnimatePresence>
          {readingLetter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 25 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 25 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="bg-[#EFE6DA] dark:bg-[#250709] max-w-lg w-full rounded-3xl p-8 border border-[#7A1018]/30 shadow-2xl relative my-8"
              >
                <CloseButton onClick={() => setReadingLetter(null)} label="Tutup surat" className="absolute right-4 top-4" />

                <div className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] mb-1">
                  SURAT CINTA • {readingLetter.unlockDate}
                </div>

                <h3 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA] mb-4">
                  {readingLetter.title}
                </h3>

                <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 border border-[#7A1018]/15 font-editorial text-base sm:text-lg leading-relaxed text-[#3B0A0F] dark:text-[#EFE6DA] whitespace-pre-line mb-6">
                  {readingLetter.content}
                </div>

                <div className="flex items-center justify-between border-t border-[#7A1018]/15 pt-3">
                  <span className="text-xs text-gray-500 font-sans-clean">
                    Untuk: <strong>{readingLetter.recipient}</strong>
                  </span>
                  <span className="font-script text-3xl text-[#7A1018] dark:text-[#F4B6C2]">
                    xoxo, {readingLetter.sender}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: Write New Locked Letter */}
        <AnimatePresence>
          {isNewLetterOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 25 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 25 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="bg-[#EFE6DA] dark:bg-[#250709] max-w-md w-full rounded-3xl p-6 border border-[#7A1018]/30 shadow-2xl my-8"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#7A1018]/15 mb-4">
                  <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                    Tulis Surat Terkunci
                  </h3>
                  <CloseButton onClick={() => setIsNewLetterOpen(false)} />
                </div>

                <form onSubmit={handleSaveLetter} className="space-y-3 font-sans-clean text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Dari:</label>
                      <select
                        value={letterForm.sender}
                        onChange={(e) => setLetterForm({ ...letterForm, sender: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                      >
                        <option value="Savero">Savero</option>
                        <option value="Soffie">Soffie</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Untuk:</label>
                      <select
                        value={letterForm.recipient}
                        onChange={(e) => setLetterForm({ ...letterForm, recipient: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                      >
                        <option value="Soffie">Soffie</option>
                        <option value="Savero">Savero</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Judul Surat *</label>
                    <input
                      type="text"
                      required
                      value={letterForm.title}
                      onChange={(e) => setLetterForm({ ...letterForm, title: e.target.value })}
                      placeholder="Contoh: Pesan Rahasia untuk Anniversary"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Buka Kunci Pada Tanggal *</label>
                    <input
                      type="date"
                      required
                      value={letterForm.unlockDate}
                      onChange={(e) => setLetterForm({ ...letterForm, unlockDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Isi Surat Cinta *</label>
                    <textarea
                      rows={5}
                      required
                      value={letterForm.content}
                      onChange={(e) => setLetterForm({ ...letterForm, content: e.target.value })}
                      placeholder="Tuliskan ungkapan hatimu yang paling tulus..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20 text-xs"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-[#7A1018]/15">
                    <button
                      type="button"
                      onClick={() => setIsNewLetterOpen(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#7A1018] text-[#EFE6DA] rounded-xl font-bold hover:bg-[#5e0a11]"
                    >
                      Segel & Kunci Surat
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateLoveNote}
                      className="px-3 py-2 bg-[#7A1018] text-[#EFE6DA] rounded-xl text-[10px] font-bold uppercase tracking-[0.15em]"
                    >
                      Generate AI Love Note
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
