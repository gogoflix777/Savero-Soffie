import React from 'react';
import { X } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface CloseButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onClick, label = 'Tutup', className = '' }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={() => {
      soundManager.playClose();
      onClick();
    }}
    className={`app-close-button ${className}`}
  >
    <X aria-hidden="true" className="h-5 w-5" />
  </button>
);
