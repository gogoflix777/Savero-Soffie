import React, { useState, useRef, useEffect } from 'react';
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
  FileText,
  Pencil,
  Trash2
} from 'lucide-react';
import { CloseButton } from '../common/CloseButton';
import { PhotoLibrary } from './PhotoLibrary';
import { CoupleProfile, FavoriteSinger, LockedLetter, LoveSong, MemoryPin, MovieItem, AppSettings } from '../../types';
import { soundManager } from '../../utils/audio';
import { HeartRating } from '../common/AnimatedIcons';
import { supabase } from '../../lib/supabase';
import { getMusicArtistMetadata, getMusicRecordingMetadata, MusicArtistSearchResult, MusicRecordingSearchResult, searchMusicArtists, searchMusicRecordings } from '../../lib/musicBrainz';

interface RomanticExtrasProps {
  letters: LockedLetter[];
  songs: LoveSong[];
  favoriteSingers: FavoriteSinger[];
  favoriteSingersError: string | null;
  favoriteSingersCanEdit: boolean;
  activeProfile: CoupleProfile;
  pins: MemoryPin[];
  movies: MovieItem[];
  settings: AppSettings;
  onAddLetter: (letter: LockedLetter) => void;
  onUpdateLetter: (letter: LockedLetter) => void;
  onDeleteLetter: (letterId: string) => void;
  onAddSong: (song: LoveSong) => void;
  onUpdateSong: (song: LoveSong) => void;
  onDeleteSong: (songId: string) => void;
  onSaveFavoriteSinger: (singer: FavoriteSinger) => Promise<void>;
  onDeleteFavoriteSinger: (profile: CoupleProfile, musicBrainzId: string) => Promise<void>;
  onOpenLetter: (id: string) => void;
}

