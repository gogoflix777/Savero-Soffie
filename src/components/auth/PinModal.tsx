import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Heart, Shield, KeyRound, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../../utils/audio';
import { AnimatedHeart, AnimatedSparkles } from '../common/AnimatedIcons';

interface PinModalProps {
  correctPin: string;
  onSuccess: () => void;
  onEnterGuestMode: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  correctPin,
  onSuccess,
  onEnterGuestMode
}) => {
  const [pinInput, setPinInput] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleDigit = (digit: string) => {
    soundManager.playTap();
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setHasError(false);

      if (next.length === 4) {
        if (next === correctPin) {
          soundManager.playChime();
          onSuccess();
        } else {
          setHasError(true);
          setTimeout(() => {
            setPinInput('');
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    soundManager.playTap();
    setPinInput((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  const handleAutoFillDefault = () => {
    soundManager.playChime();
    setPinInput(correctPin);
    setTimeout(() => {
      onSuccess();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f0507]/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#EFE6DA] dark:bg-[#250709] max-w-sm w-full rounded-3xl p-7 border-2 border-[#7A1018]/30 shadow-2xl text-center relative"
      >
        {/* Top Heart Emblem */}
        <div className="w-16 h-16 rounded-full bg-[#7A1018] text-[#EFE6DA] flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-[#D9B26F]/50">
          <AnimatedHeart className="w-8 h-8 fill-[#F4B6C2] text-[#F4B6C2]" />
        </div>

        <h2 className="font-serif-title text-2xl font-bold text-[#7A1018] dark:text-[#F4B6C2] tracking-wider uppercase">
          Savero & Soffie
        </h2>
        <p className="font-editorial italic text-xs text-[#3B0A0F]/70 dark:text-[#EFE6DA]/70 mt-1 mb-4">
          Ruang privat cinta di Semarang. Masukkan 4 digit PIN untuk membuka kenangan.
        </p>

        {/* PIN Banner Callout */}
        <div className="mb-5 bg-[#7A1018]/10 dark:bg-white/10 p-2.5 rounded-2xl border border-[#7A1018]/20 flex items-center justify-between text-xs font-sans-clean">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-[#7A1018] dark:text-[#F4B6C2] block">
              KUNCI PIN RAHASIA:
            </span>
            <span className="font-mono font-black text-[#7A1018] dark:text-[#EFE6DA] tracking-widest text-sm">
              {correctPin || '2608'}
            </span>
            <span className="text-[9px] text-gray-500 block">
              (Tanggal Jadian 26 Agustus)
            </span>
          </div>

          <button
            type="button"
            onClick={handleAutoFillDefault}
            className="px-3 py-1.5 bg-[#7A1018] text-[#EFE6DA] rounded-xl font-bold text-[11px] shadow-sm hover:bg-[#5e0a11] transition flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3 text-[#D9B26F]" />
            <span>Buka Langsung</span>
          </button>
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < pinInput.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasError
                    ? 'bg-red-500 animate-bounce'
                    : isFilled
                    ? 'bg-[#7A1018] dark:bg-[#F4B6C2] scale-125 shadow-md'
                    : 'border-2 border-[#7A1018]/40 dark:border-white/20'
                }`}
              />
            );
          })}
        </div>

        {hasError && (
          <p className="text-xs font-sans-clean font-bold text-red-600 mb-3 animate-shake">
            PIN salah. Coba lagi atau gunakan PIN {correctPin}.
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-13 rounded-2xl bg-white/70 dark:bg-black/30 hover:bg-[#7A1018] hover:text-[#EFE6DA] dark:hover:bg-[#7A1018] text-[#3B0A0F] dark:text-[#EFE6DA] text-xl font-bold font-serif-title border border-[#7A1018]/15 shadow-xs active:scale-95 transition-all"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-13 rounded-2xl bg-white/70 dark:bg-black/30 hover:bg-[#7A1018] hover:text-[#EFE6DA] text-[#3B0A0F] dark:text-[#EFE6DA] text-xl font-bold font-serif-title border border-[#7A1018]/15 shadow-xs active:scale-95 transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-13 rounded-2xl bg-white/40 dark:bg-black/20 text-[#3B0A0F] dark:text-[#EFE6DA] text-xs font-sans-clean font-bold tracking-wider uppercase border border-[#7A1018]/15 active:scale-95 transition-all flex items-center justify-center"
          >
            HAPUS
          </button>
        </div>

        {/* Guest Mode Fallback */}
        <div className="pt-3 border-t border-[#7A1018]/15 flex items-center justify-between text-xs font-sans-clean">
          <span className="text-[10px] text-gray-500">
            Situs Privat Savero & Soffie
          </span>

          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              onEnterGuestMode();
            }}
            className="text-[#7A1018] dark:text-[#F4B6C2] font-bold hover:underline flex items-center space-x-1"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Mode Tamu &rarr;</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
