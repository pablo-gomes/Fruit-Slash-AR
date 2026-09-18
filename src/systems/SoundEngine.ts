/**
 * Web Audio API procedural synthesizer for Fruit Slash AR.
 * Generates low-latency, crisp arcade sound effects and dynamic frenzy beats
 * without requiring external sound files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private isVibrationEnabled: boolean = true;
  private frenzyInterval: number | null = null;
  private frenzyStep: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setConfig(sfxVolume: number, musicVolume: number, vibration: boolean) {
    this.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
    this.musicVolume = Math.max(0, Math.min(1, musicVolume));
    this.isVibrationEnabled = vibration;
  }

  public triggerHaptic(pattern: number | number[]) {
    if (!this.isVibrationEnabled || typeof navigator === 'undefined' || !navigator.vibrate) {
      return;
    }
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }

  public playSwoosh(speed: number) {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // White noise buffer for realistic whoosh
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      // Pitch sweeps from high to low based on slash speed
      const baseFreq = Math.min(2200, 600 + speed * 12);
      filter.frequency.setValueAtTime(baseFreq * 1.5, now);
      filter.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.16);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.18);
    } catch {
      // Silent error fallback
    }
  }

  public playSlice(fruitType: string, multiCount: number = 1) {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Blade metallic ping
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = fruitType === 'watermelon' ? 440 : fruitType === 'strawberry' ? 880 : 620;
      osc.frequency.setValueAtTime(baseFreq * (1 + (multiCount - 1) * 0.15), now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.08);

      oscGain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);

      // 2. Wet Juicy squelch noise
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.11);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45 * this.sfxVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.13);

      // Haptic feedback
      this.triggerHaptic(multiCount > 1 ? [25, 40, 35] : 20);
    } catch {
      // Ignore audio failure
    }
  }

  public playCombo(comboMultiplier: number) {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Arpeggio notes based on multiplier
      const scale = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C E G C E G
      const count = Math.min(4, Math.max(2, Math.floor(comboMultiplier / 2) + 1));

      for (let i = 0; i < count; i++) {
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const noteTime = now + i * 0.055;

        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(scale[(i + comboMultiplier) % scale.length], noteTime);

        noteGain.gain.setValueAtTime(0.01, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.3 * this.sfxVolume, noteTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

        noteOsc.connect(noteGain);
        noteGain.connect(this.ctx.destination);

        noteOsc.start(noteTime);
        noteOsc.stop(noteTime + 0.19);
      }

      this.triggerHaptic([30, 40, 50]);
    } catch {
      // Ignore
    }
  }

  public playBombWarning() {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.08);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  public playExplosion() {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Subwoofer impact
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      oscGain.gain.setValueAtTime(0.8 * this.sfxVolume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);

      // Noise blast
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7 * this.sfxVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.6);

      // Heavy bomb vibration
      this.triggerHaptic([100, 60, 200]);
    } catch {}
  }

  public playFreeze() {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [1046.5, 1318.51, 1567.98, 2093.0];
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.45);
      });
      this.triggerHaptic([40, 40, 40]);
    } catch {}
  }

  public playPowerup() {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.25);

      gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  public startFrenzyMusic() {
    if (this.musicVolume <= 0) return;
    this.stopFrenzyMusic();
    this.initContext();

    this.frenzyStep = 0;
    this.frenzyInterval = window.setInterval(() => {
      if (!this.ctx || this.musicVolume <= 0) return;
      try {
        const now = this.ctx.currentTime;
        const bassFreqs = [110, 110, 130.81, 164.81, 98, 98, 123.47, 146.83];
        const freq = bassFreqs[this.frenzyStep % bassFreqs.length];
        this.frenzyStep++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 0.12);

        gain.gain.setValueAtTime(0.25 * this.musicVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
      } catch {}
    }, 135);
  }

  public stopFrenzyMusic() {
    if (this.frenzyInterval) {
      clearInterval(this.frenzyInterval);
      this.frenzyInterval = null;
    }
  }

  public playGameOver() {
    this.stopFrenzyMusic();
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 415.3, 392, 349.23];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = now + idx * 0.15;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.38);
      });
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
