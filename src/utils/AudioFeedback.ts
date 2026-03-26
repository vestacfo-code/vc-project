// Audio feedback utility for call controls
export class AudioFeedback {
  private static audioContext: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  // Pleasant beep for mute/unmute actions
  static playMuteToggle(isMuted: boolean) {
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different tones for mute vs unmute
    oscillator.frequency.setValueAtTime(isMuted ? 800 : 1000, ctx.currentTime);
    oscillator.type = 'sine';

    // Gentle fade in/out
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  // Gentle click for other buttons
  static playButtonClick() {
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  }

  // Success sound for call start
  static playCallStart() {
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
    oscillator.frequency.linearRampToValueAtTime(659, ctx.currentTime + 0.1); // E5
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  // End call sound
  static playCallEnd() {
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(659, ctx.currentTime); // E5
    oscillator.frequency.linearRampToValueAtTime(523, ctx.currentTime + 0.1); // C5
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }
}