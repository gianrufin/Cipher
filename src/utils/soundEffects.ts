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

/**
 * Dramatic Soundboard & Reveal Effects
 */

// Heavy judicial gavel impact on oak sound
export function playGavel() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Sharp wood crack transient
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(280, now);
  osc1.frequency.exponentialRampToValueAtTime(80, now + 0.08);
  gain1.gain.setValueAtTime(0.35, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.1);

  // Deep resonant wood block body
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(110, now + 0.01);
  osc2.frequency.exponentialRampToValueAtTime(45, now + 0.35);
  gain2.gain.setValueAtTime(0.4, now + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.01);
  osc2.stop(now + 0.4);

  triggerHaptic([100, 40, 140]);
}

// Low sub-bass double-thump "lub-dub" heartbeat
export function playHeartbeat() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // First thump (lub)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(75, now);
  osc1.frequency.exponentialRampToValueAtTime(40, now + 0.14);
  gain1.gain.setValueAtTime(0.35, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.15);

  // Second thump (dub) - slightly higher and sharper
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(90, now + 0.15);
  osc2.frequency.exponentialRampToValueAtTime(42, now + 0.32);
  gain2.gain.setValueAtTime(0.4, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.33);

  triggerHaptic([60, 80, 70]);
}

// Cinematic suspense / shock sting
export function playSuspenseSting() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Dissonant minor second cluster: C4, C#4, F#4, G#4
  const cluster = [261.63, 277.18, 369.99, 415.30];

  cluster.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.03, now + 0.4);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05 + idx * 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  });

  // Ominous sub drop
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(140, now + 0.05);
  sub.frequency.exponentialRampToValueAtTime(35, now + 0.6);
  subGain.gain.setValueAtTime(0.25, now + 0.05);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
  sub.connect(subGain);
  subGain.connect(ctx.destination);
  sub.start(now + 0.05);
  sub.stop(now + 0.7);

  triggerHaptic([80, 50, 80, 50, 120]);
}

// Classic game show buzzer (error / taboo / wrong guess)
export function playBuzzer() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [155, 218]; // dissonant tritone interval buzz

  freqs.forEach(freq => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.setValueAtTime(0.22, now + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  });

  triggerHaptic([180, 40, 180]);
}

// Rhythmic suspense drumroll build-up
export function playDrumroll() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const beats = 14;
  const duration = 0.85;

  for (let i = 0; i < beats; i++) {
    const time = now + (i / beats) * duration;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const progress = i / beats;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 + progress * 40, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.04);

    const vol = 0.05 + progress * 0.25;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.045);
  }

  // Final crash on end
  const crashTime = now + duration + 0.02;
  const crashOsc = ctx.createOscillator();
  const crashGain = ctx.createGain();
  crashOsc.type = 'sine';
  crashOsc.frequency.setValueAtTime(260, crashTime);
  crashOsc.frequency.exponentialRampToValueAtTime(50, crashTime + 0.3);
  crashGain.gain.setValueAtTime(0.35, crashTime);
  crashGain.gain.exponentialRampToValueAtTime(0.001, crashTime + 0.35);
  crashOsc.connect(crashGain);
  crashGain.connect(ctx.destination);
  crashOsc.start(crashTime);
  crashOsc.stop(crashTime + 0.36);

  triggerHaptic([30, 30, 30, 30, 30, 30, 120]);
}

// Sneaky imposter stealth tip-toe staccato
export function playSneak() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [330, 311, 293, 277]; // descending chromatic pizzicato

  notes.forEach((freq, idx) => {
    const time = now + idx * 0.1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.09);
  });

  triggerHaptic([30, 40, 30, 40, 30]);
}

// Wild Card chaotic Solo Heist fanfare
export function playSoloHeist() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Chaotic ascending whole-tone / tritone fanfare: C4, E4, F#4, Bb4, D5, F#5
  const notes = [261.63, 329.63, 369.99, 466.16, 587.33, 739.99];

  notes.forEach((freq, i) => {
    const time = now + i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.5);
  });

  triggerHaptic([60, 40, 80, 40, 160]);
}

