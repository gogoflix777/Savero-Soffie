import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Filter,
  ExternalLink,
  Heart,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Navigation,
  Layers,
  Crosshair,
  Compass,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  ChevronRight,
  Route as RouteIcon,
  Maximize2
} from 'lucide-react';
import { MemoryPin, PinCategory, AppSettings } from '../../types';
import { soundManager } from '../../utils/audio';
import { AnimatedHeart, AnimatedSparkles } from '../common/AnimatedIcons';
import { getGoogleMapsApiKey } from '../../config/env';

interface MemoryMapProps {
  pins: MemoryPin[];
  settings: AppSettings;
  onAddPin: (newPin: MemoryPin) => void;
  onUpdatePin: (updatedPin: MemoryPin) => void;
  onDeletePin: (pinId: string) => void;
  selectedPinId?: string | null;
}

// Sophisticated custom SVG glyphs for map markers (No standard emojis)
const CATEGORY_SVGS: Record<PinCategory, string> = {
  kafe: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B0A0F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4h8Z"/><path d="M6 17v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"/></svg>',
  restoran: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A1018" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M5 2v4a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2"/><path d="M8 9v13"/></svg>',
  hotel: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A1018" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',
  motel: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>',
  rekreasi: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B0A0F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>',
  pantai: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D47A1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
  gunung: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
  bioskop: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A148C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 7h5"/><path d="M17 17h5"/></svg>',
  taman: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-7"/><path d="M12 15a5 5 0 1 0-5-5c0 3 2.5 5 5 5Z"/><path d="M12 15a5 5 0 1 1 5-5c0 3-2.5 5-5 5Z"/></svg>',
  rumah: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BF360C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  kos: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E65100" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  jalan: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#263238" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>',
  lainnya: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E2723" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
};

const CATEGORY_ICONS: Record<PinCategory, { color: string; label: string }> = {
  kafe: { color: '#C9A58B', label: 'Kafe' },
  restoran: { color: '#F4B6C2', label: 'Restoran' },
  hotel: { color: '#D9B26F', label: 'Hotel' },
  motel: { color: '#7A1018', label: 'Motel' },
  rekreasi: { color: '#BFD8B8', label: 'Rekreasi' },
  pantai: { color: '#90CAF9', label: 'Pantai' },
  gunung: { color: '#A5D6A7', label: 'Gunung' },
  bioskop: { color: '#CE93D8', label: 'Bioskop' },
  taman: { color: '#81C784', label: 'Taman' },
  rumah: { color: '#FFAB91', label: 'Rumah' },
  kos: { color: '#FFE082', label: 'Kos' },
  jalan: { color: '#B0BEC5', label: 'Jalan / Rute' },
  lainnya: { color: '#BCAAA4', label: 'Lainnya' }
};

// Google Maps API Key dari .env
const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();

// Tile map menggunakan Google Maps API key
// lyrs=m → Road/Street | lyrs=s → Satellite | lyrs=y → Hybrid
const MAP_TILES = {
  voyager: {
    name: 'Warm Romance (Krem)',
    // Google Maps Road tile — pakai API key dari env
    url: GOOGLE_MAPS_API_KEY
      ? `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: GOOGLE_MAPS_API_KEY ? '&copy; Google Maps' : '&copy; Esri &copy; OpenStreetMap',
    subdomains: GOOGLE_MAPS_API_KEY ? '0123' : ''
  },
  dark: {
    name: 'Cinematic Noir',
    // Google tidak punya dark tile — pakai ArcGIS Dark Gray Canvas
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; HERE &copy; DeLorme',
    subdomains: ''
  },
  satellite: {
    name: 'Satelit Realistis',
    // Google Maps Satellite tile — pakai API key dari env
    url: GOOGLE_MAPS_API_KEY
      ? `https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: GOOGLE_MAPS_API_KEY ? '&copy; Google Maps' : '&copy; Esri &amp; contributors',
    subdomains: GOOGLE_MAPS_API_KEY ? '0123' : ''
  }
};

