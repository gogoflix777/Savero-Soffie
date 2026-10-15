import React, { useCallback, useEffect, useState } from 'react';
import { EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { soundManager } from '../../utils/audio';

interface PinModalProps {
  correctPin: string;
  onSuccess: () => void;
  onEnterGuestMode: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ correctPin, onSuccess, onEnterGuestMode }) => {
  const [pinInput, setPinInput] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    soundManager.playTap();
    if (pinInput.length >= 4) return;
    const next = pinInput + digit;
    setPinInput(next);
    setHasError(false);
    if (next.length === 4) {
      if (next === correctPin) {
        window.setTimeout(() => {
          soundManager.playChime();
          onSuccess();
        }, 140);
      } else {
        setHasError(true);
        window.setTimeout(() => {
          setPinInput('');
          setHasError(false);
        }, 700);
      }
    }
  }, [correctPin, onSuccess, pinInput]);

  const handleBackspace = useCallback(() => {
    soundManager.playTap();
    setPinInput((current) => current.slice(0, -1));
    setHasError(false);
  }, []);

  useEffect(() => {
    const handleKeyboardInput = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        handleDigit(event.key);
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyboardInput);
    return () => window.removeEventListener('keydown', handleKeyboardInput);
  }, [handleBackspace, handleDigit]);

  return (
    <div className="pin-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-modal-title"
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="pin-modal-card my-auto w-full max-w-[360px] rounded-[28px] px-5 pb-5 pt-6 text-center sm:px-7 sm:pb-6 sm:pt-7"
      >
        <div className="pin-modal-logo mx-auto mb-3 flex h-[78px] w-[78px] items-center justify-center rounded-full p-1.5">
          <img src="/logo/logo%20couple%203d.png" alt="Logo Savero dan Soffie" className="h-full w-full object-contain" />
        </div>

        <h2 id="pin-modal-title" className="font-sans-clean text-xl font-extrabold tracking-tight text-[var(--theme-ink)] sm:text-2xl">
          Savero &amp; Soffie
        </h2>
        <p className="mx-auto mb-5 mt-1 max-w-[270px] font-sans-clean text-xs leading-relaxed text-[var(--theme-muted)]">
          Masukkan PIN 4 digit untuk membuka kenangan.
        </p>

        <div className="mb-5 flex items-center justify-center gap-4" role="status" aria-label={`${pinInput.length} dari 4 digit PIN terisi`}>
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`pin-entry-dot ${hasError ? 'is-error' : index < pinInput.length ? 'is-filled' : ''}`}
            />
          ))}
        </div>

        {hasError && (
          <p role="alert" className="mb-3 font-sans-clean text-xs font-bold text-[var(--theme-brand-strong)]">
            PIN salah. Silakan coba lagi.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5" aria-label="Keypad PIN">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button key={digit} type="button" onClick={() => handleDigit(digit)} className="pin-key" aria-label={`Angka ${digit}`}>
              {digit}
            </button>
          ))}
          <span aria-hidden="true" />
          <button type="button" onClick={() => handleDigit('0')} className="pin-key" aria-label="Angka 0">0</button>
          <button type="button" onClick={handleBackspace} className="pin-key pin-key-delete" aria-label="Hapus satu angka">Hapus</button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-[var(--theme-border)] pt-3 font-sans-clean">
          <span className="text-[10px] text-[var(--theme-muted)]">Situs privat Savero &amp; Soffie</span>
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              onEnterGuestMode();
            }}
            className="pin-guest-button inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold text-[var(--theme-brand-strong)] transition-colors"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Mode Tamu</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
