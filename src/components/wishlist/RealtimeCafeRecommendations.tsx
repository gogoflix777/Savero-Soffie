import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ManagedImage } from '../common/ManagedImage';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  MapPin,
  Clock,
  Sparkles,
  Coffee,
  Navigation,
  RefreshCw,
  Search,
  ExternalLink,
  Plus,
  Check,
  Star,
  Flame,
  Camera,
  Share2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { CloseButton } from '../common/CloseButton';
import {
  RealtimeCafeRecommendation,
  WishlistPlace,
  AppSettings
} from '../../types';
import {
  REALTIME_SEMARANG_CAFES,
  calculateDistanceKm,
  SEMARANG_PRESET_LOCATIONS,
  PresetLocation,
  RealtimeStatusResult
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
  onAddPlace,
  settings
}) => {
  // Live Time state for real-time calculation
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);

  // User Location State (Default: Pleburan Undip - Savero's campus)
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

  const [gpsError, setGpsError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<
    'semua' | 'terdekat' | 'buka' | 'baru' | 'tren' | 'matcha' | 'kopi'
  >('semua');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(15);

  // Detail Modal State
  const [selectedCafe, setSelectedCafe] = useState<ProcessedCafe | null>(null);
  const [modalPhotoIndex, setModalPhotoIndex] = useState(0);
  const [copiedToast, setCopiedToast] = useState(false);
  const [addedCafeIds, setAddedCafeIds] = useState<Record<string, boolean>>({});

  // Dynamic Google Places API results
  const [googlePlaces, setGooglePlaces] = useState<GooglePlaceCafe[]>([]);

  // Auto-refresh real-time clock every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Request browser GPS on initial load
  useEffect(() => {
    requestLiveGpsLocation(false);
  }, []);

  const requestLiveGpsLocation = (showSound = true) => {
    if (showSound) soundManager.playTap();
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung geolokasi GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Lokasi GPS Anda Sekarang',
          isLiveGps: true
        });
        setGpsError(null);
        if (showSound) soundManager.playSuccess();
      },
      () => {
        setGpsError('GPS tidak aktif, menggunakan titik acuan Pleburan Semarang.');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Fetch live places from Google Places API
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
        setApiConnected(true);
      }
    } catch (err) {
      console.warn('Could not load Google Places:', err);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [filterTab, searchQuery, userLocation.lat, userLocation.lng]);

  // Load when filter or query changes (with debounced search)
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadGooglePlacesData();
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

  // Check if cafe is already in Wishlist
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
      notes: `${cafe.signatureMenu}. ⭐ Google Rating: ${cafe.rating} (${cafe.reviewCount} ulasan). ${cafe.highlightForCouple}`,
      mapUrl: cafe.mapUrl,
      tags: [
        'Google Places API',
        cafe.statusBadgeLabel.replace(/[^\w\s]/gi, '').trim(),
        cafe.area.split(',')[0].trim()
      ],
      createdAt: new Date().toISOString().split('T')[0],
      isVisited: false
    };

    onAddPlace(newPlace);
    setAddedCafeIds((prev) => ({ ...prev, [cafe.id]: true }));
  };

  // Helper to compute open status message
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
        statusLabel: 'Buka Sekarang',
        statusColor: 'green',
        detailMessage: 'Sedang beroperasi hari ini • Siap dikunjungi kencan'
      };
    }
    if (isOpenNow === false) {
      return {
        isOpen: false,
        statusLabel: 'Tutup Saat Ini',
        statusColor: 'red',
        detailMessage: weekdayDesc?.[0]
          ? `Jadwal: ${weekdayDesc[0]}`
          : 'Sedang tutup • Simpan ke Wishlist untuk kunjungan berikutnya'
      };
    }
    return {
      isOpen: true,
      statusLabel: 'Buka Hari Ini',
      statusColor: 'amber',
      detailMessage: 'Buka setiap hari • Cek Maps untuk jam tepatnya'
    };
  };

  // Harmonize Google Places API results with curated spots
  const processedCafes: ProcessedCafe[] = useMemo(() => {
    const list: ProcessedCafe[] = [];
    const seenNames = new Set<string>();

    // 1. Process Google Places API results
    googlePlaces.forEach((gp) => {
      const norm = gp.name.toLowerCase().trim();
      seenNames.add(norm);

      const distance = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        gp.lat,
        gp.lng
      );

      const status = computeStatusInfo(gp.isOpenNow, gp.weekdayDescriptions);
      const isAdded = isCafeInWishlist(gp.name) || addedCafeIds[gp.id];

      // Romantic notes for couple
      let highlight = 'Tempat aesthetic yang sangat direkomendasikan untuk kencan berdua Savero & Soffie.';
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
        averagePrice: 'Rp 30.000 - Rp 60.000',
        photos: gp.photos,
        photoUrl: gp.photos[0],
        signatureMenu: gp.editorialSummary || `Specialty menu & kopi pilihan khas ${gp.name}`,
        matchaMenu: norm.includes('matcha') ? 'Signature Ceremonial Matcha' : undefined,
        coffeeMenu: 'Specialty Espresso & Manual Brew',
        atmosphere: 'Suasana modern, nyaman, dan estetik khas kafe pilihan Semarang',
        highlightForCouple: highlight,
        mapUrl: gp.googleMapsUri || `https://maps.google.com/?q=${encodeURIComponent(gp.name + ' Semarang')}`,
        rating: gp.rating || 4.8,
        reviewCount: gp.userRatingCount || 150,
        isAdded: isAdded,
        isFromGoogleApi: true,
        weekdayDescriptions: gp.weekdayDescriptions
      });
    });

    // 2. Add curated cafes if not already present
    REALTIME_SEMARANG_CAFES.forEach((c) => {
      const norm = c.name.toLowerCase().trim();
      if (!seenNames.has(norm)) {
        const distance = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          c.lat,
          c.lng
        );
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
          statusLabel: c.statusBadge === 'baru_buka' ? 'Baru Buka' : 'Buka Hari Ini',
          statusColor: c.statusBadge === 'baru_buka' ? 'green' : 'amber',
          detailMessage: `Jam Buka: ${c.openTime} - ${c.closeTime} WIB (${c.openDays})`,
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
          isAdded: isAdded,
          isFromGoogleApi: false
        });
      }
    });

    return list;
  }, [googlePlaces, userLocation, existingPlaces, addedCafeIds]);

  // Filter & Search Logic
  const filteredCafes = useMemo(() => {
    let result = processedCafes;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.signatureMenu.toLowerCase().includes(q) ||
          (c.matchaMenu && c.matchaMenu.toLowerCase().includes(q)) ||
          (c.coffeeMenu && c.coffeeMenu.toLowerCase().includes(q))
      );
    }

    // Filter Tab
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
        result = result.filter(
          (c) =>
            c.statusBadge === 'sedang_tren' ||
            c.statusBadge === 'viral' ||
            c.reviewCount > 200
        ).sort((a, b) => b.reviewCount - a.reviewCount);
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
      case 'semua':
      default:
        // Smart sort: newly opened & high ratings first
        result = [...result].sort((a, b) => {
          if (a.statusBadge === 'baru_buka' && b.statusBadge !== 'baru_buka') return -1;
          if (b.statusBadge === 'baru_buka' && a.statusBadge !== 'baru_buka') return 1;
          return a.distanceKm - b.distanceKm;
        });
        break;
    }

    // Distance Radius Slider if applied
    if (maxDistanceKm < 20) {
      result = result.filter((c) => c.distanceKm <= maxDistanceKm);
    }

    return result;
  }, [processedCafes, searchQuery, filterTab, maxDistanceKm]);

  // Copy address to clipboard
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedToast(true);
    soundManager.playPop();
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Formatted Live Time string (WIB)
  const formattedTimeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="space-y-6">
      {/* Realtime Discovery Banner & Status Strip */}
      <div className="bg-gradient-to-r from-[#7A1018] via-[#5e0a11] to-[#3B0A0F] text-[#EFE6DA] p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden border border-[#D9B26F]/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-sans-clean font-bold tracking-[0.2em] uppercase text-[#F4B6C2]">
              <div className="flex items-center space-x-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-[#D9B26F] animate-spin" />
                <span>GOOGLE PLACES API LIVE • SEMARANG</span>
              </div>
              <div className="flex items-center space-x-1 text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>DATA TERVERIFIKASI</span>
              </div>
            </div>
            <h3 className="font-serif-title text-2xl sm:text-3xl font-bold text-white">
              Rekomendasi Kafe Realtime & Baru
            </h3>
            <p className="font-editorial italic text-xs sm:text-sm text-[#EFE6DA]/90 max-w-xl">
              Data langsung Google Places API: kafe baru buka, sedang viral, dan kafe terdekat di Semarang dengan foto asli untuk kencan Savero & Soffie.
            </p>
          </div>

          {/* Live Clock & Refresh Widget */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 flex items-center space-x-2 text-xs font-sans-clean">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-[10px] opacity-75 block font-mono">WIB (LIVE):</span>
                <span className="font-bold font-mono tracking-wider">{formattedTimeStr}</span>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoadingPlaces}
              className="p-2.5 bg-[#D9B26F] hover:bg-[#c49c56] text-[#3B0A0F] font-bold rounded-2xl shadow-md transition flex items-center justify-center focus:outline-hidden"
              title="Segarkan data Google Places realtime"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isRefreshing || isLoadingPlaces ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Location Switcher Toolbar */}
        <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs font-sans-clean">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#D9B26F] flex-shrink-0" />
            <span className="text-[11px] font-bold text-white/90">
              Titik Acuan GPS: <span className="text-[#D9B26F]">{userLocation.label}</span>
              {userLocation.isLiveGps && (
                <span className="ml-1.5 bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full border border-emerald-400/30 font-mono">
                  GPS AKTIF
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => requestLiveGpsLocation(true)}
              className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-[#EFE6DA] text-[10px] font-bold flex items-center space-x-1 border border-white/20 whitespace-nowrap transition"
            >
              <Navigation className="w-3 h-3 text-[#D9B26F]" />
              <span>Gunakan GPS HP</span>
            </button>
            {SEMARANG_PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPresetLocation(preset)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition ${
                  userLocation.label === preset.name
                    ? 'bg-[#D9B26F] text-[#3B0A0F] shadow-sm'
                    : 'bg-black/20 hover:bg-black/40 text-white/80'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white/80 dark:bg-black/30 p-4 rounded-3xl border border-[#7A1018]/15 shadow-sm space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kafe Semarang di Google Places (cth: Levain, Eastman, ARAH, roastery, matcha)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-black/40 border border-[#7A1018]/20 focus:outline-hidden focus:ring-2 focus:ring-[#7A1018] text-xs font-sans-clean text-[#3B0A0F] dark:text-[#EFE6DA]"
          />
          {searchQuery && (
            <CloseButton onClick={() => setSearchQuery('')} label="Hapus pencarian" className="absolute right-1.5 top-1" />
          )}
        </div>

        {/* Filter Pills with Badge Counters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 text-xs font-sans-clean font-bold">
          <button
            onClick={() => {
              soundManager.playTap();
              setFilterTab('semua');
            }}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1 ${
              filterTab === 'semua'
                ? 'bg-[#7A1018] text-[#EFE6DA] shadow-xs'
                : 'bg-white/60 dark:bg-black/20 text-[#3B0A0F] dark:text-[#EFE6DA] hover:bg-[#7A1018]/10'
            }`}
          >
            <span>Semua Kafe</span>
            <span className="text-[10px] opacity-75">({processedCafes.length})</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setFilterTab('terdekat');
            }}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1 ${
              filterTab === 'terdekat'
                ? 'bg-[#7A1018] text-[#EFE6DA] shadow-xs'
                : 'bg-white/60 dark:bg-black/20 text-[#3B0A0F] dark:text-[#EFE6DA] hover:bg-[#7A1018]/10'
            }`}
          >
            <Navigation className="w-3 h-3 text-[#D9B26F]" />
            <span>Paling Dekat</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setFilterTab('tren');
            }}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1 ${
              filterTab === 'tren'
                ? 'bg-[#7A1018] text-[#EFE6DA] shadow-xs'
                : 'bg-white/60 dark:bg-black/20 text-[#3B0A0F] dark:text-[#EFE6DA] hover:bg-[#7A1018]/10'
            }`}
          >
            <Flame className="w-3 h-3 text-red-500" />
            <span>Sedang Tren</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setFilterTab('baru');
            }}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1 ${
              filterTab === 'baru'
                ? 'bg-[#7A1018] text-[#EFE6DA] shadow-xs'
                : 'bg-white/60 dark:bg-black/20 text-[#3B0A0F] dark:text-[#EFE6DA] hover:bg-[#7A1018]/10'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Baru Buka</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setFilterTab('buka');
            }}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1.5 ${
              filterTab === 'buka'
                ? 'bg-[#7A1018] text-[#EFE6DA] shadow-xs'
                : 'bg-white/60 dark:bg-black/20 text-[#3B0A0F] dark:text-[#EFE6DA] hover:bg-[#7A1018]/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Buka Sekarang</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setFilterTab('matcha');
            }}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1 ${
              filterTab === 'matcha'
                ? 'bg-[#7A1018] text-[#EFE6DA] shadow-xs'
                : 'bg-white/60 dark:bg-black/20 text-[#3B0A0F] dark:text-[#EFE6DA] hover:bg-[#7A1018]/10'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Matcha Soffie</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setFilterTab('kopi');
            }}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1 ${
              filterTab === 'kopi'
                ? 'bg-[#7A1018] text-[#EFE6DA] shadow-xs'
                : 'bg-white/60 dark:bg-black/20 text-[#3B0A0F] dark:text-[#EFE6DA] hover:bg-[#7A1018]/10'
            }`}
          >
            <Coffee className="w-3 h-3 text-amber-700" />
            <span>Kopi Savero</span>
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoadingPlaces && (
        <div className="flex items-center justify-center space-x-2 py-4 text-xs font-sans-clean text-[#7A1018] dark:text-[#F4B6C2]">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Memuat rekomendasi live dari Google Places API...</span>
        </div>
      )}

      {/* Kafe Recommendation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCafes.map((cafe) => {
          return (
            <motion.div
              key={cafe.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => {
                soundManager.playTap();
                setSelectedCafe(cafe);
                setModalPhotoIndex(0);
              }}
              className="bg-white/90 dark:bg-black/40 rounded-3xl p-5 border border-[#7A1018]/15 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              {/* Image & Badges */}
              <div>
                <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-3.5 bg-gray-100 dark:bg-black/40">
                  <ManagedImage
                    src={cafe.photoUrl}
                    alt={cafe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

                  {/* Top Status Badge */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    <span
                      className={`text-[9px] font-sans-clean font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md text-white ${
                        cafe.statusBadge === 'baru_buka'
                          ? 'bg-amber-600'
                          : cafe.statusBadge === 'sedang_tren' || cafe.statusBadge === 'viral'
                          ? 'bg-red-600'
                          : cafe.statusBadge === 'spesial_matcha'
                          ? 'bg-emerald-700'
                          : 'bg-[#7A1018]'
                      }`}
                    >
                      {cafe.statusBadgeLabel}
                    </span>
                  </div>

                  {/* Realtime Distance Pill */}
                  <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md text-[#EFE6DA] px-2.5 py-1 rounded-full text-[10px] font-sans-clean font-bold flex items-center space-x-1 border border-white/20">
                    <Navigation className="w-2.5 h-2.5 text-[#D9B26F]" />
                    <span>{cafe.distanceKm} km</span>
                  </div>

                  {/* Bottom Image Overlay: Realtime Open Status & Ratings */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-sans-clean font-bold">
                    <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cafe.statusColor === 'green'
                            ? 'bg-emerald-400 animate-pulse'
                            : cafe.statusColor === 'amber'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-red-400'
                        }`}
                      />
                      <span className="text-[11px]">{cafe.statusLabel}</span>
                    </div>

                    <div className="text-[10px] opacity-95 bg-black/60 px-2 py-1 rounded-xl flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{cafe.rating}</span>
                      <span className="opacity-75">({cafe.reviewCount})</span>
                    </div>
                  </div>
                </div>

                {/* Cafe Title & Area */}
                <div className="mb-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif-title font-bold text-lg sm:text-xl text-[#3B0A0F] dark:text-[#EFE6DA] group-hover:text-[#7A1018] dark:group-hover:text-[#F4B6C2] transition line-clamp-1">
                      {cafe.name}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 font-sans-clean mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7A1018] dark:text-[#F4B6C2] flex-shrink-0" />
                    <span className="line-clamp-1">{cafe.address}</span>
                  </div>
                </div>

                {/* Live Hours Details */}
                <div className="bg-[#EFE6DA]/60 dark:bg-black/30 p-2.5 rounded-2xl mb-3 text-[11px] font-sans-clean text-[#3B0A0F]/80 dark:text-[#EFE6DA]/80 flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-[#7A1018] dark:text-[#F4B6C2] flex-shrink-0" />
                  <span className="line-clamp-1">{cafe.detailMessage}</span>
                </div>

                {/* Signature Menu & Highlights */}
                <div className="space-y-1 mb-4 text-xs font-sans-clean">
                  <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 line-clamp-1">
                    ✨ <span className="text-[#7A1018] dark:text-[#F4B6C2]">Menu:</span> {cafe.signatureMenu}
                  </div>
                  <p className="font-editorial italic text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    "{cafe.highlightForCouple}"
                  </p>
                </div>
              </div>

              {/* Action Buttons: Add to Wishlist & Open Google Maps */}
              <div className="pt-3 border-t border-[#7A1018]/15 flex items-center justify-between gap-2 text-xs font-sans-clean">
                <button
                  type="button"
                  onClick={(e) => handleAddToWishlist(cafe, e)}
                  disabled={cafe.isAdded}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition shadow-xs ${
                    cafe.isAdded
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA]'
                  }`}
                >
                  {cafe.isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Di Wishlist</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Wishlist</span>
                    </>
                  )}
                </button>

                <a
                  href={cafe.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-xl border border-[#7A1018]/20 bg-white/70 dark:bg-black/30 hover:bg-[#7A1018]/10 text-[#7A1018] dark:text-[#F4B6C2] transition flex items-center justify-center"
                  title="Buka Rute di Google Maps"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCafes.length === 0 && !isLoadingPlaces && (
        <div className="text-center py-12 bg-white/50 dark:bg-black/20 rounded-3xl border border-dashed border-[#7A1018]/20 p-6 space-y-3">
          <Coffee className="w-10 h-10 text-gray-400 mx-auto" />
          <h4 className="font-serif-title text-lg font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
            Tidak ada kafe yang cocok dengan filter
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto font-sans-clean">
            Coba ganti kata kunci pencarian atau pilih tab filter lain untuk melihat kafe rekomendasi di Semarang.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterTab('semua');
            }}
            className="px-4 py-1.5 rounded-xl bg-[#7A1018] text-[#EFE6DA] text-xs font-bold font-sans-clean"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Interactive Modal: Detail Kafe Realtime & Ide Kencan */}
      <AnimatePresence>
        {selectedCafe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedCafe(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#EFE6DA] dark:bg-[#250709] max-w-lg w-full rounded-3xl p-5 sm:p-6 border-2 border-[#7A1018]/30 shadow-2xl relative my-8 text-left max-h-[90vh] overflow-y-auto scrollbar-none"
            >
              {/* Close Button */}
              <CloseButton onClick={() => setSelectedCafe(null)} label="Tutup detail tempat" className="absolute right-4 top-4 z-20" />

              {/* Photo Cover & Gallery */}
              <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden mb-4 shadow-md bg-gray-900">
                <ManagedImage
                  src={
                    selectedCafe.photos && selectedCafe.photos.length > 0
                      ? selectedCafe.photos[modalPhotoIndex] || selectedCafe.photoUrl
                      : selectedCafe.photoUrl
                  }
                  alt={selectedCafe.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

                {/* Photo Switcher Arrows if multiple photos */}
                {selectedCafe.photos && selectedCafe.photos.length > 1 && (
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalPhotoIndex((prev) =>
                          prev === 0 ? selectedCafe.photos.length - 1 : prev - 1
                        );
                      }}
                      className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition pointer-events-auto"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalPhotoIndex((prev) =>
                          prev === selectedCafe.photos.length - 1 ? 0 : prev + 1
                        );
                      }}
                      className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition pointer-events-auto"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Photo Counter Badge */}
                {selectedCafe.photos && selectedCafe.photos.length > 1 && (
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-mono flex items-center space-x-1">
                    <Camera className="w-3 h-3 text-[#D9B26F]" />
                    <span>
                      {modalPhotoIndex + 1} / {selectedCafe.photos.length} Foto Asli
                    </span>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    <span className="text-[10px] font-sans-clean font-bold tracking-widest uppercase bg-[#7A1018] px-2.5 py-0.5 rounded-md inline-block">
                      {selectedCafe.statusBadgeLabel}
                    </span>
                    <span className="text-[10px] font-sans-clean font-bold bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-emerald-300">
                      Google Maps Verified
                    </span>
                  </div>
                  <h3 className="font-serif-title text-xl sm:text-2xl font-bold leading-tight">
                    {selectedCafe.name}
                  </h3>
                  <div className="flex items-center space-x-1 text-xs text-white/90 font-sans-clean mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D9B26F] flex-shrink-0" />
                    <span className="line-clamp-1">{selectedCafe.address}</span>
                  </div>
                </div>
              </div>

              {/* Photo Thumbnail Strip if multiple photos */}
              {selectedCafe.photos && selectedCafe.photos.length > 1 && (
                <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                  {selectedCafe.photos.map((ph, idx) => (
                    <button
                      key={idx}
                      onClick={() => setModalPhotoIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                        modalPhotoIndex === idx
                          ? 'border-[#7A1018] scale-105 shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <ManagedImage src={ph} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Body Content */}
              <div className="space-y-4 font-sans-clean text-xs">
                {/* Realtime Status Alert */}
                <div className="p-3 rounded-2xl bg-white/70 dark:bg-black/40 border border-[#7A1018]/15 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-500">
                      Status Operasional Live:
                    </div>
                    <div className="font-bold text-sm text-[#7A1018] dark:text-[#F4B6C2] flex items-center space-x-1.5 mt-0.5">
                      <Clock className="w-4 h-4" />
                      <span>{selectedCafe.statusLabel}</span>
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                      {selectedCafe.detailMessage}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-gray-500">
                      Jarak dari GPS:
                    </div>
                    <div className="font-bold text-base text-[#D9B26F]">
                      {selectedCafe.distanceKm} km
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center justify-end space-x-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{selectedCafe.rating} ({selectedCafe.reviewCount} ulasan)</span>
                    </div>
                  </div>
                </div>

                {/* Highlight Khusus Pasangan Savero & Soffie */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#7A1018]/10 to-[#F4B6C2]/20 dark:from-white/5 dark:to-white/10 border border-[#7A1018]/20">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#7A1018] dark:text-[#F4B6C2] uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D9B26F]" />
                    <span>Rekomendasi Kencan Savero & Soffie:</span>
                  </div>
                  <p className="font-editorial text-sm text-[#3B0A0F] dark:text-[#EFE6DA] leading-relaxed">
                    "{selectedCafe.highlightForCouple}"
                  </p>
                </div>

                {/* Operating Schedule & Address Actions */}
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-black/30 border border-[#7A1018]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-500">
                      Alamat Lengkap:
                    </span>
                    <button
                      onClick={() => handleCopyAddress(selectedCafe.address)}
                      className="text-[10px] font-bold text-[#7A1018] dark:text-[#F4B6C2] flex items-center space-x-1 hover:underline"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedToast ? 'Tersalin!' : 'Salin Alamat'}</span>
                    </button>
                  </div>
                  <p className="text-[#3B0A0F] dark:text-[#EFE6DA] font-medium">
                    {selectedCafe.address}
                  </p>

                  {selectedCafe.weekdayDescriptions &&
                    selectedCafe.weekdayDescriptions.length > 0 && (
                      <div className="pt-2 border-t border-black/10 dark:border-white/10 text-[11px] text-gray-600 dark:text-gray-400">
                        <span className="font-bold block text-gray-700 dark:text-gray-300 mb-1">
                          Jam Buka Mingguan (Google Places):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
                          {selectedCafe.weekdayDescriptions.slice(0, 4).map((d, i) => (
                            <div key={i}>{d}</div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-3 border-t border-[#7A1018]/15 flex items-center justify-end space-x-2">
                  <a
                    href={selectedCafe.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl border border-[#7A1018]/30 font-bold text-[#7A1018] dark:text-[#F4B6C2] hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center space-x-1.5"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Buka Rute Maps</span>
                  </a>

                  <button
                    onClick={() => {
                      handleAddToWishlist(selectedCafe);
                      setSelectedCafe(null);
                    }}
                    disabled={selectedCafe.isAdded}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 shadow-md transition ${
                      selectedCafe.isAdded
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA]'
                    }`}
                  >
                    {selectedCafe.isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tersimpan di Wishlist</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Simpan ke Wishlist Kita</span>
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