// Preset Quick Jumps in Semarang for effortless exploration
const QUICK_SPOTS = [
  { id: 'pin-1', label: 'Mie Gacoan', sub: 'Pertemuan Pertama', lat: -7.004128, lng: 110.419234 },
  { id: 'pin-2', label: 'Kafe Unika', sub: '01.30 Dini Hari', lat: -7.0215, lng: 110.4072 },
  { id: 'pin-3', label: 'Taichan Pleburan', sub: 'Kencan 23.23', lat: -6.9957834, lng: 110.423215 },
  { id: 'pin-4', label: 'Jangli - Undip', sub: 'Night Ride Fajar', lat: -7.038, lng: 110.435 },
  { id: 'pin-5', label: 'Alam Indah', sub: 'Motel Pertama', lat: -7.0392, lng: 110.4225 },
  { id: 'pin-6', label: 'Rumah Savero', sub: 'Semarang', lat: -6.985, lng: 110.41 },
  { id: 'pin-7', label: 'Rumah Soffie', sub: 'Semarang', lat: -7.012, lng: 110.438 },
  { id: 'pin-8', label: 'Kos Soffie', sub: 'Turus Asri III', lat: -7.057831, lng: 110.447910 }
];

export const MemoryMapSection: React.FC<MemoryMapProps> = ({
  pins,
  settings,
  onAddPin,
  onUpdatePin,
  onDeletePin,
  selectedPinId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const replayPolylineRef = useRef<L.Polyline | null>(null);
  const replayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [activeTile, setActiveTile] = useState<'voyager' | 'dark' | 'satellite'>('voyager');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchPinQuery, setSearchPinQuery] = useState('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);

  // Active selected pin highlight
  const [highlightedPinId, setHighlightedPinId] = useState<string | null>(selectedPinId || null);

  // Modal State for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<MemoryPin | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    date: '2026-10-14',
    time: '20:00',
    description: '',
    photos: '',
    rating: 5,
    tags: '',
    category: 'kafe' as PinCategory,
    mapUrl: '',
    status: 'visited' as 'visited' | 'wishlist',
    addedBy: 'Berdua' as 'Savero' | 'Soffie' | 'Berdua',
    lat: -6.9957834,
    lng: 110.423215,
    isSensitive: false
  });

  // Filter Pins
  const filteredPins = pins.filter((p) => {
    if (settings.isGuestMode && p.isSensitive) return false;
    if (activeCategoryFilter !== 'all' && p.category !== activeCategoryFilter) return false;
    if (searchPinQuery) {
      const q = searchPinQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center Semarang (-7.015, 110.425)
    const map = L.map(mapContainerRef.current, {
      center: [-7.015, 110.425],
      zoom: 13,
      zoomControl: false
    });

    const tileMeta = MAP_TILES[activeTile];
    const initialTileLayer = L.tileLayer(tileMeta.url, {
      attribution: tileMeta.attribution,
      subdomains: tileMeta.subdomains ?? 'abcd',
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = initialTileLayer;

    // Add custom zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Map click handler to place a new pin easily
    map.on('click', (e: L.LeafletMouseEvent) => {
      soundManager.playTap();
      setEditingPin(null);
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        description: '',
        photos: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        rating: 5,
        tags: 'Semarang, Kenangan Kita',
        category: 'kafe',
        mapUrl: `https://www.google.com/maps?q=${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`,
        status: 'visited',
        addedBy: 'Berdua',
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        isSensitive: false
      });
      setIsFormOpen(true);
    });

    mapInstanceRef.current = map;

    return () => {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Switching
  const changeTile = (tileKey: 'voyager' | 'dark' | 'satellite') => {
    soundManager.playTap();
    setActiveTile(tileKey);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const tileMeta = MAP_TILES[tileKey];
    const newLayer = L.tileLayer(tileMeta.url, {
      attribution: tileMeta.attribution,
      subdomains: tileMeta.subdomains ?? 'abcd',
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = newLayer;
  };

  // Fly to Pin with cinematic smooth camera
  const flyToPin = (pin: MemoryPin) => {
    soundManager.playTap();
    setHighlightedPinId(pin.id);
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([pin.lat, pin.lng], 16, {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.25
    });

    setTimeout(() => {
      if (markersRef.current[pin.id]) {
        markersRef.current[pin.id].openPopup();
      }
    }, 1250);
  };

  // Update Markers when filteredPins change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    filteredPins.forEach((pin) => {
      const meta = CATEGORY_ICONS[pin.category] || CATEGORY_ICONS.lainnya;
      const isSelected = highlightedPinId === pin.id;

      // Custom Pastel 3D Clay Pin with animated halo
      const iconHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div class="pin-beacon" style="background: ${meta.color}; opacity: ${isSelected ? 0.9 : 0.4};"></div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: ${meta.color};
            border: 3px solid #7A1018;
            box-shadow: 0 8px 18px rgba(122, 16, 24, 0.4);
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <div style="
              transform: rotate(45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              user-select: none;
            ">${CATEGORY_SVGS[pin.category] || CATEGORY_SVGS.lainnya}</div>
          </div>
          ${isSelected ? `<div style="position: absolute; -top: 10px; animation: heartbeat 1.5s infinite;"><svg width="20" height="20" viewBox="0 0 24 24" fill="#7A1018" stroke="#F4B6C2" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></div>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-pastel-pin-container',
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -44]
      });

      const marker = L.marker([pin.lat, pin.lng], {
        icon: customIcon,
        draggable: true
      }).addTo(map);

      // Handle marker drag
      marker.on('dragend', (ev) => {
        const target = ev.target as L.Marker;
        const newPos = target.getLatLng();
        onUpdatePin({
          ...pin,
          lat: newPos.lat,
          lng: newPos.lng
        });
      });

      marker.on('click', () => {
        setHighlightedPinId(pin.id);
        soundManager.playTap();
      });

      // Pure SVG Heart Rating Generator (Zero Emojis)
      const renderHeartSvgString = (score: number) => {
        let res = '';
        for (let i = 1; i <= 5; i++) {
          const filled = i <= score;
          res += `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${filled ? '#7A1018' : 'none'}" stroke="${filled ? '#7A1018' : '#bbb'}" stroke-width="2" style="display:inline-block; margin-right:2px;">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          `;
        }
        return res;
      };

      // Romantic Popup Design (Strictly No Emojis)
      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 240px; background: #EFE6DA; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.18);">
          ${pin.photos && pin.photos[0] ? `
            <div style="width: 100%; height: 115px; overflow: hidden; position: relative;">
              <img src="${pin.photos[0]}" style="width: 100%; height: 100%; object-fit: cover;" />
              <div style="position: absolute; top: 6px; left: 6px; background: #7A1018; color: #EFE6DA; font-size: 9px; font-weight: bold; padding: 2px 7px; border-radius: 6px; text-transform: uppercase;">
                ${meta.label}
              </div>
            </div>
          ` : `
            <div style="padding: 8px 12px 0 12px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #7A1018;">${meta.label}</span>
              <span style="font-size: 10px; color: #777;">${pin.date}</span>
            </div>
          `}
          
          <div style="padding: 10px 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; font-size: 10px; color: #666; font-weight: 600;">
              <span>${pin.date} ${pin.time ? `• ${pin.time}` : ''}</span>
            </div>
            <h4 style="font-family: 'Bodoni Moda', serif; font-size: 15px; font-weight: bold; margin: 0 0 4px 0; color: #3B0A0F;">${pin.title}</h4>
            <p style="font-size: 11px; color: #444; margin: 0 0 8px 0; line-height: 1.4;">${pin.description}</p>
            <div style="margin-bottom: 8px;">${renderHeartSvgString(pin.rating)}</div>
            
            <div style="display: flex; gap: 6px; justify-content: space-between; border-top: 1px solid rgba(122,16,24,0.15); padding-top: 8px;">
              <span style="font-size: 9px; color: #777; align-self: center;">Oleh: <strong>${pin.addedBy}</strong></span>
              ${pin.mapUrl ? `
                <a href="${pin.mapUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 10px; font-weight: bold; background: #7A1018; color: #EFE6DA; padding: 4px 10px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                  Buka Maps &rarr;
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'romantic-leaflet-popup',
        maxWidth: 280
      });

      markersRef.current[pin.id] = marker;
    });

    // Auto open selected pin if passed
    if (highlightedPinId && markersRef.current[highlightedPinId]) {
      const targetPin = pins.find((p) => p.id === highlightedPinId);
      if (targetPin) {
        map.flyTo([targetPin.lat, targetPin.lng], 16, { animate: true, duration: 1 });
        setTimeout(() => {
          markersRef.current[highlightedPinId]?.openPopup();
        }, 1100);
      }
    }
  }, [filteredPins, highlightedPinId]);

  // Route Replay Feature (Animated Trajectory between chronological memory pins)
  const startRouteReplay = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    soundManager.playChime();
    setIsReplaying(true);
    setReplayIdx(0);

    const sorted = [...pins]
      .filter((p) => !(settings.isGuestMode && p.isSensitive))
      .sort((a, b) => new Date(`${a.date} ${a.time || '00:00'}`).getTime() - new Date(`${b.date} ${b.time || '00:00'}`).getTime());

    if (sorted.length < 2) {
      alert('Perjalanan butuh minimal 2 pin untuk diputar ulang.');
      setIsReplaying(false);
      return;
    }

    if (replayPolylineRef.current) replayPolylineRef.current.remove();

    const latlngs = sorted.map((p) => [p.lat, p.lng] as [number, number]);

    // Animated dashed glowing line
    const polyline = L.polyline(latlngs, {
      color: '#7A1018',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85
    }).addTo(map);

    replayPolylineRef.current = polyline;
    map.fitBounds(polyline.getBounds(), { padding: [50, 50], animate: true });

    let current = 0;
    replayIntervalRef.current = setInterval(() => {
      if (current >= sorted.length) {
        clearInterval(replayIntervalRef.current!);
        setIsReplaying(false);
        soundManager.playChime();
        return;
      }

      const p = sorted[current];
      setReplayIdx(current);
      setHighlightedPinId(p.id);

      map.panTo([p.lat, p.lng], { animate: true, duration: 1.2 });
      if (markersRef.current[p.id]) {
        markersRef.current[p.id].openPopup();
      }

      current++;
    }, 2800);
  };

  const stopRouteReplay = () => {
    if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    if (replayPolylineRef.current) replayPolylineRef.current.remove();
    setIsReplaying(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const photosArr = formData.photos
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const tagsArr = formData.tags
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingPin) {
      onUpdatePin({
        ...editingPin,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        description: formData.description,
        photos: photosArr.length > 0 ? photosArr : editingPin.photos,
        rating: formData.rating,
        tags: tagsArr,
        category: formData.category,
        mapUrl: formData.mapUrl,
        status: formData.status,
        addedBy: formData.addedBy,
        lat: formData.lat,
        lng: formData.lng,
        isSensitive: formData.isSensitive
      });
    } else {
      const newPin: MemoryPin = {
        id: 'pin-' + Date.now(),
        title: formData.title,
        date: formData.date,
        time: formData.time,
        description: formData.description,
        photos: photosArr,
        rating: formData.rating,
        tags: tagsArr,
        category: formData.category,
        mapUrl: formData.mapUrl,
        status: formData.status,
        addedBy: formData.addedBy,
        lat: formData.lat,
        lng: formData.lng,
        isSensitive: formData.isSensitive
      };
      onAddPin(newPin);
      setHighlightedPinId(newPin.id);
    }

    setIsFormOpen(false);
    setEditingPin(null);
  };

  return (
    <section id="peta-kenangan" className="py-12 px-3 sm:px-6 bg-[#EFE6DA] dark:bg-[#1a0507] border-b border-[#7A1018]/15 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-sans-clean font-bold tracking-[0.25em] uppercase text-[#7A1018] dark:text-[#F4B6C2] mb-1">
              <MapPin className="w-4 h-4 text-[#7A1018] dark:text-[#F4B6C2]" />
              <span>JEJAK LANGKAH DI KOTA SEMARANG</span>
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
              Peta Kenangan Savero & Soffie
            </h2>
            <p className="font-editorial italic text-xs sm:text-sm text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 mt-0.5">
              Klik titik kenangan untuk melihat cerita, atau ketuk langsung di peta untuk menandai tempat baru kita.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (isReplaying) stopRouteReplay();
                else startRouteReplay();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-sans-clean font-bold shadow-md transition flex items-center space-x-2 ${
                isReplaying
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-[#7A1018] text-[#EFE6DA] hover:bg-[#5e0a11]'
              }`}
            >
              {isReplaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isReplaying ? 'Hentikan Putar Jejak' : 'Putar Ulang Perjalanan'}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playTap();
                setEditingPin(null);
                setFormData({
                  title: '',
                  date: new Date().toISOString().split('T')[0],
                  time: '20:00',
                  description: '',
                  photos: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
                  rating: 5,
                  tags: 'Semarang, Kencan',
                  category: 'kafe',
                  mapUrl: '',
                  status: 'visited',
                  addedBy: 'Berdua',
                  lat: -6.9957834,
                  lng: 110.423215,
                  isSensitive: false
                });
                setIsFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-sans-clean font-bold bg-white/80 dark:bg-black/40 text-[#7A1018] dark:text-[#F4B6C2] border border-[#7A1018]/25 hover:bg-[#7A1018] hover:text-[#EFE6DA] transition shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pin Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Location Chips Bar ("Loncat Cepat ke Tempat Kenangan") */}
        <div className="bg-white/70 dark:bg-black/30 p-3 rounded-2xl border border-[#7A1018]/15 shadow-xs">
          <div className="flex items-center space-x-2 text-[10px] font-sans-clean font-bold tracking-wider text-[#7A1018] dark:text-[#F4B6C2] uppercase mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>PILIH CEPAT LOKASI UTAMA SEMARANG:</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
            {QUICK_SPOTS.map((spot) => {
              const matchedPin = pins.find((p) => p.id === spot.id || p.title.toLowerCase().includes(spot.label.toLowerCase()));
              return (
                <button
                  key={spot.id}
                  onClick={() => {
                    if (matchedPin) {
                      flyToPin(matchedPin);
                    } else {
                      mapInstanceRef.current?.flyTo([spot.lat, spot.lng], 16, { animate: true });
                    }
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#EFE6DA]/80 dark:bg-black/50 hover:bg-[#7A1018] hover:text-[#EFE6DA] dark:hover:bg-[#7A1018] text-[#3B0A0F] dark:text-[#EFE6DA] text-xs font-sans-clean border border-[#7A1018]/15 transition-all flex items-center space-x-1.5 shadow-xs"
                >
                  <MapPin className="w-3 h-3 text-[#7A1018] dark:text-[#F4B6C2]" />
                  <span className="font-bold">{spot.label}</span>
                  <span className="text-[10px] opacity-70">({spot.sub})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Ribbon (Search, Filters, Map Tiles) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-sans-clean">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={searchPinQuery}
              onChange={(e) => setSearchPinQuery(e.target.value)}
              placeholder="Cari tempat, catatan, atau tag..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 dark:bg-black/40 border border-[#7A1018]/20 focus:outline-hidden focus:ring-2 focus:ring-[#7A1018] text-xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 whitespace-nowrap ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#7A1018] text-[#EFE6DA] shadow-xs'
                  : 'bg-white/60 dark:bg-black/30 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>Semua ({pins.length})</span>
            </button>
            {(['restoran', 'kafe', 'motel', 'jalan', 'rumah', 'kos', 'rekreasi'] as PinCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition capitalize whitespace-nowrap flex items-center space-x-1 ${
                  activeCategoryFilter === cat
                    ? 'bg-[#7A1018] text-[#EFE6DA] font-bold shadow-xs'
                    : 'bg-white/60 dark:bg-black/30 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{CATEGORY_ICONS[cat]?.label || cat}</span>
              </button>
            ))}
          </div>

          {/* Map Tile Layers */}
          <div className="flex items-center space-x-1 bg-white/70 dark:bg-black/30 p-1 rounded-xl border border-[#7A1018]/15 flex-shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#7A1018] dark:text-[#F4B6C2] ml-1.5 mr-1" />
            {(['voyager', 'dark', 'satellite'] as const).map((tileKey) => (
              <button
                key={tileKey}
                onClick={() => changeTile(tileKey)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  activeTile === tileKey
                    ? 'bg-[#7A1018] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-black'
                }`}
              >
                {tileKey === 'voyager' ? 'Krem' : tileKey === 'dark' ? 'Noir' : 'Satelit'}
              </button>
            ))}
          </div>
        </div>

        {/* Map Viewport Container */}
        <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border-2 border-[#7A1018]/30 shadow-2xl">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Replay HUD Overlay */}
          {isReplaying && (
            <div className="absolute top-4 left-4 z-20 bg-[#7A1018]/95 text-[#EFE6DA] px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md border border-[#D9B26F]/40 flex items-center space-x-3">
              <RouteIcon className="w-4 h-4 animate-spin text-[#D9B26F]" />
              <div className="text-xs font-sans-clean">
                <span className="font-bold block">Memutar Perjalanan Kisah...</span>
                <span className="text-[10px] text-[#EFE6DA]/80">Titik {replayIdx + 1} dari {filteredPins.length}</span>
              </div>
            </div>
          )}

          {/* Tap-to-add Helper Badge */}
          <div className="absolute bottom-4 right-4 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#7A1018]/20 shadow-md text-[10px] font-sans-clean font-bold text-[#7A1018] dark:text-[#F4B6C2] pointer-events-none flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-[#D9B26F]" />
            <span>Ketuk area peta mana saja untuk menambah pin kenangan</span>
          </div>
        </div>

        {/* Horizontal Pin Cards Carousel (Fast Inspection below map) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-sans-clean">
            <span className="font-bold text-[#7A1018] dark:text-[#F4B6C2] uppercase tracking-wider">
              DAFTAR PIN KENANGAN ({filteredPins.length} LOKASI)
            </span>
            <span className="text-gray-500">Geser untuk memilih kartu</span>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-4 pt-1 scrollbar-none">
            {filteredPins.map((pin) => {
              const meta = CATEGORY_ICONS[pin.category] || CATEGORY_ICONS.lainnya;
              const isSelected = highlightedPinId === pin.id;

              return (
                <div
                  key={pin.id}
                  onClick={() => flyToPin(pin)}
                  className={`flex-shrink-0 w-72 rounded-2xl p-3.5 bg-white/80 dark:bg-black/40 border transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#7A1018] dark:border-[#F4B6C2] ring-2 ring-[#7A1018]/30 dark:ring-[#F4B6C2]/30 scale-[1.02]'
                      : 'border-[#7A1018]/15 hover:border-[#7A1018]/40'
                  }`}
                >
                  <div>
                    {pin.photos && pin.photos[0] && (
                      <div className="w-full h-32 rounded-xl overflow-hidden mb-2 relative">
                        <img src={pin.photos[0]} alt={pin.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[#7A1018] text-[#EFE6DA]">
                          {meta.label}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-sans-clean mb-1">
                      <Calendar className="w-3 h-3 text-[#7A1018]" />
                      <span>{pin.date} {pin.time ? `• ${pin.time}` : ''}</span>
                    </div>

                    <h4 className="font-serif-title font-bold text-sm text-[#3B0A0F] dark:text-[#EFE6DA] line-clamp-1 mb-1">
                      {pin.title}
                    </h4>

                    <p className="text-xs text-gray-600 dark:text-gray-300 font-editorial line-clamp-2 mb-2">
                      {pin.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#7A1018]/10 text-xs font-sans-clean">
                    <span className="text-[10px] text-gray-500">Oleh: <strong>{pin.addedBy}</strong></span>
                    {pin.mapUrl && (
                      <a
                        href={pin.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#7A1018] dark:text-[#F4B6C2] font-bold hover:underline flex items-center space-x-1 text-[11px]"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Add or Edit Memory Pin */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#EFE6DA] dark:bg-[#250709] max-w-lg w-full rounded-3xl p-6 border-2 border-[#7A1018]/30 shadow-2xl my-8"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#7A1018]/15 mb-4">
                  <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                    {editingPin ? 'Ubah Pin Kenangan' : 'Tambah Titik Kenangan Baru'}
                  </h3>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="text-gray-500 hover:text-black font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans-clean">
                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Nama Tempat / Momen
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Contoh: Kencan Taichan Pleburan"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20 focus:outline-hidden focus:ring-1 focus:ring-[#7A1018]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">Jam (WIB)</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">Kategori</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as PinCategory })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                      >
                        {(Object.keys(CATEGORY_ICONS) as PinCategory[]).map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_ICONS[cat].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">Ditambahkan Oleh</label>
                      <select
                        value={formData.addedBy}
                        onChange={(e) => setFormData({ ...formData, addedBy: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                      >
                        <option value="Berdua">Berdua</option>
                        <option value="Savero">Savero</option>
                        <option value="Soffie">Soffie</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Cerita / Deskripsi Romantis
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Apa yang membuat momen ini begitu berkesan bagi kita..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Tautan Foto (Pisahkan dengan koma bila lebih dari satu)
                    </label>
                    <input
                      type="text"
                      value={formData.photos}
                      onChange={(e) => setFormData({ ...formData, photos: e.target.value })}
                      placeholder="https://images.unsplash.com/..., https://..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Tautan Google Maps Asli (Opsional)
                    </label>
                    <input
                      type="url"
                      value={formData.mapUrl}
                      onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20 text-xs"
                    />
                  </div>

                  {/* Rating Selector using SVG Hearts (Zero Emojis) */}
                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Rating Hati Momen (1-5)
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 focus:outline-hidden hover:scale-125 transition"
                        >
                          <Heart
                            className={`w-6 h-6 ${
                              star <= formData.rating
                                ? 'fill-[#7A1018] text-[#7A1018] dark:fill-[#F4B6C2] dark:text-[#F4B6C2]'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="isSensitiveMap"
                      checked={formData.isSensitive}
                      onChange={(e) => setFormData({ ...formData, isSensitive: e.target.checked })}
                      className="rounded text-[#7A1018] focus:ring-[#7A1018]"
                    />
                    <label htmlFor="isSensitiveMap" className="text-gray-600 dark:text-gray-300">
                      Sembunyikan pin ini saat Mode Tamu aktif (Privasi)
                    </label>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#7A1018]/15">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 rounded-xl bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] font-bold shadow-md"
                    >
                      Simpan Titik Kenangan
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
