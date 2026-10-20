import { MoodExpression, CoupleProfile } from '../types';

export interface MoodOption {
  id: MoodExpression;
  label: string;
  asset: string;
}

export const moodOptions: MoodOption[] = [
  { id: 'bahagia', label: 'Senang', asset: 'bahagia' },
  { id: 'rindu', label: 'Rindu', asset: 'gemas-sayang' },
  { id: 'tenang', label: 'Tenang', asset: 'serius' },
  { id: 'semangat', label: 'Semangat', asset: 'semangat' },
  { id: 'lelah', label: 'Lelah', asset: 'mengantuk' },
  { id: 'sedih', label: 'Sedih', asset: 'sedih' }
];

export const moodImage = (profile: CoupleProfile, mood: MoodExpression): string => {
  const asset = moodOptions.find((option) => option.id === mood)?.asset ?? 'bahagia';
  return `/characters/expressions/${profile.toLowerCase()}/${asset}.webp`;
};
