// Web Audio API Synthesizer for soft, pleasant sound effects without external audio files

class SoundManager {
  private audioCtx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play romantic chime for badge unlock
  playChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0, this.audioCtx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.18, this.audioCtx.currentTime + idx * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + idx * 0.1 + 0.8);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + idx * 0.1);
        osc.stop(this.audioCtx.currentTime + idx * 0.1 + 0.85);
      });
    } catch {
      // Audio autoplay may be blocked until user interaction
    }
  }

  // Soft click / gentle tap
  playTap() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.06);
    } catch {
      // Ignore audio context error
    }
  }

  // Heartbeat sound
  playHeartbeat() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      [0, 0.22].forEach((delay) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(75, this.audioCtx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + delay + 0.1);

        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + delay + 0.15);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + delay);
        osc.stop(this.audioCtx.currentTime + delay + 0.16);
      });
    } catch {
      // Ignore
    }
  }

  // Soft celebratory pop / success notification
  playSuccess() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.22);
    } catch {
      // Ignore
    }
  }

  playPop() {
    this.playTap();
  }
}

export const soundManager = new SoundManager();
