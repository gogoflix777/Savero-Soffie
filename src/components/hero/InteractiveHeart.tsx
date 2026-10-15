import React, { useId, useRef, useState } from 'react';

interface InteractiveHeartProps {
  className?: string;
  onTap?: (point: { x: number; y: number }) => void;
}

export const InteractiveHeart: React.FC<InteractiveHeartProps> = ({ className = '', onTap }) => {
  const gradientId = `puffy-heart-gradient-${useId().replace(/:/g, '')}`;
  const filterId = `puffy-heart-shadow-${useId().replace(/:/g, '')}`;
  const popTimer = useRef<number | null>(null);
  const [isPopping, setIsPopping] = useState(false);

  const handleTap = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsPopping(false);
    window.requestAnimationFrame(() => setIsPopping(true));
    if (popTimer.current) window.clearTimeout(popTimer.current);
    popTimer.current = window.setTimeout(() => setIsPopping(false), 650);
    onTap?.({ x: event.clientX, y: event.clientY });
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label="Ketuk hati untuk mengirim cinta"
      className={`interactive-puffy-heart ${isPopping ? 'jelly-active' : ''} ${className}`}
    >
      <svg viewBox="0 0 200 185" role="img" aria-hidden="true" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id={gradientId} cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#ffd4e0" />
            <stop offset="45%" stopColor="#f4829e" />
            <stop offset="85%" stopColor="#d94b70" />
            <stop offset="100%" stopColor="#a82849" />
          </radialGradient>
          <filter id={filterId} x="-15%" y="-12%" width="130%" height="135%">
            <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#d94b70" floodOpacity=".34" />
          </filter>
        </defs>
        <path
          d="M100 172C100 172 20 120 20 62C20 30 45 12 72 12C88 12 96 21 100 28C104 21 112 12 128 12C155 12 180 30 180 62C180 120 100 172 100 172Z"
          fill={`url(#${gradientId})`}
          filter={`url(#${filterId})`}
        />
        <ellipse cx="62" cy="46" rx="18" ry="10" transform="rotate(-25 62 46)" fill="white" fillOpacity=".55" />
        <circle cx="46" cy="64" r="5" fill="white" fillOpacity=".42" />
      </svg>
    </button>
  );
};
