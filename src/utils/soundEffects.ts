// Web Audio API Context (lazy initialization)
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playOscillator = (type: OscillatorType, frequency: number, duration: number, volume: number = 0.5) => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

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
};

export const playPop = () => {
  // Soft click/selection sound
  playOscillator('sine', 600, 0.1, 0.3);
};

export const playSuccessChime = () => {
  // Harmonic double tone
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  
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

export const playVictoryFanfare = () => {
  // Triumph melody
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const playTone = (freq: number, delay: number, duration: number) => {
    setTimeout(() => playOscillator('square', freq, duration, 0.3), delay);
  };

  playTone(392.00, 0, 0.2);   // G4
  playTone(392.00, 150, 0.2); // G4
  playTone(392.00, 300, 0.2); // G4
  playTone(523.25, 450, 0.6); // C5
};
