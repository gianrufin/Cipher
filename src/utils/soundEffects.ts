// Web Audio API Procedural Sound Engine
let audioCtx: AudioContext | null = null;
let soundEnabled = typeof localStorage === 'undefined' ? true : localStorage.getItem('cipher_sound') !== 'off';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  try { localStorage.setItem('cipher_sound', enabled ? 'on' : 'off'); } catch { /* optional */ }
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function triggerHaptic(pattern: number | number[] = 40) {
  try {
    if (localStorage.getItem('cipher_haptics') === 'off') return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore if vibration is restricted or not supported
  }
}

export function playTick() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.04);
}

export function playWhoosh() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.12);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.22);

  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.22);
}

export function playReveal() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [220, 277.18, 329.63, 440]; // A major suspense chord

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.1 + idx * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + idx * 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.04);
    osc.stop(now + 0.65 + idx * 0.04);
  });
  triggerHaptic([60, 40, 80]);
}

export function playVote() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
  triggerHaptic(50);
}

export function playElimination() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [260, 246, 220, 185]; // descending suspense tone

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + i * 0.12);

    gain.gain.setValueAtTime(0.12, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.12);
    osc.stop(now + (i + 1) * 0.15);
  });
  triggerHaptic([120, 50, 200]);
}

export function playVictory() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [392, 523.25, 659.25, 783.99, 1046.5]; // G, C, E, G, High C

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.09);

    gain.gain.setValueAtTime(0.001, now + i * 0.09);
    gain.gain.linearRampToValueAtTime(0.14, now + i * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.09);
    osc.stop(now + i * 0.09 + 0.42);
  });
}

export function playImposterWin() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [311.13, 293.66, 277.18, 220]; // D# D C# A

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + i * 0.16);

    gain.gain.setValueAtTime(0.12, now + i * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.16);
    osc.stop(now + i * 0.16 + 0.38);
  });
}

export function playCountdown(step: number) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const isZero = step === 0;
  osc.type = isZero ? 'sawtooth' : 'sine';
  osc.frequency.setValueAtTime(isZero ? 880 : 440 + (3 - step) * 110, ctx.currentTime);

  gain.gain.setValueAtTime(isZero ? 0.25 : 0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isZero ? 0.35 : 0.12));

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + (isZero ? 0.35 : 0.12));
  triggerHaptic(isZero ? [80, 50, 150] : 40);
}

