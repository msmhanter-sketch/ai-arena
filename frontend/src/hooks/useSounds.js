// ── Web Audio API procedural sound effects ──────────────────────────────────
// No external files needed — all sounds generated in-browser

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone({ freq = 440, type = 'sine', duration = 0.15, volume = 0.18, decay = 0.12 }) {
  try {
    const c   = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration + decay);
  } catch {}
}

function playChord(freqs, opts = {}) {
  freqs.forEach((freq, i) => setTimeout(() => playTone({ freq, ...opts }), i * 60));
}

export const sounds = {
  buy() {
    playTone({ freq: 523, type: 'sine', duration: 0.1, volume: 0.12 });
    setTimeout(() => playTone({ freq: 659, type: 'sine', duration: 0.1, volume: 0.12 }), 80);
  },
  sell() {
    playTone({ freq: 659, type: 'sine', duration: 0.1, volume: 0.12 });
    setTimeout(() => playTone({ freq: 440, type: 'sine', duration: 0.12, volume: 0.12 }), 80);
  },
  win() {
    playChord([523, 659, 784, 1047], { type: 'sine', duration: 0.25, volume: 0.15 });
    setTimeout(() => playTone({ freq: 1047, duration: 0.4, volume: 0.2 }), 300);
  },
  lose() {
    playTone({ freq: 330, type: 'sawtooth', duration: 0.3, volume: 0.1 });
    setTimeout(() => playTone({ freq: 220, type: 'sawtooth', duration: 0.4, volume: 0.1 }), 200);
  },
  news() {
    playTone({ freq: 880, type: 'square', duration: 0.08, volume: 0.08 });
    setTimeout(() => playTone({ freq: 1100, type: 'square', duration: 0.08, volume: 0.08 }), 100);
    setTimeout(() => playTone({ freq: 880, type: 'square', duration: 0.08, volume: 0.08 }), 200);
  },
  roundStart() {
    [300, 200, 100, 0].forEach((delay, i) => {
      setTimeout(() => playTone({ freq: [330, 415, 523, 659][i], duration: 0.12, volume: 0.14 }), delay);
    });
    setTimeout(() => playTone({ freq: 784, duration: 0.3, volume: 0.18 }), 420);
  },
  bet() {
    playTone({ freq: 698, type: 'sine', duration: 0.08, volume: 0.12 });
    setTimeout(() => playTone({ freq: 880, type: 'sine', duration: 0.12, volume: 0.14 }), 70);
  },
  airdrop() {
    playChord([392, 494, 587, 740], { type: 'sine', duration: 0.2, volume: 0.13 });
    setTimeout(() => playTone({ freq: 987, duration: 0.3, volume: 0.16 }), 280);
  },
  nft() {
    [0,80,160,240,320].forEach((delay, i) => {
      setTimeout(() => playTone({ freq: [523,659,784,988,1047][i], duration: 0.18, volume: 0.13 }), delay);
    });
  },
};

// Mute/unmute state
let muted = localStorage.getItem('arena_muted') === '1';

export function toggleMute() {
  muted = !muted;
  localStorage.setItem('arena_muted', muted ? '1' : '0');
  return muted;
}

export function isMuted() { return muted; }

export function play(name) {
  if (muted) return;
  sounds[name]?.();
}