export const RomanticExtrasSection: React.FC<RomanticExtrasProps> = ({
  letters,
  songs,
  favoriteSingers,
  favoriteSingersError,
  favoriteSingersCanEdit,
  activeProfile,
  pins,
  movies,
  settings,
  onAddLetter,
  onUpdateLetter,
  onDeleteLetter,
  onAddSong,
  onUpdateSong,
  onDeleteSong,
  onSaveFavoriteSinger,
  onDeleteFavoriteSinger,
  onOpenLetter
}) => {
  const [activeTab, setActiveTab] = useState<'surat' | 'onthisday' | 'wrapped' | 'galeri' | 'lagu' | 'penyanyi'>('surat');
  const [selectedFlashbackDate, setSelectedFlashbackDate] = useState<string>('2026-08-26');

  // Audio Playback State
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Selected Letter Modal
  const [readingLetter, setReadingLetter] = useState<LockedLetter | null>(null);
  const [isLetterEditorOpen, setIsLetterEditorOpen] = useState(false);
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [isSongEditorOpen, setIsSongEditorOpen] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

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
  const [isGeneratingLoveNote, setIsGeneratingLoveNote] = useState(false);
  const [loveNoteError, setLoveNoteError] = useState('');
  const [songForm, setSongForm] = useState({
    musicBrainzId: '',
    title: '',
    artist: '',
    albumArt: '',
    releaseTitle: '',
    durationMs: undefined as number | undefined,
    description: '',
    audioUrl: '',
    memoryNote: ''
  });
  const [recordingQuery, setRecordingQuery] = useState('');
  const [recordingResults, setRecordingResults] = useState<MusicRecordingSearchResult[]>([]);
  const [isSearchingRecordings, setIsSearchingRecordings] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [artistQuery, setArtistQuery] = useState('');
  const [artistResults, setArtistResults] = useState<MusicArtistSearchResult[]>([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [favoriteDescription, setFavoriteDescription] = useState('');
  const [favoriteStatus, setFavoriteStatus] = useState('');
  const [editingFavoriteId, setEditingFavoriteId] = useState<string | null>(null);
  const [favoriteEditDescription, setFavoriteEditDescription] = useState('');
  const [favoritePhotoUrl, setFavoritePhotoUrl] = useState('');

  // Slideshow State
  const allPhotos = pins.flatMap((pin) => pin.photos.map((url, index) => ({
    url,
    key: `pin-photo:${pin.id}:${index}`
  }))).filter((photo) => photo.url);
  const [slideshowIdx, setSlideshowIdx] = useState(0);
  const safeSlideshowIdx = allPhotos.length ? slideshowIdx % allPhotos.length : 0;

  useEffect(() => {
    if (!readingLetter && !isLetterEditorOpen && !isSongEditorOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setReadingLetter(null);
      setIsLetterEditorOpen(false);
      setIsSongEditorOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingLetter, isLetterEditorOpen, isSongEditorOpen]);

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
    const letter: LockedLetter = {
      id: editingLetterId ?? 'letter-' + Date.now(),
      sender: letterForm.sender,
      recipient: letterForm.recipient,
      title: letterForm.title,
      content: letterForm.content,
      unlockDate: letterForm.unlockDate,
      isOpened: letters.find((item) => item.id === editingLetterId)?.isOpened ?? false
    };
    if (editingLetterId) onUpdateLetter(letter);
    else onAddLetter(letter);
    setIsLetterEditorOpen(false);
    setEditingLetterId(null);
  };

  const handleEditLetter = (letter: LockedLetter) => {
    setEditingLetterId(letter.id);
    setLoveNoteError('');
    setLetterForm({
      sender: letter.sender,
      recipient: letter.recipient,
      title: letter.title,
      content: letter.content,
      unlockDate: letter.unlockDate
    });
    setIsLetterEditorOpen(true);
  };

  const handleDeleteLetter = (letter: LockedLetter) => {
    if (!window.confirm(`Hapus surat “${letter.title}”?`)) return;
    if (readingLetter?.id === letter.id) setReadingLetter(null);
    onDeleteLetter(letter.id);
  };

  const handleEditSong = (song: LoveSong) => {
    setEditingSongId(song.id);
    setSongForm({
      musicBrainzId: song.musicBrainzId ?? '',
      title: song.title,
      artist: song.artist,
      albumArt: song.albumArt,
      releaseTitle: song.releaseTitle ?? '',
      durationMs: song.durationMs,
      description: song.description ?? '',
      audioUrl: song.audioUrl ?? '',
      memoryNote: song.memoryNote ?? ''
    });
    setRecordingQuery('');
    setRecordingResults([]);
    setIsSongEditorOpen(true);
  };

  const handleSearchRecordings = async () => {
    setIsSearchingRecordings(true);
    setFavoriteStatus('');
    try {
      setRecordingResults(await searchMusicRecordings(recordingQuery));
    } catch (error) {
      setFavoriteStatus(error instanceof Error ? error.message : 'Pencarian lagu gagal.');
      setRecordingResults([]);
    } finally {
      setIsSearchingRecordings(false);
    }
  };

  const handleSelectRecording = async (recording: MusicRecordingSearchResult) => {
    setSelectedRecordingId(recording.id);
    setFavoriteStatus('');
    try {
      const metadata = await getMusicRecordingMetadata(recording.id);
      setSongForm((current) => ({
        ...current,
        musicBrainzId: metadata.id,
        title: metadata.title,
        artist: metadata.artist || recording.artist,
        albumArt: metadata.albumArt ?? '',
        releaseTitle: metadata.releaseTitle ?? '',
        durationMs: metadata.length
      }));
    } catch (error) {
      setFavoriteStatus(error instanceof Error ? error.message : 'Metadata lagu gagal dimuat.');
    } finally {
      setSelectedRecordingId(null);
    }
  };

  const handleSearchArtists = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSearchingArtists(true);
    setFavoriteStatus('');
    try {
      setArtistResults(await searchMusicArtists(artistQuery));
    } catch (error) {
      setFavoriteStatus(error instanceof Error ? error.message : 'Pencarian penyanyi gagal.');
      setArtistResults([]);
    } finally {
      setIsSearchingArtists(false);
    }
  };

  const handleAddFavoriteSinger = async (artist: MusicArtistSearchResult) => {
    setFavoriteStatus(`Memuat profil ${artist.name}…`);
    let photoUrl = artist.photoUrl;
    try {
      const metadata = await getMusicArtistMetadata(artist.id);
      photoUrl = metadata.photoUrl;
    } catch (error) {
      setFavoriteStatus(error instanceof Error ? error.message : 'Foto artis gagal dimuat; artis tetap dapat disimpan.');
    }
    const singer: FavoriteSinger = {
      profile: activeProfile,
      musicBrainzId: artist.id,
      name: artist.name,
      disambiguation: artist.disambiguation,
      country: artist.country,
      artistType: artist.type,
      photoUrl,
      description: favoriteDescription.trim(),
      createdAt: new Date().toISOString()
    };
    try {
      await onSaveFavoriteSinger(singer);
      setFavoriteStatus(`${artist.name} ditambahkan ke daftar ${activeProfile}.${photoUrl ? '' : ' Foto bisa ditambahkan lewat Edit.'}`);
      setArtistResults((current) => current.filter((item) => item.id !== artist.id));
    } catch (error) {
      setFavoriteStatus(error instanceof Error ? error.message : 'Penyanyi favorit gagal disimpan.');
    }
  };

  const handleSaveFavoriteDetails = async (singer: FavoriteSinger) => {
    try {
      await onSaveFavoriteSinger({
        ...singer,
        description: favoriteEditDescription.trim(),
        photoUrl: favoritePhotoUrl.trim() || undefined
      });
      setEditingFavoriteId(null);
      setFavoriteStatus('Profil penyanyi diperbarui.');
    } catch (error) {
      setFavoriteStatus(error instanceof Error ? error.message : 'Profil penyanyi gagal disimpan.');
    }
  };

  const handleRemoveFavoriteSinger = async (singer: FavoriteSinger) => {
    if (!window.confirm(`Hapus ${singer.name} dari favorit ${singer.profile}?`)) return;
    try {
      await onDeleteFavoriteSinger(singer.profile, singer.musicBrainzId);
      setFavoriteStatus(`${singer.name} dihapus dari favorit.`);
    } catch (error) {
      setFavoriteStatus(error instanceof Error ? error.message : 'Penyanyi favorit gagal dihapus.');
    }
  };

  const handleSaveSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSongId === playingSongId) {
      audioRef.current?.pause();
      setPlayingSongId(null);
    }
    const song: LoveSong = {
      id: editingSongId ?? 'song-' + Date.now(),
      musicBrainzId: songForm.musicBrainzId || undefined,
      title: songForm.title.trim(),
      artist: songForm.artist.trim(),
      albumArt: songForm.albumArt.trim(),
      releaseTitle: songForm.releaseTitle.trim() || undefined,
      durationMs: songForm.durationMs,
      description: songForm.description.trim() || undefined,
      spotifyUri: songs.find((item) => item.id === editingSongId)?.spotifyUri,
      audioUrl: songForm.audioUrl.trim() || undefined,
      memoryNote: songForm.memoryNote.trim() || undefined
    };
    if (editingSongId) onUpdateSong(song);
    else onAddSong(song);
    setIsSongEditorOpen(false);
    setEditingSongId(null);
    setSongForm({ musicBrainzId: '', title: '', artist: '', albumArt: '', releaseTitle: '', durationMs: undefined, description: '', audioUrl: '', memoryNote: '' });
  };

  const handleDeleteSong = (song: LoveSong) => {
    if (!window.confirm(`Hapus “${song.title}” dari Lagu Kita?`)) return;
    if (playingSongId === song.id) {
      audioRef.current?.pause();
      setPlayingSongId(null);
    }
    onDeleteSong(song.id);
  };

  const handleGenerateLoveNote = async () => {
    if (!supabase) {
      setLoveNoteError('Supabase belum dikonfigurasi. Surat AI tidak dapat dibuat.');
      return;
    }
    if (!letterForm.title.trim()) {
      setLoveNoteError('Isi judul surat terlebih dahulu.');
      return;
    }
    setIsGeneratingLoveNote(true);
    setLoveNoteError('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-love-note', {
        body: {
          title: letterForm.title,
          sender: letterForm.sender,
          recipient: letterForm.recipient
        }
      });
      if (error) throw error;
      const text = typeof data?.text === 'string' ? data.text : '';
      if (!text) throw new Error('Gemini tidak mengembalikan isi surat.');
      setLetterForm((prev) => ({ ...prev, content: text.trim() }));
    } catch (error) {
      console.error('Gemini note generation failed:', error);
      setLoveNoteError(error instanceof Error ? error.message : 'Surat AI gagal dibuat. Coba lagi.');
    } finally {
      setIsGeneratingLoveNote(false);
    }
  };

  return (
    <section id="romantis-section" className="romantic-section bg-[#fffaf0] px-3 py-6 transition-colors dark:bg-[#21151a] sm:px-5 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Hidden Audio element for "Lagu Kita" */}
        <audio ref={audioRef} onEnded={() => setPlayingSongId(null)} />

        {/* Section Header with Chibi */}
        <div className="mb-5 flex flex-col gap-4 sm:mb-7">
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center space-x-2 text-[11px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>RUANG ROMANTIS & NOSTALGIA</span>
              </div>
              <h2 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA] sm:text-4xl">
                Ruang Romantis
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#5c2432] dark:text-rose-200 sm:text-sm">
                Surat, kenangan, foto, dan lagu kita—pilih yang ingin dibuka.
              </p>
            </div>
            <div className="shrink-0">
              <img
                src="/characters/berdua/Chibi Couple Hug.webp"
                alt="Chibi Couple Hug"
                className="h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          </div>

          <nav aria-label="Bagian ruang romantis" className="romantic-tab-nav grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-[#7A1018]/15 bg-white/55 p-1.5 text-[11px] font-sans-clean font-bold dark:bg-black/25 sm:flex sm:w-auto sm:flex-wrap sm:justify-start">
            <button
              type="button"
              aria-pressed={activeTab === 'surat'}
              onClick={() => setActiveTab('surat')}
              className={`min-h-10 rounded-xl px-3 py-2 transition ${
                activeTab === 'surat' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] hover:bg-rose-100/70 dark:text-[#EFE6DA] dark:hover:bg-white/5'
              }`}
            >
              Surat <span className="opacity-75">({letters.length})</span>
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'onthisday'}
              onClick={() => setActiveTab('onthisday')}
              className={`min-h-10 rounded-xl px-3 py-2 transition ${
                activeTab === 'onthisday' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] hover:bg-rose-100/70 dark:text-[#EFE6DA] dark:hover:bg-white/5'
              }`}
            >
              Kilas balik
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'wrapped'}
              onClick={() => setActiveTab('wrapped')}
              className={`min-h-10 rounded-xl px-3 py-2 transition ${
                activeTab === 'wrapped' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] hover:bg-rose-100/70 dark:text-[#EFE6DA] dark:hover:bg-white/5'
              }`}
            >
              Wrapped
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'galeri'}
              onClick={() => setActiveTab('galeri')}
              className={`min-h-10 rounded-xl px-3 py-2 transition ${
                activeTab === 'galeri' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] hover:bg-rose-100/70 dark:text-[#EFE6DA] dark:hover:bg-white/5'
              }`}
            >
              Galeri foto
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'lagu'}
              onClick={() => setActiveTab('lagu')}
              className={`min-h-10 rounded-xl px-3 py-2 transition ${
                activeTab === 'lagu' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] hover:bg-rose-100/70 dark:text-[#EFE6DA] dark:hover:bg-white/5'
              }`}
            >
              Lagu <span className="opacity-75">({songs.length})</span>
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'penyanyi'}
              onClick={() => setActiveTab('penyanyi')}
              className={`min-h-10 rounded-xl px-3 py-2 transition ${
                activeTab === 'penyanyi' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] hover:bg-rose-100/70 dark:text-[#EFE6DA] dark:hover:bg-white/5'
              }`}
            >
              Penyanyi favorit
            </button>
          </nav>
        </div>

        {/* Tab 1: Surat Terkunci (Time-locked Letters) */}
        {activeTab === 'surat' && (
          <div className="space-y-6">
            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <span className="text-xs text-gray-600 font-sans-clean dark:text-rose-100/65">
                Surat yang disegel tidak dapat dibuka hingga tanggal yang telah ditentukan.
              </span>
              <button
                onClick={() => {
                  setEditingLetterId(null);
                  setLoveNoteError('');
                  setLetterForm({
                    sender: 'Savero',
                    recipient: 'Soffie',
                    title: '',
                    content: '',
                    unlockDate: new Date().toISOString().slice(0, 10)
                  });
                  setIsLetterEditorOpen(true);
                }}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#7A1018] px-4 py-2 text-xs font-sans-clean font-bold text-[#EFE6DA] shadow transition hover:bg-[#5e0a11] sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tulis Surat Terkunci</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {letters.map((letter) => {
                const today = new Date().toISOString().split('T')[0];
                const isReady = letter.unlockDate <= today || letter.isOpened;

                return (
                  <article
                    key={letter.id}
                    className="romantic-surface content-auto-card flex flex-col rounded-3xl border border-[#7A1018]/20 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:shadow-xl dark:bg-black/30 sm:p-5"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenLetter(letter)}
                      className="group min-h-0 rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1018]"
                    >
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
                    </button>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#7A1018]/10 pt-3 text-xs font-sans-clean">
                      <span className="font-script text-xl text-[#7A1018] dark:text-[#F4B6C2]">
                        xoxo, {letter.sender}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditLetter(letter)}
                          aria-label={`Edit surat ${letter.title}`}
                          className="grid h-10 w-10 place-items-center rounded-xl text-[#7A1018] transition hover:bg-rose-100/70 dark:text-rose-100 dark:hover:bg-white/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLetter(letter)}
                          aria-label={`Hapus surat ${letter.title}`}
                          className="grid h-10 w-10 place-items-center rounded-xl text-[#7A1018] transition hover:bg-rose-100/70 dark:text-rose-100 dark:hover:bg-white/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <span className="hidden items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#7A1018] dark:text-[#F4B6C2] sm:flex">
                          {isReady ? <span>BACA SURAT →</span> : <><Lock className="h-3 w-3 text-gray-500" /><span>TERKUNCI</span></>}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
              {letters.length === 0 && <p className="rounded-2xl border border-dashed border-[#7A1018]/20 bg-white/50 p-6 text-center text-xs text-[#80646a] dark:bg-black/15 dark:text-rose-100/65 sm:col-span-2 lg:col-span-3">Belum ada surat. Tulis surat pertama untuk disimpan sebagai kenangan.</p>}
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
              <p className="font-editorial italic text-xs sm:text-sm text-[#5c2432] dark:text-rose-200">
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
          <div className="wrapped-panel max-w-4xl mx-auto rounded-3xl p-5 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="wrapped-glow absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-8 sm:mb-10 relative">
              <span className="wrapped-eyebrow text-[10px] font-sans-clean font-bold tracking-[0.3em] uppercase block mb-2">
                KILAS BALIK TAHUNAN
              </span>
              <h3 className="wrapped-title font-serif-title text-3xl sm:text-5xl font-bold mb-3">
                Savero & Soffie Wrapped
              </h3>
              <p className="wrapped-subtitle font-editorial text-sm sm:text-base">
                Merekam jejak langkah dan momen terbaik dua hati sepanjang tahun 2026 di Semarang.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 relative">
              <div className="wrapped-stat-card rounded-2xl p-3 sm:p-4 text-center">
                <span className="wrapped-stat-value text-3xl font-serif-title font-bold block">
                  {pins.length}
                </span>
                <span className="wrapped-stat-label text-[10px] font-sans-clean font-bold tracking-wider uppercase">
                  Sudut Kota Dikunjungi
                </span>
              </div>
              <div className="wrapped-stat-card rounded-2xl p-3 sm:p-4 text-center">
                <span className="wrapped-stat-value text-3xl font-serif-title font-bold block">
                  {movies.filter((m) => m.status === 'together').length}
                </span>
                <span className="wrapped-stat-label text-[10px] font-sans-clean font-bold tracking-wider uppercase">
                  Film Ditonton Berdua
                </span>
              </div>
              <div className="wrapped-stat-card rounded-2xl p-3 sm:p-4 text-center">
                <span className="wrapped-stat-value text-3xl font-serif-title font-bold block">
                  {tasteScore}%
                </span>
                <span className="wrapped-stat-label text-[10px] font-sans-clean font-bold tracking-wider uppercase">
                  Skor Selera Film
                </span>
              </div>
              <div className="wrapped-stat-card rounded-2xl p-3 sm:p-4 text-center">
                <span className="wrapped-stat-value text-3xl font-serif-title font-bold block">
                  100%
                </span>
                <span className="wrapped-stat-label text-[10px] font-sans-clean font-bold tracking-wider uppercase">
                  Ketulusan Cinta
                </span>
              </div>
            </div>

            <div className="wrapped-story rounded-2xl p-5 sm:p-7 space-y-3 font-editorial text-base sm:text-lg leading-relaxed relative">
              <h4 className="wrapped-story-title font-serif-title font-bold text-xl mb-2">
                Catatan Manis Tahun 2026:
              </h4>
              <p className="wrapped-story-copy">
                Dari obrolan pertama di riuhnya Mie Gacoan hingga menembus fajar jam 05.38 pagi di jalan baru Jangli–Undip, tahun ini penuh dengan keberanian untuk saling mencintai dan menjaga.
              </p>
              <p className="wrapped-story-copy">
                Savero dengan cangkir kopi dan palu hukumnya, Soffie dengan stetoskop dan segelas iced matchanya. Bersama, kita membuktikan bahwa dua dunia yang berbeda bisa menyatu dalam irama paling indah di Kota Semarang.
              </p>
            </div>

            <div className="mt-7 sm:mt-8 text-center relative">
              <div className="wrapped-signoff font-script text-3xl sm:text-4xl">
                Selamanya Bersama, S & S
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Galeri Slideshow Sinematik */}
        {activeTab === 'galeri' && (
          <div className="mx-auto max-w-4xl space-y-5 rounded-3xl border border-[#7A1018]/15 bg-white/65 p-3 shadow-sm dark:bg-black/25 sm:space-y-6 sm:p-5">
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
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black shadow-2xl sm:aspect-video">
                  <ManagedImage
                    src={allPhotos[safeSlideshowIdx].url}
                    photoKey={allPhotos[safeSlideshowIdx].key}
                    alt="Kenangan Savero & Soffie"
                    className="w-full h-full object-cover transition-all duration-700"
                  />
                  <div className="absolute bottom-3 left-4 text-white text-xs font-sans-clean bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Foto {safeSlideshowIdx + 1} dari {allPhotos.length}
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <button
                    onClick={() => setSlideshowIdx((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                    className="min-h-11 rounded-xl bg-[#7A1018] px-3 py-2 text-xs font-bold font-sans-clean text-[#EFE6DA]"
                  >
                    <span className="sm:hidden">← Kembali</span><span className="hidden sm:inline">← Sebelumnya</span>
                  </button>
                  <span className="px-1 text-center text-[10px] text-[#80646a] dark:text-rose-100/65 sm:text-xs">{safeSlideshowIdx + 1} / {allPhotos.length}</span>
                  <button
                    onClick={() => setSlideshowIdx((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                    className="min-h-11 rounded-xl bg-[#7A1018] px-3 py-2 text-xs font-bold font-sans-clean text-[#EFE6DA]"
                  >
                    <span className="sm:hidden">Lanjut →</span><span className="hidden sm:inline">Selanjutnya →</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl bg-rose-50/70 p-5 text-center text-xs text-[#80646a] dark:bg-white/5 dark:text-rose-100/65">Belum ada foto kenangan. Tambahkan foto lewat galeri di bawah.</p>
            )}
            <div className="border-t border-[#7A1018]/10 pt-5 dark:border-white/10">
              <PhotoLibrary />
            </div>
          </div>
        )}

        {/* Tab 4: Lagu Kita */}
        {activeTab === 'lagu' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] block mb-1">
                  SOUNDTRACK CINTA
                </span>
                <h3 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                  Daftar Lagu Kita
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingSongId(null);
                  setSongForm({ musicBrainzId: '', title: '', artist: '', albumArt: '', releaseTitle: '', durationMs: undefined, description: '', audioUrl: '', memoryNote: '' });
                  setRecordingQuery('');
                  setRecordingResults([]);
                  setIsSongEditorOpen(true);
                }}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7A1018] px-4 py-2 text-xs font-bold text-[#EFE6DA] sm:w-auto"
              >
                <Plus className="h-4 w-4" /> Tambah lagu
              </button>
            </div>

            {songs.map((song) => {
              const isPlaying = playingSongId === song.id;

              return (
                <article
                  key={song.id}
                  className="romantic-surface content-auto-card flex min-w-0 items-center gap-3 rounded-2xl border border-[#7A1018]/15 bg-white/70 p-3 shadow-sm dark:bg-black/30 sm:gap-4 sm:p-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    {song.albumArt ? (
                      <ManagedImage
                        src={song.albumArt}
                        alt={song.title}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm sm:h-16 sm:w-16"
                      />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-rose-100 text-[#7A1018] dark:bg-white/10 dark:text-rose-100 sm:h-16 sm:w-16">
                        <Music className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="break-words font-serif-title font-bold text-sm text-[#3B0A0F] dark:text-[#EFE6DA] sm:text-base">
                        {song.title}
                      </h4>
                      <div className="break-words text-xs text-gray-500 font-sans-clean">{song.artist}</div>
                      {song.releaseTitle && <div className="break-words text-[11px] text-gray-500 font-sans-clean">{song.releaseTitle}</div>}
                      {song.durationMs && (
                        <div className="text-[10px] text-gray-500 font-sans-clean">
                          {Math.floor(song.durationMs / 60000)}:{String(Math.floor((song.durationMs % 60000) / 1000)).padStart(2, '0')}
                        </div>
                      )}
                      {song.description && (
                        <p className="mt-1 line-clamp-2 break-words text-xs text-[#57202c] dark:text-rose-50">{song.description}</p>
                      )}
                      {song.memoryNote && (
                        <p className="mt-1 line-clamp-2 break-words text-[11px] font-editorial italic text-gray-600 dark:text-gray-400">
                          "{song.memoryNote}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSongPlay(song)}
                      disabled={!song.audioUrl}
                      className={`grid h-11 w-11 place-items-center rounded-full shadow-md transition ${
                      isPlaying
                        ? 'animate-pulse bg-[#7A1018] text-white'
                        : 'bg-white text-[#7A1018] hover:bg-[#F4B6C2]/30 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-black/40'
                      }`}
                      title={isPlaying ? 'Jeda Lagu' : song.audioUrl ? 'Putar Lagu' : 'Tambahkan tautan audio untuk memutar'}
                      aria-label={isPlaying ? `Jeda ${song.title}` : `Putar ${song.title}`}
                    >
                      {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditSong(song)}
                      className="grid h-10 w-10 place-items-center rounded-xl text-[#7A1018] hover:bg-rose-100/70 dark:text-rose-100 dark:hover:bg-white/10"
                      aria-label={`Edit lagu ${song.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSong(song)}
                      className="grid h-10 w-10 place-items-center rounded-xl text-[#7A1018] hover:bg-rose-100/70 dark:text-rose-100 dark:hover:bg-white/10"
                      aria-label={`Hapus lagu ${song.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
            {songs.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[#7A1018]/20 bg-white/50 p-6 text-center text-sm text-[#80646a] dark:bg-black/15 dark:text-rose-100/65">
                Belum ada lagu. Tambahkan soundtrack kenangan kalian.
              </p>
            )}
          </div>
        )}

        {activeTab === 'penyanyi' && (
          <div className="mx-auto max-w-3xl space-y-5">
            <header>
              <span className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2]">
                FAVORIT KITA
              </span>
              <h3 className="mt-1 font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                Penyanyi favorit
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                Cari artis di MusicBrainz. Favorit Savero dan Soffie akan terlihat oleh kedua profil.
              </p>
            </header>

            {favoriteSingersError && (
              <p role="alert" className="rounded-xl border border-rose-300/50 bg-rose-50 p-3 text-xs text-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                {favoriteSingersError} Jalankan migration `202610170009_music_library.sql` untuk mengaktifkan sinkronisasi.
              </p>
            )}
            {!favoriteSingersCanEdit && (
              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                Hubungkan Supabase, jalankan migration musik, lalu masuk dengan akun pasangan untuk mengelola favorit.
              </p>
            )}

            <form onSubmit={handleSearchArtists} className="space-y-3 rounded-2xl border border-[#7A1018]/15 bg-white/70 p-4 shadow-sm dark:bg-black/25">
              <label className="block text-xs font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                Cari penyanyi atau grup
                <div className="mt-1 flex gap-2">
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={artistQuery}
                    onChange={(event) => setArtistQuery(event.target.value)}
                    placeholder="Contoh: NIKI"
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-sm font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                  />
                  <button type="submit" disabled={isSearchingArtists || !favoriteSingersCanEdit} className="min-h-11 shrink-0 rounded-xl bg-[#7A1018] px-4 text-xs font-bold text-[#EFE6DA] disabled:opacity-50">
                    {isSearchingArtists ? 'Mencari…' : 'Cari'}
                  </button>
                </div>
              </label>
              <label className="block text-xs font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                Deskripsi favorit (opsional)
                <textarea
                  rows={2}
                  value={favoriteDescription}
                  onChange={(event) => setFavoriteDescription(event.target.value)}
                  placeholder="Alasan atau cerita kenapa penyanyi ini jadi favorit…"
                  className="mt-1 w-full resize-y rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-sm font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                />
              </label>
            </form>

            {artistResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Pilih hasil pencarian</p>
                {artistResults.map((artist) => {
                  const alreadyAdded = favoriteSingers.some((item) =>
                    item.profile === activeProfile && item.musicBrainzId === artist.id
                  );
                  return (
                    <div key={artist.id} className="romantic-surface flex min-w-0 items-center justify-between gap-3 rounded-2xl border p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-rose-100 text-[#7A1018] dark:bg-white/10 dark:text-rose-100">
                          <Music className="h-5 w-5" />
                          {artist.photoUrl && <img src={artist.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                        </div>
                        <div className="min-w-0">
                          <p className="break-words text-sm font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">{artist.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {[artist.type, artist.country, artist.disambiguation].filter(Boolean).join(' • ') || 'Artis MusikBrainz'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={alreadyAdded || !favoriteSingersCanEdit}
                        onClick={() => void handleAddFavoriteSinger(artist)}
                        className="min-h-10 shrink-0 rounded-xl bg-[#7A1018] px-3 text-xs font-bold text-[#EFE6DA] disabled:opacity-50"
                      >
                        {alreadyAdded ? 'Sudah ada' : `Tambah ${activeProfile}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {(['Savero', 'Soffie'] as const).map((profile) => {
              const profileSingers = favoriteSingers.filter((singer) => singer.profile === profile);
              return (
                <section key={profile} className="space-y-2">
                  <h4 className="text-sm font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">{`Favorit ${profile}`}</h4>
                  {profileSingers.map((singer) => {
                    const isEditing = editingFavoriteId === `${profile}:${singer.musicBrainzId}`;
                    const canEdit = favoriteSingersCanEdit && profile === activeProfile;
                    return (
                      <article key={singer.musicBrainzId} className="romantic-surface rounded-2xl border p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-rose-100 text-[#7A1018] dark:bg-white/10 dark:text-rose-100">
                            <Music className="h-6 w-6" />
                            {singer.photoUrl && (
                              <img
                                src={singer.photoUrl}
                                alt={`Foto ${singer.name}`}
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h5 className="break-words font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">{singer.name}</h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {[singer.artistType, singer.country, singer.disambiguation].filter(Boolean).join(' • ')}
                                </p>
                              </div>
                              {canEdit && (
                                <div className="flex shrink-0 gap-1">
                                  <button
                                    type="button"
                                    aria-label={`Edit profil ${singer.name}`}
                                    onClick={() => {
                                      setEditingFavoriteId(`${profile}:${singer.musicBrainzId}`);
                                      setFavoriteEditDescription(singer.description);
                                      setFavoritePhotoUrl(singer.photoUrl ?? '');
                                    }}
                                    className="grid h-10 w-10 place-items-center rounded-xl text-[#7A1018] hover:bg-rose-100/70 dark:text-rose-100 dark:hover:bg-white/10"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Hapus ${singer.name} dari favorit`}
                                    onClick={() => void handleRemoveFavoriteSinger(singer)}
                                    className="grid h-10 w-10 place-items-center rounded-xl text-[#7A1018] hover:bg-rose-100/70 dark:text-rose-100 dark:hover:bg-white/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="mt-3 space-y-2">
                                <label className="block text-xs font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                                  URL foto
                                  <input
                                    type="url"
                                    value={favoritePhotoUrl}
                                    onChange={(event) => setFavoritePhotoUrl(event.target.value)}
                                    placeholder="https://… (opsional)"
                                    className="mt-1 min-h-10 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                                  />
                                </label>
                                <label className="block text-xs font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                                  Deskripsi favorit
                                  <textarea
                                    rows={2}
                                    value={favoriteEditDescription}
                                    onChange={(event) => setFavoriteEditDescription(event.target.value)}
                                    placeholder="Deskripsi favorit…"
                                    className="mt-1 w-full resize-y rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                                  />
                                </label>
                                <div className="flex justify-end gap-2">
                                  <button type="button" onClick={() => setEditingFavoriteId(null)} className="min-h-10 rounded-xl bg-gray-200 px-3 text-xs font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-100">Batal</button>
                                  <button type="button" onClick={() => void handleSaveFavoriteDetails(singer)} className="min-h-10 rounded-xl bg-[#7A1018] px-3 text-xs font-bold text-[#EFE6DA]">Simpan</button>
                                </div>
                              </div>
                            ) : singer.description ? (
                              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#57202c] dark:text-rose-50">{singer.description}</p>
                            ) : (
                              <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">Belum ada deskripsi.</p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {profileSingers.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-[#7A1018]/20 p-4 text-center text-xs text-gray-600 dark:text-gray-400">
                      Belum ada penyanyi favorit untuk {profile}.
                    </p>
                  )}
                </section>
              );
            })}
            {favoriteStatus && <p role="status" aria-live="polite" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-[#7A1018] dark:bg-white/5 dark:text-rose-100">{favoriteStatus}</p>}
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
              className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/65 p-0 backdrop-blur-md sm:items-center sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 25 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 25 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="romantic-dialog relative my-0 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[#7A1018]/30 bg-[#fffaf0] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[#57202c] shadow-2xl dark:bg-[#250709] dark:text-rose-50 sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-7"
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
          {isLetterEditorOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 25 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 25 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="romantic-dialog my-0 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-[#7A1018]/30 bg-[#fffaf0] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[#57202c] shadow-2xl dark:bg-[#250709] dark:text-rose-50 sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#7A1018]/15 mb-4">
                  <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                    {editingLetterId ? 'Edit surat' : 'Tulis surat'}
                  </h3>
                  <CloseButton onClick={() => setIsLetterEditorOpen(false)} />
                </div>

                <form onSubmit={handleSaveLetter} className="space-y-3 font-sans-clean text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Dari:</label>
                      <select
                        value={letterForm.sender}
                        onChange={(e) => setLetterForm({ ...letterForm, sender: e.target.value as 'Savero' | 'Soffie' })}
                        className="min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-[#57202c] dark:bg-black/30 dark:text-rose-50 dark:[color-scheme:dark]"
                      >
                        <option value="Savero">Savero</option>
                        <option value="Soffie">Soffie</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Untuk:</label>
                      <select
                        value={letterForm.recipient}
                        onChange={(e) => setLetterForm({ ...letterForm, recipient: e.target.value as 'Savero' | 'Soffie' })}
                        className="min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-[#57202c] dark:bg-black/30 dark:text-rose-50 dark:[color-scheme:dark]"
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
                      className="min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-[#57202c] placeholder:text-[#b9949a] dark:bg-black/30 dark:text-rose-50 dark:placeholder:text-rose-100/40 dark:[color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Buka Kunci Pada Tanggal *</label>
                    <input
                      type="date"
                      required
                      value={letterForm.unlockDate}
                      onChange={(e) => setLetterForm({ ...letterForm, unlockDate: e.target.value })}
                      className="min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-[#57202c] dark:bg-black/30 dark:text-rose-50 dark:[color-scheme:dark]"
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
                      className="w-full resize-y rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-xs text-[#57202c] placeholder:text-[#b9949a] dark:bg-black/30 dark:text-rose-50 dark:placeholder:text-rose-100/40"
                    />
                  </div>

                  {loveNoteError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-200">{loveNoteError}</p>}
                  <div className="flex flex-wrap justify-end gap-2 border-t border-[#7A1018]/15 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsLetterEditorOpen(false)}
                      className="min-h-10 flex-1 rounded-xl bg-gray-200 px-3 py-2 font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-100 sm:flex-none"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="min-h-10 flex-1 rounded-xl bg-[#7A1018] px-3 py-2 font-bold text-[#EFE6DA] hover:bg-[#5e0a11] sm:flex-none"
                    >
                      {editingLetterId ? 'Simpan perubahan' : 'Segel & Kunci Surat'}
                    </button>
                    <button
                      type="button"
                      disabled={isGeneratingLoveNote}
                      onClick={() => void handleGenerateLoveNote()}
                      className="min-h-10 w-full rounded-xl border border-[#7A1018]/25 bg-white/65 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7A1018] disabled:opacity-60 dark:bg-white/5 dark:text-rose-100 sm:w-auto"
                    >
                      {isGeneratingLoveNote ? 'Membuat surat…' : 'Generate AI Love Note'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSongEditorOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="romantic-dialog my-0 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-[#7A1018]/20 bg-[#fffaf0] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[#57202c] shadow-2xl dark:bg-[#250709] dark:text-rose-50 sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between border-b border-[#7A1018]/15 pb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A1018] dark:text-[#F4B6C2]">Soundtrack cinta</p>
                    <h3 className="mt-1 font-serif-title text-xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                      {editingSongId ? 'Edit lagu' : 'Tambah lagu'}
                    </h3>
                  </div>
                  <CloseButton onClick={() => setIsSongEditorOpen(false)} label="Tutup editor lagu" />
                </div>
                <form onSubmit={handleSaveSong} className="space-y-3 font-sans-clean text-xs">
                  <div className="rounded-2xl border border-[#7A1018]/15 bg-white/60 p-3 dark:bg-black/20">
                    <label className="block font-bold">
                      Cari lagu di MusicBrainz
                      <div className="mt-1 flex gap-2">
                        <input
                          value={recordingQuery}
                          onChange={(event) => setRecordingQuery(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void handleSearchRecordings();
                            }
                          }}
                          minLength={2}
                          maxLength={120}
                          placeholder="Judul lagu atau penyanyi"
                          aria-label="Cari lagu atau penyanyi di MusicBrainz"
                          className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                        />
                        <button
                          type="button"
                          disabled={isSearchingRecordings || recordingQuery.trim().length < 2}
                          onClick={() => void handleSearchRecordings()}
                          className="min-h-11 shrink-0 rounded-xl bg-[#7A1018] px-3 font-bold text-[#EFE6DA] disabled:opacity-50"
                        >
                          {isSearchingRecordings ? 'Mencari…' : 'Cari'}
                        </button>
                      </div>
                    </label>
                    {recordingResults.length > 0 && (
                      <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                        {recordingResults.map((recording) => (
                          <button
                            key={recording.id}
                            type="button"
                            disabled={selectedRecordingId !== null}
                            onClick={() => void handleSelectRecording(recording)}
                            className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left hover:bg-rose-100/70 disabled:opacity-60 dark:hover:bg-white/10"
                          >
                            <span className="min-w-0">
                              <span className="block break-words font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">{recording.title}</span>
                              <span className="block break-words text-[11px] text-gray-600 dark:text-gray-400">{recording.artist}</span>
                            </span>
                            <span className="shrink-0 text-[10px] text-[#7A1018] dark:text-rose-100">
                              {selectedRecordingId === recording.id ? 'Memuat…' : 'Pilih'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!recordingResults.length && !isSearchingRecordings && recordingQuery.length >= 2 && (
                      <p className="mt-2 text-[11px] text-gray-600 dark:text-gray-400">Cari untuk menampilkan hasil.</p>
                    )}
                    {favoriteStatus && <p role="status" className="mt-2 text-[11px] text-rose-700 dark:text-rose-200">{favoriteStatus}</p>}
                    <p className="mt-2 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                      Memilih hasil mengisi judul, artis, album, durasi, dan sampul yang tersedia. Metadata musik dari MusicBrainz.
                    </p>
                  </div>
                  <label className="block font-bold">
                    Judul lagu
                    <input
                      required
                      value={songForm.title}
                      onChange={(event) => setSongForm({ ...songForm, title: event.target.value })}
                      placeholder="Contoh: Lagu kenangan kita"
                      className="mt-1 min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                    />
                  </label>
                  <label className="block font-bold">
                    Penyanyi
                    <input
                      required
                      value={songForm.artist}
                      onChange={(event) => setSongForm({ ...songForm, artist: event.target.value })}
                      placeholder="Nama penyanyi"
                      className="mt-1 min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                    />
                  </label>
                  <label className="block font-bold">
                    Album
                    <input
                      value={songForm.releaseTitle}
                      onChange={(event) => setSongForm({ ...songForm, releaseTitle: event.target.value })}
                      placeholder="Nama album (opsional)"
                      className="mt-1 min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                    />
                  </label>
                  <label className="block font-bold">
                    Deskripsi lagu <span className="font-normal text-gray-500">(opsional)</span>
                    <textarea
                      rows={3}
                      value={songForm.description}
                      onChange={(event) => setSongForm({ ...songForm, description: event.target.value })}
                      placeholder="Ceritakan arti lagu ini atau kenapa lagu ini spesial…"
                      className="mt-1 w-full resize-y rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                    />
                  </label>
                  <label className="block font-bold">
                    Tautan sampul khusus <span className="font-normal text-gray-500">(opsional)</span>
                    <input
                      type="url"
                      value={songForm.albumArt}
                      onChange={(event) => setSongForm({ ...songForm, albumArt: event.target.value })}
                      placeholder="Otomatis dari Cover Art Archive bila tersedia"
                      className="mt-1 min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                    />
                  </label>
                  <label className="block font-bold">
                    Tautan audio <span className="font-normal text-gray-500">(opsional)</span>
                    <input
                      type="url"
                      value={songForm.audioUrl}
                      onChange={(event) => setSongForm({ ...songForm, audioUrl: event.target.value })}
                      placeholder="https://…"
                      className="mt-1 min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                    />
                  </label>
                  <label className="block font-bold">
                    Catatan kenangan <span className="font-normal text-gray-500">(opsional)</span>
                    <textarea
                      rows={3}
                      value={songForm.memoryNote}
                      onChange={(event) => setSongForm({ ...songForm, memoryNote: event.target.value })}
                      placeholder="Cerita di balik lagu ini…"
                      className="mt-1 w-full resize-y rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 font-normal text-[#57202c] dark:bg-black/30 dark:text-rose-50"
                    />
                  </label>
                  <div className="flex gap-2 border-t border-[#7A1018]/15 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsSongEditorOpen(false)}
                      className="min-h-11 flex-1 rounded-xl bg-gray-200 px-3 py-2 font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="min-h-11 flex-1 rounded-xl bg-[#7A1018] px-3 py-2 font-bold text-[#EFE6DA]"
                    >
                      Simpan lagu
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
