import React, { useEffect, useId, useRef, useState } from 'react';
import { Crown, Flower2, Heart, Sparkles, Star } from 'lucide-react';

interface InteractiveHeartProps {
  className?: string;
  fillLevel?: number;
  meetingCount?: number;
  meetingLocked?: boolean;
  meetingProgress?: number;
  profileName?: 'Savero' | 'Soffie';
  percentage?: number;
  readOnly?: boolean;
  onProgressChange?: (percentage: number) => void;
  onMeetingProgressChange?: (percentage: number) => void;
  onTap?: (point: { x: number; y: number }, profile?: 'Savero' | 'Soffie') => void;
  onMeetingConfirm?: () => Promise<boolean>;
}

const HOLD_DURATION = 1500;
const MEETING_FILL_DURATION = 5000;
const HOLD_DELAY = 155;
const HEART_PROGRESS_PER_SECOND = 30;
const HEART_PATH =
  'M100,178 C100,178 22,126 22,68 C22,36 47,16 74,16 C91,16 100,28 100,36 C100,28 109,16 126,16 C153,16 178,36 178,68 C178,126 100,178 100,178 Z';

const buildReferenceWavePath = (levelY: number, phase: number, amplitude: number, frequency: number, slope = 0) => {
  let path = `M -20 210 L -20 ${levelY}`;
  for (let x = -20; x <= 220; x += 12) {
    path += ` L ${x} ${(levelY + (x - 100) * slope + Math.sin(x * frequency + phase) * amplitude).toFixed(1)}`;
  }
  return `${path} L 220 210 Z`;
};

interface FloatingParticle {
  x: number;
  y: number;
  speed: number;
  phase: number;
  radius?: number;
}

// Synthesizer Web Audio API internal agar suara gelembung, squishy jelly, dan fanfare langsung berbunyi tanpa perlu file audio eksternal
class HeartSoundEngine {
  private ctx: AudioContext | null = null;
  private lastStreamTick = 0;
  private lastUpwellingTick = 0;

  private init(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playSquishDown() {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.085);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playReferenceTap(levelRatio: number) {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;
    const base = 340 + levelRatio * 540;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * 0.78, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.11);
    osc.frequency.exponentialRampToValueAtTime(base * 1.12, now + 0.21);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  playTapBounce(levelRatio = 0.5) {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Suara lentingan jelly
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.11);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.22);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);

    // Suara tetesan air (droplet plink)
    const dropOsc = ctx.createOscillator();
    const dropGain = ctx.createGain();
    const baseFreq = 480 + levelRatio * 360;
    dropOsc.type = 'sine';
    dropOsc.frequency.setValueAtTime(baseFreq, now + 0.02);
    dropOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.65, now + 0.13);
    dropGain.gain.setValueAtTime(0.1, now + 0.02);
    dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    dropOsc.connect(dropGain);
    dropGain.connect(ctx.destination);
    dropOsc.start(now + 0.02);
    dropOsc.stop(now + 0.15);
  }

  playHoldBubbleTick(progress: number) {
    const nowMs = performance.now();
    if (nowMs - this.lastStreamTick < 75) return;
    this.lastStreamTick = nowMs;

    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = 320 + progress * 560 + (Math.random() * 45 - 22);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.38, now + 0.065);
    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  playReferenceUpwelling(levelRatio: number) {
    const nowMs = performance.now();
    if (nowMs - this.lastUpwellingTick < 65) return;
    this.lastUpwellingTick = nowMs;
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;
    const frequency = 280 + levelRatio * 640 + (Math.random() * 50 - 25);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency * 0.85, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.25, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playSingleHeart100Chime() {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const start = now + index * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.52);
    });
  }

  playFullClimaxFanfare() {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Arpeggio harpa kristal + akor bahagia
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.07;
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.75);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.78);
    });
  }
}

const heartAudio = new HeartSoundEngine();

