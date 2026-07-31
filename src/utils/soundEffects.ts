// Web Audio API Context (lazy initialization, fully guarded).
// Audio is best-effort feedback: if the AudioContext is unavailable or the
// browser blocks it, every play function degrades to a silent no-op instead
// of throwing an unhandled runtime exception.
let audioCtx: AudioContext | null = null;
let audioFailed = false;

const getAudioContext = (): AudioContext | null => {
  if (audioFailed) return null;
  if (!audioCtx) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        audioFailed = true;
        return null;
      }
      audioCtx = new Ctor();
    } catch {
      audioFailed = true;
      return null;
    }
  }
  return audioCtx;
};

const resumeIfSuspended = (ctx: AudioContext): void => {
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {
      // Autoplay policy rejection – sound simply stays muted until next gesture.
    });
  }
};

const playOscillator = (type: OscillatorType, frequency: number, duration: number, volume: number = 0.5) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  resumeIfSuspended(ctx);

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Never let audio feedback break gameplay.
  }
};

export const playPop = () => {
  // Soft click/selection sound
  playOscillator('sine', 600, 0.1, 0.3);
};

export const playSuccessChime = () => {
  // Harmonic double tone
  const ctx = getAudioContext();
  if (!ctx) return;
  resumeIfSuspended(ctx);

  const playTone = (freq: number, delay: number) => {
    setTimeout(() => playOscillator('sine', freq, 0.3, 0.4), delay);
  };

  playTone(523.25, 0);   // C5
  playTone(659.25, 150); // E5
};

export const playErrorBuzz = () => {
  // Deep error tone
  playOscillator('sawtooth', 150, 0.3, 0.4);
};

export const playWhoosh = () => {
  // Rising sweep for the victory wave (bottom-left to top-right)
  const ctx = getAudioContext();
  if (!ctx) return;
  resumeIfSuspended(ctx);

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(220, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.9);

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 1.0);
  } catch {
    // Never let audio feedback break gameplay.
  }
};

export const playVictoryFanfare = () => {
  // Triumph melody
  const ctx = getAudioContext();
  if (!ctx) return;
  resumeIfSuspended(ctx);

  const playTone = (freq: number, delay: number, duration: number) => {
    setTimeout(() => playOscillator('square', freq, duration, 0.3), delay);
  };

  playTone(392.00, 0, 0.2);   // G4
  playTone(392.00, 150, 0.2); // G4
  playTone(392.00, 300, 0.2); // G4
  playTone(523.25, 450, 0.6); // C5
};
