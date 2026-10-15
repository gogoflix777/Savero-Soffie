import React, { useState, useEffect, useCallback } from 'react';
import { ManagedImage } from '../common/ManagedImage';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coffee,
  Hotel,
  MapPin,
  Navigation,
  RefreshCw,
  Star,
  ExternalLink,
  Sparkles,
  Clock,
  Plus,
  Check,
  Flame,
  Wifi,
  Car,
  Phone
} from 'lucide-react';
import { WishlistPlace, AppSettings } from '../../types';
import { getGoogleMapsApiKey } from '../../config/env';
import { soundManager } from '../../utils/audio';

const API_KEY = getGoogleMapsApiKey();

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  area: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  photos: string[];
  isOpenNow?: boolean;
  weekdayDescriptions?: string[];
  googleMapsUri: string;
  priceLevel?: string;
  editorialSummary?: string;
  primaryType?: string;
  tag: string;
  tagLabel: string;
  distanceKm: number;
}

function calcDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// Build real Google Places photo URL via Vite proxy
function buildPhotoUrl(photoName: string): string {
  return `/api/places/photo?name=${encodeURIComponent(photoName)}`;
}

async function fetchPlaces(
  textQuery: string,
  userLat: number,
  userLng: number,
  tag: string,
  tagLabel: string
): Promise<PlaceResult[]> {
  try {
    const res = await fetch('/api/places/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 12,
        locationBias: {
          circle: {
            center: { latitude: userLat, longitude: userLng },
            radius: 10000.0
          }
        }
      })
    });

    if (!res.ok) throw new Error('Proxy failed');
    const data = await res.json();
    if (!data.places || !Array.isArray(data.places)) return [];

    return data.places.map((p: any, idx: number) => {
      const name = p.displayName?.text || p.displayName || 'Tempat';
      const address = p.formattedAddress || 'Semarang';
      const parts = address.split(',');
      const area = parts.length > 2 ? (parts[parts.length - 4]?.trim() || parts[1]?.trim() || 'Semarang') : 'Semarang';
      const lat = p.location?.latitude ?? userLat;
      const lng = p.location?.longitude ?? userLng;

      // Build real photo URLs
      const photos: string[] = [];
      if (p.photos && Array.isArray(p.photos)) {
        p.photos.slice(0, 5).forEach((ph: any) => {
          if (ph.name) photos.push(buildPhotoUrl(ph.name));
        });
      }
      return {
        id: p.id || `place-${idx}-${Date.now()}`,
        name,
        address,
        area,
        lat,
        lng,
        rating: p.rating || 4.5,
        reviewCount: p.userRatingCount || 50,
        photos,
        isOpenNow: p.regularOpeningHours?.openNow,
        weekdayDescriptions: p.regularOpeningHours?.weekdayDescriptions || [],
        googleMapsUri: p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' Semarang')}`,
        priceLevel: p.priceLevel,
        editorialSummary: p.editorialSummary?.text,
        primaryType: p.primaryType,
        tag,
        tagLabel,
        distanceKm: calcDist(userLat, userLng, lat, lng)
      };
    });
  } catch (err) {
    console.warn('Places fetch error:', err);
    return [];
  }
}

interface RealtimePlacesHubProps {
  existingPlaces: WishlistPlace[];
  onAddPlace: (place: WishlistPlace) => void;
  settings: AppSettings;
}

export const RealtimePlacesHub: React.FC<RealtimePlacesHubProps> = ({
  existingPlaces,
  onAddPlace,
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'kafe' | 'penginapan'>('kafe');
  const [cafes, setCafes] = useState<PlaceResult[]>([]);
  const [hotels, setHotels] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [userLat, setUserLat] = useState(-6.9932);
  const [userLng, setUserLng] = useState(110.4203);
  const [gpsLabel, setGpsLabel] = useState('Pleburan, Semarang');
  const [photoErrors, setPhotoErrors] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cafeResults, hotelResults] = await Promise.all([
        fetchPlaces(
          'cafe coffee shop aesthetic hits terbaik Semarang',
          userLat, userLng,
          'sedang_tren', 'Kafe Populer Semarang'
        ),
        fetchPlaces(
          'hotel penginapan kost guest house Semarang',
          userLat, userLng,
          'penginapan', 'Penginapan Semarang'
        )
      ]);
      setCafes(cafeResults);
      setHotels(hotelResults);
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng]);

  useEffect(() => {
    // Try to get live GPS first
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setGpsLabel('Lokasi GPS Anda');
      },
      () => {} // silently use default
    );
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddToWishlist = (place: PlaceResult, type: 'kafe' | 'penginapan') => {
    soundManager.playSuccess();
    const newPlace: WishlistPlace = {
      id: 'wplace-' + Date.now(),
      name: place.name,
      category: type === 'kafe' ? 'kafe' : 'hotel',
      area: place.area,
      budgetEstimate: 'sedang',
      priority: 'sedang',
      requestedBy: 'Berdua',
      notes: place.editorialSummary || `Rating Google: ${place.rating} (${place.reviewCount} ulasan)`,
      mapUrl: place.googleMapsUri,
      tags: ['Google Places', type === 'kafe' ? 'Kafe' : 'Penginapan', place.area],
      createdAt: new Date().toISOString().split('T')[0],
      isVisited: false
    };
    onAddPlace(newPlace);
    setAddedIds(prev => ({ ...prev, [place.id]: true }));
  };

  const isInWishlist = (name: string) =>
    existingPlaces.some(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());

  const currentList = activeTab === 'kafe' ? cafes : hotels;

  const priceLevelLabel = (level?: string) => {
    if (!level) return '';
    if (level.includes('INEXPENSIVE')) return '• Budget';
    if (level.includes('MODERATE')) return '• Sedang';
    if (level.includes('EXPENSIVE')) return '• Premium';
    if (level.includes('VERY_EXPENSIVE')) return '• Mewah';
    return '';
  };

  return (
    <section className="py-10 px-4 bg-[#EFE6DA] dark:bg-[#1a0507] border-t border-[#7A1018]/10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>JELAJAHI SEMARANG</span>
              <span className="flex items-center space-x-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE</span>
              </span>
            </div>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
              Rekomendasi Kafe & Penginapan
            </h2>
            <p className="font-editorial italic text-xs sm:text-sm text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 mt-0.5">
              Temukan tempat nyaman untuk kencan berikutnya.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center space-x-1.5 bg-white/70 dark:bg-black/30 px-3 py-1.5 rounded-xl border border-[#7A1018]/15 text-[11px] font-sans-clean">
              <MapPin className="w-3.5 h-3.5 text-[#7A1018]" />
              <span className="text-[#3B0A0F] dark:text-[#EFE6DA] font-medium">{gpsLabel}</span>
            </div>
            <button
              onClick={() => { soundManager.playTap(); loadData(); }}
              disabled={loading}
              className="p-2 bg-[#7A1018] hover:bg-[#5e0a11] text-white rounded-xl shadow transition"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-white/60 dark:bg-black/20 p-1.5 rounded-2xl border border-[#7A1018]/15 w-fit shadow-sm">
          <button
            onClick={() => { soundManager.playTap(); setActiveTab('kafe'); }}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-sans-clean font-bold transition-all ${
              activeTab === 'kafe'
                ? 'bg-[#7A1018] text-[#EFE6DA] shadow-md'
                : 'text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 hover:bg-[#7A1018]/10'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Kafe & Resto</span>
            {cafes.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'kafe' ? 'bg-white/20' : 'bg-[#7A1018]/10'}`}>
                {cafes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { soundManager.playTap(); setActiveTab('penginapan'); }}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-sans-clean font-bold transition-all ${
              activeTab === 'penginapan'
                ? 'bg-[#7A1018] text-[#EFE6DA] shadow-md'
                : 'text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 hover:bg-[#7A1018]/10'
            }`}
          >
            <Hotel className="w-4 h-4" />
            <span>Hotel & Penginapan</span>
            {hotels.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'penginapan' ? 'bg-white/20' : 'bg-[#7A1018]/10'}`}>
                {hotels.length}
              </span>
            )}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center space-x-3 py-12 text-sm font-sans-clean text-[#7A1018] dark:text-[#F4B6C2]">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Mencari tempat menarik di sekitar...</span>
          </div>
        )}

        {/* Cards Grid */}
        {!loading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {currentList.length === 0 && !loading && (
                <div className="col-span-full text-center py-12 text-sm font-sans-clean text-gray-500 dark:text-gray-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Belum ada rekomendasi saat ini. Coba muat ulang sebentar lagi.</p>
                </div>
              )}

              {currentList.map((place, idx) => {
                const alreadyAdded = isInWishlist(place.name) || addedIds[place.id];
                const mainPhoto = place.photos[0];
                const hasPhotoError = photoErrors[place.id];

                return (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className="bg-white/90 dark:bg-black/40 rounded-3xl overflow-hidden border border-[#7A1018]/15 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                  >
                    {/* Photo */}
                    <div className="relative h-48 w-full bg-gray-100 dark:bg-black/40 overflow-hidden flex-shrink-0">
                      {mainPhoto && !hasPhotoError ? <ManagedImage
                        src={mainPhoto}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                        onError={() => setPhotoErrors(prev => ({ ...prev, [place.id]: true }))}
                      /> : <div className="w-full h-full flex items-center justify-center text-center px-6 text-sm text-gray-500 bg-[#e8ddd0] dark:bg-white/5">Foto Google belum tersedia untuk tempat ini</div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Status badge */}
                      <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                        {place.isOpenNow === true && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center space-x-1 shadow">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                            <span>Buka</span>
                          </span>
                        )}
                        {place.isOpenNow === false && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shadow">
                            Tutup
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600/80 text-white shadow">
                            Google Places
                          </span>
                      </div>

                      {/* Distance */}
                      <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1">
                        <Navigation className="w-2.5 h-2.5 text-[#D9B26F]" />
                        <span>{place.distanceKm} km</span>
                      </div>

                      {/* Rating bottom */}
                      <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1 text-white">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold">{place.rating.toFixed(1)}</span>
                        <span className="text-[10px] opacity-75">({place.reviewCount})</span>
                        <span className="text-[10px] opacity-75">{priceLevelLabel(place.priceLevel)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                      <div>
                        <h3 className="font-serif-title font-bold text-sm text-[#3B0A0F] dark:text-[#EFE6DA] line-clamp-1 group-hover:text-[#7A1018] dark:group-hover:text-[#F4B6C2] transition-colors">
                          {place.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-sans-clean flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="line-clamp-1">{place.area}</span>
                        </p>

                        {place.editorialSummary && (
                          <p className="text-[11px] font-editorial text-[#3B0A0F]/80 dark:text-[#EFE6DA]/70 mt-2 line-clamp-2 italic">
                            {place.editorialSummary}
                          </p>
                        )}

                        {/* Opening hours snippet */}
                        {place.weekdayDescriptions && place.weekdayDescriptions.length > 0 && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-sans-clean mt-1.5 flex items-start space-x-1">
                            <Clock className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{place.weekdayDescriptions[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]}</span>
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#7A1018]/10">
                        <a
                          href={place.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center space-x-1 text-[11px] font-bold text-[#7A1018] dark:text-[#F4B6C2] hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Maps</span>
                        </a>

                        <button
                          onClick={() => handleAddToWishlist(place, activeTab)}
                          disabled={alreadyAdded}
                          className={`flex items-center space-x-1 text-[11px] font-bold px-3 py-1.5 rounded-xl transition shadow-sm ${
                            alreadyAdded
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-default'
                              : 'bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA]'
                          }`}
                        >
                          {alreadyAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Tersimpan</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Wishlist</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Attribution */}
        <p className="text-center text-[10px] font-sans-clean text-gray-400 dark:text-gray-600">
          Data &amp; foto disediakan oleh{' '}
          <a href="https://developers.google.com/maps/documentation/places/web-service" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#7A1018]">
            Google Places API (New)
          </a>{' '}
          · Diperbarui secara realtime
        </p>
      </div>
    </section>
  );
};
