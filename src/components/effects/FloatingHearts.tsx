import React, { useMemo } from 'react';

type ParticleType = 'heart' | 'sparkle' | 'leaf' | 'petal';

interface ParticleDef {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  type: ParticleType;
  color: string;
  drift: number;
}

const TYPES: ParticleType[] = ['heart', 'sparkle', 'leaf', 'petal'];
const COLORS = ['#F4B6C2', '#D9B26F', '#BFD8B8', '#E8C5C8', '#f87171'];

export const FloatingHearts: React.FC = React.memo(() => {
  // Pre-calculate fixed, deterministic particle parameters (zero continuous state updates)
  const particles = useMemo<ParticleDef[]>(() => {
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      x: (i * 6.25 + (Math.sin(i * 99) * 3)) % 96 + 2,
      size: 13 + (i % 4) * 3.5,
      duration: 14 + (i % 5) * 2.8,
      delay: (i * 1.3) % 12,
      opacity: 0.18 + (i % 3) * 0.1,
      type: TYPES[i % TYPES.length],
      color: COLORS[i % COLORS.length],
      drift: (i % 2 === 0 ? 1 : -1) * (12 + (i % 3) * 6)
    }));
  }, []);

  const renderIcon = (type: ParticleType, size: number, color: string) => {
    switch (type) {
      case 'heart':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case 'sparkle':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
        );
      case 'leaf':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
        );
      case 'petal':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 3.31 1.79 6.2 4.46 7.76.77.45 1.73-.02 1.89-.9l.71-3.92c.11-.63.66-1.08 1.3-1.08h1.28c.64 0 1.19.45 1.3 1.08l.71 3.92c.16.88 1.12 1.35 1.89.9C18.21 18.2 20 15.31 20 12c0-4.97-4.03-9-9-9z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="ambient-floating-particle"
          style={{
            left: `${p.x}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `-${p.delay}s`,
            ['--drift-x' as string]: `${p.drift}px`,
            filter: 'drop-shadow(0 2px 4px rgba(122, 16, 24, 0.12))'
          }}
        >
          {renderIcon(p.type, p.size, p.color)}
        </div>
      ))}
    </div>
  );
});

FloatingHearts.displayName = 'FloatingHearts';
