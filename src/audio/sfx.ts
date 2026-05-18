/**
 * Tiny procedural SFX via WebAudio. No audio files = no asset loading.
 * Keep volumes low and durations short — these fire often.
 *
 * Also fires a short device vibration (where supported — Android etc;
 * iOS Safari has no Vibration API, so it's a harmless no-op there).
 */

let ctx: AudioContext | null = null;
let muted = readStoredMute();

function readStoredMute(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('bb-muted') === '1';
  } catch {
    return false;
  }
}

function writeStoredMute(m: boolean) {
  try {
    localStorage.setItem('bb-muted', m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (muted) return null;
  if (ctx && ctx.state !== 'closed') return ctx;
  try {
    const Ctor: typeof AudioContext =
      window.AudioContext ||
      // @ts-expect-error legacy webkit
      window.webkitAudioContext;
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

/** Short haptic pulse — respects the same mute flag as audio. */
function buzz(pattern: number | number[]) {
  if (muted) return;
  if (typeof navigator === 'undefined') return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* some browsers throw on rapid calls — ignore */
  }
}

function tone(opts: {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  attack?: number;
  release?: number;
  freqEnd?: number;
  delay?: number;
}) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t0 = ac.currentTime + (opts.delay ?? 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t0 + opts.duration);
  }
  const v = opts.volume ?? 0.08;
  const atk = opts.attack ?? 0.005;
  const rel = opts.release ?? Math.max(opts.duration - atk, 0.02);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(v, t0 + atk);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + atk + rel);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + atk + rel + 0.02);
}

export const sfx = {
  click() {
    tone({ freq: 760, duration: 0.07, type: 'square', volume: 0.04 });
  },
  thud() {
    tone({ freq: 220, freqEnd: 110, duration: 0.12, type: 'triangle', volume: 0.06 });
    buzz(14);
  },
  /**
   * Crisp "snap" for stacking a block onto another. Pitches up slightly
   * with stack height so building taller feels like it climbs. `level`
   * is the y-coordinate the block landed on (0 = ground).
   */
  snap(level = 0) {
    const base = 540 + Math.min(level, 12) * 26;
    tone({ freq: base, freqEnd: base * 0.7, duration: 0.06, type: 'square', volume: 0.045 });
    tone({ freq: base * 1.5, duration: 0.045, type: 'sine', volume: 0.03, delay: 0.012 });
    buzz(10);
  },
  error() {
    tone({ freq: 180, duration: 0.18, type: 'sawtooth', volume: 0.05 });
    tone({ freq: 140, duration: 0.18, type: 'sawtooth', volume: 0.05, delay: 0.08 });
    buzz([18, 40, 18]);
  },
  sparkle() {
    tone({ freq: 1320, duration: 0.08, type: 'sine', volume: 0.05 });
    tone({ freq: 1760, duration: 0.08, type: 'sine', volume: 0.05, delay: 0.06 });
    tone({ freq: 2640, duration: 0.1, type: 'sine', volume: 0.04, delay: 0.12 });
  },
  chime() {
    tone({ freq: 880, duration: 0.16, type: 'sine', volume: 0.07 });
    tone({ freq: 1320, duration: 0.22, type: 'sine', volume: 0.06, delay: 0.1 });
    buzz([12, 30, 24]);
  },
  /** Soft tick — for tool / type / shape toggles in the toolbar. */
  tick() {
    tone({ freq: 980, duration: 0.04, type: 'square', volume: 0.025 });
  },
  /** Hollow pop — for deleting / removing a block. */
  pop() {
    tone({ freq: 420, freqEnd: 80, duration: 0.13, type: 'triangle', volume: 0.06 });
    buzz(20);
  },
  /** Quick whoosh — for rotating a placed block or piece. */
  whoosh() {
    tone({ freq: 320, freqEnd: 640, duration: 0.09, type: 'sine', volume: 0.035 });
  },
  /** Two-tone page turn — for advancing a lesson page. */
  page() {
    tone({ freq: 520, duration: 0.05, type: 'sine', volume: 0.03 });
    tone({ freq: 720, duration: 0.06, type: 'sine', volume: 0.03, delay: 0.05 });
  },
  setMuted(m: boolean) {
    muted = m;
    writeStoredMute(m);
  },
  isMuted() {
    return muted;
  },
};
