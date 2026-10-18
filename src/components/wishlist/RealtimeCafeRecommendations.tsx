import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ManagedImage } from '../common/ManagedImage';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Clock,
  Sparkles,
  Coffee,
  Navigation,
  RefreshCw,
  Search,
  Plus,
  Check,
  Star,
  Flame,
  Camera,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CloseButton } from '../common/CloseButton';
import { WishlistPlace, AppSettings } from '../../types';
import {
  REALTIME_SEMARANG_CAFES,
  calculateDistanceKm,
  SEMARANG_PRESET_LOCATIONS,
  PresetLocation
} from '../../data/realtimeCafes';
import {
  fetchGooglePlacesCafes,
  GooglePlaceCafe
} from '../../services/googlePlacesService';
import { soundManager } from '../../utils/audio';

export interface ProcessedCafe {
  id: string;
  name: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  openTime?: string;
  closeTime?: string;
  openDays?: string;
  isOpenNow: boolean;
  statusLabel: string;
  statusColor: 'green' | 'amber' | 'blue' | 'red';
  detailMessage: string;
  statusBadge: string;
  statusBadgeLabel: string;
  priceRange: 'murah' | 'sedang' | 'mewah';
  averagePrice?: string;
  photos: string[];
  photoUrl: string;
  signatureMenu: string;
  matchaMenu?: string;
  coffeeMenu?: string;
  atmosphere: string;
  highlightForCouple: string;
  mapUrl: string;
  rating: number;
  reviewCount: number;
  isAdded: boolean;
  isFromGoogleApi: boolean;
  weekdayDescriptions?: string[];
}

interface RealtimeCafeRecommendationsProps {
  existingPlaces: WishlistPlace[];
  onAddPlace: (place: WishlistPlace) => void;
  settings: AppSettings;
}

