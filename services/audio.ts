
class AudioManager {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private beatCounter: number = 0;
  private bpm: number = 120;
  private isMusicPlaying: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playEngine(speed: number) {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    const frequency = 30 + (Math.abs(speed) * 15);
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playCollision() {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playVictory() {
    this.init();
    if (!this.ctx) return;
    
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + i * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + i * 0.1);
      osc.stop(this.ctx!.currentTime + i * 0.1 + 0.4);
    });
  }

  // --- Procedural Phonk Music System ---

  startMusic() {
    this.init();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.beatCounter = 0;
    this.bpm = 120;
    this.scheduleNextBeat();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  updateMusicIntensity(speed: number, isBoosting: boolean) {
    // Dynamically adjust BPM between 120 and 180 based on speed
    const targetBpm = 120 + (Math.min(speed, 45) / 45) * 60;
    this.bpm = targetBpm;
  }

  private scheduleNextBeat() {
    if (!this.isMusicPlaying || !this.ctx) return;

    const beatDuration = 60 / this.bpm / 4; // 16th notes
    this.playBeat(this.beatCounter);
    
    this.beatCounter = (this.beatCounter + 1) % 16;
    this.musicInterval = setTimeout(() => this.scheduleNextBeat(), beatDuration * 1000);
  }

  private playBeat(step: number) {
    if (!this.ctx) return;
    const time = this.ctx.currentTime;

    // Phonk Cowbell Pattern (Typical syncopated drift)
    const cowbellSteps = [0, 3, 6, 8, 11, 14];
    if (cowbellSteps.includes(step)) {
      this.triggerCowbell(time);
    }

    // Heavy Phonk Kick (Every 1st and 3rd beat usually)
    if (step === 0 || step === 8 || step === 4 || step === 12) {
      this.triggerKick(time);
    }

    // Distorted Sub Bass Pattern
    const bassSteps = [0, 2, 4, 6, 8, 10, 12, 14];
    if (bassSteps.includes(step)) {
      this.triggerBass(time, step);
    }
  }

  private triggerCowbell(time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'square';
    // Classic high pitched drift phonk cowbell sound
    osc.frequency.setValueAtTime(800 + Math.random() * 20, time);
    
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private triggerKick(time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private triggerBass(time: number, step: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    const filter = this.ctx!.createBiquadFilter();
    
    osc.type = 'sawtooth';
    // Phonk often uses a simple 1-note or 2-note minor bassline
    const freq = step < 8 ? 55 : 48.99; // A1 to G1# roughly
    osc.frequency.setValueAtTime(freq, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, time);
    
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start(time);
    osc.stop(time + 0.2);
  }
}

export const audioManager = new AudioManager();
