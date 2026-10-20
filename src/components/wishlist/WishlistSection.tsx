import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Compass,
  CheckCircle,
  Plus,
  Pencil,
  Shuffle,
  ExternalLink,
  MapPin,
  Trash2,
  Search,
  X,
  RotateCcw,
  ListFilter
} from 'lucide-react';
import { CloseButton } from '../common/CloseButton';
import { WishlistPlace, WishlistDrink, PinCategory, AppSettings, MemoryPin } from '../../types';
import { AnimatedMatcha, AnimatedCoffee, HeartRating } from '../common/AnimatedIcons';
import { RealtimePlacesHub } from '../home/RealtimePlacesHub';
import { soundManager } from '../../utils/audio';

interface WishlistSectionProps {
  places: WishlistPlace[];
  drinks: WishlistDrink[];
  pins: MemoryPin[];
  settings: AppSettings;
  activeProfile: 'Savero' | 'Soffie';
  onAddPlace: (place: WishlistPlace) => void;
  onUpdatePlace: (place: WishlistPlace) => void;
  onDeletePlace?: (placeId: string) => void;
  onMarkPlaceVisited: (place: WishlistPlace) => void;
  onAddDrink: (drink: WishlistDrink) => void;
  onUpdateDrink: (drink: WishlistDrink) => void;
}