export const RealtimeCafeRecommendations: React.FC<RealtimeCafeRecommendationsProps> = ({
  existingPlaces,
  onAddPlace
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
    isLiveGps: boolean;
  }>({
    lat: SEMARANG_PRESET_LOCATIONS[0].lat,
    lng: SEMARANG_PRESET_LOCATIONS[0].lng,
    label: SEMARANG_PRESET_LOCATIONS[0].name,
    isLiveGps: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<
    'semua' | 'terdekat' | 'buka' | 'baru' | 'tren' | 'matcha' | 'kopi'
  >('semua');

  const [selectedCafe, setSelectedCafe] = useState<ProcessedCafe | null>(null);
  const [modalPhotoIndex, setModalPhotoIndex] = useState(0);
  const [copiedToast, setCopiedToast] = useState(false);
  const [addedCafeIds, setAddedCafeIds] = useState<Record<string, boolean>>({});
  const [googlePlaces, setGooglePlaces] = useState<GooglePlaceCafe[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    requestLiveGpsLocation(false);
  }, []);

  const requestLiveGpsLocation = (showSound = true) => {
    if (showSound) soundManager.playTap();
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'GPS Aktif',
          isLiveGps: true
        });
        if (showSound) soundManager.playSuccess();
      },
      () => {},
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const loadGooglePlacesData = useCallback(async () => {
    setIsLoadingPlaces(true);
    try {
      const categoryMap: Record<string, any> = {
        semua: 'semua',
        terdekat: 'terdekat',
        buka: 'semua',
        baru: 'baru_buka',
        tren: 'sedang_tren',
        matcha: 'spesial_matcha',
        kopi: 'spesial_kopi'
      };

      const results = await fetchGooglePlacesCafes({
        category: categoryMap[filterTab] || 'semua',
        query: searchQuery,
        userLat: userLocation.lat,
        userLng: userLocation.lng
      });

      if (results && results.length > 0) {
        setGooglePlaces(results);
      }
    } catch (err) {
      console.warn('Could not load Google Places:', err);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [filterTab, searchQuery, userLocation.lat, userLocation.lng]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadGooglePlacesData();
    }, searchQuery ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [loadGooglePlacesData, searchQuery]);

  const handleManualRefresh = () => {
    soundManager.playTap();
    setIsRefreshing(true);
    setCurrentTime(new Date());
    loadGooglePlacesData().then(() => {
      setIsRefreshing(false);
      soundManager.playPop();
    });
  };

  const handleSelectPresetLocation = (preset: PresetLocation) => {
    soundManager.playTap();
    setUserLocation({
      lat: preset.lat,
      lng: preset.lng,
      label: preset.name,
      isLiveGps: false
    });
  };

  const isCafeInWishlist = (cafeName: string) => {
    return existingPlaces.some(
      (p) => p.name.toLowerCase().trim() === cafeName.toLowerCase().trim()
    );
  };

  const handleAddToWishlist = (cafe: ProcessedCafe, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundManager.playSuccess();

    const newPlace: WishlistPlace = {
      id: 'wplace-gmp-' + Date.now(),
      name: cafe.name,
      category: 'kafe',
      area: cafe.area,
      budgetEstimate: cafe.priceRange,
      priority:
        cafe.statusBadge === 'baru_buka' || cafe.statusBadge === 'spesial_matcha'
          ? 'tinggi'
          : 'sedang',
      requestedBy:
        cafe.statusBadge === 'spesial_matcha'
          ? 'Soffie'
          : cafe.statusBadge === 'spesial_kopi'
          ? 'Savero'
          : 'Berdua',
      notes: `${cafe.signatureMenu}. ⭐ Rating: ${cafe.rating} (${cafe.reviewCount} ulasan). ${cafe.highlightForCouple}`,
      mapUrl: cafe.mapUrl,
      tags: [
        cafe.statusBadgeLabel.replace(/[^\w\s]/gi, '').trim(),
        cafe.area.split(',')[0].trim()
      ],
      createdAt: new Date().toISOString().split('T')[0],
      isVisited: false
    };

    onAddPlace(newPlace);
    setAddedCafeIds((prev) => ({ ...prev, [cafe.id]: true }));
  };

  const computeStatusInfo = (
    isOpenNow: boolean | undefined,
    weekdayDesc?: string[]
  ): {
    isOpen: boolean;
    statusLabel: string;
    statusColor: 'green' | 'amber' | 'blue' | 'red';
    detailMessage: string;
  } => {
    if (isOpenNow === true) {
      return {
        isOpen: true,
        statusLabel: 'Buka',
        statusColor: 'green',
        detailMessage: 'Sedang beroperasi hari ini'
      };
    }
    if (isOpenNow === false) {
      return {
        isOpen: false,
        statusLabel: 'Tutup',
        statusColor: 'red',
        detailMessage: weekdayDesc?.[0] ? `Jadwal: ${weekdayDesc[0]}` : 'Sedang tutup saat ini'
      };
    }
    return {
      isOpen: true,
      statusLabel: 'Buka',
      statusColor: 'amber',
      detailMessage: 'Buka setiap hari'
    };
  };

  const processedCafes: ProcessedCafe[] = useMemo(() => {
    const list: ProcessedCafe[] = [];
    const seenNames = new Set<string>();

    googlePlaces.forEach((gp) => {
      const norm = gp.name.toLowerCase().trim();
      seenNames.add(norm);

      const distance = calculateDistanceKm(userLocation.lat, userLocation.lng, gp.lat, gp.lng);
      const status = computeStatusInfo(gp.isOpenNow, gp.weekdayDescriptions);
      const isAdded = isCafeInWishlist(gp.name) || addedCafeIds[gp.id];

      let highlight = 'Tempat aesthetic yang direkomendasikan untuk kencan berdua Savero & Soffie.';
      if (norm.includes('matcha') || norm.includes('tea')) {
        highlight = 'Spot matcha favorit Soffie dengan racikan teh autentik yang menenangkan.';
      } else if (norm.includes('coffee') || norm.includes('roast') || norm.includes('kopi')) {
        highlight = 'Kopi specialty beraroma harum, cocok untuk Savero diskusi santai atau quality time.';
      }

      list.push({
        id: gp.id,
        name: gp.name,
        area: gp.area,
        address: gp.formattedAddress,
        lat: gp.lat,
        lng: gp.lng,
        distanceKm: distance,
        isOpenNow: status.isOpen,
        statusLabel: status.statusLabel,
        statusColor: status.statusColor,
        detailMessage: status.detailMessage,
        statusBadge: gp.tag,
        statusBadgeLabel: gp.tagLabel,
        priceRange: 'sedang',
        averagePrice: 'Rp 30rb - 60rb',
        photos: gp.photos,
        photoUrl: gp.photos[0],
        signatureMenu: gp.editorialSummary || `Menu spesial khas ${gp.name}`,
        matchaMenu: norm.includes('matcha') ? 'Signature Matcha' : undefined,
        coffeeMenu: 'Specialty Espresso & Brew',
        atmosphere: 'Suasana nyaman dan estetik khas Semarang',
        highlightForCouple: highlight,
        mapUrl: gp.googleMapsUri || `https://maps.google.com/?q=${encodeURIComponent(gp.name + ' Semarang')}`,
        rating: gp.rating || 4.8,
        reviewCount: gp.userRatingCount || 150,
        isAdded,
        isFromGoogleApi: true,
        weekdayDescriptions: gp.weekdayDescriptions
      });
    });

    REALTIME_SEMARANG_CAFES.forEach((c) => {
      const norm = c.name.toLowerCase().trim();
      if (!seenNames.has(norm)) {
        const distance = calculateDistanceKm(userLocation.lat, userLocation.lng, c.lat, c.lng);
        const isAdded = isCafeInWishlist(c.name) || addedCafeIds[c.id];

        list.push({
          id: c.id,
          name: c.name,
          area: c.area,
          address: c.address,
          lat: c.lat,
          lng: c.lng,
          distanceKm: distance,
          openTime: c.openTime,
          closeTime: c.closeTime,
          openDays: c.openDays,
          isOpenNow: true,
          statusLabel: c.statusBadge === 'baru_buka' ? 'Baru' : 'Buka',
          statusColor: c.statusBadge === 'baru_buka' ? 'green' : 'amber',
          detailMessage: `${c.openTime} - ${c.closeTime} WIB`,
          statusBadge: c.statusBadge,
          statusBadgeLabel: c.statusBadgeLabel,
          priceRange: c.priceRange,
          averagePrice: c.averagePrice,
          photos: [c.photoUrl],
          photoUrl: c.photoUrl,
          signatureMenu: c.signatureMenu,
          matchaMenu: c.matchaMenu,
          coffeeMenu: c.coffeeMenu,
          atmosphere: c.atmosphere,
          highlightForCouple: c.highlightForCouple,
          mapUrl: c.mapUrl,
          rating: c.rating,
          reviewCount: c.reviewCount,
          isAdded,
          isFromGoogleApi: false
        });
      }
    });

    return list;
  }, [googlePlaces, userLocation, existingPlaces, addedCafeIds]);

  const filteredCafes = useMemo(() => {
    let result = processedCafes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.signatureMenu.toLowerCase().includes(q)
      );
    }

    switch (filterTab) {
      case 'terdekat':
        result = [...result].sort((a, b) => a.distanceKm - b.distanceKm);
        break;
      case 'buka':
        result = result.filter((c) => c.isOpenNow);
        break;
      case 'baru':
        result = result.filter(
          (c) =>
            c.statusBadge === 'baru_buka' ||
            c.statusBadgeLabel.toLowerCase().includes('baru')
        );
        break;
      case 'tren':
        result = result
          .filter(
            (c) =>
              c.statusBadge === 'sedang_tren' ||
              c.statusBadge === 'viral' ||
              c.reviewCount > 200
          )
          .sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'matcha':
        result = result.filter(
          (c) =>
            c.matchaMenu ||
            c.name.toLowerCase().includes('matcha') ||
            c.name.toLowerCase().includes('tea') ||
            c.signatureMenu.toLowerCase().includes('matcha')
        );
        break;
      case 'kopi':
        result = result.filter(
          (c) =>
            c.coffeeMenu ||
            c.name.toLowerCase().includes('coffee') ||
            c.name.toLowerCase().includes('kopi') ||
            c.name.toLowerCase().includes('roaster')
        );
        break;
      default:
        result = [...result].sort((a, b) => {
          if (a.statusBadge === 'baru_buka' && b.statusBadge !== 'baru_buka') return -1;
          if (b.statusBadge === 'baru_buka' && a.statusBadge !== 'baru_buka') return 1;
          return a.distanceKm - b.distanceKm;
        });
        break;
    }

    return result;
  }, [processedCafes, searchQuery, filterTab]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedToast(true);
    soundManager.playPop();
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const formattedTimeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-4">
      {/* COMPACT 3D CLAY DISCOVERY CONTROL HUB (Irit Ruang & Mobile-First) */}
      <div className="clay-card-3d rounded-[2rem] p-3.5">
        {/* Top Micro Row: Title + Live Status + Refresh */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white shadow-xs">
              <Coffee className="h-4 w-4" />
            </span>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-sm font-black text-[#4a1623] dark:text-rose-50 sm:text-base">
                  Eksplor Kafe Semarang
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8.5px] font-black text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {formattedTimeStr}
                </span>
              </div>
              <p className="truncate text-[10px] font-bold text-[#8c4f60] dark:text-rose-200/75">
                Acuan: <strong className="text-[#b84661] dark:text-rose-300">{userLocation.label}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoadingPlaces}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/90 text-[#8c2840] shadow-xs transition hover:scale-105 active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-rose-200"
            title="Segarkan Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing || isLoadingPlaces ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Compact GPS Location Pills */}
        <div className="mb-2.5 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => requestLiveGpsLocation(true)}
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold transition active:scale-95 ${
              userLocation.isLiveGps
                ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-xs'
                : 'border border-white/80 bg-white/80 text-[#6e2438] dark:border-white/10 dark:bg-white/10 dark:text-rose-100'
            }`}
          >
            <Navigation className="h-2.5 w-2.5" />
            <span>GPS HP</span>
          </button>
          {SEMARANG_PRESET_LOCATIONS.map((preset) => {
            const active = !userLocation.isLiveGps && userLocation.label === preset.name;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPresetLocation(preset)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold transition active:scale-95 ${
                  active
                    ? 'bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white shadow-xs'
                    : 'border border-white/80 bg-white/75 text-[#7a3948] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-rose-200/80'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Compact 3D Clay Search Input */}
        <div className="relative mb-2.5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-rose-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kafe, matcha, roastery di Semarang..."
            className="w-full rounded-full border border-white/90 bg-white/90 py-1.5 pl-9 pr-8 text-[11.5px] font-bold text-[#4a1623] shadow-inner placeholder:text-[#8c4f60]/55 focus:border-rose-300 focus:outline-none dark:border-white/10 dark:bg-black/30 dark:text-rose-50 dark:placeholder:text-rose-200/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-600 dark:bg-white/10 dark:text-rose-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { id: 'semua', label: `Semua (${processedCafes.length})`, icon: null },
            { id: 'terdekat', label: 'Terdekat', icon: Navigation },
            { id: 'tren', label: 'Viral', icon: Flame },
            { id: 'baru', label: 'Baru', icon: Sparkles },
            { id: 'buka', label: 'Buka', icon: null },
            { id: 'matcha', label: 'Matcha', icon: null },
            { id: 'kopi', label: 'Kopi', icon: Coffee }
          ].map((tab) => {
            const active = filterTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setFilterTab(tab.id as any);
                }}
                className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[10.5px] font-extrabold transition-all active:scale-95 ${
                  active
                    ? 'bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white shadow-[0_3px_8px_rgba(217,56,106,0.28),inset_0_1px_2px_rgba(255,255,255,0.55)]'
                    : 'border border-white/85 bg-white/85 text-[#6e2438] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-rose-100'
                }`}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {tab.id === 'buka' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoadingPlaces && (
        <div className="flex items-center justify-center gap-2 py-2 text-[11px] font-extrabold text-[#b84661] dark:text-rose-300">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Memperbarui daftar kafe...</span>
        </div>
      )}

      {/* COMPACT 2-COLUMN MOBILE GRID FOR CAFE CARDS */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 sm:gap-3.5">
        {filteredCafes.map((cafe) => (
          <motion.div
            key={cafe.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => {
              soundManager.playTap();
              setSelectedCafe(cafe);
              setModalPhotoIndex(0);
            }}
            className="clay-card-3d group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[1.6rem] p-2.5 transition-all hover:-translate-y-0.5"
          >
            <div>
              {/* Squircle-ish Thumbnail Image */}
              <div className="relative mb-2 h-28 w-full overflow-hidden rounded-[1.2rem] border border-white/80 bg-rose-100/50 sm:h-36 dark:border-white/10 dark:bg-black/40">
                <ManagedImage
                  src={cafe.photoUrl}
                  alt={cafe.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />

                {/* Top Left: Distance Pill */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-full border border-white/25 bg-black/55 px-2 py-0.5 text-[8.5px] font-black text-white backdrop-blur-md">
                  <Navigation className="h-2.5 w-2.5 text-rose-300" />
                  <span>{cafe.distanceKm} km</span>
                </div>

                {/* Top Right: Rating Pill */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full border border-white/25 bg-black/55 px-1.5 py-0.5 text-[8.5px] font-black text-white backdrop-blur-md">
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  <span>{cafe.rating}</span>
                </div>

                {/* Bottom Overlay: Open Status + Tag */}
                <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between gap-1 text-white">
                  <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[8px] font-extrabold backdrop-blur-md">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        cafe.statusColor === 'green'
                          ? 'bg-emerald-400'
                          : cafe.statusColor === 'amber'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                    />
                    {cafe.statusLabel}
                  </span>

                  <span className="truncate rounded-full bg-rose-500/85 px-2 py-0.5 text-[7.5px] font-black uppercase tracking-wide text-white backdrop-blur-xs">
                    {cafe.statusBadgeLabel.replace(/[^\w\s]/gi, '').trim().slice(0, 12)}
                  </span>
                </div>
              </div>

              {/* Cafe Name & Area */}
              <h4 className="line-clamp-1 text-left text-xs font-black leading-snug text-[#4a1623] group-hover:text-[#d9386a] dark:text-rose-50 sm:text-sm">
                {cafe.name}
              </h4>
              <p className="mt-0.5 flex items-center gap-1 text-left text-[9.5px] font-bold text-[#8c4f60] dark:text-rose-200/70">
                <MapPin className="h-2.5 w-2.5 shrink-0 text-rose-400" />
                <span className="truncate">{cafe.area}</span>
              </p>
              <p className="mt-1 line-clamp-1 text-left text-[9.5px] font-medium text-[#6b3140] dark:text-rose-200/80">
                {cafe.signatureMenu}
              </p>
            </div>

            {/* Compact Action Bar */}
            <div className="mt-2.5 flex items-center gap-1.5 border-t border-rose-200/40 pt-2 dark:border-white/10">
              <button
                type="button"
                onClick={(e) => handleAddToWishlist(cafe, e)}
                disabled={cafe.isAdded}
                className={`flex min-h-[28px] flex-1 items-center justify-center gap-1 rounded-full px-2 text-[9.5px] font-extrabold transition active:scale-95 ${
                  cafe.isAdded
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white shadow-xs'
                }`}
              >
                {cafe.isAdded ? (
                  <>
                    <Check className="h-3 w-3 stroke-[2.75]" />
                    <span>Tersimpan</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 stroke-[2.75]" />
                    <span>Wishlist</span>
                  </>
                )}
              </button>

              <a
                href={cafe.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/90 text-rose-500 shadow-2xs transition hover:scale-105 active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-rose-200"
                title="Rute Google Maps"
              >
                <Navigation className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCafes.length === 0 && !isLoadingPlaces && (
        <div className="rounded-[2rem] border border-white/90 bg-white/75 p-8 text-center shadow-inner dark:border-white/10 dark:bg-white/5">
          <Coffee className="mx-auto mb-2 h-8 w-8 text-rose-400" />
          <h4 className="text-sm font-black text-[#4a1623] dark:text-rose-50">
            Tidak ada kafe yang cocok
          </h4>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterTab('semua');
            }}
            className="mt-3 rounded-full bg-gradient-to-b from-[#ff6b98] to-[#d9386a] px-4 py-1.5 text-xs font-extrabold text-white shadow-sm"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* DETAIL MODAL KAFE (Compact 3D Clay Sheet) */}
      <AnimatePresence>
        {selectedCafe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-md"
            onClick={() => setSelectedCafe(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 18 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="clay-card-3d relative my-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[2.4rem] p-4 text-left text-[#4a1623] scrollbar-none dark:text-rose-50"
            >
              <CloseButton
                onClick={() => setSelectedCafe(null)}
                label="Tutup detail"
                className="absolute right-3.5 top-3.5 z-20"
              />

              {/* Photo Cover */}
              <div className="relative mb-3 h-48 w-full overflow-hidden rounded-[1.8rem] border-2 border-white bg-black shadow-md dark:border-white/15">
                <ManagedImage
                  src={
                    selectedCafe.photos && selectedCafe.photos.length > 0
                      ? selectedCafe.photos[modalPhotoIndex] || selectedCafe.photoUrl
                      : selectedCafe.photoUrl
                  }
                  alt={selectedCafe.name}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {selectedCafe.photos && selectedCafe.photos.length > 1 && (
                  <div className="pointer-events-none absolute inset-x-2 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalPhotoIndex((prev) =>
                          prev === 0 ? selectedCafe.photos.length - 1 : prev - 1
                        );
                      }}
                      className="pointer-events-auto rounded-full bg-black/50 p-1.5 text-white backdrop-blur-md hover:bg-black/75"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalPhotoIndex((prev) =>
                          prev === selectedCafe.photos.length - 1 ? 0 : prev + 1
                        );
                      }}
                      className="pointer-events-auto rounded-full bg-black/50 p-1.5 text-white backdrop-blur-md hover:bg-black/75"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {selectedCafe.photos && selectedCafe.photos.length > 1 && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-md">
                    <Camera className="h-3 w-3 text-rose-300" />
                    <span>
                      {modalPhotoIndex + 1}/{selectedCafe.photos.length}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-2.5 inset-x-3 text-white">
                  <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                    {selectedCafe.statusBadgeLabel}
                  </span>
                  <h3 className="mt-1 text-lg font-black leading-tight">{selectedCafe.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] text-white/85">
                    <MapPin className="h-3 w-3 shrink-0 text-rose-300" />
                    <span className="truncate">{selectedCafe.address}</span>
                  </p>
                </div>
              </div>

              {/* Compact Info Pills */}
              <div className="space-y-2.5 text-xs">
                <div className="clay-subcard-3d flex items-center justify-between rounded-2xl p-2.5">
                  <div>
                    <span className="text-[9.5px] font-extrabold uppercase text-[#8c4f60] dark:text-rose-300">
                      Status Live
                    </span>
                    <div className="flex items-center gap-1 font-black text-[#4a1623] dark:text-rose-50">
                      <Clock className="h-3.5 w-3.5 text-rose-500" />
                      <span>{selectedCafe.statusLabel}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#8c4f60] dark:text-rose-200/75">
                      {selectedCafe.detailMessage}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9.5px] font-extrabold uppercase text-[#8c4f60] dark:text-rose-300">
                      Jarak
                    </span>
                    <div className="text-sm font-black text-rose-500 dark:text-rose-300">
                      {selectedCafe.distanceKm} km
                    </div>
                    <span className="flex items-center justify-end gap-0.5 text-[10px] font-bold">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {selectedCafe.rating} ({selectedCafe.reviewCount})
                    </span>
                  </div>
                </div>

                {/* Couple Highlight */}
                <div className="clay-subcard-3d rounded-2xl p-3">
                  <div className="mb-0.5 flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-300">
                    <Sparkles className="h-3 w-3" />
                    <span>Catatan Kencan Kita</span>
                  </div>
                  <p className="text-[11.5px] font-semibold italic leading-relaxed text-[#4a1623] dark:text-rose-100">
                    "{selectedCafe.highlightForCouple}"
                  </p>
                </div>

                {/* Copy Address */}
                <div className="clay-subcard-3d flex items-center justify-between rounded-2xl px-3 py-2">
                  <span className="truncate text-[10.5px] font-semibold text-[#6b3140] dark:text-rose-200">
                    {selectedCafe.address}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAddress(selectedCafe.address)}
                    className="ml-2 flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[9.5px] font-extrabold text-rose-700 dark:bg-white/10 dark:text-rose-200"
                  >
                    <Copy className="h-2.5 w-2.5" />
                    <span>{copiedToast ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={selectedCafe.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-full border border-white/90 bg-white px-4 py-2.5 text-xs font-extrabold text-[#7a243b] shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-rose-100"
                  >
                    <Navigation className="h-3.5 w-3.5 text-rose-500" />
                    <span>Maps</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      handleAddToWishlist(selectedCafe);
                      setSelectedCafe(null);
                    }}
                    disabled={selectedCafe.isAdded}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 px-4 text-xs font-extrabold shadow-md transition active:scale-95 ${
                      selectedCafe.isAdded
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gradient-to-b from-[#ff6b98] to-[#d9386a] text-white'
                    }`}
                  >
                    {selectedCafe.isAdded ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Sudah di Wishlist</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Simpan ke Wishlist</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};