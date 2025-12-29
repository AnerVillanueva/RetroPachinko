const SoundManager = {
  ctx: null,
  enabled: true,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio error", e);
    }
  },
  playTone(freq, type, duration) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  playHit() {
    this.playTone(800 + Math.random() * 200, 'sine', 0.1);
  },
  playSlot() {
    this.playTone(150, 'square', 0.2);
  },
  playWin() {
    if (!this.ctx || !this.enabled) return;
    [440, 554, 659].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.3), i * 100);
    });
  }
};

export default SoundManager;
