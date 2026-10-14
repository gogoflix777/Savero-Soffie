import React from 'react';
import { Heart } from 'lucide-react';

export const MarqueeTicker: React.FC = () => {
  const phrases = [
    '24 Maret 2026 • Pertemuan Pertama di Mie Gacoan',
    '26 Agustus 2026 • Kencan Pertama Taichan Pleburan 23.23',
    'Night Ride Jangli – Undip Menembus Fajar 05.38',
    'Savero Pramudika Arya Wibowo & Soffie Aulia Fatikhasari',
    'Keadilan di Meja Hijau, Kehangatan di Pelukan',
    'Stetoskop Merawat Pasien, Senyummu Menenangkan Hatiku',
    'Semarang, Saksi Bisu Setiap Sudut Kenangan Kita',
    'Secangkir Kopi Hangat Savero & Segelas Matcha Manis Soffie',
    'Setiap Hari Adalah Lembaran Baru Kisah Kita'
  ];

  return (
    <div className="bg-[#1f0507] text-[#EFE6DA] py-2 overflow-hidden border-y border-[#7A1018]/30 select-none">
      <div className="animate-marquee flex items-center space-x-6 whitespace-nowrap text-xs font-sans-clean tracking-[0.2em] uppercase font-medium">
        {phrases.concat(phrases).map((phrase, idx) => (
          <div key={idx} className="flex items-center space-x-4">
            <span className="text-[#F4B6C2]/90 hover:text-white transition-colors">{phrase}</span>
            <Heart className="w-3.5 h-3.5 fill-[#7A1018] text-[#F4B6C2] inline-block flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
