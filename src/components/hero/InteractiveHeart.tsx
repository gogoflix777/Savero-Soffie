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
  isStreakLit?: boolean;
  isMutualMeetingConfirmed?: boolean;
  onProgressChange?: (percentage: number) => void;
  onMeetingProgressChange?: (percentage: number) => void;
  onTap?: (point: { x: number; y: number }, profile?: 'Savero' | 'Soffie') => void;
  onMeetingConfirm?: () => Promise<boolean>;
  onCancelMeeting?: () => Promise<void> | void;
}

const HOLD_DURATION = 1500;
const MEETING_FILL_DURATION = 5000;
const HOLD_DELAY = 155;
const HEART_PROGRESS_PER_SECOND = 30;
const HEART_PATH =
  'M100,178 C100,178 22,126 22,68 C22,36 47,16 74,16 C91,16 100,28 100,36 C100,28 109,16 126,16 C153,16 178,36 178,68 C178,126 100,178 100,178 Z';

const buildWavePath = (levelY: number, phase: number, amplitude: number, frequency: number, slosh = 0) => {
  let d = `M -20 210 L -20 ${levelY}`;
  for (let x = -20; x <= 220; x += 10) {
    const tiltOffset = ((x - 100) / 100) * slosh;
    const y =
      levelY +
      tiltOffset +
      Math.sin(x * frequency + phase) * amplitude +
      Math.cos(x * frequency * 1.8 - phase * 0.7) * (amplitude * 0.28);
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return `${d} L 220 210 Z`;
};

const buildCrestPath = (levelY: number, phase: number, amplitude: number, frequency: number, slosh = 0) => {
  let d = '';
  for (let x = 15; x <= 185; x += 10) {
    const tiltOffset = ((x - 100) / 100) * slosh;
    const y =
      levelY +
      tiltOffset +
      Math.sin(x * frequency + phase) * amplitude +
      Math.cos(x * frequency * 1.8 - phase * 0.7) * (amplitude * 0.28);
    d += x === 15 ? `M ${x} ${y.toFixed(1)}` : ` L ${x} ${y.toFixed(1)}`;
  }
  return d;
};

interface FloatingParticle {
  x: number;
  y: number;
  speed: number;
  phase: number;
  radius?: number;
}

interface TapRippleItem {
  id: number;
  x: number;
  y: number;
}

class HeartSoundEngine {
  private ctx: AudioContext | null = null;
  private lastStreamTick = 0;
  private lastUpwellingTick = 0;

  private init(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(135, now + 0.09);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playReferenceTap(levelRatio: number, level = 1) {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;
    const base = 340 + levelRatio * 540 + level * 35;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = level >= 3 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(base * 0.78, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.48, now + 0.11);
    osc.frequency.exponentialRampToValueAtTime(base * 1.15, now + 0.21);
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
    const freq = 260 + progress * 460 + (Math.random() * 35 - 17);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.28, now + 0.075);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  playReferenceUpwelling(levelRatio: number, level = 1) {
    const nowMs = performance.now();
    if (nowMs - this.lastUpwellingTick < 65) return;
    this.lastUpwellingTick = nowMs;
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;
    const frequency = 280 + levelRatio * 640 + (Math.random() * 50 - 25);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = level >= 3 ? 'triangle' : 'sine';
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

  playHammerImpactAndCrack() {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Suara hantaman palu (low thud)
    const impactTime = now + 0.24;
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(175, impactTime);
    thud.frequency.exponentialRampToValueAtTime(42, impactTime + 0.22);
    thudGain.gain.setValueAtTime(0.32, impactTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.25);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(impactTime);
    thud.stop(impactTime + 0.26);

    // Suara kaca retak (high crystal snap)
    [1950, 2480, 3120].forEach((freq, idx) => {
      const t = impactTime + idx * 0.018;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.62, t + 0.09);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    });
  }

  // Suara bocor cairan ke-1 (cair/deras)
  playWateryLeakDrain() {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime + 0.3;
    for (let i = 0; i < 8; i++) {
      const t = now + i * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const f = 720 - i * 68;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.52, t + 0.12);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }
  }

  // Suara bocor cairan ke-2 (kental seperti madu/nektar emas)
  playViscousLeakDrain() {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime + 0.32;
    for (let i = 0; i < 9; i++) {
      const t = now + i * 0.23;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const f = 420 - i * 28;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f * 0.85, t);
      osc.frequency.exponentialRampToValueAtTime(f * 1.18, t + 0.09);
      osc.frequency.exponentialRampToValueAtTime(f * 0.58, t + 0.21);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    }
  }

  // Suara magis kristal emas saat palu berevolusi menjadi palu emas (Level-Up Upgrade)
  playHammerGoldTransformationChime() {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    freqs.forEach((freq, idx) => {
      const t = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.32);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    });

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(261.63, now);
    sub.frequency.exponentialRampToValueAtTime(523.25, now + 0.55);
    subGain.gain.setValueAtTime(0.18, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.68);
  }

  // Suara magis kemunculan palu untuk pertama kali (Spawn Pop & Sparkle Twinkle)
  playHammerMaterializeSound() {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Suara "pop" bubble lembut
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(420, now);
    pop.frequency.exponentialRampToValueAtTime(180, now + 0.08);
    popGain.gain.setValueAtTime(0.18, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    pop.connect(popGain);
    popGain.connect(ctx.destination);
    pop.start(now);
    pop.stop(now + 0.09);

    // Suara lentik twinkle lonceng magis kecil (F6, A6, C7, D7)
    [880, 1320, 1760, 2093].forEach((f, idx) => {
      const t = now + 0.035 + idx * 0.04;
      const chime = ctx.createOscillator();
      const cGain = ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(f, t);
      chime.frequency.exponentialRampToValueAtTime(f * 1.04, t + 0.16);
      cGain.gain.setValueAtTime(0.12, t);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      chime.connect(cGain);
      cGain.connect(ctx.destination);
      chime.start(t);
      chime.stop(t + 0.19);
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
  isStreakLit = false,
  isMutualMeetingConfirmed = false,
  onProgressChange,
  onMeetingProgressChange,
  onTap,
  onMeetingConfirm,
  onCancelMeeting
}) => {
  const uid = useId().replace(/:/g, '');
  const gradientId = `puffy-heart-gradient-${uid}`;
  const liquidGradId = `puffy-heart-liquid-${uid}`;
  const meetingGradId = `puffy-heart-meeting-${uid}`;
  const fusionGradId = `puffy-heart-fusion-${uid}`;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const waveBackRef = useRef<SVGPathElement>(null);
  const waveMidRef = useRef<SVGPathElement>(null);
  const waveFrontRef = useRef<SVGPathElement>(null);
  const waveCrestRef = useRef<SVGPathElement>(null);
  const meetingWaveRef = useRef<SVGPathElement>(null);
  const meetingWaveBackRef = useRef<SVGPathElement>(null);
  const meetingWaveMidRef = useRef<SVGPathElement>(null);
  const meetingWaveFrontRef = useRef<SVGPathElement>(null);
  const meetingWaveCrestRef = useRef<SVGPathElement>(null);
  const upwellingRef = useRef<SVGCircleElement>(null);
  const glassHighlightRef = useRef<SVGGElement>(null);
  const crackOverlayRef = useRef<SVGPathElement>(null);
  const bubbleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const characterParticleRefs = useRef<Array<SVGTextElement | null>>([]);

  const bubbles = useRef<FloatingParticle[]>(
    Array.from({ length: 16 }, () => ({
      x: 35 + Math.random() * 130,
      y: 180 + Math.random() * 25,
      speed: 0.6 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      radius: 1.6 + Math.random() * 3.4
    }))
  );
  const characterParticles = useRef<FloatingParticle[]>(
    Array.from({ length: 10 }, () => ({
      x: 42 + Math.random() * 116,
      y: 175 + Math.random() * 30,
      speed: 0.45 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2
    }))
  );

  const visualPercentageRef = useRef(percentage ?? 0);
  const targetPercentageRef = useRef(percentage ?? 0);
  const visualMeetingPercentageRef = useRef(meetingProgress);
  const targetMeetingPercentageRef = useRef(meetingProgress);
  const lastAnimationFrameRef = useRef(0);

  const holdFrameRef = useRef<number | null>(null);
  const holdDelayRef = useRef<number | null>(null);
  const physicsFrameRef = useRef<number | null>(null);
  const leakFrameRef = useRef<number | null>(null);
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

  // Fisika Pegas 3D Squishy + 3D Magnetic Tilt + Triple Wave
  const springRef = useRef({
    scaleX: 1,
    scaleY: 1,
    velX: 0,
    velY: 0,
    targetX: 1,
    targetY: 1,
    tiltAngle: 0,
    targetTilt: 0,
    rotX: 0,
    rotY: 0,
    targetRotX: 0,
    targetRotY: 0,
    sloshAngle: 0,
    sloshVel: 0,
    wavePhase: 0,
    wavePhaseFront: 0,
    wavePhaseMid: 1.8,
    wavePhaseBack: Math.PI,
    meetingWavePhaseFront: Math.PI * 0.7,
    meetingWavePhaseMid: 1.1,
    meetingWavePhaseBack: 0,
    waveEnergy: 1
  });

  const [isPopping, setIsPopping] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmingMeetingHold, setIsConfirmingMeetingHold] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [tapRipples, setTapRipples] = useState<TapRippleItem[]>([]);

  // State Animasi Palu & Bocor (Leak)
  const [leakState, setLeakState] = useState<{
    active: boolean;
    phase: 'swing' | 'draining';
    target: 'daily' | 'meeting';
  } | null>(null);
  const [leakDisplayPct, setLeakDisplayPct] = useState<number | null>(null);
  const leakStateRef = useRef(leakState);
  leakStateRef.current = leakState;

  const isProfileProgressHeart =
    profileName !== undefined && percentage !== undefined && onProgressChange !== undefined;
  const currentPercentage = Math.min(100, Math.max(0, percentage ?? 0));
  const currentMeetingProgress = Math.min(
    100,
    Math.max(0, meetingLocked ? Math.max(100, meetingProgress) : meetingProgress)
  );
  const isMeetingFillStage =
    isProfileProgressHeart && currentPercentage >= 100 && !meetingLocked;

  const hammerTargetStage: 'meeting' | 'daily' =
    currentMeetingProgress > 0 || meetingLocked ? 'meeting' : 'daily';

  const canUseHammer =
    isProfileProgressHeart &&
    !readOnly &&
    !leakState?.active &&
    (currentPercentage > 0 || currentMeetingProgress > 0 || meetingLocked);

  const [isSpawningHammer, setIsSpawningHammer] = useState(false);
  const prevCanUseHammerRef = useRef(false);

  useEffect(() => {
    if (!prevCanUseHammerRef.current && canUseHammer) {
      setIsSpawningHammer(true);
      heartAudio.playHammerMaterializeSound();
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
      const timer = window.setTimeout(() => {
        setIsSpawningHammer(false);
      }, 720);
      prevCanUseHammerRef.current = true;
      return () => window.clearTimeout(timer);
    }
    prevCanUseHammerRef.current = canUseHammer;
  }, [canUseHammer]);

  const [isTransformingGold, setIsTransformingGold] = useState(false);
  const prevHammerStageRef = useRef<'meeting' | 'daily'>(hammerTargetStage);

  useEffect(() => {
    if (prevHammerStageRef.current === 'daily' && hammerTargetStage === 'meeting') {
      setIsTransformingGold(true);
      heartAudio.playHammerGoldTransformationChime();
      if (navigator.vibrate) {
        navigator.vibrate([30, 45, 90]);
      }
      const timer = window.setTimeout(() => {
        setIsTransformingGold(false);
      }, 1450);
      prevHammerStageRef.current = 'meeting';
      return () => window.clearTimeout(timer);
    }
    prevHammerStageRef.current = hammerTargetStage;
  }, [hammerTargetStage]);

  const visiblePercentage =
    leakState?.active && leakState.target === 'daily' && leakDisplayPct !== null
      ? leakDisplayPct
      : isProfileProgressHeart &&
          currentPercentage < 100 &&
          isHolding &&
          !isConfirmingMeetingHold
        ? Math.max(
            currentPercentage,
            Math.round(
              holdBasePercentageRef.current +
                holdProgress * (100 - holdBasePercentageRef.current)
            )
          )
        : currentPercentage;

  const visibleMeetingPercentage =
    leakState?.active && leakState.target === 'meeting' && leakDisplayPct !== null
      ? leakDisplayPct
      : isProfileProgressHeart && currentPercentage >= 100
        ? Math.max(
            currentMeetingProgress,
            isHolding && isConfirmingMeetingHold
              ? Math.round(
                  holdBaseMeetingPercentageRef.current +
                    holdProgress * (100 - holdBaseMeetingPercentageRef.current)
                )
              : currentMeetingProgress
          )
        : currentMeetingProgress;

  targetPercentageRef.current = visiblePercentage;
  targetMeetingPercentageRef.current = visibleMeetingPercentage;

  const dailyFillRatio = Math.min(1, Math.max(0, fillLevel / 2));
  const meetingFill = isProfileProgressHeart
    ? 0
    : Math.min(1, (Math.min(2, meetingCount) + (!meetingLocked ? holdProgress : 0)) / 2);
  const isFullClimax = meetingCount >= 2 || fillLevel >= 2 || celebrating;

  // Level Aura dari gemini-code (lv-2, lv-3, lv-4-charged, lv-4-fusion)
  const auraLevelClass = isMutualMeetingConfirmed
    ? 'lv-4-fusion'
    : visiblePercentage >= 100 || isStreakLit
      ? 'lv-4-charged'
      : visiblePercentage >= 70
        ? 'lv-3'
        : visiblePercentage >= 30
          ? 'lv-2'
          : '';

  useEffect(
    () => () => {
      if (holdFrameRef.current !== null) window.cancelAnimationFrame(holdFrameRef.current);
      if (holdDelayRef.current !== null) window.clearTimeout(holdDelayRef.current);
      if (physicsFrameRef.current !== null) window.cancelAnimationFrame(physicsFrameRef.current);
      if (leakFrameRef.current !== null) window.cancelAnimationFrame(leakFrameRef.current);
      if (popTimer.current) window.clearTimeout(popTimer.current);
    },
    []
  );

  useEffect(() => {
    if (meetingCount >= 2 && previousMeetingCountRef.current < 2) {
      setCelebrating(true);
      heartAudio.playFullClimaxFanfare();
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

  // Loop 60fps: Floating, 3D Squishy Jelly, 3D Magnetic Tilt, Triple Liquid Wave & Viscous Second Layer
  useEffect(() => {
    let active = true;
    lastAnimationFrameRef.current = performance.now();

    const animatePhysics = (now: number) => {
      if (!active) return;
      const s = springRef.current;
      const dt = Math.min(0.05, Math.max(0, (now - lastAnimationFrameRef.current) / 1000));
      lastAnimationFrameRef.current = now;
      const t = now * 0.001;

      if (isProfileProgressHeart && buttonRef.current) {
        const floatY = Math.sin(t * 2.15) * 9 + Math.cos(t * 1.1) * 2;
        const floatRot = Math.sin(t * 1.35) * 2.0;
        buttonRef.current.style.setProperty('translate', `0 ${floatY.toFixed(2)}px`);
        buttonRef.current.style.setProperty('rotate', `${floatRot.toFixed(2)}deg`);
      }

      const currentLeak = leakStateRef.current;

      // Detak jantung halus saat >= 70%
      let beatPulse = 0;
      const roundedPct = Math.round(visualPercentageRef.current);
      if (roundedPct >= 70 && !holdActiveRef.current && !currentLeak?.active) {
        const speed = isMutualMeetingConfirmed ? 6.2 : 4.6;
        beatPulse = Math.pow(Math.max(0, Math.sin(t * speed)), 8) * 0.055;
      }

      // Spring physics stabil dengan batas clamp (mencegah akumulasi / ledakan skala saat tap cepat)
      const springK = 180;
      const springDamp = 18;
      const forceX = (s.targetX + beatPulse - s.scaleX) * springK - s.velX * springDamp;
      const forceY = (s.targetY + beatPulse - s.scaleY) * springK - s.velY * springDamp;
      s.velX += forceX * dt;
      s.velY += forceY * dt;
      s.velX = Math.max(-0.6, Math.min(0.6, s.velX));
      s.velY = Math.max(-0.6, Math.min(0.6, s.velY));

      s.scaleX += s.velX * dt * 4;
      s.scaleY += s.velY * dt * 4;
      // Kunci skala hati di rentang aman agar tidak membesar liar sampai menutupi layar
      s.scaleX = Math.max(0.88, Math.min(1.15, s.scaleX));
      s.scaleY = Math.max(0.88, Math.min(1.15, s.scaleY));

      // Fitur gyro / kursor tilt dihilangkan: selalu stabil tegak 0deg
      s.tiltAngle = 0;
      s.targetTilt = 0;
      s.rotX = 0;
      s.rotY = 0;
      s.targetRotX = 0;
      s.targetRotY = 0;

      const sloshForce = -s.sloshAngle * 0.12;
      s.sloshVel = (s.sloshVel + sloshForce) * 0.88;
      s.sloshAngle += s.sloshVel;

      if (isProfileProgressHeart) {
        const targetLevel = targetPercentageRef.current;
        const lerpRateDaily = currentLeak?.active && currentLeak.target === 'daily' ? 18 : 8.5;
        visualPercentageRef.current +=
          (targetLevel - visualPercentageRef.current) * Math.min(1, dt * lerpRateDaily);
        if (Math.abs(targetLevel - visualPercentageRef.current) < 0.04) {
          visualPercentageRef.current = targetLevel;
        }

        const targetMeetingLevel = targetMeetingPercentageRef.current;
        // Cairan ke-2 lebih kental (viscous), sehingga interpolasi gelombangnya lebih berat & lembut
        const lerpRateMeeting =
          currentLeak?.active && currentLeak.target === 'meeting' ? 12 : 4.0;
        visualMeetingPercentageRef.current +=
          (targetMeetingLevel - visualMeetingPercentageRef.current) *
          Math.min(1, dt * lerpRateMeeting);
        if (Math.abs(targetMeetingLevel - visualMeetingPercentageRef.current) < 0.04) {
          visualMeetingPercentageRef.current = targetMeetingLevel;
        }

        const level = visualPercentageRef.current;
        const meetingLevel = visualMeetingPercentageRef.current;
        const glowLevel = Math.min(1, Math.max(0, level / 100));
        if (buttonRef.current) {
          buttonRef.current.style.setProperty('--heart-glow-level', glowLevel.toFixed(3));
        }

        const levelMultiplier = level >= 70 ? 1.38 : level >= 30 ? 1.16 : 1;
        if (holdActiveRef.current || currentLeak?.phase === 'draining') {
          s.waveEnergy = Math.min(2.8, s.waveEnergy + 4.0 * dt);
        }
        s.waveEnergy = Math.max(1, s.waveEnergy - dt * 1.15);

        s.wavePhaseFront += dt * (3.8 + s.waveEnergy * 1.45) * levelMultiplier;
        s.wavePhaseMid += dt * (2.9 + s.waveEnergy * 1.2) * levelMultiplier;
        s.wavePhaseBack -= dt * (2.6 + s.waveEnergy * 1.05) * levelMultiplier;

        const liquidY = 184 - (level / 100) * 172;
        const amplitude = (3.4 + s.waveEnergy * 2.3) * (level > 98.5 ? 0.32 : 1);
        const slosh = s.sloshAngle * 0.4;

        waveBackRef.current?.setAttribute(
          'd',
          buildWavePath(liquidY - 4.5, s.wavePhaseBack, amplitude * 1.18, 0.036, -slosh * 0.7)
        );
        waveMidRef.current?.setAttribute(
          'd',
          buildWavePath(liquidY - 2.0, s.wavePhaseMid, amplitude * 0.95, 0.041, slosh * 0.85)
        );
        waveFrontRef.current?.setAttribute(
          'd',
          buildWavePath(liquidY, s.wavePhaseFront, amplitude, 0.046, slosh)
        );
        waveCrestRef.current?.setAttribute(
          'd',
          level > 2 && level < 99
            ? buildCrestPath(liquidY, s.wavePhaseFront, amplitude, 0.046, slosh)
            : ''
        );

        // Gelombang Cairan Kedua (Konfirmasi Bertemu - Viscous Honey Gold)
        if (level >= 100 || meetingLevel > 0) {
          const isLeakingViscous =
            currentLeak?.phase === 'draining' && currentLeak.target === 'meeting';
          const viscousSpeedMult = isLeakingViscous ? 1.65 : 1;
          s.meetingWavePhaseFront += dt * (0.95 + s.waveEnergy * 0.25) * viscousSpeedMult;
          s.meetingWavePhaseMid += dt * (0.78 + s.waveEnergy * 0.2) * viscousSpeedMult;
          s.meetingWavePhaseBack -= dt * (0.68 + s.waveEnergy * 0.18) * viscousSpeedMult;

          const secondLiquidY = 184 - (meetingLevel / 100) * 172;
          // Karena kental, amplitudo lebih membulat dan slosh lebih lambat
          const secondAmplitude =
            (2.1 + Math.min(1.8, s.waveEnergy * 0.55)) *
            (meetingLevel > 98.5 ? 0.28 : 1);
          const viscousSlosh = slosh * 0.42;

          meetingWaveBackRef.current?.setAttribute(
            'd',
            buildWavePath(
              secondLiquidY - 3.2,
              s.meetingWavePhaseBack,
              secondAmplitude * 1.15,
              0.026,
              -viscousSlosh * 0.65
            )
          );
          meetingWaveMidRef.current?.setAttribute(
            'd',
            buildWavePath(
              secondLiquidY - 1.5,
              s.meetingWavePhaseMid,
              secondAmplitude * 0.95,
              0.029,
              viscousSlosh * 0.8
            )
          );
          meetingWaveFrontRef.current?.setAttribute(
            'd',
            buildWavePath(
              secondLiquidY,
              s.meetingWavePhaseFront,
              secondAmplitude,
              0.032,
              viscousSlosh
            )
          );
          meetingWaveCrestRef.current?.setAttribute(
            'd',
            meetingLevel > 2 && meetingLevel < 99
              ? buildCrestPath(
                  secondLiquidY,
                  s.meetingWavePhaseFront,
                  secondAmplitude,
                  0.032,
                  viscousSlosh
                )
              : ''
          );
        }

        // Gelembung & Partikel Karakter di dalam cairan
        const isDraining = currentLeak?.phase === 'draining';
        const speedBoost = (holdActiveRef.current ? 2.3 : 1) * levelMultiplier;
        bubbles.current.forEach((bubble, index) => {
          bubble.y += isDraining ? bubble.speed * 2.4 : -bubble.speed * speedBoost;
          if (
            (!isDraining && bubble.y < liquidY + 4) ||
            (isDraining && bubble.y > 184) ||
            level < 3
          ) {
            bubble.y = isDraining ? liquidY + 8 : 180 + Math.random() * 12;
            bubble.x = 35 + Math.random() * 130;
          }
          const element = bubbleRefs.current[index];
          element?.setAttribute(
            'cx',
            (bubble.x + Math.sin(t * 2.3 + bubble.phase) * 4.5).toFixed(1)
          );
          element?.setAttribute('cy', bubble.y.toFixed(1));
          if (element) element.style.display = level < 2 ? 'none' : 'block';
        });

        characterParticles.current.forEach((particle, index) => {
          particle.y += isDraining ? particle.speed * 2.1 : -particle.speed * speedBoost;
          if (
            (!isDraining && particle.y < liquidY + 8) ||
            (isDraining && particle.y > 182) ||
            level < 25
          ) {
            particle.y = isDraining ? liquidY + 10 : 178 + Math.random() * 14;
            particle.x = 42 + Math.random() * 116;
          }
          const element = characterParticleRefs.current[index];
          element?.setAttribute(
            'x',
            (particle.x + Math.cos(t * 1.85 + particle.phase) * 6).toFixed(1)
          );
          element?.setAttribute('y', particle.y.toFixed(1));
          if (element) element.style.display = level < 25 ? 'none' : 'block';
        });

        if (upwellingRef.current) {
          upwellingRef.current.setAttribute(
            'r',
            (52 + Math.sin(t * 22) * 11).toFixed(1)
          );
          const glowOpacity = holdActiveRef.current ? 0.35 + glowLevel * 0.55 : 0;
          upwellingRef.current.setAttribute('opacity', glowOpacity.toFixed(2));
        }
      } else {
        const waveSpeed = holdActiveRef.current ? 0.14 : celebrating ? 0.16 : 0.065;
        const waveAmp = holdActiveRef.current ? 5.2 : celebrating ? 6.0 : 3.2;
        s.wavePhase += waveSpeed;
        const buildLegacyWave = (
          phase: number,
          amplitude: number,
          frequency: number,
          offset: number,
          close: boolean
        ) => {
          const points: string[] = [];
          for (let x = -30; x <= 230; x += 10) {
            const y =
              offset +
              Math.sin(x * frequency + phase) * amplitude +
              Math.cos(x * frequency * 0.6 - phase * 0.7) * amplitude * 0.35;
            points.push(`${x === -30 ? 'M' : 'L'}${x} ${y.toFixed(2)}`);
          }
          if (close) points.push('L230 195 L-30 195 Z');
          return points.join(' ');
        };
        waveBackRef.current?.setAttribute(
          'd',
          buildLegacyWave(s.wavePhase + 1.3, waveAmp * 1.1, 0.045, 6, true)
        );
        waveFrontRef.current?.setAttribute(
          'd',
          buildLegacyWave(-s.wavePhase * 1.15, waveAmp, 0.05, 9, true)
        );
        waveCrestRef.current?.setAttribute(
          'd',
          buildLegacyWave(-s.wavePhase * 1.15, waveAmp, 0.05, 9, false)
        );
        meetingWaveRef.current?.setAttribute(
          'd',
          buildLegacyWave(s.wavePhase * 1.35 + 0.7, waveAmp * 1.15, 0.052, 8, true)
        );
      }

      if (svgRef.current) {
        const holdJitter =
          holdActiveRef.current || currentLeak?.phase === 'draining'
            ? Math.sin(s.wavePhaseFront * 4.5) * 1.0
            : 0;
        svgRef.current.style.setProperty('--jelly-sx', s.scaleX.toFixed(4));
        svgRef.current.style.setProperty('--jelly-sy', s.scaleY.toFixed(4));
        svgRef.current.style.setProperty(
          '--jelly-rot',
          `${holdJitter.toFixed(2)}deg`
        );
        svgRef.current.style.setProperty('--jelly-rx', '0deg');
        svgRef.current.style.setProperty('--jelly-ry', '0deg');
        svgRef.current.style.setProperty('--slosh-deg', `${s.sloshAngle.toFixed(2)}deg`);
      }

      if (glassHighlightRef.current) {
        glassHighlightRef.current.setAttribute('transform', 'translate(0, 0)');
      }

      physicsFrameRef.current = window.requestAnimationFrame(animatePhysics);
    };

    physicsFrameRef.current = window.requestAnimationFrame(animatePhysics);
    return () => {
      active = false;
      if (physicsFrameRef.current !== null) {
        window.cancelAnimationFrame(physicsFrameRef.current);
      }
    };
  }, [celebrating, isMutualMeetingConfirmed, isProfileProgressHeart]);

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
      next === 0 ||
      Math.abs(next - lastProgressSaveRef.current.percentage) >= 10 ||
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
      next === 0 ||
      Math.abs(next - lastMeetingProgressSaveRef.current.percentage) >= 5 ||
      now - lastMeetingProgressSaveRef.current.at >= 400
    ) {
      lastMeetingProgressSaveRef.current = { percentage: next, at: now };
      onMeetingProgressChange(next);
    }
  };

  // Handler Palu (🔨) Pembocor Hati (Mendukung Cairan Kental Tahap 2 & Cairan Segar Tahap 1)
  const handleHammerSmash = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (readOnly || leakState?.active) return;

    const hasMeetingLiquid = currentMeetingProgress > 0 || meetingLocked;
    const hasDailyLiquid = currentPercentage > 0;
    if (!hasMeetingLiquid && !hasDailyLiquid) return;

    const target: 'meeting' | 'daily' = hasMeetingLiquid ? 'meeting' : 'daily';
    const startValue =
      target === 'meeting' ? Math.max(10, currentMeetingProgress) : currentPercentage;

    // Batalkan hold jika sedang berjalan
    holdActiveRef.current = false;
    holdHasStartedRef.current = false;
    cancelHoldFrame();
    setIsHolding(false);
    setIsConfirmingMeetingHold(false);
    setHoldProgress(0);

    setLeakDisplayPct(startValue);
    setLeakState({ active: true, phase: 'swing', target });
    heartAudio.playHammerImpactAndCrack();

    if (target === 'meeting') {
      heartAudio.playViscousLeakDrain();
    } else {
      heartAudio.playWateryLeakDrain();
    }

    // Pada saat palu menghantam hati (250ms)
    window.setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(
          target === 'meeting' ? [40, 30, 80, 40, 60] : [35, 25, 65]
        );
      }

      // Efek penyok & guncangan keras terkena pukulan palu
      springRef.current.velX += 0.65;
      springRef.current.velY -= 0.58;
      springRef.current.targetTilt = -11;
      springRef.current.waveEnergy = 3.0;
      crackOverlayRef.current?.setAttribute('opacity', '1');

      setLeakState({ active: true, phase: 'draining', target });

      // Durasi kuras: cairan ke-2 lebih kental (2350ms) dibanding cairan ke-1 (1450ms)
      const drainDuration = target === 'meeting' ? 2350 : 1450;
      const drainStart = performance.now();

      const stepDrain = (now: number) => {
        const elapsed = now - drainStart;
        const progress = Math.min(1, elapsed / drainDuration);

        // Kurva kekentalan: cairan ke-2 mengalir berat (viscous ease-in-out), cairan ke-1 memancar cepat
        const eased =
          target === 'meeting'
            ? progress < 0.35
              ? 1.4 * progress * progress
              : 1 - Math.pow(1 - progress, 2.2)
            : 1 - Math.pow(1 - progress, 1.65);

        const nextVal = Math.max(0, startValue * (1 - eased));
        setLeakDisplayPct(nextVal);

        // Getaran hati selama cairan bocor keluar
        springRef.current.targetX = 0.95 + Math.sin(now * 0.03) * 0.03;
        springRef.current.targetY = 1.05 - Math.sin(now * 0.03) * 0.03;

        if (progress < 1) {
          leakFrameRef.current = window.requestAnimationFrame(stepDrain);
        } else {
          // Selesai bocor ke 0%
          springRef.current.targetX = 1;
          springRef.current.targetY = 1;
          springRef.current.targetTilt = 0;
          springRef.current.velX = -0.32;
          springRef.current.velY = 0.35;
          crackOverlayRef.current?.setAttribute('opacity', '0');

          if (target === 'meeting') {
            visualMeetingPercentageRef.current = 0;
            targetMeetingPercentageRef.current = 0;
            saveMeetingProgress(0, true);
            void onCancelMeeting?.();
          } else {
            visualPercentageRef.current = 0;
            targetPercentageRef.current = 0;
            saveProgress(0, true);
          }

          setLeakDisplayPct(null);
          setLeakState(null);
        }
      };

      leakFrameRef.current = window.requestAnimationFrame(stepDrain);
    }, 250);
  };

  const spawnRipple = (clientX: number, clientY: number) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = Date.now() + Math.random();
    setTapRipples((prev) => [...prev.slice(-4), { id, x, y }]);
    window.setTimeout(() => {
      setTapRipples((prev) => prev.filter((item) => item.id !== id));
    }, 680);
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

    springRef.current.targetX = 1;
    springRef.current.targetY = 1;
    springRef.current.targetTilt = 0;
    springRef.current.velX = -0.38;
    springRef.current.velY = 0.42;
    springRef.current.sloshVel += 10;
    springRef.current.waveEnergy = 2.6;

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 500);
    cancelHoldFrame();

    if (navigator.vibrate) {
      navigator.vibrate(
        isMeetingConfirmation
          ? [25, 40, 110, 45, 150]
          : isProfileProgressHeart
            ? [24, 35, 65]
            : meetingCount > 0
              ? [35, 40, 75, 30, 120]
              : [24, 35, 65]
      );
    }

    if (isMeetingConfirmation) {
      saveMeetingProgress(100, true);
      setCelebrating(true);
      heartAudio.playFullClimaxFanfare();
      window.setTimeout(() => setCelebrating(false), 3000);
      void onMeetingConfirm?.()
        .then(() => undefined)
        .catch((error: unknown) => {
          console.error('Meeting confirmation failed:', error);
        });
      return;
    }

    if (isProfileProgressHeart) {
      setCelebrating(true);
      heartAudio.playSingleHeart100Chime();
      window.setTimeout(() => setCelebrating(false), 3000);
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

  const beginHold = (clientX?: number, clientY?: number) => {
    if (leakState?.active) return;
    const meetingConfirmationHold = isProfileProgressHeart && currentPercentage >= 100;
    if (
      readOnly ||
      (isProfileProgressHeart && meetingConfirmationHold && meetingLocked) ||
      (meetingLocked && !isProfileProgressHeart) ||
      holdActiveRef.current
    ) {
      return;
    }
    heartAudio.playSquishDown();
    if (clientX !== undefined && clientY !== undefined) {
      spawnRipple(clientX, clientY);
    }

    springRef.current.targetX = 1.05;
    springRef.current.targetY = 0.95;
    springRef.current.targetTilt = 0;
    springRef.current.velX = 0.04;
    springRef.current.velY = -0.04;
    springRef.current.sloshVel = 2.0;
    springRef.current.waveEnergy = 1.6;
    if (isProfileProgressHeart) upwellingRef.current?.setAttribute('opacity', '0.9');

    holdActiveRef.current = true;
    holdHasStartedRef.current = false;
    meetingConfirmationHoldRef.current = meetingConfirmationHold;
    holdBasePercentageRef.current = currentPercentage;
    holdBaseMeetingPercentageRef.current = currentMeetingProgress;
    lastProgressSaveRef.current = { percentage: currentPercentage, at: performance.now() };
    lastMeetingProgressSaveRef.current = {
      percentage: currentMeetingProgress,
      at: performance.now()
    };
    setIsHolding(false);
    setHoldProgress(0);

    const tick = (now: number) => {
      if (!holdActiveRef.current) return;
      const elapsed = now - holdStartRef.current;
      const nextPercentage = Math.min(
        100,
        holdBasePercentageRef.current + (elapsed * HEART_PROGRESS_PER_SECOND) / 1000
      );
      const remainingMeetingDuration = Math.max(
        1,
        (MEETING_FILL_DURATION * (100 - holdBaseMeetingPercentageRef.current)) / 100
      );
      const progress = meetingConfirmationHoldRef.current
        ? Math.min(1, elapsed / remainingMeetingDuration)
        : isProfileProgressHeart
          ? (nextPercentage - holdBasePercentageRef.current) /
            Math.max(1, 100 - holdBasePercentageRef.current)
          : Math.min(1, elapsed / HOLD_DURATION);
      setHoldProgress(progress);

      if (isProfileProgressHeart && !meetingConfirmationHoldRef.current) {
        saveProgress(nextPercentage);
      } else if (meetingConfirmationHoldRef.current) {
        saveMeetingProgress(
          holdBaseMeetingPercentageRef.current +
            progress * (100 - holdBaseMeetingPercentageRef.current)
        );
        if (navigator.vibrate && now - lastMeetingHapticRef.current >= 850) {
          navigator.vibrate(8);
          lastMeetingHapticRef.current = now;
        }
      }

      springRef.current.targetX = 1.16 + Math.sin(now * 0.028) * 0.028;
      springRef.current.targetY = 0.84 - Math.sin(now * 0.028) * 0.028;
      const lv = nextPercentage >= 70 ? 3 : nextPercentage >= 30 ? 2 : 1;
      if (isProfileProgressHeart && !meetingConfirmationHoldRef.current) {
        heartAudio.playReferenceUpwelling(nextPercentage / 100, lv);
      } else {
        heartAudio.playHoldBubbleTick(progress);
      }

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
    springRef.current.targetX = 1;
    springRef.current.targetY = 1;
    springRef.current.targetTilt = 0;
    springRef.current.velX -= 0.28;
    springRef.current.velY += 0.3;
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
        const remainingMeetingDuration = Math.max(
          1,
          (MEETING_FILL_DURATION * (100 - holdBaseMeetingPercentageRef.current)) / 100
        );
        const progress = Math.min(1, elapsed / remainingMeetingDuration);
        const nextMeetingPercentage =
          holdBaseMeetingPercentageRef.current +
          progress * (100 - holdBaseMeetingPercentageRef.current);
        if (progress >= 1) {
          completeHold();
          return;
        }
        saveMeetingProgress(nextMeetingPercentage, true);
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 500);
        holdActiveRef.current = false;
        holdHasStartedRef.current = false;
        meetingConfirmationHoldRef.current = false;
        cancelHoldFrame();
        setIsHolding(false);
        setIsConfirmingMeetingHold(false);
        setHoldProgress(0);
        return;
      }
      const nextPercentage = Math.min(
        100,
        holdBasePercentageRef.current + (elapsed * HEART_PROGRESS_PER_SECOND) / 1000
      );
      if (nextPercentage >= 100) {
        completeHold();
        return;
      }
      saveProgress(nextPercentage, true);
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 500);
      holdActiveRef.current = false;
      holdHasStartedRef.current = false;
      cancelHoldFrame();
      setIsHolding(false);
      setHoldProgress(
        (nextPercentage - holdBasePercentageRef.current) /
          Math.max(1, 100 - holdBasePercentageRef.current)
      );
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
    if (suppressClickRef.current || leakState?.active) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      return;
    }
    if (readOnly) return;

    // Dorongan squish terkontrol saat di-tap (tidak berlebih / tidak membesar menutupi layar)
    springRef.current.velX = -0.14;
    springRef.current.velY = 0.16;
    springRef.current.waveEnergy = Math.min(2.0, springRef.current.waveEnergy + 0.4);
    springRef.current.sloshVel = (Math.random() > 0.5 ? 1 : -1) * 3.2;

    const lv = currentPercentage >= 70 ? 3 : currentPercentage >= 30 ? 2 : 1;
    if (isProfileProgressHeart) {
      heartAudio.playReferenceTap(currentPercentage / 100, lv);
    } else {
      heartAudio.playTapBounce(Math.max(dailyFillRatio, meetingFill));
    }

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
    popTimer.current = window.setTimeout(() => setIsPopping(false), 450);
    onTap?.({ x: event.clientX, y: event.clientY }, profileName);
  };

  const displayDailyFillRatio = isProfileProgressHeart
    ? visiblePercentage / 100
    : dailyFillRatio;
  const liquidTop = isProfileProgressHeart
    ? visiblePercentage >= 100
      ? -30
      : 172 - displayDailyFillRatio * 152
    : fillLevel >= 2
      ? 22
      : fillLevel === 1
        ? 90
        : 172;
  const meetingTop = 172 - meetingFill * 152;
  const effectivePercentage = isProfileProgressHeart
    ? visiblePercentage
    : Math.round(Math.max(dailyFillRatio, meetingFill) * 100);

  // Palet warna 3 Lapis dari gemini-code (Soffie Sakura Rose vs Savero Ruby Crimson)
  const liquidFrontColors =
    profileName === 'Soffie'
      ? ['#ffc4da', '#ff5c97', '#ad104a']
      : ['#ff6b9d', '#d90448', '#5e011e'];
  const liquidMidColors =
    profileName === 'Soffie'
      ? ['#ffd9e8', '#e03677']
      : ['#ff8ab3', '#9e0436'];
  const liquidBackColors =
    profileName === 'Soffie'
      ? ['#ffebf3', '#ff7aa8']
      : ['#ffb3ce', '#b5093f'];

  return (
    <div className="relative inline-flex items-center justify-center">
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
          if (!readOnly) beginHold(event.clientX, event.clientY);
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
        aria-label={
          isProfileProgressHeart
            ? `Hati ${profileName}, terisi ${Math.round(visiblePercentage)} persen.${
                readOnly
                  ? ' Hanya pemilik profil yang dapat mengisi hati ini.'
                  : meetingLocked
                    ? ' Konfirmasi bertemu hari ini sudah tercatat.'
                    : currentPercentage >= 100
                      ? ' Tahan hingga lima detik untuk mengisi cairan kental emas dan mengonfirmasi bertemu.'
                      : ' Ketuk untuk menambah 5 persen atau tekan-tahan untuk mengisi.'
              }`
            : `Jar hati: ${Math.min(2, fillLevel)} dari 2 log hari ini.`
        }
        aria-valuetext={
          isHolding
            ? isConfirmingMeetingHold
              ? `Liquid kedua ${Math.round(visibleMeetingPercentage)} persen, liquid pertama tetap 100 persen`
              : `${Math.round(visiblePercentage)} persen`
            : isProfileProgressHeart
              ? `${Math.round(isMeetingFillStage ? currentMeetingProgress : currentPercentage)} persen`
              : undefined
        }
        aria-pressed={isProfileProgressHeart ? currentPercentage >= 100 : meetingLocked}
        className={`interactive-puffy-heart ${
          isProfileProgressHeart ? 'profile-progress-heart' : ''
        } ${auraLevelClass} ${
          visiblePercentage >= 30 ? 'profile-heart-warming' : ''
        } ${visiblePercentage >= 70 ? 'profile-heart-fever' : ''} ${
          visiblePercentage >= 100 ? 'profile-heart-charged' : ''
        } ${isMeetingFillStage ? 'meeting-fill-active' : ''} ${
          profileName === 'Soffie' ? 'profile-heart-soffie' : ''
        } ${readOnly ? 'profile-heart-readonly' : ''} ${
          isPopping ? 'jelly-active' : ''
        } ${isHolding ? 'meeting-holding' : ''} ${
          celebrating ? 'meeting-celebrating' : ''
        } ${
          isFullClimax || currentPercentage >= 100 ? 'heart-full-climax' : ''
        } ${leakState?.phase === 'draining' ? 'heart-is-leaking' : ''} ${className}`}
      >
        {/* Pulse Conic Fusion Aura (Aktif saat Streak Nyala atau Mutual Meeting Fusion) */}
        <span
          className={`heart-conic-fusion-aura ${
            isMutualMeetingConfirmed || isStreakLit ? 'active' : ''
          }`}
          aria-hidden="true"
        />

        {/* Ambient Halo Pulse Aura */}
        <span className="heart-ambient-aura" aria-hidden="true" />

        {/* Cincin Gelombang Kejut (Shockwave Rings) saat Ditahan atau Klimaks */}
        {(celebrating || isHolding) && (
          <span className="heart-shockwave-container" aria-hidden="true">
            <span className="heart-shockwave-ring ring-1" />
            <span className="heart-shockwave-ring ring-2" />
            {celebrating && <span className="heart-shockwave-ring ring-3" />}
          </span>
        )}

        {/* Riak Air Sentuhan (Tap Ripples dari gemini-code) */}
        {tapRipples.map((r) => (
          <span
            key={r.id}
            className="heart-tap-ripple"
            style={{ left: `${r.x}px`, top: `${r.y}px` }}
            aria-hidden="true"
          />
        ))}

        {/* Bayangan Lantai Dinamis */}
        <span className="heart-floating-floor-shadow" aria-hidden="true" />

        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          role="img"
          aria-hidden="true"
          className="heart-jelly-svg h-full w-full overflow-visible"
        >
          <defs>
            {/* Kaca Transparan 3D */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity=".32" />
              <stop offset="50%" stopColor="#ffcce0" stopOpacity=".08" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity=".24" />
            </linearGradient>

            {/* Triple Wave Gradients (Front, Mid, Back) */}
            <linearGradient id={liquidGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={liquidFrontColors[0]} />
              <stop offset="48%" stopColor={liquidFrontColors[1]} />
              <stop offset="100%" stopColor={liquidFrontColors[2]} />
            </linearGradient>

            <linearGradient id={`${liquidGradId}-mid`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={liquidMidColors[0]} stopOpacity=".8" />
              <stop offset="100%" stopColor={liquidMidColors[1]} stopOpacity=".8" />
            </linearGradient>

            <linearGradient id={`${liquidGradId}-back`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={liquidBackColors[0]} stopOpacity=".68" />
              <stop offset="100%" stopColor={liquidBackColors[1]} stopOpacity=".68" />
            </linearGradient>

            {/* Gradien True 100% Fusion dari gemini-code */}
            <linearGradient id={fusionGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff4b8" />
              <stop offset="35%" stopColor="#ff75a8" />
              <stop offset="72%" stopColor="#d90448" />
              <stop offset="100%" stopColor="#690222" />
            </linearGradient>

            {/* Gradien Cairan Kedua (Viscous Golden Honey-Amber untuk Konfirmasi Bertemu) */}
            <linearGradient id={meetingGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff7d6" stopOpacity=".98" />
              <stop offset="42%" stopColor="#fbbf24" stopOpacity=".94" />
              <stop offset="100%" stopColor="#b45309" stopOpacity=".96" />
            </linearGradient>
            <linearGradient id={`${meetingGradId}-mid`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity=".85" />
              <stop offset="100%" stopColor="#d97706" stopOpacity=".85" />
            </linearGradient>
            <linearGradient id={`${meetingGradId}-back`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity=".7" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity=".7" />
            </linearGradient>
            <radialGradient id={`${meetingGradId}-glow`} cx="50%" cy="72%" r="58%">
              <stop offset="0%" stopColor="#fff5b5" stopOpacity=".85" />
              <stop offset="55%" stopColor="#f59e0b" stopOpacity=".48" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            <radialGradient id={`${liquidGradId}-upwelling`} cx="50%" cy="92%" r="48%">
              <stop offset="0%" stopColor="#fff0b8" stopOpacity=".95" />
              <stop offset="45%" stopColor="#ff85b3" stopOpacity=".45" />
              <stop offset="100%" stopColor="#ff2a6d" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`${gradientId}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity=".92" />
              <stop offset="50%" stopColor="#ff9ebb" stopOpacity=".55" />
              <stop offset="100%" stopColor="#ffe58f" stopOpacity=".85" />
            </linearGradient>

            <clipPath id={`${gradientId}-heart-clip`}>
              <path d={HEART_PATH} />
            </clipPath>
          </defs>

          {/* Isi Dalam Kontainer Hati Kaca */}
          <g clipPath={`url(#${gradientId}-heart-clip)`}>
            <path d={HEART_PATH} fill={`url(#${gradientId})`} />

            {isProfileProgressHeart ? (
              <>
                {/* TRIPLE WAVE CAIRAN UTAMA (Hati Harian) */}
                <path
                  ref={waveBackRef}
                  d={buildWavePath(184 - (visiblePercentage / 100) * 172 - 4.5, 0, 6.44, 0.036)}
                  fill={`url(#${liquidGradId}-back)`}
                />
                <path
                  ref={waveMidRef}
                  d={buildWavePath(184 - (visiblePercentage / 100) * 172 - 2.0, 1.8, 5.2, 0.041)}
                  fill={`url(#${liquidGradId}-mid)`}
                />
                <path
                  ref={waveFrontRef}
                  d={buildWavePath(184 - (visiblePercentage / 100) * 172, 0, 5.6, 0.046)}
                  fill={
                    isMutualMeetingConfirmed
                      ? `url(#${fusionGradId})`
                      : `url(#${liquidGradId})`
                  }
                />
                <path
                  ref={waveCrestRef}
                  d=""
                  fill="none"
                  stroke="rgba(255,255,255,0.68)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* TRIPLE WAVE CAIRAN KEDUA (Viscous Golden Honey - Konfirmasi Bertemu) */}
                {(currentPercentage >= 100 || visibleMeetingPercentage > 0) && (
                  <g
                    className={`heart-liquid-second-layer ${
                      isHolding && isConfirmingMeetingHold
                        ? 'heart-liquid-second-layer-filling'
                        : ''
                    }`}
                  >
                    <path
                      ref={meetingWaveBackRef}
                      d={buildWavePath(
                        184 - (visibleMeetingPercentage / 100) * 172 - 3.2,
                        0,
                        2.8,
                        0.026
                      )}
                      fill={`url(#${meetingGradId}-back)`}
                    />
                    <path
                      ref={meetingWaveMidRef}
                      d={buildWavePath(
                        184 - (visibleMeetingPercentage / 100) * 172 - 1.5,
                        1.1,
                        2.4,
                        0.029
                      )}
                      fill={`url(#${meetingGradId}-mid)`}
                    />
                    <path
                      ref={meetingWaveFrontRef}
                      d={buildWavePath(
                        184 - (visibleMeetingPercentage / 100) * 172,
                        0,
                        2.2,
                        0.032
                      )}
                      fill={`url(#${meetingGradId})`}
                    />
                    <path
                      ref={meetingWaveCrestRef}
                      d=""
                      fill="none"
                      stroke="rgba(255,250,210,0.85)"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="100"
                      cy="162"
                      r="75"
                      fill={`url(#${meetingGradId}-glow)`}
                      opacity={Math.min(0.85, (visibleMeetingPercentage / 100) * 0.85)}
                    />
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

                {/* Gelembung Udara */}
                <g aria-hidden="true">
                  {bubbles.current.map((bubble, index) => (
                    <circle
                      key={`bubble-${index}`}
                      ref={(element) => {
                        bubbleRefs.current[index] = element;
                      }}
                      cx={bubble.x}
                      cy={bubble.y}
                      r={bubble.radius}
                      fill="#ffffff"
                      fillOpacity=".45"
                      style={{ display: 'none' }}
                    />
                  ))}
                </g>

                {/* Partikel Karakter (🌸 / ✦) */}
                <g aria-hidden="true">
                  {characterParticles.current.map((particle, index) => (
                    <text
                      key={`character-particle-${index}`}
                      ref={(element) => {
                        characterParticleRefs.current[index] = element;
                      }}
                      x={particle.x}
                      y={particle.y}
                      fontSize="11"
                      textAnchor="middle"
                      opacity=".8"
                      fill={
                        isMutualMeetingConfirmed
                          ? '#fff6c2'
                          : profileName === 'Soffie'
                            ? '#ffebf2'
                            : '#ffe58f'
                      }
                      style={{ display: 'none' }}
                    >
                      {isMutualMeetingConfirmed
                        ? index % 2 === 0
                          ? '✦'
                          : '🌸'
                        : profileName === 'Soffie'
                          ? '🌸'
                          : '✦'}
                    </text>
                  ))}
                </g>

                {/* Garis Retakan Kristal di Dasar Hati saat Dipukul Palu */}
                <path
                  ref={crackOverlayRef}
                  d="M100,174 L82,144 L91,126 M100,174 L122,142 L114,122 M100,174 L68,160 M100,174 L132,158 M96,152 L112,148"
                  stroke="#fff9d6"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(255, 229, 143, 0.95))',
                    transition: 'opacity 180ms ease'
                  }}
                />
              </>
            ) : (
              <>
                {(fillLevel > 0 || isHolding) && (
                  <g
                    className="heart-liquid-level-transition"
                    style={{
                      transform: `translateY(${fillLevel > 0 ? liquidTop : meetingTop}px)`
                    }}
                  >
                    <g className="heart-liquid-slosh">
                      <path
                        ref={waveBackRef}
                        d="M-30 6 Q0 -3 30 6 T90 6 T150 6 T210 6 V195 H-30 Z"
                        fill={`url(#${liquidGradId}-back)`}
                      />
                      <path
                        ref={waveFrontRef}
                        d="M-30 9 Q0 0 30 9 T90 9 T150 9 T210 9 V195 H-30 Z"
                        fill={`url(#${liquidGradId})`}
                      />
                      <path
                        ref={waveCrestRef}
                        d="M-30 9 Q0 0 30 9 T90 9 T150 9 T210 9"
                        fill="none"
                        stroke="#ffe5ee"
                        strokeOpacity=".92"
                        strokeWidth="3"
                      />
                    </g>
                  </g>
                )}
                {meetingFill > 0 && (
                  <g
                    className="meeting-fill-overlay"
                    style={{ transform: `translateY(${meetingTop}px)` }}
                  >
                    <path
                      ref={meetingWaveRef}
                      d="M-30 8 Q0 -2 30 8 T90 8 T150 8 T210 8 V195 H-30 Z"
                      fill={`url(#${meetingGradId})`}
                    />
                  </g>
                )}
              </>
            )}

            {/* Pantulan Kaca 3D Dinamis (Bergerak Mengikuti Magnetic Tilt) */}
            <g ref={glassHighlightRef}>
              <ellipse
                cx="65"
                cy="52"
                rx="19"
                ry="10.5"
                transform="rotate(-28 65 52)"
                fill="#ffffff"
                fillOpacity=".7"
              />
              <circle cx="52" cy="72" r="4.2" fill="#ffffff" fillOpacity=".48" />
              <path
                d="M142,48 C158,64 162,88 154,112"
                fill="none"
                stroke="#ffffff"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeOpacity=".48"
              />
            </g>
          </g>

          {/* Garis Tepi Kaca Hati */}
          <path
            d={HEART_PATH}
            fill="none"
            stroke={`url(#${gradientId}-rim)`}
            strokeWidth="4"
          />

          {/* ===============================================================
              ANIMASI STREAM BOCOR DARI RETAKAN BAWAH HATI (CAIR VS KENTAL)
             =============================================================== */}
          {leakState?.phase === 'draining' && (
            <g className="heart-leak-discharge-group" aria-hidden="true">
              {leakState.target === 'meeting' ? (
                /* BOCOR CAIRAN KE-2: KENTAL (VISCOUS GOLDEN HONEY DRIPS) */
                <g className="viscous-honey-leak">
                  <path
                    d="M96,174 Q100,196 98,224 Q100,240 104,224 Q102,196 104,174 Z"
                    fill={`url(#${meetingGradId})`}
                    className="viscous-main-column"
                  />
                  <circle cx="100" cy="195" r="6.5" fill="#fbbf24" className="viscous-blob blob-1" />
                  <circle cx="97" cy="212" r="5.2" fill="#f59e0b" className="viscous-blob blob-2" />
                  <circle cx="103" cy="226" r="4.8" fill="#d97706" className="viscous-blob blob-3" />
                  <ellipse cx="100" cy="238" rx="18" ry="5" fill="#fbbf24" fillOpacity="0.65" className="viscous-puddle" />
                </g>
              ) : (
                /* BOCOR CAIRAN KE-1: CAIR DERAS (WATERY RUBY/SAKURA JETS) */
                <g className="watery-elixir-leak">
                  <path
                    d="M100,174 L92,232 M100,174 L100,238 M100,174 L108,232"
                    stroke={profileName === 'Soffie' ? '#ff5c97' : '#e01e5a'}
                    strokeWidth="4.2"
                    strokeLinecap="round"
                    strokeDasharray="10 8"
                    className="watery-jet-lines"
                  />
                  <circle
                    cx="86"
                    cy="218"
                    r="3.2"
                    fill={profileName === 'Soffie' ? '#ffc4da' : '#ff6b9d'}
                    className="watery-splash-drop drop-1"
                  />
                  <circle
                    cx="114"
                    cy="215"
                    r="3.5"
                    fill={profileName === 'Soffie' ? '#ff5c97' : '#d90448'}
                    className="watery-splash-drop drop-2"
                  />
                  <circle
                    cx="95"
                    cy="234"
                    r="2.8"
                    fill="#ffffff"
                    className="watery-splash-drop drop-3"
                  />
                  <circle
                    cx="106"
                    cy="232"
                    r="3"
                    fill={profileName === 'Soffie' ? '#ffc4da' : '#ff6b9d'}
                    className="watery-splash-drop drop-4"
                  />
                </g>
              )}
            </g>
          )}
        </svg>

        {/* ANIMASI 3D PALU MENGAYUN & MEMUKUL HATI */}
        {leakState?.active && (
          <div
            className={`heart-hammer-actor ${
              leakState.phase === 'swing' ? 'is-striking' : 'is-aftermath'
            }`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 90 90" className="h-16 w-16 overflow-visible drop-shadow-lg">
              <defs>
                <linearGradient id={`hammer-head-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  {leakState.target === 'meeting' ? (
                    <>
                      <stop offset="0%" stopColor="#fff3c4" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#92400e" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#475569" />
                    </>
                  )}
                </linearGradient>
              </defs>
              {/* Gagang Kayu */}
              <rect
                x="42"
                y="34"
                width="9"
                height="46"
                rx="4.5"
                fill="#7c2d12"
                stroke={leakState.target === 'meeting' ? '#fed7aa' : '#e2e8f0'}
                strokeWidth="1.5"
              />
              {/* Kepala Palu */}
              <rect
                x="20"
                y="16"
                width="52"
                height="22"
                rx="7"
                fill={`url(#hammer-head-${uid})`}
                stroke={leakState.target === 'meeting' ? '#ffffff' : '#f1f5f9'}
                strokeWidth="2"
              />
              <circle cx="30" cy="24" r="3" fill="#ffffff" fillOpacity="0.8" />
            </svg>
            <span className="heart-hammer-impact-burst" />
          </div>
        )}

        {/* Label Tengah Hati */}
        {isProfileProgressHeart && (
          <span className="profile-heart-center-label" aria-hidden="true">
            <strong key="heart-percentage">
              {leakState?.active && leakState.target === 'meeting'
                ? `${Math.round(visibleMeetingPercentage)}%`
                : `${Math.round(visiblePercentage)}%`}
            </strong>
            {leakState?.active ? (
              <span className="profile-heart-layer-progress">
                {leakState.target === 'meeting'
                  ? 'Membocorkan Liquid Kental…'
                  : 'Hati Bocor ke 0%…'}
              </span>
            ) : isMeetingFillStage || visibleMeetingPercentage > 0 ? (
              <span key="layer-meeting-progress" className="profile-heart-layer-progress">
                {isMutualMeetingConfirmed
                  ? '💞 True 100% Bertemu'
                  : `Bertemu ${Math.round(visibleMeetingPercentage)}%`}
              </span>
            ) : (
              <span key="layer-meeting-status">
                {currentPercentage >= 100
                  ? meetingLocked
                    ? 'Bertemu ♥'
                    : 'Tahan untuk bertemu'
                  : `Hati ${profileName}`}
              </span>
            )}
          </span>
        )}

        {/* Badge Persentase Saat Ditahan */}
        {isHolding && (
          <span className="heart-hold-badge" aria-hidden="true">
            {isConfirmingMeetingHold
              ? `Liquid Kental ${Math.round(visibleMeetingPercentage)}%`
              : `${Math.round(visiblePercentage)}%`}
          </span>
        )}

        {/* Partikel Perayaan Saat Penuh */}
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

      {/* TOMBOL PALU (🔨) SVG PEMBOCOR LIQUID HATI (PALU BIASA VS PALU EMAS) */}
      {canUseHammer && (
        <button
          type="button"
          onClick={handleHammerSmash}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onTouchStart={(event) => {
            event.stopPropagation();
          }}
          title={
            hammerTargetStage === 'meeting'
              ? 'Pukul dengan palu emas untuk membocorkan liquid bertemu (kental) kembali ke 0%'
              : 'Pukul dengan palu untuk membocorkan isi hati kembali ke 0%'
          }
          aria-label={
            hammerTargetStage === 'meeting'
              ? 'Batalkan dan bocorkan liquid konfirmasi bertemu ke 0 persen dengan palu emas'
              : 'Batalkan dan bocorkan progres hati ke 0 persen dengan palu'
          }
          className={`heart-hammer-svg-btn heart-hammer-trigger-btn pointer-events-auto ${
            hammerTargetStage === 'meeting'
              ? 'is-gold-hammer is-viscous-stage'
              : 'is-steel-hammer is-daily-stage'
          } ${isTransformingGold ? 'is-transforming-gold' : ''} ${
            isSpawningHammer ? 'is-spawning' : ''
          }`}
        >
          {/* EFEK VISUAL KEMUNCULAN PERTAMA KALI (POP & SPARKLE PUFF) */}
          {isSpawningHammer && (
            <>
              <span className="hammer-spawn-ring" aria-hidden="true" />
              <span className="hammer-spawn-stars" aria-hidden="true">
                <span className="spawn-star star-1">✨</span>
                <span className="spawn-star star-2">✦</span>
                <span className="spawn-star star-3">✨</span>
                <span className="spawn-star star-4">✦</span>
              </span>
            </>
          )}

          {/* EFEK VISUAL LEDAKAN CAHAYA & BINTANG KETIKA BERUBAH KE PALU EMAS */}
          {isTransformingGold && (
            <>
              <span className="hammer-gold-sunburst" aria-hidden="true" />
              <span className="hammer-gold-burst-ring" aria-hidden="true" />
              <span className="hammer-transform-sparkles" aria-hidden="true">
                <span className="gold-sparkle sp-1">✦</span>
                <span className="gold-sparkle sp-2">★</span>
                <span className="gold-sparkle sp-3">✦</span>
                <span className="gold-sparkle sp-4">★</span>
                <span className="gold-sparkle sp-5">✦</span>
                <span className="gold-sparkle sp-6">★</span>
              </span>
            </>
          )}

          <svg
            viewBox="0 0 54 54"
            className="heart-hammer-svg-icon"
            aria-hidden="true"
          >
            <defs>
              {hammerTargetStage === 'meeting' ? (
                <>
                  <linearGradient id={`hammer-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="25%" stopColor="#fde047" />
                    <stop offset="60%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#854d0e" />
                  </linearGradient>
                  <linearGradient id={`hammer-wood-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#78350f" />
                    <stop offset="50%" stopColor="#9a3412" />
                    <stop offset="100%" stopColor="#451a03" />
                  </linearGradient>
                </>
              ) : (
                <>
                  <linearGradient id={`hammer-steel-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#f1f5f9" />
                    <stop offset="70%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  <linearGradient id={`hammer-wood-steel-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#854d0e" />
                    <stop offset="50%" stopColor="#b45309" />
                    <stop offset="100%" stopColor="#451a03" />
                  </linearGradient>
                </>
              )}
            </defs>

            <g className="heart-hammer-svg-group" transform="rotate(30 27 27)">
              {/* Gagang Kayu */}
              <rect
                x="24.5"
                y="24"
                width="5"
                height="22"
                rx="2.5"
                fill={
                  hammerTargetStage === 'meeting'
                    ? `url(#hammer-wood-gold-${uid})`
                    : `url(#hammer-wood-steel-${uid})`
                }
                stroke={hammerTargetStage === 'meeting' ? '#fde047' : '#e2e8f0'}
                strokeWidth="0.8"
              />
              {/* Cincin/Lilitan Gagang */}
              <line
                x1="24.5"
                y1="32"
                x2="29.5"
                y2="32"
                stroke={hammerTargetStage === 'meeting' ? '#fde047' : '#cbd5e1'}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <line
                x1="24.5"
                y1="38"
                x2="29.5"
                y2="38"
                stroke={hammerTargetStage === 'meeting' ? '#fde047' : '#cbd5e1'}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Pommel Ujung Bawah Gagang */}
              <circle
                cx="27"
                cy="46.5"
                r="3"
                fill={hammerTargetStage === 'meeting' ? '#f59e0b' : '#94a3b8'}
                stroke={hammerTargetStage === 'meeting' ? '#fef08a' : '#ffffff'}
                strokeWidth="0.9"
              />

              {/* Collar/Cincin Penghubung Kepala */}
              <rect
                x="23"
                y="22"
                width="8"
                height="3"
                rx="1.5"
                fill={hammerTargetStage === 'meeting' ? '#f59e0b' : '#cbd5e1'}
                stroke={hammerTargetStage === 'meeting' ? '#fef08a' : '#ffffff'}
                strokeWidth="0.8"
              />

              {/* Muka Pemukul Sisi Kiri */}
              <rect
                x="11"
                y="10.5"
                width="4.5"
                height="12"
                rx="2"
                fill={
                  hammerTargetStage === 'meeting'
                    ? `url(#hammer-gold-${uid})`
                    : `url(#hammer-steel-${uid})`
                }
                stroke={hammerTargetStage === 'meeting' ? '#fef08a' : '#ffffff'}
                strokeWidth="1.1"
              />

              {/* Sisi Belakang Sisi Kanan */}
              <rect
                x="38.5"
                y="10.5"
                width="4.5"
                height="12"
                rx="2"
                fill={
                  hammerTargetStage === 'meeting'
                    ? `url(#hammer-gold-${uid})`
                    : `url(#hammer-steel-${uid})`
                }
                stroke={hammerTargetStage === 'meeting' ? '#fef08a' : '#ffffff'}
                strokeWidth="1.1"
              />

              {/* Balok Utama Kepala Palu */}
              <rect
                x="14"
                y="9"
                width="26"
                height="15"
                rx="4.5"
                fill={
                  hammerTargetStage === 'meeting'
                    ? `url(#hammer-gold-${uid})`
                    : `url(#hammer-steel-${uid})`
                }
                stroke={hammerTargetStage === 'meeting' ? '#fffbeb' : '#ffffff'}
                strokeWidth="1.6"
              />

              {/* Kilauan Specular Garis Atas */}
              <line
                x1="17"
                y1="11.5"
                x2="37"
                y2="11.5"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* Simbol Emas / Logam di Tengah Kepala */}
              {hammerTargetStage === 'meeting' ? (
                <path
                  d="M27 12.5 L27.7 15 L30 16.5 L27.7 18 L27 20.5 L26.3 18 L24 16.5 L26.3 15 Z"
                  fill="#ffffff"
                  filter="drop-shadow(0 0 2px rgba(254, 240, 138, 0.8))"
                />
              ) : (
                <circle cx="27" cy="16.5" r="2.2" fill="#ffffff" opacity="0.85" />
              )}

              {/* Kilauan Putih Flash saat Berubah (Transform) */}
              {isTransformingGold && (
                <rect
                  x="10"
                  y="8"
                  width="34"
                  height="17"
                  rx="5"
                  fill="#ffffff"
                  className="hammer-gold-flash-overlay"
                />
              )}
            </g>

            {/* Sparkle Glint Kecil di Luar */}
            <path
              className="hammer-glint-star"
              d="M39 7 L40 9.5 L42.5 10.5 L40 11.5 L39 14 L38 11.5 L35.5 10.5 L38 9.5 Z"
              fill={hammerTargetStage === 'meeting' ? '#fef08a' : '#ffffff'}
            />
          </svg>
        </button>
      )}
    </div>
  );
};