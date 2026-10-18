// src/utils/caption.ts

/**
 * Jalur Squircle Presisi (ViewBox 0 0 400 400)
 * Mengikuti bingkai dengan border-radius 22% (88px) dan padding dalam 28px dari tepi foto.
 * Titik awal: (28, 230) -> Naik lurus ke (28, 96) -> Belok di sudut kiri atas ke (96, 28) -> Lurus di tepi atas ke (310, 28)
 */
export const SQUIRCLE_CURVE_PATH =
  'M 28,230 L 28,96 C 28,46 46,28 96,28 L 304,28 C 354,28 372,46 372,96';

export const getCurvedCaptionFontSize = (text: string): number => {
  const len = text.trim().length;
  if (len <= 10) return 18.5;
  if (len <= 20) return 16.5;
  if (len <= 32) return 15;
  return 13.5;
};

export const getCurvedCaptionStartOffset = (text: string): string => {
  const len = text.trim().length;
  // Mengatur posisi mulai agar selalu memeluk sudut kiri atas dengan manis
  if (len <= 8) return '24%';
  if (len <= 16) return '16%';
  if (len <= 26) return '10%';
  return '5%';
};