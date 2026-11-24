import { HazardKind, NinjutsuType } from './types';

export class NinjaAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    try {
      const saved = localStorage.getItem('kage_muted');
      if (saved === 'true') this.muted = true;
    } catch {
      // Ignore storage failures
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('kage_muted', String(muted));
    } catch {
      // Ignore storage failures
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private createNoiseBuffer(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 1.0;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  private ensureReady(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return null;
    return this.ctx;
  }

  public playSlash(comboStep: 1 | 2 | 3 | 4): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const startFreq = comboStep === 4 ? 950 : comboStep === 3 ? 1100 : comboStep === 2 ? 1550 : 1850;
    const endFreq = comboStep >= 3 ? 250 : 420;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    const vol = comboStep === 4 ? 0.28 : comboStep === 3 ? 0.24 : 0.16;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (comboStep >= 3 ? 0.2 : 0.13));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.22);

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(comboStep === 4 ? 460 : comboStep === 3 ? 520 : 780, now);
    osc.frequency.exponentialRampToValueAtTime(comboStep === 4 ? 190 : 220, now + 0.09);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.045, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playHit(heavy: boolean): void {
    const ctx = this.ensureReady();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = heavy ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(heavy ? 180 : 240, now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 45 : 70, now + (heavy ? 0.16 : 0.09));

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.22 : 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.17 : 0.1));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);

    if (this.noiseBuffer) {
      const snap = ctx.createBufferSource();
      snap.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = heavy ? 900 : 1400;
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(heavy ? 0.16 : 0.1, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      snap.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      snap.start(now);
      snap.stop(now + 0.07);
    }
  }

  public playPlayerHurt(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(85, now + 0.18);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playShuriken(isBurst = false): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isBurst ? 1650 : 1350, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(isBurst ? 0.12 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playDash(): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.17);
  }

  public playJump(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playSomersault(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playLandingThud(intensity = 0.6): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const clamped = Math.max(0.25, Math.min(1, intensity));

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115 + clamped * 35, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.14);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16 + clamped * 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    if (this.noiseBuffer) {
      const burst = ctx.createBufferSource();
      burst.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520 + clamped * 280, now);
      filter.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.11 + clamped * 0.09, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      burst.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      burst.start(now);
      burst.stop(now + 0.14);
    }
  }

  public playPickup(kind: 'heal' | 'chi' | 'score'): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = kind === 'heal' ? [523.25, 659.25, 783.99] : kind === 'chi' ? [440, 587.33, 880] : [659.25, 987.77];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + idx * 0.055);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.055 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.16);
    });
  }

  public playNinjutsu(kind: NinjutsuType): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (kind === 'ikazuchi') {
      // Electric crackle arpeggio
      [660, 990, 1320, 1760].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.09, now + idx * 0.045);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.16);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.17);
      });
    } else if (kind === 'karyu') {
      // Roaring fire dragon sweep
      if (this.noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(220, now);
        filter.frequency.linearRampToValueAtTime(880, now + 0.25);
        filter.frequency.linearRampToValueAtTime(180, now + 0.6);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.28, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        noise.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.66);
      }
    } else if (kind === 'fushin') {
      // Rising wind agility chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.11, now + idx * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.24);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.25);
      });
    } else if (kind === 'bunshin') {
      // Twin shadow-split shimmer + ninja smoke pop
      [392, 587.33, 783.99, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + idx * 0.035 + 0.14);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.085, now + idx * 0.035);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.22);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.23);
      });
    } else if (kind === 'yagan') {
      // Mystical Night-Vision sonar resonance sweep
      [587.33, 880, 1318.5, 1760].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + idx * 0.045 + 0.25);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, now + idx * 0.045);
        g.gain.linearRampToValueAtTime(0.11, now + idx * 0.045 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.34);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.35);
      });
    } else {
      // Mijin mega-burst
      const sub = ctx.createOscillator();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(160, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 0.55);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      sub.connect(g);
      g.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.6);
    }
  }

  public playGong(isBoss = false): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = isBoss ? [98, 147, 196, 261.6] : [130.8, 196, 261.6];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + 1.1);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(idx === 0 ? 0.24 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  public playMoonFury(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Deep crimson moon sub-bass shockwave
    const sub = ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(195, now);
    sub.frequency.exponentialRampToValueAtTime(38, now + 0.55);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.28, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.6);

    // Rising lunar blade arpeggio
    [440, 587.33, 880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.09, now + idx * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.24);
    });

    if (this.noiseBuffer) {
      const sweep = ctx.createBufferSource();
      sweep.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(240, now + 0.42);
      filter.Q.value = 1.4;
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.24, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      sweep.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      sweep.start(now);
      sweep.stop(now + 0.46);
    }
  }

  public playAchievement(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.085, now + idx * 0.06 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  public playHazardTick(kind: HazardKind): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (kind === 'electric_pool') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.linearRampToValueAtTime(210, now + 0.09);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if (kind === 'frost_fissure') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.08);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else if (kind === 'cave_rockfall') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(175, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.16);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(kind === 'poison_mire' ? 280 : 340, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playRockfallImpact(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.24);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playHazardPhase(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.11);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }
}