export const WishlistSection: React.FC<WishlistSectionProps> = ({
  places,
  drinks,
  settings,
  activeProfile,
  onAddPlace,
  onUpdatePlace,
  onDeletePlace,
  onMarkPlaceVisited,
  onAddDrink,
  onUpdateDrink
}) => {
  const [activeTab, setActiveTab] = useState<'tempat' | 'rekomendasi' | 'minuman' | 'roulette'>('tempat');

  // Filter & Sort State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'budget_asc' | 'budget_desc' | 'name_asc'>('newest');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unvisited' | 'visited'>('all');
  const [filterCreator, setFilterCreator] = useState<'all' | 'Soffie' | 'Savero' | 'Berdua'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    places.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [places]);

  const filteredPlaces = useMemo(() => {
    const result = places.filter((p) => {
      if (filterStatus === 'unvisited' && p.isVisited) return false;
      if (filterStatus === 'visited' && !p.isVisited) return false;
      if (filterCreator !== 'all' && p.requestedBy !== filterCreator) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchArea = p.area.toLowerCase().includes(q);
        const matchNotes = p.notes ? p.notes.toLowerCase().includes(q) : false;
        if (!matchName && !matchArea && !matchNotes) return false;
      }
      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'priority') {
        const weight: Record<string, number> = { tinggi: 3, sedang: 2, rendah: 1 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      if (sortBy === 'budget_asc') {
        const weight: Record<string, number> = { murah: 1, rendah: 1, sedang: 2, mewah: 3, tinggi: 3 };
        return (weight[a.budgetEstimate] || 2) - (weight[b.budgetEstimate] || 2);
      }
      if (sortBy === 'budget_desc') {
        const weight: Record<string, number> = { murah: 1, rendah: 1, sedang: 2, mewah: 3, tinggi: 3 };
        return (weight[b.budgetEstimate] || 2) - (weight[a.budgetEstimate] || 2);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name, 'id');
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [places, filterStatus, filterCreator, filterCategory, filterSearch, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterCreator !== 'all') count++;
    if (filterCategory !== 'all') count++;
    if (filterSearch.trim() !== '') count++;
    if (sortBy !== 'newest') count++;
    return count;
  }, [filterStatus, filterCreator, filterCategory, filterSearch, sortBy]);

  const isFilterActive = activeFilterCount > 0;

  const unvisitedCount = useMemo(() => places.filter((p) => !p.isVisited).length, [places]);
  const visitedCount = useMemo(() => places.filter((p) => p.isVisited).length, [places]);

  // Roulette State
  const [rouletteCategory, setRouletteCategory] = useState<string>('all');
  const [rouletteBudget, setRouletteBudget] = useState<string>('all');
  const [rouletteResult, setRouletteResult] = useState<WishlistPlace | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Place Modal & Delete State
  const [isNewPlaceOpen, setIsNewPlaceOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<WishlistPlace | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<WishlistPlace | null>(null);
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
    requestedBy: activeProfile,
    notes: '',
    mapUrl: '',
    tags: 'Semarang, Kencan'
  });

  // Drink Modal State
  const [isNewDrinkOpen, setIsNewDrinkOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<WishlistDrink | null>(null);
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

  const spinRoulette = () => {
    soundManager.playTap();
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
        soundManager.playSuccess();
      }
    }, 95);
  };

  const handleSavePlace = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlace: WishlistPlace = {
      id: editingPlace?.id ?? 'wplace-' + Date.now(),
      name: placeForm.name.trim(),
      category: placeForm.category,
      area: placeForm.area.trim(),
      budgetEstimate: placeForm.budgetEstimate,
      priority: placeForm.priority,
      requestedBy: placeForm.requestedBy || activeProfile,
      notes: placeForm.notes.trim() || undefined,
      mapUrl: placeForm.mapUrl.trim() || undefined,
      tags: placeForm.tags ? placeForm.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      createdAt: editingPlace?.createdAt ?? new Date().toISOString().split('T')[0],
      isVisited: editingPlace?.isVisited ?? false
    };
    if (editingPlace) onUpdatePlace(newPlace);
    else onAddPlace(newPlace);
    soundManager.playSuccess();
    setEditingPlace(null);
    setIsNewPlaceOpen(false);
  };

  const openPlaceEditor = (place: WishlistPlace) => {
    soundManager.playTap();
    setEditingPlace(place);
    setPlaceForm({
      name: place.name,
      category: place.category,
      area: place.area,
      budgetEstimate: place.budgetEstimate,
      priority: place.priority,
      requestedBy: place.requestedBy,
      notes: place.notes ?? '',
      mapUrl: place.mapUrl ?? '',
      tags: Array.isArray(place.tags) ? place.tags.join(', ') : ''
    });
    setIsNewPlaceOpen(true);
  };

  const handleSaveDrink = (e: React.FormEvent) => {
    e.preventDefault();
    const newDrink: WishlistDrink = {
      ...editingDrink,
      id: editingDrink?.id ?? 'wdrink-' + Date.now(),
      name: drinkForm.name,
      type: drinkForm.type,
      venueName: drinkForm.venueName,
      addedBy: activeProfile,
      price: Number(drinkForm.price),
      forWhom: drinkForm.forWhom,
      status: drinkForm.status,
      rating: drinkForm.status === 'sudah_coba' ? drinkForm.rating : undefined,
      tastingNotes: drinkForm.tastingNotes,
      createdAt: editingDrink?.createdAt ?? new Date().toISOString().split('T')[0]
    };
    if (editingDrink) onUpdateDrink(newDrink);
    else onAddDrink(newDrink);
    soundManager.playSuccess();
    setEditingDrink(null);
    setIsNewDrinkOpen(false);
  };

  const openDrinkEditor = (drink: WishlistDrink) => {
    soundManager.playTap();
    setEditingDrink(drink);
    setDrinkForm({
      name: drink.name,
      type: drink.type,
      venueName: drink.venueName,
      price: drink.price ?? 0,
      forWhom: drink.forWhom,
      status: drink.status,
      rating: drink.rating ?? 5,
      tastingNotes: drink.tastingNotes ?? ''
    });
    setIsNewDrinkOpen(true);
  };

  const visibleDrinks = drinks.filter((d) => {
    if (d.type === 'alkohol' && settings.isGuestMode) return false;
    return true;
  });

  const soffieMatchas = visibleDrinks
    .filter((d) => d.type === 'matcha' && d.status === 'sudah_coba')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const saveroCoffees = visibleDrinks
    .filter((d) => d.type === 'kopi' && d.status === 'sudah_coba')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'restoran': return { icon: '🍽️', label: 'Restoran' };
      case 'kafe': return { icon: '☕', label: 'Kafe' };
      case 'bioskop': return { icon: '🎬', label: 'Bioskop' };
      case 'rekreasi': return { icon: '🎡', label: 'Rekreasi' };
      case 'hotel':
      case 'motel': return { icon: '🏨', label: 'Hotel' };
      case 'pantai': return { icon: '🌊', label: 'Pantai' };
      case 'gunung': return { icon: '⛰️', label: 'Gunung' };
      case 'taman': return { icon: '🌳', label: 'Taman' };
      case 'rumah': return { icon: '🏠', label: 'Rumah' };
      case 'kos': return { icon: '🏡', label: 'Kos' };
      case 'jalan': return { icon: '🚗', label: 'Jalan' };
      default: return { icon: '📍', label: cat };
    }
  };

  const getBudgetSymbol = (budget?: string) => {
    if (budget === 'murah' || budget === 'rendah') return '$';
    if (budget === 'sedang') return '$$';
    if (budget === 'mewah' || budget === 'tinggi') return '$$$';
    return '$$';
  };

  const renderPriorityLamp = (priority: string) => {
    if (priority === 'tinggi') {
      return (
        <span
          className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0"
          title="Prioritas: Tinggi"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.95)]" />
        </span>
      );
    }
    if (priority === 'sedang') {
      return (
        <span
          className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0"
          title="Prioritas: Sedang"
        >
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.95)]" />
        </span>
      );
    }
    return (
      <span
        className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0"
        title="Prioritas: Rendah"
      >
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.95)]" />
      </span>
    );
  };

  return (
    <section
      id="wishlist-section"
      className="min-h-[70vh] bg-[#fffaf0] px-3.5 py-4 transition-colors dark:bg-[#21151a] sm:px-5 sm:py-7"
    >
      <div className="mx-auto max-w-5xl">
        {/* HEADER WITH CHIBI BERDUA & NAVIGATION DOCK */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-1.5 text-[9.5px] font-black tracking-[0.16em] uppercase text-[#b84661] dark:text-rose-300">
                <Compass className="h-3 w-3" />
                <span>RENCANA KENCAN</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[#4a1623] dark:text-rose-50">
                Wishlist Kita
              </h2>
              <p className="mt-0.5 max-w-md text-[11px] sm:text-xs leading-relaxed text-[#5c2432] dark:text-rose-200">
                Daftar tempat impian, kuliner, dan agenda jalan-jalan berdua.
              </p>

              {/* Action buttons */}
              <div className="mt-2.5 flex items-center gap-2">
                {activeTab === 'tempat' && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setEditingPlace(null);
                      setPlaceForm((f) => ({ ...f, name: '', notes: '', mapUrl: '', requestedBy: activeProfile }));
                      setIsNewPlaceOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] px-3.5 py-1 text-[10.5px] font-extrabold text-white shadow-2xs transition active:scale-95"
                  >
                    <Plus className="h-3 w-3 stroke-[2.75]" />
                    <span>Tambah Tempat</span>
                  </button>
                )}
                {activeTab === 'minuman' && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setEditingDrink(null);
                      setDrinkForm((f) => ({
                        ...f,
                        name: '',
                        venueName: '',
                        tastingNotes: '',
                        forWhom: activeProfile,
                        type: activeProfile === 'Savero' ? 'kopi' : 'matcha'
                      }));
                      setIsNewDrinkOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] px-3.5 py-1 text-[10.5px] font-extrabold text-white shadow-2xs transition active:scale-95"
                  >
                    <Plus className="h-3 w-3 stroke-[2.75]" />
                    <span>Tambah Minuman</span>
                  </button>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <img
                src="/characters/berdua/Rushed Travel Prep Chaos.webp" loading="lazy" decoding="async"
                alt="Rushed Travel Prep Chaos"
                className="h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Compact Cute Segmented Tab Bar */}
          <div className="clay-pill-dock-3d grid grid-cols-4 gap-1 rounded-full p-1">
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setActiveTab('tempat');
              }}
              className={`flex items-center justify-center gap-1 rounded-full py-1 px-1.5 text-[10.5px] font-extrabold transition-all ${
                activeTab === 'tempat'
                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-xs'
                  : 'text-[#753546] hover:text-[#4a1623] dark:text-rose-200/80'
              }`}
            >
              <span className="truncate">Tempat</span>
              <span className="text-[9px] opacity-80">({places.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setActiveTab('rekomendasi');
              }}
              className={`flex items-center justify-center gap-1 rounded-full py-1 px-1.5 text-[10.5px] font-extrabold transition-all ${
                activeTab === 'rekomendasi'
                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-xs'
                  : 'text-[#753546] hover:text-[#4a1623] dark:text-rose-200/80'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="truncate">Eksplor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setActiveTab('minuman');
              }}
              className={`flex items-center justify-center gap-1 rounded-full py-1 px-1.5 text-[10.5px] font-extrabold transition-all ${
                activeTab === 'minuman'
                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-xs'
                  : 'text-[#753546] hover:text-[#4a1623] dark:text-rose-200/80'
              }`}
            >
              <span className="truncate">Minuman</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setActiveTab('roulette');
              }}
              className={`flex items-center justify-center gap-1 rounded-full py-1 px-1.5 text-[10.5px] font-extrabold transition-all ${
                activeTab === 'roulette'
                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-xs'
                  : 'text-[#753546] hover:text-[#4a1623] dark:text-rose-200/80'
              }`}
            >
              <Shuffle className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">Acak</span>
            </button>
          </div>
        </div>

        {/* TAB 1: WISHLIST TEMPAT */}
        {activeTab === 'tempat' && (
          <div className="space-y-3">
            {/* COMPACT CONTROLS BAR: COUNT, SEARCH & LISTFILTER ICON */}
            <div className="relative flex items-center justify-between gap-2 px-1 py-0.5">
              {/* Left: Place Count & Active Filter Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#57202c] dark:text-rose-100">
                  {filteredPlaces.length} Tempat
                </span>

                {isFilterActive && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setFilterStatus('all');
                      setFilterCreator('all');
                      setFilterCategory('all');
                      setFilterSearch('');
                      setSortBy('newest');
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[9.5px] font-extrabold text-rose-600 dark:bg-rose-400/15 dark:text-rose-300 hover:bg-rose-500/20 transition active:scale-95"
                    title="Klik untuk reset semua filter"
                  >
                    <span>{activeFilterCount} filter aktif</span>
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>

              {/* Right: Search Input & ListFilter Button */}
              <div className="flex items-center gap-1.5">
                {/* Compact Search Input */}
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-rose-400" />
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Cari tempat..."
                    className="h-8 w-28 sm:w-44 rounded-full border border-rose-200/60 bg-white/90 py-1 pl-7 pr-6 text-[10.5px] font-bold text-[#4a1623] placeholder-rose-300 outline-none focus:border-rose-400 dark:border-white/10 dark:bg-[#200508]/80 dark:text-rose-100 dark:placeholder-rose-400/50 transition-all focus:w-36 sm:focus:w-52"
                  />
                  {filterSearch && (
                    <button
                      type="button"
                      onClick={() => setFilterSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>

                {/* THE LISTFILTER ICON BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setIsFilterOpen(!isFilterOpen);
                  }}
                  title="Filter & Urutkan"
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
                    isFilterOpen || isFilterActive
                      ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs'
                      : 'border border-rose-200/60 bg-white/90 text-[#7a3444] hover:bg-rose-100/60 shadow-2xs dark:border-white/10 dark:bg-[#200508]/80 dark:text-rose-200'
                  }`}
                >
                  <ListFilter className="h-4 w-4 stroke-[2.25]" />
                  {activeFilterCount > 0 && !isFilterOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8.5px] font-black text-white shadow-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* POPUP / POPOVER CARD: FILTER & SORT */}
              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
                      onClick={() => setIsFilterOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.16 }}
                      className="clay-card-3d absolute right-0 top-10 z-50 w-[310px] sm:w-[360px] rounded-2xl p-3.5 shadow-xl border border-rose-200/60 dark:border-white/10 dark:bg-[#1f070f] space-y-3"
                    >
                      {/* Popover Header */}
                      <div className="flex items-center justify-between border-b border-rose-200/40 pb-2 dark:border-white/10">
                        <div className="flex items-center gap-1.5 text-xs font-black text-[#57202c] dark:text-rose-100">
                          <ListFilter className="h-3.5 w-3.5 text-rose-500" />
                          <span>Filter & Urutkan</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isFilterActive && (
                            <button
                              type="button"
                              onClick={() => {
                                soundManager.playTap();
                                setFilterStatus('all');
                                setFilterCreator('all');
                                setFilterCategory('all');
                                setFilterSearch('');
                                setSortBy('newest');
                              }}
                              className="text-[9.5px] font-extrabold text-rose-500 hover:text-rose-600 underline dark:text-rose-300"
                            >
                              Reset
                            </button>
                          )}
                          <CloseButton onClick={() => setIsFilterOpen(false)} />
                        </div>
                      </div>

                      {/* 1. Sort Options */}
                      <div>
                        <span className="mb-1 block text-[9.5px] font-black uppercase tracking-wider text-[#9c4c60] dark:text-rose-300/80">
                          Urutkan Berdasarkan
                        </span>
                        <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
                          {[
                            { id: 'newest', label: '🕒 Terbaru' },
                            { id: 'priority', label: '🔥 Prioritas Tertinggi' },
                            { id: 'budget_asc', label: '💲 Budget Terendah' },
                            { id: 'budget_desc', label: '💎 Budget Tertinggi' },
                            { id: 'name_asc', label: '🔤 Nama (A - Z)' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                soundManager.playTap();
                                setSortBy(item.id as any);
                              }}
                              className={`rounded-xl py-1 px-2 text-left transition active:scale-95 ${
                                sortBy === item.id
                                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs font-extrabold'
                                  : 'bg-rose-50/80 text-[#7a3444] hover:bg-rose-100/70 dark:bg-white/5 dark:text-rose-200'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Status Kunjungan */}
                      <div>
                        <span className="mb-1 block text-[9.5px] font-black uppercase tracking-wider text-[#9c4c60] dark:text-rose-300/80">
                          Status Kunjungan
                        </span>
                        <div className="flex items-center gap-1">
                          {[
                            { id: 'all', label: `Semua (${places.length})` },
                            { id: 'unvisited', label: `Belum (${unvisitedCount})` },
                            { id: 'visited', label: `Sudah (${visitedCount})` }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                soundManager.playTap();
                                setFilterStatus(item.id as any);
                              }}
                              className={`flex-1 rounded-xl py-1 text-center text-[10px] font-extrabold transition active:scale-95 ${
                                filterStatus === item.id
                                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs'
                                  : 'bg-rose-50/80 text-[#7a3444] hover:bg-rose-100/70 dark:bg-white/5 dark:text-rose-200'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Pengusul (Chibi Avatars) */}
                      <div>
                        <span className="mb-1 block text-[9.5px] font-black uppercase tracking-wider text-[#9c4c60] dark:text-rose-300/80">
                          Pengusul Rencana
                        </span>
                        <div className="grid grid-cols-4 gap-1 text-[9.5px] font-extrabold">
                          {[
                            { id: 'all', label: 'Semua' },
                            { id: 'Soffie', label: 'Soffie', img: '/characters/expressions/soffie/gemas-sayang.webp' },
                            { id: 'Savero', label: 'Savero', img: '/characters/expressions/savero/bahagia.webp' },
                            { id: 'Berdua', label: 'Berdua' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                soundManager.playTap();
                                setFilterCreator(item.id as any);
                              }}
                              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 px-1 transition active:scale-95 ${
                                filterCreator === item.id
                                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs'
                                  : 'bg-rose-50/80 text-[#7a3444] hover:bg-rose-100/70 dark:bg-white/5 dark:text-rose-200'
                              }`}
                            >
                              {item.id === 'all' && <span className="text-sm">👥</span>}
                              {item.id === 'Soffie' && (
                                <img
                                  src="/characters/expressions/soffie/gemas-sayang.webp"
                                  alt="Soffie"
                                  className="h-5 w-5 rounded-full object-cover object-top scale-125"
                                />
                              )}
                              {item.id === 'Savero' && (
                                <img
                                  src="/characters/expressions/savero/bahagia.webp"
                                  alt="Savero"
                                  className="h-5 w-5 rounded-full object-cover object-top scale-125"
                                />
                              )}
                              {item.id === 'Berdua' && (
                                <div className="flex items-center -space-x-1.5">
                                  <img
                                    src="/characters/expressions/savero/bahagia.webp"
                                    alt=""
                                    className="h-5 w-5 rounded-full object-cover object-top scale-125"
                                  />
                                  <img
                                    src="/characters/expressions/soffie/gemas-sayang.webp"
                                    alt=""
                                    className="h-5 w-5 rounded-full object-cover object-top scale-125"
                                  />
                                </div>
                              )}
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4. Kategori */}
                      <div>
                        <span className="mb-1 block text-[9.5px] font-black uppercase tracking-wider text-[#9c4c60] dark:text-rose-300/80">
                          Kategori
                        </span>
                        <div className="flex flex-wrap gap-1 text-[9.5px] font-extrabold">
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playTap();
                              setFilterCategory('all');
                            }}
                            className={`rounded-lg py-1 px-2 transition active:scale-95 ${
                              filterCategory === 'all'
                                ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs'
                                : 'bg-rose-50/80 text-[#7a3444] hover:bg-rose-100/70 dark:bg-white/5 dark:text-rose-200'
                            }`}
                          >
                            Semua
                          </button>
                          {availableCategories.map((cat) => {
                            const meta = getCategoryMeta(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  soundManager.playTap();
                                  setFilterCategory(filterCategory === cat ? 'all' : cat);
                                }}
                                className={`inline-flex items-center gap-1 rounded-lg py-1 px-2 transition active:scale-95 ${
                                  filterCategory === cat
                                    ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs'
                                    : 'bg-rose-50/80 text-[#7a3444] hover:bg-rose-100/70 dark:bg-white/5 dark:text-rose-200'
                                }`}
                              >
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selesai Button */}
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playPop();
                          setIsFilterOpen(false);
                        }}
                        className="w-full rounded-xl bg-gradient-to-r from-[#FF5C77] to-[#d9386a] py-2 text-center text-xs font-black text-white shadow-xs transition active:scale-95"
                      >
                        Terapkan Filter
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {filteredPlaces.length === 0 ? (
              <div className="clay-card-3d rounded-2xl px-5 py-8 text-center">
                <Sparkles className="mx-auto mb-2 h-6 w-6 text-rose-400" />
                <h3 className="text-xs font-black text-[#57202c] dark:text-rose-50">
                  {places.length === 0 ? 'Wishlist masih kosong' : 'Tidak ada tempat yang cocok'}
                </h3>
                <p className="mt-0.5 text-[11px] text-[#8c4f60] dark:text-rose-200/75">
                  {places.length === 0
                    ? 'Simpan kafe, penginapan, atau tempat yang ingin kalian kunjungi bersama.'
                    : 'Coba ubah filter atau kata kunci pencarian Anda.'}
                </p>
                {places.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setFilterStatus('all');
                      setFilterCreator('all');
                      setFilterCategory('all');
                      setFilterSearch('');
                    }}
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF5C77] to-[#d9386a] px-3.5 py-1 text-[10.5px] font-extrabold text-white shadow-2xs"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlaces.map((place) => {
                  const catMeta = getCategoryMeta(place.category);

                  return (
                    <div
                      key={place.id}
                      className={`group content-auto-card relative flex flex-col justify-between rounded-2xl border border-rose-200/50 bg-white/90 p-3 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-[#200508]/90 ${
                        place.isVisited ? 'opacity-65' : ''
                      }`}
                    >
                      <div>
                        {/* Top Meta & Actions Bar */}
                        <div className="mb-1.5 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-[#9c2848] dark:bg-rose-400/15 dark:text-rose-200">
                              <span>{catMeta.icon}</span>
                              <span>{catMeta.label}</span>
                            </span>

                            {/* Priority Glowing Lamp */}
                            {renderPriorityLamp(place.priority)}
                          </div>

                          <div className="flex items-center gap-0.5">
                            {place.mapUrl && (
                              <a
                                href={place.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-100/60 hover:text-rose-600 active:scale-90 dark:text-rose-300 dark:hover:bg-white/10 transition"
                                title="Buka Google Maps"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => openPlaceEditor(place)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-[#7a3444] hover:bg-rose-100/60 hover:text-[#4a1623] active:scale-90 dark:text-rose-200 dark:hover:bg-white/10 transition"
                              title="Ubah detail"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            {onDeletePlace && (
                              <button
                                type="button"
                                onClick={() => setPlaceToDelete(place)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-100/60 hover:text-rose-600 active:scale-90 dark:text-rose-300 dark:hover:bg-white/10 transition"
                                title="Hapus"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Place Name & Location */}
                        <h4 className="text-[13.5px] sm:text-sm font-black tracking-tight text-[#43252d] dark:text-rose-50 line-clamp-1">
                          {place.name}
                        </h4>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-[#8c4f60] dark:text-rose-200/80">
                          <MapPin className="h-2.5 w-2.5 shrink-0 text-rose-500 dark:text-rose-400" />
                          <span className="truncate">{place.area}</span>
                          <span className="text-rose-300 dark:text-rose-700 font-bold">•</span>
                          <span
                            className="font-mono font-black tracking-wider text-emerald-600 dark:text-emerald-400 text-[11px]"
                            title={
                              place.budgetEstimate === 'murah'
                                ? 'Budget Rendah ($)'
                                : place.budgetEstimate === 'mewah'
                                ? 'Budget Tinggi ($$$)'
                                : 'Budget Sedang ($$)'
                            }
                          >
                            {getBudgetSymbol(place.budgetEstimate)}
                          </span>
                        </div>

                        {/* Cute Compact Notes Quote */}
                        {place.notes && (
                          <div className="mt-1.5 flex items-start gap-1 rounded-xl border border-rose-200/35 bg-rose-50/70 px-2 py-1 text-[10.5px] leading-snug text-[#5c2432] dark:border-white/5 dark:bg-white/[0.04] dark:text-rose-100/90">
                            <span className="shrink-0 text-[11px] leading-none select-none">💬</span>
                            <p className="line-clamp-2 italic font-medium">{place.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Footer Row */}
                      <div className="mt-2.5 flex items-center justify-between border-t border-rose-200/30 pt-1.5 dark:border-white/5">
                        {/* Penanda Pengusul: Chibi Avatar */}
                        <div className="flex items-center">
                          {place.requestedBy === 'Berdua' ? (
                            <div className="flex items-center -space-x-1.5" title="Diinginkan Berdua (Savero & Soffie)">
                              <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-amber-50 shadow-xs dark:border-[#200508] dark:bg-amber-950/40">
                                <img
                                  src="/characters/expressions/savero/bahagia.webp"
                                  alt="Savero"
                                  className="h-full w-full object-cover object-top scale-125"
                                />
                              </div>
                              <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-rose-50 shadow-xs dark:border-[#200508] dark:bg-rose-950/40">
                                <img
                                  src="/characters/expressions/soffie/gemas-sayang.webp"
                                  alt="Soffie"
                                  className="h-full w-full object-cover object-top scale-125"
                                />
                              </div>
                            </div>
                          ) : place.requestedBy === 'Savero' ? (
                            <div className="flex items-center" title="Diinginkan Savero">
                              <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-emerald-50 shadow-xs dark:border-[#200508] dark:bg-emerald-950/40">
                                <img
                                  src="/characters/expressions/savero/bahagia.webp"
                                  alt="Savero"
                                  className="h-full w-full object-cover object-top scale-125"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center" title="Diinginkan Soffie">
                              <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-rose-50 shadow-xs dark:border-[#200508] dark:bg-rose-950/40">
                                <img
                                  src="/characters/expressions/soffie/gemas-sayang.webp"
                                  alt="Soffie"
                                  className="h-full w-full object-cover object-top scale-125"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playPop();
                            onMarkPlaceVisited(place);
                          }}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold transition active:scale-95 ${
                            place.isVisited
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                              : 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          <CheckCircle className="h-2.5 w-2.5" />
                          <span>{place.isVisited ? 'Sudah Dikunjungi' : 'Tandai Sudah'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EKSPLOR KAFE & PENGINAPAN REALTIME */}
        {activeTab === 'rekomendasi' && (
          <RealtimePlacesHub
            existingPlaces={places}
            onAddPlace={onAddPlace}
            settings={settings}
          />
        )}

        {/* TAB 3: RANKING MINUMAN (Theme-Safe 3D Clay Duel Columns) */}
        {activeTab === 'minuman' && (
          <div className="space-y-4">
            <div className="hidden sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setEditingDrink(null);
                  setDrinkForm((form) => ({
                    ...form,
                    name: '',
                    venueName: '',
                    tastingNotes: '',
                    forWhom: activeProfile,
                    type: activeProfile === 'Savero' ? 'kopi' : 'matcha'
                  }));
                  setIsNewDrinkOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/40 bg-gradient-to-b from-[#ff6b98] to-[#d9386a] px-4 py-2 text-xs font-extrabold text-white shadow-md transition hover:-translate-y-0.5 active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Tambah Minuman Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Soffie's Matcha Leaderboard */}
              <div className="clay-card-3d rounded-[2rem] p-4">
                <div className="mb-3 flex items-center gap-2.5 border-b border-rose-200/45 pb-2.5 dark:border-rose-200/10">
                  <div className="clay-subcard-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
                    <AnimatedMatcha className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#4a1623] dark:text-rose-50">
                      Matcha Terbaik Soffie
                    </h3>
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#9c4c60] dark:text-rose-300/80">
                      KEPERAWATAN UNDIP • MATCHA QUEEN
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {soffieMatchas.map((item, idx) => (
                    <div
                      key={item.id}
                      className="clay-subcard-3d flex items-center justify-between gap-2 rounded-2xl p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ff7aa2] to-[#e11d48] text-[10px] font-black text-white shadow-2xs">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-extrabold text-[#4a1623] dark:text-rose-50">
                            {item.name}
                          </h4>
                          <span className="flex items-center gap-1 truncate text-[10px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                            <MapPin className="h-2.5 w-2.5 shrink-0 text-rose-500 dark:text-rose-300" />
                            <span className="truncate">
                              {item.venueName} • Rp {item.price?.toLocaleString('id-ID')}
                            </span>
                          </span>
                          {item.tastingNotes && (
                            <p className="mt-0.5 line-clamp-1 text-[10px] italic text-[#6b3140] dark:text-rose-200/75">
                              "{item.tastingNotes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <HeartRating rating={item.rating || 5} size={11} />
                        <button
                          type="button"
                          onClick={() => openDrinkEditor(item)}
                          className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[9px] font-extrabold text-[#7a3444] transition hover:bg-rose-500/25 dark:bg-rose-400/15 dark:text-rose-200"
                        >
                          <Pencil className="h-2.5 w-2.5" /> Ubah
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Savero's Coffee Leaderboard */}
              <div className="clay-card-3d rounded-[2rem] p-4">
                <div className="mb-3 flex items-center gap-2.5 border-b border-rose-200/45 pb-2.5 dark:border-rose-200/10">
                  <div className="clay-subcard-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
                    <AnimatedCoffee className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#4a1623] dark:text-rose-50">
                      Kopi Terbaik Savero
                    </h3>
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#9c4c60] dark:text-rose-300/80">
                      HUKUM UNNES • COFFEE CONNOISSEUR
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {saveroCoffees.map((item, idx) => (
                    <div
                      key={item.id}
                      className="clay-subcard-3d flex items-center justify-between gap-2 rounded-2xl p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ff7aa2] to-[#e11d48] text-[10px] font-black text-white shadow-2xs">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-extrabold text-[#4a1623] dark:text-rose-50">
                            {item.name}
                          </h4>
                          <span className="flex items-center gap-1 truncate text-[10px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                            <MapPin className="h-2.5 w-2.5 shrink-0 text-rose-500 dark:text-rose-300" />
                            <span className="truncate">
                              {item.venueName} • Rp {item.price?.toLocaleString('id-ID')}
                            </span>
                          </span>
                          {item.tastingNotes && (
                            <p className="mt-0.5 line-clamp-1 text-[10px] italic text-[#6b3140] dark:text-rose-200/75">
                              "{item.tastingNotes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <HeartRating rating={item.rating || 5} size={11} />
                        <button
                          type="button"
                          onClick={() => openDrinkEditor(item)}
                          className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[9px] font-extrabold text-[#7a3444] transition hover:bg-rose-500/25 dark:bg-rose-400/15 dark:text-rose-200"
                        >
                          <Pencil className="h-2.5 w-2.5" /> Ubah
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ROULETTE "KITA KE MANA?" (Theme-Safe 3D Clay Machine) */}
        {activeTab === 'roulette' && (
          <div className="clay-card-3d mx-auto max-w-md rounded-[2.2rem] p-5 text-center">
            <span className="block text-[9.5px] font-black tracking-[0.2em] uppercase text-rose-500 dark:text-rose-300">
              BINGUNG MAU KENCAN KE MANA?
            </span>
            <h3 className="mt-0.5 text-xl font-black text-[#4a1623] dark:text-rose-50">
              Roulette Kencan Kita
            </h3>
            <p className="mt-0.5 mb-4 text-[11px] font-semibold text-[#8c4f60] dark:text-rose-200/75">
              Biarkan takdir memilihkan tempat kencan dari daftar wishlist!
            </p>

            <div className="mb-4 grid grid-cols-2 gap-2.5 text-left text-[11px]">
              <div>
                <label className="mb-1 block font-extrabold text-[#5c2432] dark:text-rose-200">
                  Kategori
                </label>
                <select
                  value={rouletteCategory}
                  onChange={(e) => setRouletteCategory(e.target.value)}
                  className="w-full rounded-2xl border border-rose-200/70 bg-white px-3 py-2 font-bold text-[#4a1623] dark:border-rose-200/15 dark:bg-[#1f070f] dark:text-rose-100"
                >
                  <option value="all">Semua</option>
                  <option value="kafe">Kafe</option>
                  <option value="restoran">Restoran</option>
                  <option value="rekreasi">Rekreasi</option>
                  <option value="pantai">Pantai</option>
                  <option value="bioskop">Bioskop</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-extrabold text-[#5c2432] dark:text-rose-200">
                  Budget
                </label>
                <select
                  value={rouletteBudget}
                  onChange={(e) => setRouletteBudget(e.target.value)}
                  className="w-full rounded-2xl border border-rose-200/70 bg-white px-3 py-2 font-bold text-[#4a1623] dark:border-rose-200/15 dark:bg-[#1f070f] dark:text-rose-100"
                >
                  <option value="all">Semua Budget</option>
                  <option value="murah">$ Rendah</option>
                  <option value="sedang">$$ Sedang</option>
                  <option value="mewah">$$$ Tinggi</option>
                </select>
              </div>
            </div>

            <div className="clay-subcard-3d mb-4 flex min-h-[116px] flex-col items-center justify-center rounded-[1.6rem] p-4">
              {rouletteResult ? (
                <div className={`transition-transform ${isSpinning ? 'scale-95 blur-[1px]' : 'scale-100'}`}>
                  <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-300">
                    {rouletteResult.category} • {rouletteResult.area}
                  </span>
                  <h4 className="my-1 text-lg font-black text-[#4a1623] dark:text-rose-50">
                    {rouletteResult.name}
                  </h4>
                  {rouletteResult.notes && (
                    <p className="line-clamp-2 text-[11px] italic text-[#7a3948] dark:text-rose-200/80">
                      "{rouletteResult.notes}"
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs font-bold text-[#8c4f60] dark:text-rose-200/75">
                  Tekan tombol di bawah untuk mengacak tujuan kencan!
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={spinRoulette}
              disabled={isSpinning}
              className="mx-auto flex w-full items-center justify-center gap-2 rounded-full border border-white/40 bg-gradient-to-b from-[#ff6b98] to-[#d9386a] px-6 py-3 text-xs font-black tracking-wider uppercase text-white shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <Shuffle className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Memilih Tujuan...' : 'Putar Roulette Kencan'}</span>
            </button>
          </div>
        )}

        {/* MODAL: TAMBAH / UBAH WISHLIST TEMPAT */}
        <AnimatePresence>
          {isNewPlaceOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="clay-card-3d my-auto w-full max-w-md rounded-[2.2rem] p-5 text-[#4a1623] dark:text-rose-50"
              >
                <div className="mb-3.5 flex items-center justify-between border-b border-rose-200/50 pb-2.5 dark:border-rose-200/15">
                  <h3 className="text-base font-black text-[#57202c] dark:text-rose-100">
                    {editingPlace ? 'Ubah Wishlist Tempat' : 'Tambah Wishlist Tempat'}
                  </h3>
                  <CloseButton onClick={() => setIsNewPlaceOpen(false)} />
                </div>

                <form onSubmit={handleSavePlace} className="space-y-2.5 text-xs">
                  <div>
                    <label className="mb-1 block font-extrabold">Nama Tempat *</label>
                    <input
                      type="text"
                      required
                      value={placeForm.name}
                      onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                      placeholder="Contoh: Spiegel Bar & Bistro"
                      className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block font-extrabold">Kategori</label>
                      <select
                        value={placeForm.category}
                        onChange={(e) => setPlaceForm({ ...placeForm, category: e.target.value as PinCategory })}
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
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
                      <label className="mb-1 block font-extrabold">Kawasan</label>
                      <input
                        type="text"
                        value={placeForm.area}
                        onChange={(e) => setPlaceForm({ ...placeForm, area: e.target.value })}
                        placeholder="Kota Lama / Tembalang"
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block font-extrabold">Budget</label>
                      <select
                        value={placeForm.budgetEstimate}
                        onChange={(e) => setPlaceForm({ ...placeForm, budgetEstimate: e.target.value as any })}
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-2.5 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                      >
                        <option value="murah">$ Rendah</option>
                        <option value="sedang">$$ Sedang</option>
                        <option value="mewah">$$$ Tinggi</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block font-extrabold">Prioritas</label>
                      <select
                        value={placeForm.priority}
                        onChange={(e) => setPlaceForm({ ...placeForm, priority: e.target.value as any })}
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-2.5 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                      >
                        <option value="tinggi">🔴 Tinggi</option>
                        <option value="sedang">🟡 Sedang</option>
                        <option value="rendah">🟢 Rendah</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block font-extrabold">Pengusul</label>
                      <select
                        value={placeForm.requestedBy}
                        onChange={(e) => setPlaceForm({ ...placeForm, requestedBy: e.target.value as any })}
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-2.5 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                      >
                        <option value="Berdua">💕 Berdua</option>
                        <option value="Soffie">🎀 Soffie</option>
                        <option value="Savero">🌿 Savero</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-extrabold">Link Google Maps (Opsional)</label>
                    <input
                      type="url"
                      value={placeForm.mapUrl}
                      onChange={(e) => setPlaceForm({ ...placeForm, mapUrl: e.target.value })}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-extrabold">Catatan Rencana Kencan</label>
                    <textarea
                      rows={2}
                      value={placeForm.notes}
                      onChange={(e) => setPlaceForm({ ...placeForm, notes: e.target.value })}
                      placeholder="Mau coba menu apa, waktu terbaik berkunjung..."
                      className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-rose-200/50 pt-3 dark:border-rose-200/15">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewPlaceOpen(false);
                        setEditingPlace(null);
                      }}
                      className="clay-subcard-3d rounded-full px-4 py-2 font-extrabold text-[#7a3444] dark:text-rose-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] px-5 py-2 font-extrabold text-white shadow-md"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL KONFIRMASI HAPUS */}
        <AnimatePresence>
          {placeToDelete && onDeletePlace && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="clay-card-3d w-full max-w-xs rounded-[2rem] p-5 text-center"
              >
                <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/15 text-rose-500 dark:text-rose-300">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-[#4a1623] dark:text-rose-50">
                  Hapus Wishlist?
                </h3>
                <p className="mt-1 mb-4 text-xs text-[#8c4f60] dark:text-rose-200/80">
                  Hapus <strong>"{placeToDelete.name}"</strong> dari daftar kencan?
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaceToDelete(null)}
                    className="clay-subcard-3d flex-1 rounded-full py-2 text-xs font-extrabold text-[#7a3444] dark:text-rose-200"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePlace(placeToDelete.id);
                      setPlaceToDelete(null);
                    }}
                    className="flex-1 rounded-full bg-rose-600 py-2 text-xs font-extrabold text-white shadow-md"
                  >
                    Hapus
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL: TAMBAH / UBAH MINUMAN */}
        <AnimatePresence>
          {isNewDrinkOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="clay-card-3d my-auto w-full max-w-md rounded-[2.2rem] p-5 text-[#4a1623] dark:text-rose-50"
              >
                <div className="mb-3.5 flex items-center justify-between border-b border-rose-200/50 pb-2.5 dark:border-rose-200/15">
                  <h3 className="text-base font-black text-[#57202c] dark:text-rose-100">
                    {editingDrink ? 'Ubah Ulasan Minuman' : 'Tambah Minuman'}
                  </h3>
                  <CloseButton onClick={() => { setIsNewDrinkOpen(false); setEditingDrink(null); }} />
                </div>

                <form onSubmit={handleSaveDrink} className="space-y-2.5 text-xs">
                  <div>
                    <label className="mb-1 block font-extrabold">Nama Minuman *</label>
                    <input
                      type="text"
                      required
                      value={drinkForm.name}
                      onChange={(e) => setDrinkForm({ ...drinkForm, name: e.target.value })}
                      placeholder="Contoh: Ceremonial Matcha Latte"
                      className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block font-extrabold">Kategori</label>
                      <select
                        value={drinkForm.type}
                        onChange={(e) => setDrinkForm({ ...drinkForm, type: e.target.value as any })}
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                      >
                        <option value="matcha">Matcha (Soffie)</option>
                        <option value="kopi">Kopi (Savero)</option>
                        <option value="non-kopi">Non-Kopi</option>
                        <option value="alkohol">Spesial</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block font-extrabold">Nama Kafe *</label>
                      <input
                        type="text"
                        required
                        value={drinkForm.venueName}
                        onChange={(e) => setDrinkForm({ ...drinkForm, venueName: e.target.value })}
                        placeholder="Kofitiere, Eastman..."
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block font-extrabold">Harga (Rp)</label>
                      <input
                        type="number"
                        value={drinkForm.price}
                        onChange={(e) => setDrinkForm({ ...drinkForm, price: Number(e.target.value) })}
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-extrabold">Untuk Siapa</label>
                      <select
                        value={drinkForm.forWhom}
                        onChange={(e) => setDrinkForm({ ...drinkForm, forWhom: e.target.value as any })}
                        className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                      >
                        <option value="Soffie">Soffie</option>
                        <option value="Savero">Savero</option>
                        <option value="Berdua">Berdua</option>
                      </select>
                    </div>
                  </div>

                  {drinkForm.status === 'sudah_coba' && (
                    <div>
                      <label className="mb-1 block font-extrabold">Rating Rasa (1–5 Hati)</label>
                      <HeartRating
                        rating={drinkForm.rating}
                        interactive={true}
                        size={20}
                        onChange={(r) => setDrinkForm({ ...drinkForm, rating: r })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block font-extrabold">Catatan Rasa</label>
                    <textarea
                      rows={2}
                      value={drinkForm.tastingNotes}
                      onChange={(e) => setDrinkForm({ ...drinkForm, tastingNotes: e.target.value })}
                      placeholder="Creamy, umami kuat..."
                      className="w-full rounded-xl border border-rose-200/80 bg-white px-3 py-2 font-bold dark:border-rose-200/15 dark:bg-[#1f070f]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-rose-200/50 pt-3 dark:border-rose-200/15">
                    <button
                      type="button"
                      onClick={() => setIsNewDrinkOpen(false)}
                      className="clay-subcard-3d rounded-full px-4 py-2 font-extrabold text-[#7a3444] dark:text-rose-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] px-5 py-2 font-extrabold text-white shadow-md"
                    >
                      Simpan
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