export const InteractiveHeart: React.FC<InteractiveHeartProps> = ({
  className = '',
  fillLevel = 0,
  meetingCount = 0,
  meetingLocked = false,
  meetingProgress = 0,
  profileName,
  percentage,
  readOnly = false,
  onProgressChange,
  onMeetingProgressChange,
  onTap,
  onMeetingConfirm
}) => {
  const uid = useId().replace(/:/g, '');
  const gradientId = `puffy-heart-gradient-${uid}`;
  const liquidGradId = `puffy-heart-liquid-${uid}`;
  const meetingGradId = `puffy-heart-meeting-${uid}`;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const waveBackRef = useRef<SVGPathElement>(null);
  const waveFrontRef = useRef<SVGPathElement>(null);
  const waveCrestRef = useRef<SVGPathElement>(null);
  const meetingWaveRef = useRef<SVGPathElement>(null);
  const meetingWaveBackRef = useRef<SVGPathElement>(null);
  const meetingWaveFrontRef = useRef<SVGPathElement>(null);
  const upwellingRef = useRef<SVGCircleElement>(null);
  const bubbleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const characterParticleRefs = useRef<Array<SVGTextElement | null>>([]);
  const bubbles = useRef<FloatingParticle[]>(Array.from({ length: 14 }, () => ({
    x: 35 + Math.random() * 130,
    y: 180 + Math.random() * 25,
    speed: 0.55 + Math.random() * 0.85,
    phase: Math.random() * Math.PI * 2,
    radius: 1.8 + Math.random() * 3.2
  })));
  const characterParticles = useRef<FloatingParticle[]>(Array.from({ length: 9 }, () => ({
    x: 42 + Math.random() * 116,
    y: 175 + Math.random() * 30,
    speed: 0.4 + Math.random() * 0.65,
    phase: Math.random() * Math.PI * 2
  })));
  const visualPercentageRef = useRef(percentage ?? 0);
  const targetPercentageRef = useRef(percentage ?? 0);
  const visualMeetingPercentageRef = useRef(meetingProgress);
  const targetMeetingPercentageRef = useRef(meetingProgress);
  const lastAnimationFrameRef = useRef(0);

  const holdFrameRef = useRef<number | null>(null);
  const holdDelayRef = useRef<number | null>(null);
  const physicsFrameRef = useRef<number | null>(null);
  const holdStartRef = useRef(0);
  const holdBasePercentageRef = useRef(0);
  const holdBaseMeetingPercentageRef = useRef(0);
  const lastProgressSaveRef = useRef({ percentage: percentage ?? 0, at: 0 });
  const lastMeetingProgressSaveRef = useRef({ percentage: meetingProgress, at: 0 });
  const lastMeetingHapticRef = useRef(0);
  const holdActiveRef = useRef(false);
  const holdHasStartedRef = useRef(false);
  const meetingConfirmationHoldRef = useRef(false);
  const suppressClickRef = useRef(false);
  const popTimer = useRef<number | null>(null);
  const previousMeetingCountRef = useRef(meetingCount);

  // State Fisika Pegas (Spring Squash & Stretch) + Guncangan Cairan
  const springRef = useRef({
    scaleX: 1,
    scaleY: 1,
    velX: 0,
    velY: 0,
    targetX: 1,
    targetY: 1,
    tiltAngle: 0,
    sloshAngle: 0,
    sloshVel: 0,
    wavePhase: 0,
    wavePhaseFront: 0,
    wavePhaseBack: Math.PI,
    meetingWavePhaseFront: Math.PI * 0.7,
    meetingWavePhaseBack: 0,
    waveEnergy: 1,
    visualFillRatio: 0,
    visualMeetingRatio: 0
  });

  const [isPopping, setIsPopping] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmingMeetingHold, setIsConfirmingMeetingHold] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const isProfileProgressHeart = profileName !== undefined && percentage !== undefined && onProgressChange !== undefined;
  const currentPercentage = Math.min(100, Math.max(0, percentage ?? 0));
  const currentMeetingProgress = Math.min(100, Math.max(0, meetingProgress));
  const isMeetingFillStage = isProfileProgressHeart && currentPercentage >= 100 && !meetingLocked;
  const visiblePercentage = isProfileProgressHeart && currentPercentage < 100 && isHolding && !isConfirmingMeetingHold
    ? Math.max(currentPercentage, Math.round(holdBasePercentageRef.current + holdProgress * (100 - holdBasePercentageRef.current)))
    : currentPercentage;
  const visibleMeetingPercentage = isProfileProgressHeart && currentPercentage >= 100
    ? Math.max(currentMeetingProgress, isHolding && isConfirmingMeetingHold
      ? Math.round(holdBaseMeetingPercentageRef.current + holdProgress * (100 - holdBaseMeetingPercentageRef.current))
      : currentMeetingProgress)
    : currentMeetingProgress;
  targetPercentageRef.current = visiblePercentage;
  targetMeetingPercentageRef.current = visibleMeetingPercentage;

  // Target rasio cairan dari logika asli:
  // 1) fillLevel (0, 1, atau 2 log harian dari Savero & Soffie)
  // 2) meetingFill (progress tahan 1.5 detik + jumlah konfirmasi bertemu hari ini)
  const dailyFillRatio = Math.min(1, Math.max(0, fillLevel / 2));
  const meetingFill = isProfileProgressHeart
    ? 0
    : Math.min(1, (Math.min(2, meetingCount) + (!meetingLocked ? holdProgress : 0)) / 2);
  const isFullClimax = meetingCount >= 2 || fillLevel >= 2 || celebrating;

  useEffect(() => () => {
    if (holdFrameRef.current !== null) window.cancelAnimationFrame(holdFrameRef.current);
    if (holdDelayRef.current !== null) window.clearTimeout(holdDelayRef.current);
    if (physicsFrameRef.current !== null) window.cancelAnimationFrame(physicsFrameRef.current);
    if (popTimer.current) window.clearTimeout(popTimer.current);
  }, []);

  // Trigger perayaan klimaks ketika meetingCount mencapai 2 (keduanya konfirmasi bertemu)
  useEffect(() => {
    if (meetingCount >= 2 && previousMeetingCountRef.current < 2) {
      setCelebrating(true);
      heartAudio.playFullClimaxFanfare();
      // Berikan dorongan lentingan pegas bahagia
      springRef.current.velX += 0.42;
      springRef.current.velY -= 0.38;
      springRef.current.sloshVel += 12;
      window.setTimeout(() => setCelebrating(false), 3200);
    }
    previousMeetingCountRef.current = meetingCount;
  }, [meetingCount]);

  useEffect(() => {
    if (meetingLocked) setHoldProgress(0);
  }, [meetingLocked]);

  // Loop Animasi Fisika Pegas (Squishy Jelly) & Gelombang Sinus Cairan Halus (60fps)
  useEffect(() => {
    let active = true;
    lastAnimationFrameRef.current = performance.now();

    const animatePhysics = (now: number) => {
      if (!active) return;
      const s = springRef.current;
      const dt = Math.min(0.05, Math.max(0, (now - lastAnimationFrameRef.current) / 1000));
      lastAnimationFrameRef.current = now;
      if (isProfileProgressHeart && buttonRef.current) {
        const time = now * 0.001;
        buttonRef.current.style.setProperty('translate', `0 ${(Math.sin(time * 2.1) * 6).toFixed(2)}px`);
        buttonRef.current.style.setProperty('rotate', `${(Math.sin(time * 1.35) * 1.4).toFixed(2)}deg`);
      }

      // Kekenyalan pegas (Hooke's Law dengan redaman kenyal seperti jeli)
      const stiffness = 210;
      const damping = 13;
      s.velX = (s.velX + (s.targetX - s.scaleX) * stiffness * dt) * Math.exp(-damping * dt);
      s.velY = (s.velY + (s.targetY - s.scaleY) * stiffness * dt) * Math.exp(-damping * dt);
      s.scaleX += s.velX * dt * 10;
      s.scaleY += s.velY * dt * 10;

      // Osilasi kemiringan cairan (liquid sloshing)
      const sloshForce = -s.sloshAngle * 0.12;
      s.sloshVel = (s.sloshVel + sloshForce) * 0.88;
      s.sloshAngle += s.sloshVel;

      if (isProfileProgressHeart) {
        const targetLevel = targetPercentageRef.current;
        visualPercentageRef.current += (targetLevel - visualPercentageRef.current) * Math.min(1, dt * 7.5);
        if (Math.abs(targetLevel - visualPercentageRef.current) < 0.05) visualPercentageRef.current = targetLevel;
        const targetMeetingLevel = targetMeetingPercentageRef.current;
        visualMeetingPercentageRef.current += (targetMeetingLevel - visualMeetingPercentageRef.current) * Math.min(1, dt * 4.2);
        if (Math.abs(targetMeetingLevel - visualMeetingPercentageRef.current) < 0.05) visualMeetingPercentageRef.current = targetMeetingLevel;
        const level = visualPercentageRef.current;
        const meetingLevel = visualMeetingPercentageRef.current;
        const glowLevel = Math.min(1, Math.max(0, level / 100));
        if (buttonRef.current) buttonRef.current.style.setProperty('--heart-glow-level', glowLevel.toFixed(3));
        const levelMultiplier = level >= 70 ? 1.35 : level >= 30 ? 1.15 : 1;
        if (holdActiveRef.current) s.waveEnergy = Math.min(2.6, s.waveEnergy + 3.8 * dt);
        s.waveEnergy = Math.max(1, s.waveEnergy - dt * 1.2);
        s.wavePhaseFront += dt * (3.6 + s.waveEnergy * 1.4) * levelMultiplier;
        s.wavePhaseBack -= dt * (2.8 + s.waveEnergy * 1.1) * levelMultiplier;
        const liquidY = 184 - (level / 100) * 172;
        const amplitude = (3.4 + s.waveEnergy * 2.2) * (level > 98 ? 0.35 : 1);
        waveFrontRef.current?.setAttribute('d', buildReferenceWavePath(liquidY, s.wavePhaseFront, amplitude, 0.045));
        waveBackRef.current?.setAttribute('d', buildReferenceWavePath(liquidY - 3.5, s.wavePhaseBack, amplitude * 1.15, 0.038));
        if (level >= 100) {
          s.meetingWavePhaseFront += dt * (0.9 + s.waveEnergy * 0.22);
          s.meetingWavePhaseBack -= dt * (0.72 + s.waveEnergy * 0.18);
          const secondLiquidY = 184 - (meetingLevel / 100) * 172;
          const secondAmplitude = (1.7 + Math.min(1.2, s.waveEnergy * 0.4)) * (meetingLevel > 98 ? 0.25 : 1);
          meetingWaveFrontRef.current?.setAttribute('d', buildReferenceWavePath(secondLiquidY, s.meetingWavePhaseFront, secondAmplitude, 0.032));
          meetingWaveBackRef.current?.setAttribute('d', buildReferenceWavePath(secondLiquidY - 2, s.meetingWavePhaseBack, secondAmplitude * 1.15, 0.028));
        }

        const speedBoost = (holdActiveRef.current ? 2.2 : 1) * levelMultiplier;
        bubbles.current.forEach((bubble, index) => {
          bubble.y -= bubble.speed * speedBoost;
          if (bubble.y < liquidY + 4 || level < 3) {
            bubble.y = 180 + Math.random() * 12;
            bubble.x = 35 + Math.random() * 130;
          }
          const element = bubbleRefs.current[index];
          element?.setAttribute('cx', (bubble.x + Math.sin(now * 0.0022 + bubble.phase) * 4).toFixed(1));
          element?.setAttribute('cy', bubble.y.toFixed(1));
          if (element) element.style.display = level < 2 ? 'none' : 'block';
        });
        characterParticles.current.forEach((particle, index) => {
          particle.y -= particle.speed * speedBoost;
          if (particle.y < liquidY + 8 || level < 25) {
            particle.y = 178 + Math.random() * 14;
            particle.x = 42 + Math.random() * 116;
          }
          const element = characterParticleRefs.current[index];
          element?.setAttribute('x', (particle.x + Math.cos(now * 0.0018 + particle.phase) * 6).toFixed(1));
          element?.setAttribute('y', particle.y.toFixed(1));
          if (element) element.style.display = level < 25 ? 'none' : 'block';
        });
        if (upwellingRef.current) {
          upwellingRef.current.setAttribute('r', (52 + Math.sin(now * 0.022) * 10).toFixed(1));
          const glowOpacity = holdActiveRef.current ? 0.3 + glowLevel * 0.55 : 0;
          upwellingRef.current.setAttribute('opacity', glowOpacity.toFixed(2));
        }
      } else {
        const waveSpeed = holdActiveRef.current ? 0.14 : celebrating ? 0.16 : 0.065;
        const waveAmp = holdActiveRef.current ? 5.2 : celebrating ? 6.0 : 3.2;
        s.wavePhase += waveSpeed;
        const buildLegacyWave = (phase: number, amplitude: number, frequency: number, offset: number, close: boolean) => {
          const points: string[] = [];
          for (let x = -30; x <= 230; x += 10) {
            const y = offset + Math.sin(x * frequency + phase) * amplitude + Math.cos(x * frequency * 0.6 - phase * 0.7) * amplitude * 0.35;
            points.push(`${x === -30 ? 'M' : 'L'}${x} ${y.toFixed(2)}`);
          }
          if (close) points.push('L230 195 L-30 195 Z');
          return points.join(' ');
        };
        waveBackRef.current?.setAttribute('d', buildLegacyWave(s.wavePhase + 1.3, waveAmp * 1.1, 0.045, 6, true));
        waveFrontRef.current?.setAttribute('d', buildLegacyWave(-s.wavePhase * 1.15, waveAmp, 0.05, 9, true));
        waveCrestRef.current?.setAttribute('d', buildLegacyWave(-s.wavePhase * 1.15, waveAmp, 0.05, 9, false));
        meetingWaveRef.current?.setAttribute('d', buildLegacyWave(s.wavePhase * 1.35 + 0.7, waveAmp * 1.15, 0.052, 8, true));
      }

      if (svgRef.current) {
        const holdJitter = holdActiveRef.current ? Math.sin(s.wavePhaseFront * 4.5) * 1.2 : 0;
        svgRef.current.style.setProperty('--jelly-sx', s.scaleX.toFixed(4));
        svgRef.current.style.setProperty('--jelly-sy', s.scaleY.toFixed(4));
        svgRef.current.style.setProperty('--jelly-rot', `${(s.tiltAngle + holdJitter).toFixed(2)}deg`);
        svgRef.current.style.setProperty('--slosh-deg', `${s.sloshAngle.toFixed(2)}deg`);
      }

      physicsFrameRef.current = window.requestAnimationFrame(animatePhysics);
    };

    physicsFrameRef.current = window.requestAnimationFrame(animatePhysics);
    return () => {
      active = false;
      if (physicsFrameRef.current !== null) window.cancelAnimationFrame(physicsFrameRef.current);
    };
  }, [celebrating]);

  const cancelHoldFrame = () => {
    if (holdFrameRef.current !== null) window.cancelAnimationFrame(holdFrameRef.current);
    holdFrameRef.current = null;
  };

  const saveProgress = (nextPercentage: number, force = false) => {
    if (!isProfileProgressHeart || !onProgressChange) return;
    const now = performance.now();
    const next = Math.min(100, Math.max(0, nextPercentage));
    if (
      force ||
      next >= 100 ||
      next - lastProgressSaveRef.current.percentage >= 10 ||
      now - lastProgressSaveRef.current.at >= 500
    ) {
      lastProgressSaveRef.current = { percentage: next, at: now };
      onProgressChange(next);
    }
  };

  const saveMeetingProgress = (nextPercentage: number, force = false) => {
    if (!isProfileProgressHeart || !onMeetingProgressChange) return;
    const now = performance.now();
    const next = Math.min(100, Math.max(0, nextPercentage));
    if (
      force ||
      next >= 100 ||
      next - lastMeetingProgressSaveRef.current.percentage >= 5 ||
      now - lastMeetingProgressSaveRef.current.at >= 400
    ) {
      lastMeetingProgressSaveRef.current = { percentage: next, at: now };
      onMeetingProgressChange(next);
    }
  };

  const completeHold = () => {
    if (!holdActiveRef.current) return;
    const isMeetingConfirmation = meetingConfirmationHoldRef.current;
    holdActiveRef.current = false;
    holdHasStartedRef.current = false;
    meetingConfirmationHoldRef.current = false;
    setIsHolding(false);
    setIsConfirmingMeetingHold(false);
    setHoldProgress(0);

    // Kembalikan bentuk pegas dengan dorongan membal elastis yang kuat
    springRef.current.targetX = 1;
    springRef.current.targetY = 1;
    springRef.current.tiltAngle = 0;
    springRef.current.velX = -0.32;
    springRef.current.velY = 0.36;
    springRef.current.sloshVel += 10;

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 500);
    cancelHoldFrame();

    if (navigator.vibrate) {
      navigator.vibrate(isMeetingConfirmation ? [25, 40, 110, 45, 150] : isProfileProgressHeart ? [24, 35, 65] : meetingCount > 0 ? [35, 40, 75, 30, 120] : [24, 35, 65]);
    }

    if (isMeetingConfirmation) {
      saveMeetingProgress(100, true);
      void onMeetingConfirm?.()
        .then(() => undefined)
        .catch((error: unknown) => {
          console.error('Meeting confirmation failed:', error);
        });
      return;
    }

    if (isProfileProgressHeart) {
      heartAudio.playSingleHeart100Chime();
      saveProgress(100, true);
      return;
    }

    setCelebrating(true);
    heartAudio.playFullClimaxFanfare();
    window.setTimeout(() => setCelebrating(false), 3000);

    void onMeetingConfirm?.()
      .then((saved) => {
        if (!saved) setHoldProgress(0);
      })
      .catch(() => setHoldProgress(0));
  };

  const beginHold = (clientX?: number) => {
    const meetingConfirmationHold = isProfileProgressHeart && currentPercentage >= 100;
    if (readOnly || (isProfileProgressHeart && meetingConfirmationHold && meetingLocked) || (meetingLocked && !isProfileProgressHeart) || holdActiveRef.current) return;
    heartAudio.playSquishDown();

    // Hitung kemiringan berdasarkan titik sentuh kiri/kanan pada hati
    let tilt = 0;
    if (clientX !== undefined && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const relX = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      tilt = Math.max(-8, Math.min(8, relX * 7));
    }

    // Kompresi kenyal saat jari/mouse menekan (squash)
    springRef.current.targetX = 1.15;
    springRef.current.targetY = 0.86;
    springRef.current.tiltAngle = tilt;
    springRef.current.velX += 0.08;
    springRef.current.velY -= 0.08;
    springRef.current.sloshVel += tilt ? tilt * 0.9 : 4.5;
    springRef.current.waveEnergy = 1.9;
    if (isProfileProgressHeart) upwellingRef.current?.setAttribute('opacity', '.85');

    holdActiveRef.current = true;
    holdHasStartedRef.current = false;
    meetingConfirmationHoldRef.current = meetingConfirmationHold;
    holdBasePercentageRef.current = currentPercentage;
    holdBaseMeetingPercentageRef.current = currentMeetingProgress;
    lastProgressSaveRef.current = { percentage: currentPercentage, at: performance.now() };
    lastMeetingProgressSaveRef.current = { percentage: currentMeetingProgress, at: performance.now() };
    setIsHolding(false);
    setHoldProgress(0);

    const tick = (now: number) => {
      if (!holdActiveRef.current) return;
      const elapsed = now - holdStartRef.current;
      const nextPercentage = Math.min(100, holdBasePercentageRef.current + elapsed * HEART_PROGRESS_PER_SECOND / 1000);
      const remainingMeetingDuration = Math.max(1, MEETING_FILL_DURATION * (100 - holdBaseMeetingPercentageRef.current) / 100);
      const progress = meetingConfirmationHoldRef.current
        ? Math.min(1, elapsed / remainingMeetingDuration)
        : isProfileProgressHeart
        ? (nextPercentage - holdBasePercentageRef.current) / Math.max(1, 100 - holdBasePercentageRef.current)
        : Math.min(1, elapsed / HOLD_DURATION);
      setHoldProgress(progress);
      if (isProfileProgressHeart && !meetingConfirmationHoldRef.current) {
        saveProgress(nextPercentage);
      } else if (meetingConfirmationHoldRef.current) {
        saveMeetingProgress(holdBaseMeetingPercentageRef.current + progress * (100 - holdBaseMeetingPercentageRef.current));
        if (navigator.vibrate && now - lastMeetingHapticRef.current >= 850) {
          navigator.vibrate(8);
          lastMeetingHapticRef.current = now;
        }
      }

      // Makin penuh, hati makin memipih kenyal dan mengeluarkan suara gelembung air naik
      springRef.current.targetX = 1.14 + progress * 0.08;
      springRef.current.targetY = 0.87 - progress * 0.07;
      if (isProfileProgressHeart && !meetingConfirmationHoldRef.current) heartAudio.playReferenceUpwelling(nextPercentage / 100);
      else heartAudio.playHoldBubbleTick(progress);

      if (progress >= 1) {
        completeHold();
        return;
      }
      holdFrameRef.current = window.requestAnimationFrame(tick);
    };

    const startFill = () => {
      if (!holdActiveRef.current) return;
      holdHasStartedRef.current = true;
      holdStartRef.current = performance.now();
      setIsHolding(true);
      setIsConfirmingMeetingHold(meetingConfirmationHoldRef.current);
      holdFrameRef.current = window.requestAnimationFrame(tick);
    };
    if (isProfileProgressHeart) {
      holdDelayRef.current = window.setTimeout(startFill, HOLD_DELAY);
    } else {
      startFill();
    }
  };

  const endHold = () => {
    // Lepaskan kompresi pegas agar membal (elastic stretch & wobble)
    springRef.current.targetX = 1;
    springRef.current.targetY = 1;
    springRef.current.tiltAngle = 0;
    springRef.current.velX -= 0.22;
    springRef.current.velY += 0.24;
    springRef.current.sloshVel -= 5.5;

    if (!holdActiveRef.current) return;
    if (!holdHasStartedRef.current) {
      holdActiveRef.current = false;
      if (holdDelayRef.current !== null) window.clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
      upwellingRef.current?.setAttribute('opacity', '0');
      meetingConfirmationHoldRef.current = false;
      setIsHolding(false);
      setIsConfirmingMeetingHold(false);
      setHoldProgress(0);
      return;
    }
    const now = performance.now();
    if (isProfileProgressHeart) {
      const elapsed = Math.max(0, now - holdStartRef.current);
      if (meetingConfirmationHoldRef.current) {
        const remainingMeetingDuration = Math.max(1, MEETING_FILL_DURATION * (100 - holdBaseMeetingPercentageRef.current) / 100);
        const progress = Math.min(1, elapsed / remainingMeetingDuration);
        const nextMeetingPercentage = holdBaseMeetingPercentageRef.current + progress * (100 - holdBaseMeetingPercentageRef.current);
        if (progress >= 1) {
          completeHold();
          return;
        }
        saveMeetingProgress(nextMeetingPercentage, true);
        suppressClickRef.current = true;
        window.setTimeout(() => { suppressClickRef.current = false; }, 500);
        holdActiveRef.current = false;
        holdHasStartedRef.current = false;
        meetingConfirmationHoldRef.current = false;
        cancelHoldFrame();
        setIsHolding(false);
        setIsConfirmingMeetingHold(false);
        setHoldProgress(0);
        return;
      }
      const nextPercentage = Math.min(100, holdBasePercentageRef.current + elapsed * HEART_PROGRESS_PER_SECOND / 1000);
      if (nextPercentage >= 100) {
        completeHold();
        return;
      }
      saveProgress(nextPercentage, true);
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 500);
      holdActiveRef.current = false;
      holdHasStartedRef.current = false;
      cancelHoldFrame();
      setIsHolding(false);
      setHoldProgress((nextPercentage - holdBasePercentageRef.current) / Math.max(1, 100 - holdBasePercentageRef.current));
      return;
    }
    if (now - holdStartRef.current >= HOLD_DURATION) {
      completeHold();
      return;
    }
    holdActiveRef.current = false;
    cancelHoldFrame();
    setIsHolding(false);
    setHoldProgress(0);
  };

  const handleTap = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      return;
    }
    if (readOnly) return;
    // Efek pegas kenyal saat diketuk cepat (Tap)
    springRef.current.velX += 0.28;
    springRef.current.velY -= 0.26;
    springRef.current.sloshVel += (Math.random() > 0.5 ? 1 : -1) * 7;
    if (isProfileProgressHeart) heartAudio.playReferenceTap(currentPercentage / 100);
    else heartAudio.playTapBounce(Math.max(dailyFillRatio, meetingFill));
    if (isProfileProgressHeart) {
      const nextPercentage = Math.min(100, currentPercentage + 5);
      if (currentPercentage < 100 && nextPercentage >= 100) {
        setCelebrating(true);
        heartAudio.playSingleHeart100Chime();
        window.setTimeout(() => setCelebrating(false), 3000);
      }
      saveProgress(nextPercentage, true);
    }

    setIsPopping(false);
    window.requestAnimationFrame(() => setIsPopping(true));
    if (popTimer.current) window.clearTimeout(popTimer.current);
    popTimer.current = window.setTimeout(() => setIsPopping(false), 680);
    onTap?.({ x: event.clientX, y: event.clientY }, profileName);
  };

  // Posisi vertikal cairan sesuai logika asli aplikasi
  const displayDailyFillRatio = isProfileProgressHeart ? visiblePercentage / 100 : dailyFillRatio;
  const liquidTop = isProfileProgressHeart
    ? visiblePercentage >= 100 ? -30 : 172 - displayDailyFillRatio * 152
    : fillLevel >= 2 ? 22 : fillLevel === 1 ? 90 : 172;
  const meetingTop = 172 - meetingFill * 152;
  const effectivePercentage = isProfileProgressHeart ? visiblePercentage : Math.round(Math.max(dailyFillRatio, meetingFill) * 100);
  const liquidColors = profileName === 'Soffie'
    ? ['#ffb8d2', '#ff5c97', '#b81450']
    : ['#ff5c93', '#d90448', '#690222'];

  return (
    <button
      type="button"
      ref={buttonRef}
      disabled={readOnly}
      onClick={handleTap}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* optional pointer capture */
        }
        if (!readOnly) beginHold(event.clientX);
      }}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onKeyDown={(event) => {
        if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
          event.preventDefault();
          beginHold();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') endHold();
      }}
      onBlur={endHold}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={isProfileProgressHeart
        ? `Hati ${profileName}, terisi ${Math.round(visiblePercentage)} persen.${readOnly ? ' Hanya pemilik profil yang dapat mengisi hati ini.' : meetingLocked ? ' Konfirmasi bertemu hari ini sudah tercatat.' : currentPercentage >= 100 ? ' Tahan hingga lima detik untuk mengisi hati kedua dan mengonfirmasi bertemu. Progres dapat dilanjutkan.' : ' Ketuk untuk menambah 5 persen atau tekan-tahan untuk mengisi.'}`
        : `Jar hati: ${Math.min(2, fillLevel)} dari 2 log hari ini. Tekan-tahan selama satu setengah detik untuk konfirmasi bertemu. ${meetingLocked ? 'Konfirmasi kamu hari ini sudah tercatat.' : ''}`}
      aria-valuetext={isHolding ? isConfirmingMeetingHold ? `Liquid kedua ${Math.round(visibleMeetingPercentage)} persen, liquid pertama tetap 100 persen` : `${Math.round(visiblePercentage)} persen` : isProfileProgressHeart ? `${Math.round(isMeetingFillStage ? currentMeetingProgress : currentPercentage)} persen` : undefined}
      aria-pressed={isProfileProgressHeart ? currentPercentage >= 100 : meetingLocked}
      className={`interactive-puffy-heart ${isProfileProgressHeart ? 'profile-progress-heart' : ''} ${visiblePercentage >= 30 ? 'profile-heart-warming' : ''} ${visiblePercentage >= 70 ? 'profile-heart-fever' : ''} ${visiblePercentage >= 100 ? 'profile-heart-charged' : ''} ${isMeetingFillStage ? 'meeting-fill-active' : ''} ${profileName === 'Soffie' ? 'profile-heart-soffie' : ''} ${readOnly ? 'profile-heart-readonly' : ''} ${isPopping ? 'jelly-active' : ''} ${
        isHolding ? 'meeting-holding' : ''
      } ${celebrating ? 'meeting-celebrating' : ''} ${isFullClimax || currentPercentage >= 100 ? 'heart-full-climax' : ''} ${className}`}
    >
      {/* Aura Cahaya & Gelombang Kejut (Shockwave Rings) saat Ditahan atau 100% Penuh */}
      <span className="heart-ambient-aura" aria-hidden="true" />
      {(celebrating || isHolding) && (
        <span className="heart-shockwave-container" aria-hidden="true">
          <span className="heart-shockwave-ring ring-1" />
          <span className="heart-shockwave-ring ring-2" />
          {celebrating && <span className="heart-shockwave-ring ring-3" />}
        </span>
      )}

      {/* Bayangan Lantai Dinamis yang Mengecil/Membesar Mengikuti Gerakan Mengambang (Floating) */}
      <span className="heart-floating-floor-shadow" aria-hidden="true" />

      <svg
        ref={svgRef}
        viewBox="0 0 200 200"
        role="img"
        aria-hidden="true"
        className="heart-jelly-svg h-full w-full overflow-visible"
      >
        <defs>
          {/* Gradasi Kaca Transparan 3D */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".28" />
            <stop offset="50%" stopColor="#ffcce0" stopOpacity=".07" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity=".22" />
          </linearGradient>

          <linearGradient id={liquidGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={liquidColors[0]} />
            <stop offset="50%" stopColor={liquidColors[1]} />
            <stop offset="100%" stopColor={liquidColors[2]} />
          </linearGradient>

          <linearGradient id={`${liquidGradId}-back`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={profileName === 'Soffie' ? '#ffe0ec' : '#ff9ebb'} stopOpacity=".9" />
            <stop offset="100%" stopColor={profileName === 'Soffie' ? '#ff7aa8' : '#b5093f'} stopOpacity=".9" />
          </linearGradient>

          <linearGradient id={meetingGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff4c7" stopOpacity=".95" />
            <stop offset="38%" stopColor="#ffb347" stopOpacity=".85" />
            <stop offset="100%" stopColor="#d97706" stopOpacity=".85" />
          </linearGradient>
          <linearGradient id={`${meetingGradId}-back`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff8db" stopOpacity=".65" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity=".65" />
          </linearGradient>
          <radialGradient id={`${meetingGradId}-glow`} cx="50%" cy="72%" r="58%">
            <stop offset="0%" stopColor="#fff5b5" stopOpacity=".8" />
            <stop offset="55%" stopColor="#f59e0b" stopOpacity=".45" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`${liquidGradId}-upwelling`} cx="50%" cy="92%" r="48%">
            <stop offset="0%" stopColor="#fff0b8" stopOpacity=".95" />
            <stop offset="45%" stopColor="#ff85b3" stopOpacity=".45" />
            <stop offset="100%" stopColor="#ff2a6d" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`${gradientId}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".88" />
            <stop offset="50%" stopColor="#ff9ebb" stopOpacity=".52" />
            <stop offset="100%" stopColor="#ffe58f" stopOpacity=".8" />
          </linearGradient>

          <clipPath id={`${gradientId}-heart-clip`}>
            <path d={HEART_PATH} />
          </clipPath>
        </defs>

        {/* Isi Dalam Kontainer Hati Kaca */}
        <g clipPath={`url(#${gradientId}-heart-clip)`}>
          <path d={HEART_PATH} fill={`url(#${gradientId})`} />

          {/* Pancuran Air Vertikal Saat Hati Sedang Ditekan & Ditahan (Press & Hold) */}
          {isProfileProgressHeart ? (
            <>
              <path
                ref={waveBackRef}
                d={buildReferenceWavePath(184 - visiblePercentage / 100 * 172 - 3.5, 0, 6.44, .038)}
                fill={`url(#${liquidGradId}-back)`}
              />
              <path
                ref={waveFrontRef}
                d={buildReferenceWavePath(184 - visiblePercentage / 100 * 172, 0, 5.6, .045)}
                fill={`url(#${liquidGradId})`}
              />
              {currentPercentage >= 100 && (
                <g className={`heart-liquid-second-layer ${isHolding && isConfirmingMeetingHold ? 'heart-liquid-second-layer-filling' : ''}`}>
                  <path
                    ref={meetingWaveBackRef}
                    d={buildReferenceWavePath(184 - visibleMeetingPercentage / 100 * 172 - 2, 0, 2.8, .028)}
                    fill={`url(#${meetingGradId}-back)`}
                  />
                  <path
                    ref={meetingWaveFrontRef}
                    d={buildReferenceWavePath(184 - visibleMeetingPercentage / 100 * 172, 0, 2.3, .032)}
                    fill={`url(#${meetingGradId})`}
                  />
                  <circle cx="100" cy="162" r="75" fill={`url(#${meetingGradId}-glow)`} opacity={Math.min(0.82, visibleMeetingPercentage / 100 * 0.82)} />
                </g>
              )}
              <circle
                ref={upwellingRef}
                cx="100"
                cy="172"
                r="58"
                fill={`url(#${liquidGradId}-upwelling)`}
                opacity="0"
              />
              <g aria-hidden="true">
                {bubbles.current.map((bubble, index) => (
                  <circle
                    key={`bubble-${index}`}
                    ref={(element) => { bubbleRefs.current[index] = element; }}
                    cx={bubble.x}
                    cy={bubble.y}
                    r={bubble.radius}
                    fill="#ffffff"
                    fillOpacity=".4"
                    style={{ display: 'none' }}
                  />
                ))}
              </g>
              <g aria-hidden="true">
                {characterParticles.current.map((particle, index) => (
                  <text
                    key={`character-particle-${index}`}
                    ref={(element) => { characterParticleRefs.current[index] = element; }}
                    x={particle.x}
                    y={particle.y}
                    fontSize="11"
                    textAnchor="middle"
                    opacity=".75"
                    fill={profileName === 'Soffie' ? '#ffebf2' : '#ffe58f'}
                    style={{ display: 'none' }}
                  >
                    {profileName === 'Soffie' ? '🌸' : '✦'}
                  </text>
                ))}
              </g>
            </>
          ) : (
            <>
              {(fillLevel > 0 || isHolding) && (
                <g
                  className="heart-liquid-level-transition"
                  style={{ transform: `translateY(${fillLevel > 0 ? liquidTop : meetingTop}px)` }}
                >
                  <g className="heart-liquid-slosh">
                    <path ref={waveBackRef} d="M-30 6 Q0 -3 30 6 T90 6 T150 6 T210 6 V195 H-30 Z" fill={`url(#${liquidGradId}-back)`} />
                    <path ref={waveFrontRef} d="M-30 9 Q0 0 30 9 T90 9 T150 9 T210 9 V195 H-30 Z" fill={`url(#${liquidGradId})`} />
                    <path ref={waveCrestRef} d="M-30 9 Q0 0 30 9 T90 9 T150 9 T210 9" fill="none" stroke="#ffe5ee" strokeOpacity=".92" strokeWidth="3" />
                  </g>
                </g>
              )}
              {meetingFill > 0 && (
                <g className="meeting-fill-overlay" style={{ transform: `translateY(${meetingTop}px)` }}>
                  <path ref={meetingWaveRef} d="M-30 8 Q0 -2 30 8 T90 8 T150 8 T210 8 V195 H-30 Z" fill={`url(#${meetingGradId})`} />
                </g>
              )}
            </>
          )}

          <ellipse cx="66" cy="54" rx="18" ry="10" transform="rotate(-28 66 54)" fill="#ffffff" fillOpacity=".65" />
          <path d="M142,48 C158,64 162,88 154,112" fill="none" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" strokeOpacity=".45" />

        </g>

        {/* Rim kaca memakai gradasi dari SVG referensi */}
        <path
          d={HEART_PATH}
          fill="none"
          stroke={`url(#${gradientId}-rim)`}
          strokeWidth="4"
        />
      </svg>

      {isProfileProgressHeart && (
        <span className="profile-heart-center-label" aria-hidden="true">
          <strong key="heart-percentage">{Math.round(visiblePercentage)}%</strong>
          {isMeetingFillStage ? (
            <span key="layer-meeting-progress" className="profile-heart-layer-progress">
              Bertemu {Math.round(visibleMeetingPercentage)}%
            </span>
          ) : (
            <span key="layer-meeting-status">
              {currentPercentage >= 100 ? (meetingLocked ? 'Bertemu ♥' : 'Tahan untuk bertemu') : profileName}
            </span>
          )}
        </span>
      )}

      {/* Indikator Persentase Mengambang Saat Sedang Ditekan & Ditahan */}
      {isHolding && (
        <span className="heart-hold-badge" aria-hidden="true">
          {isConfirmingMeetingHold ? 'Bertemu…' : `${Math.round(visiblePercentage)}%`}
        </span>
      )}

      {/* Ledakan Partikel Perayaan Spektakuler Saat Penuh / Konfirmasi Bertemu Tercapai */}
      {(celebrating || (isPopping && effectivePercentage >= 100)) && (
        <span className="heart-celebration-particles" aria-hidden="true">
          <Heart className="heart-celebration-one" fill="currentColor" />
          <Heart className="heart-celebration-two" fill="currentColor" />
          <Heart className="heart-celebration-three" fill="currentColor" />
          <Sparkles className="heart-celebration-sparkle" />
          <Star className="heart-celebration-star" fill="currentColor" />
          <Flower2 className="heart-celebration-flower" />
          <Crown className="heart-celebration-crown" />
        </span>
      )}
    </button>
  );
};