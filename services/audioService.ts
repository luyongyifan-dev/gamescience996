
class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playDraw() {
    this.playTone(150, 'triangle', 0.5, 0.05);
  }

  playRelease() {
    this.playTone(400, 'sine', 0.1, 0.2);
    this.playTone(200, 'sawtooth', 0.05, 0.1);
  }

  playHit() {
    this.playTone(100, 'square', 0.3, 0.3);
    this.playTone(50, 'sawtooth', 0.5, 0.2);
  }

  playDamage() {
    this.playTone(220, 'sawtooth', 0.2, 0.15);
  }

  playWin() {
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.4, 0.1), i * 150);
    });
  }

  playLose() {
    [440, 349, 293, 220].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.6, 0.1), i * 200);
    });
  }
}

export const audioService = new AudioService();
