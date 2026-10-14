import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Compass,
  Coffee,
  CheckCircle,
  Plus,
  Shuffle,
  ExternalLink,
  Filter,
  DollarSign,
  Heart,
  Star,
  MapPin,
  CupSoda,
  X
} from 'lucide-react';
import { WishlistPlace, WishlistDrink, PinCategory, AppSettings, MemoryPin } from '../../types';
import { AnimatedMatcha, AnimatedCoffee, HeartRating } from '../common/AnimatedIcons';
import { RealtimeCafeRecommendations } from './RealtimeCafeRecommendations';

interface WishlistSectionProps {
  places: WishlistPlace[];
  drinks: WishlistDrink[];
  pins: MemoryPin[];
  settings: AppSettings;
  onAddPlace: (place: WishlistPlace) => void;
  onMarkPlaceVisited: (place: WishlistPlace) => void;
  onAddDrink: (drink: WishlistDrink) => void;
  onUpdateDrink: (drink: WishlistDrink) => void;
}

export const WishlistSection: React.FC<WishlistSectionProps> = ({
  places,
  drinks,
  pins,
  settings,
  onAddPlace,
  onMarkPlaceVisited,
  onAddDrink,
  onUpdateDrink
}) => {
  const [activeTab, setActiveTab] = useState<'tempat' | 'rekomendasi' | 'minuman' | 'roulette'>('tempat');

  // Roulette State ("Kita Ke Mana?")
  const [rouletteCategory, setRouletteCategory] = useState<string>('all');
  const [rouletteBudget, setRouletteBudget] = useState<string>('all');
  const [rouletteResult, setRouletteResult] = useState<WishlistPlace | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // New Place Modal State
  const [isNewPlaceOpen, setIsNewPlaceOpen] = useState(false);
  const [placeForm, setPlaceForm] = useState<{
    name: string;
    category: PinCategory;
    area: string;
    budgetEstimate: 'murah' | 'sedang' | 'mewah';
    priority: 'tinggi' | 'sedang' | 'rendah';
    requestedBy: 'Savero' | 'Soffie' | 'Berdua';
    notes: string;
    mapUrl: string;
    tags: string;
  }>({
    name: '',
    category: 'kafe',
    area: 'Semarang',
    budgetEstimate: 'sedang',
    priority: 'tinggi',
    requestedBy: 'Berdua',
    notes: '',
    mapUrl: '',
    tags: 'Semarang, Kencan'
  });

  // New Drink Modal State
  const [isNewDrinkOpen, setIsNewDrinkOpen] = useState(false);
  const [drinkForm, setDrinkForm] = useState<{
    name: string;
    type: 'kopi' | 'matcha' | 'non-kopi' | 'alkohol';
    venueName: string;
    price: number;
    forWhom: 'Savero' | 'Soffie' | 'Berdua';
    status: 'ingin_coba' | 'sudah_coba';
    rating: number;
    tastingNotes: string;
  }>({
    name: '',
    type: 'matcha',
    venueName: '',
    price: 35000,
    forWhom: 'Soffie',
    status: 'ingin_coba',
    rating: 5,
    tastingNotes: ''
  });

  // Spin Roulette
  const spinRoulette = () => {
    let pool = places.filter((p) => !p.isVisited);
    if (rouletteCategory !== 'all') pool = pool.filter((p) => p.category === rouletteCategory);
    if (rouletteBudget !== 'all') pool = pool.filter((p) => p.budgetEstimate === rouletteBudget);

    if (pool.length === 0) {
      alert('Tidak ada tempat yang sesuai filter roulette saat ini. Coba ubah filternya!');
      return;
    }

    setIsSpinning(true);
    setRouletteResult(null);

    let count = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pool.length);
      setRouletteResult(pool[randomIdx]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleSavePlace = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlace: WishlistPlace = {
      id: 'wplace-' + Date.now(),
      name: placeForm.name,
      category: placeForm.category,
      area: placeForm.area,
      budgetEstimate: placeForm.budgetEstimate,
      priority: placeForm.priority,
      requestedBy: placeForm.requestedBy,
      notes: placeForm.notes,
      mapUrl: placeForm.mapUrl,
      tags: placeForm.tags.split(',').map((s) => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString().split('T')[0],
      isVisited: false
    };
    onAddPlace(newPlace);
    setIsNewPlaceOpen(false);
  };

  const handleSaveDrink = (e: React.FormEvent) => {
    e.preventDefault();
    const newDrink: WishlistDrink = {
      id: 'wdrink-' + Date.now(),
      name: drinkForm.name,
      type: drinkForm.type,
      venueName: drinkForm.venueName,
      price: Number(drinkForm.price),
      forWhom: drinkForm.forWhom,
      status: drinkForm.status,
      rating: drinkForm.status === 'sudah_coba' ? drinkForm.rating : undefined,
      tastingNotes: drinkForm.tastingNotes,
      createdAt: new Date().toISOString().split('T')[0]
    };
    onAddDrink(newDrink);
    setIsNewDrinkOpen(false);
  };

  // Filtered Drinks
  const visibleDrinks = drinks.filter((d) => {
    if (d.type === 'alkohol' && (!settings.allowAlcoholCategory || settings.isGuestMode)) {
      return false;
    }
    return true;
  });

  // Ranking Soffie Matcha vs Savero Coffee
  const soffieMatchas = visibleDrinks
    .filter((d) => d.type === 'matcha' && d.status === 'sudah_coba')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const saveroCoffees = visibleDrinks
    .filter((d) => d.type === 'kopi' && d.status === 'sudah_coba')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <section id="wishlist-section" className="py-12 px-4 bg-[#EFE6DA] dark:bg-[#1a0507] border-b border-[#7A1018]/15 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>DAFTAR IMPIAN KITA</span>
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
              Wishlist Tempat & Minuman
            </h2>
            <p className="font-editorial italic text-xs sm:text-sm text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 mt-0.5">
              Target destinasi kencan Semarang berikutnya, ranking Matcha Soffie, dan Kopi Savero.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full bg-white/50 dark:bg-black/30 p-1.5 rounded-2xl border border-[#7A1018]/15 text-xs font-sans-clean font-bold scrollbar-none">
            <button
              onClick={() => setActiveTab('tempat')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'tempat' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Wishlist Tempat ({places.length})
            </button>
            <button
              onClick={() => setActiveTab('rekomendasi')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'rekomendasi' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>✨ Kafe Realtime & Baru</span>
            </button>
            <button
              onClick={() => setActiveTab('minuman')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'minuman' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              Ranking Minuman
            </button>
            <button
              onClick={() => setActiveTab('roulette')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1 ${
                activeTab === 'roulette' ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm' : 'text-[#3B0A0F] dark:text-[#EFE6DA]'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Kita Ke Mana?</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Wishlist Tempat */}
        {activeTab === 'tempat' && (
          <div className="space-y-6">
            {/* Realtime Recommendation Teaser Banner */}
            <div
              onClick={() => setActiveTab('rekomendasi')}
              className="cursor-pointer bg-gradient-to-r from-[#7A1018]/10 via-[#F4B6C2]/20 to-[#D9B26F]/20 dark:from-white/5 dark:via-white/10 dark:to-white/5 p-4 rounded-2xl border border-[#7A1018]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:shadow-md transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#7A1018] text-[#EFE6DA] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                  <Sparkles className="w-5 h-5 text-[#D9B26F]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-sans-clean font-bold tracking-wider uppercase bg-[#7A1018] text-white px-2 py-0.5 rounded-md">
                      FITUR BARU
                    </span>
                    <h4 className="font-serif-title font-bold text-sm sm:text-base text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Radar Kafe Realtime & Paling Dekat
                    </h4>
                  </div>
                  <p className="font-editorial text-xs text-[#3B0A0F]/80 dark:text-[#EFE6DA]/80 mt-0.5">
                    Lihat kafe yang buka sekarang, kafe yang akan segera buka, dan jarak live GPS dari posisimu.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center space-x-1 text-xs font-sans-clean font-bold text-[#7A1018] dark:text-[#F4B6C2] group-hover:underline self-end sm:self-auto">
                <span>Buka Radar Kafe</span>
                <span className="text-base">→</span>
              </span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsNewPlaceOpen(true)}
                className="px-4 py-2 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] text-xs font-sans-clean font-bold rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Wishlist Tempat</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {places.map((place) => (
                <div
                  key={place.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    place.isVisited
                      ? 'bg-white/40 dark:bg-black/10 border-gray-300 dark:border-white/5 opacity-70'
                      : 'bg-white/80 dark:bg-black/30 border-[#7A1018]/15 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-sans-clean font-bold tracking-widest uppercase text-[#7A1018] dark:text-[#F4B6C2] bg-[#7A1018]/10 dark:bg-white/10 px-2 py-0.5 rounded-md">
                      {place.category}
                    </span>
                    <span
                      className={`text-[9px] font-sans-clean font-bold uppercase px-2 py-0.5 rounded-full ${
                        place.priority === 'tinggi'
                          ? 'bg-red-100 text-red-800'
                          : place.priority === 'sedang'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      Prioritas {place.priority}
                    </span>
                  </div>

                  <h4 className="font-serif-title font-bold text-lg text-[#3B0A0F] dark:text-[#EFE6DA] mb-1">
                    {place.name}
                  </h4>
                  <div className="text-xs text-gray-500 font-sans-clean mb-3 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-[#7A1018]" />
                    <span>{place.area} • Estimasi: {place.budgetEstimate}</span>
                  </div>

                  <p className="text-xs font-editorial text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                    {place.notes || 'Rencana kencan selanjutnya bersama pasangan.'}
                  </p>

                  <div className="pt-3 border-t border-[#7A1018]/10 flex items-center justify-between text-xs font-sans-clean">
                    <span className="text-[10px] text-gray-500">
                      Diajukan: <strong>{place.requestedBy}</strong>
                    </span>

                    <button
                      onClick={() => onMarkPlaceVisited(place)}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 text-[11px] transition ${
                        place.isVisited
                          ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                          : 'bg-[#BFD8B8] text-[#3B0A0F] hover:bg-[#a9cca1]'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{place.isVisited ? 'Sudah Dikunjungi' : 'Tandai Sudah'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Rekomendasi: Kafe Realtime, Akan Buka, Baru, & Terdekat */}
        {activeTab === 'rekomendasi' && (
          <RealtimeCafeRecommendations
            existingPlaces={places}
            onAddPlace={onAddPlace}
            settings={settings}
          />
        )}

        {/* Tab 2: Ranking Minuman (Matcha Soffie vs Kopi Savero) */}
        {activeTab === 'minuman' && (
          <div className="space-y-8">
            <div className="flex justify-end">
              <button
                onClick={() => setIsNewDrinkOpen(true)}
                className="px-4 py-2 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] text-xs font-sans-clean font-bold rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Minuman Baru</span>
              </button>
            </div>

            {/* Duel Ranking Columns: Soffie Matcha (Green) vs Savero Coffee (Brown) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Soffie's Matcha Leaderboard */}
              <div className="bg-[#BFD8B8]/25 dark:bg-[#BFD8B8]/10 p-6 rounded-3xl border border-[#BFD8B8] shadow-sm">
                <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[#BFD8B8]/40">
                  <div className="w-12 h-12 rounded-2xl bg-[#BFD8B8] flex items-center justify-center shadow-sm">
                    <AnimatedMatcha className="w-6 h-6 text-emerald-800" />
                  </div>
                  <div>
                    <h3 className="font-serif-title text-xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Matcha Terbaik Soffie
                    </h3>
                    <span className="text-[10px] font-sans-clean font-bold tracking-widest uppercase text-emerald-800 dark:text-[#BFD8B8]">
                      KEPERAWATAN UNDIP • MATCHA QUEEN
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {soffieMatchas.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-white/80 dark:bg-black/40 p-3.5 rounded-xl border border-[#BFD8B8]/40 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-[#BFD8B8] text-[#3B0A0F] font-bold text-xs flex items-center justify-center font-serif-title">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-[#3B0A0F] dark:text-[#EFE6DA]">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-gray-500 font-sans-clean flex items-center space-x-1">
                            <MapPin className="w-2.5 h-2.5 text-gray-400" />
                            <span>{item.venueName} • Rp {item.price?.toLocaleString('id-ID')}</span>
                          </span>
                          {item.tastingNotes && (
                            <p className="text-[11px] font-editorial italic text-gray-600 dark:text-gray-300 mt-0.5">
                              "{item.tastingNotes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <HeartRating rating={item.rating || 5} size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Savero's Coffee Leaderboard */}
              <div className="bg-[#C9A58B]/25 dark:bg-[#C9A58B]/10 p-6 rounded-3xl border border-[#C9A58B] shadow-sm">
                <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[#C9A58B]/40">
                  <div className="w-12 h-12 rounded-2xl bg-[#C9A58B] flex items-center justify-center shadow-sm">
                    <AnimatedCoffee className="w-6 h-6 text-amber-950" />
                  </div>
                  <div>
                    <h3 className="font-serif-title text-xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Kopi Terbaik Savero
                    </h3>
                    <span className="text-[10px] font-sans-clean font-bold tracking-widest uppercase text-amber-900 dark:text-[#C9A58B]">
                      HUKUM UNNES • COFFEE CONNOISSEUR
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {saveroCoffees.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-white/80 dark:bg-black/40 p-3.5 rounded-xl border border-[#C9A58B]/40 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-[#C9A58B] text-[#3B0A0F] font-bold text-xs flex items-center justify-center font-serif-title">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-[#3B0A0F] dark:text-[#EFE6DA]">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-gray-500 font-sans-clean flex items-center space-x-1">
                            <MapPin className="w-2.5 h-2.5 text-gray-400" />
                            <span>{item.venueName} • Rp {item.price?.toLocaleString('id-ID')}</span>
                          </span>
                          {item.tastingNotes && (
                            <p className="text-[11px] font-editorial italic text-gray-600 dark:text-gray-300 mt-0.5">
                              "{item.tastingNotes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <HeartRating rating={item.rating || 5} size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Roulette "Kita Ke Mana?" */}
        {activeTab === 'roulette' && (
          <div className="max-w-xl mx-auto bg-white/70 dark:bg-black/30 rounded-3xl p-8 border border-[#7A1018]/15 shadow-lg text-center">
            <span className="text-[10px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] block mb-1">
              BINGUNG MAU KENCAN KE MANA?
            </span>
            <h3 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA] mb-2">
              Roulette "Kita Ke Mana?"
            </h3>
            <p className="font-editorial italic text-xs text-gray-600 dark:text-gray-400 mb-6">
              Biarkan takdir yang memilihkan tempat kencan kejutan dari daftar wishlist kita!
            </p>

            {/* Filter controls */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs font-sans-clean">
              <div>
                <label className="block text-left font-bold mb-1">Filter Kategori</label>
                <select
                  value={rouletteCategory}
                  onChange={(e) => setRouletteCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="kafe">Kafe</option>
                  <option value="restoran">Restoran</option>
                  <option value="rekreasi">Rekreasi</option>
                  <option value="pantai">Pantai</option>
                  <option value="bioskop">Bioskop</option>
                </select>
              </div>

              <div>
                <label className="block text-left font-bold mb-1">Filter Budget</label>
                <select
                  value={rouletteBudget}
                  onChange={(e) => setRouletteBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                >
                  <option value="all">Semua Budget</option>
                  <option value="murah">Murah Meriah</option>
                  <option value="sedang">Standar / Sedang</option>
                  <option value="mewah">Mewah / Spesial</option>
                </select>
              </div>
            </div>

            {/* Result Box */}
            <div className="min-h-36 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#EFE6DA]/60 dark:bg-black/40 border border-[#7A1018]/20 mb-6">
              {rouletteResult ? (
                <div className={`transition-transform ${isSpinning ? 'scale-95 blur-xs' : 'scale-100'}`}>
                  <span className="text-[10px] font-sans-clean font-bold tracking-widest uppercase text-[#7A1018] dark:text-[#F4B6C2]">
                    {rouletteResult.category} • {rouletteResult.area}
                  </span>
                  <h4 className="font-serif-title text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA] my-1">
                    {rouletteResult.name}
                  </h4>
                  <p className="text-xs font-editorial text-gray-700 dark:text-gray-300 italic">
                    "{rouletteResult.notes}"
                  </p>
                </div>
              ) : (
                <div className="text-gray-400 font-sans-clean text-xs">
                  Tekan tombol di bawah untuk memutar roulette kencan!
                </div>
              )}
            </div>

            <button
              onClick={spinRoulette}
              disabled={isSpinning}
              className="px-8 py-3 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] text-xs font-sans-clean font-bold tracking-widest uppercase rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 flex items-center space-x-2 mx-auto"
            >
              <Shuffle className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Memilihkan Takdir...' : 'PUTAR ROULETTE KENCAN'}</span>
            </button>
          </div>
        )}

        {/* Modal: Tambah Wishlist Tempat */}
        <AnimatePresence>
          {isNewPlaceOpen && (
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
                    Tambah Wishlist Tempat
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsNewPlaceOpen(false)}
                    className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-black dark:hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

              <form onSubmit={handleSavePlace} className="space-y-3 font-sans-clean text-xs">
                <div>
                  <label className="block font-bold mb-1">Nama Tempat *</label>
                  <input
                    type="text"
                    required
                    value={placeForm.name}
                    onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                    placeholder="Contoh: Spiegel Bar & Bistro"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kategori</label>
                    <select
                      value={placeForm.category}
                      onChange={(e) => setPlaceForm({ ...placeForm, category: e.target.value as PinCategory })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    >
                      <option value="kafe">Kafe</option>
                      <option value="restoran">Restoran</option>
                      <option value="rekreasi">Rekreasi</option>
                      <option value="pantai">Pantai</option>
                      <option value="bioskop">Bioskop</option>
                      <option value="hotel">Hotel</option>
                      <option value="motel">Motel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Area / Kawasan</label>
                    <input
                      type="text"
                      value={placeForm.area}
                      onChange={(e) => setPlaceForm({ ...placeForm, area: e.target.value })}
                      placeholder="Kota Lama / Banyumanik"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Perkiraan Budget</label>
                    <select
                      value={placeForm.budgetEstimate}
                      onChange={(e) => setPlaceForm({ ...placeForm, budgetEstimate: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    >
                      <option value="murah">Murah Meriah</option>
                      <option value="sedang">Sedang</option>
                      <option value="mewah">Mewah / Spesial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Prioritas</label>
                    <select
                      value={placeForm.priority}
                      onChange={(e) => setPlaceForm({ ...placeForm, priority: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    >
                      <option value="tinggi">Tinggi</option>
                      <option value="sedang">Sedang</option>
                      <option value="rendah">Rendah</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Siapa yang Menginginkan?</label>
                  <select
                    value={placeForm.requestedBy}
                    onChange={(e) => setPlaceForm({ ...placeForm, requestedBy: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  >
                    <option value="Berdua">Berdua ❤️</option>
                    <option value="Savero">Savero</option>
                    <option value="Soffie">Soffie</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Catatan / Rencana Kencan</label>
                  <textarea
                    rows={2}
                    value={placeForm.notes}
                    onChange={(e) => setPlaceForm({ ...placeForm, notes: e.target.value })}
                    placeholder="Mau coba menu apa, waktu terbaik berkunjung..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#7A1018]/15">
                  <button
                    type="button"
                    onClick={() => setIsNewPlaceOpen(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#7A1018] text-[#EFE6DA] rounded-xl font-bold hover:bg-[#5e0a11]"
                  >
                    Simpan Wishlist
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Tambah Minuman */}
      <AnimatePresence>
        {isNewDrinkOpen && (
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
                  Tambah Ulasan Minuman
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewDrinkOpen(false)}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-black dark:hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDrink} className="space-y-3 font-sans-clean text-xs">
                <div>
                  <label className="block font-bold mb-1">Nama Minuman *</label>
                  <input
                    type="text"
                    required
                    value={drinkForm.name}
                    onChange={(e) => setDrinkForm({ ...drinkForm, name: e.target.value })}
                    placeholder="Contoh: Ceremonial Matcha Latte"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kategori Minuman</label>
                    <select
                      value={drinkForm.type}
                      onChange={(e) => setDrinkForm({ ...drinkForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    >
                      <option value="matcha">Matcha (Soffie)</option>
                      <option value="kopi">Kopi (Savero)</option>
                      <option value="non-kopi">Juice / Teh Artisan</option>
                      {settings.allowAlcoholCategory && <option value="alkohol">Cocktail / Spesial</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Nama Tempat / Kafe</label>
                    <input
                      type="text"
                      required
                      value={drinkForm.venueName}
                      onChange={(e) => setDrinkForm({ ...drinkForm, venueName: e.target.value })}
                      placeholder="Kafe Unika, Kofitiere..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      value={drinkForm.price}
                      onChange={(e) => setDrinkForm({ ...drinkForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Untuk Siapa</label>
                    <select
                      value={drinkForm.forWhom}
                      onChange={(e) => setDrinkForm({ ...drinkForm, forWhom: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    >
                      <option value="Soffie">Soffie (Matcha)</option>
                      <option value="Savero">Savero (Kopi)</option>
                      <option value="Berdua">Berdua (Bersama)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Status Cicip</label>
                  <select
                    value={drinkForm.status}
                    onChange={(e) => setDrinkForm({ ...drinkForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  >
                    <option value="sudah_coba">Sudah Coba (Beri Rating)</option>
                    <option value="ingin_coba">Ingin Coba (Wishlist)</option>
                  </select>
                </div>

                {drinkForm.status === 'sudah_coba' && (
                  <div>
                    <label className="block font-bold mb-1">Rating Rasa (1-5 Hati)</label>
                    <HeartRating
                      rating={drinkForm.rating}
                      interactive={true}
                      size={20}
                      onChange={(r) => setDrinkForm({ ...drinkForm, rating: r })}
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1">Catatan Rasa / Tasting Notes</label>
                  <textarea
                    rows={2}
                    value={drinkForm.tastingNotes}
                    onChange={(e) => setDrinkForm({ ...drinkForm, tastingNotes: e.target.value })}
                    placeholder="Creamy, umami kuat, rasa buah, dll..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#7A1018]/15">
                  <button
                    type="button"
                    onClick={() => setIsNewDrinkOpen(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#7A1018] text-[#EFE6DA] rounded-xl font-bold hover:bg-[#5e0a11]"
                  >
                    Simpan Minuman
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
