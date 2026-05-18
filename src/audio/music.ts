/**
 * Procedural game music — three tracks, all synthesised via WebAudio.
 * No audio files; everything is oscillators, noise buffers, and envelopes.
 *
 * Tracks
 *   0 "Block Party" — 130 BPM · C major · arpeggios + kick + snare  (energetic default)
 *   1 "Chiptune"    — 95 BPM  · C major pentatonic · square/triangle (8-bit retro)
 *   2 "Synthwave"   — 120 BPM · A minor · sawtooth lead + drums      (dark & driving)
 *
 * API: music.start / stop / setMuted / isMuted / isPlaying /
 *      music.nextTrack / music.getTrackLabel / music.getTrackCount / music.getTrackIdx
 *
 * Track preference is persisted to localStorage as 'bb-track'.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let playing = false;
let timer: ReturnType<typeof setInterval> | null = null;
let muted = readStoredMute();
let trackIdx = readStoredTrack();
let stepIdx = 0;
let nextNoteTime = 0;
let gestureCleanup: (() => void) | null = null;

const LOOK_AHEAD  = 0.35;
const PATTERN_LEN = 16;

// ─── Note frequencies (Hz) ───────────────────────────────────────────────────
const C3 = 130.81, E3 = 164.81, F3 = 174.61, G3 = 196.00, A3 = 220.00;
const A4 = 440.00;
const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00;

// ─── Track definitions ───────────────────────────────────────────────────────
interface TrackDef {
  id: string;
  label: string;
  stepSec: number;
  melody: ReadonlyArray<number | null>;
  bass: ReadonlyArray<number | null>;
  hats: ReadonlyArray<number>;    // per-step hat velocity (0 = off)
  kicks: ReadonlyArray<number>;   // per-step kick velocity (0 = off)
  snares: ReadonlyArray<number>;  // per-step snare velocity (0 = off)
  melodyType: OscillatorType;
}

const TRACKS: readonly TrackDef[] = [
  // ── 0: Block Party ── 130 BPM, C major, triadic arpeggio + full drums ─────
  {
    id: 'block-party', label: 'Block Party',
    stepSec: 60 / (130 * 4), // ≈ 0.1154 s per 16th note
    melody: [
      C5,  E5,  G5,  E5,
      A5,  G5,  E5,  C5,
      F5,  A5,  C5,  A5,
      G5,  E5,  D5,  C5,
    ],
    bass: [
      C3,  null, null, null,
      G3,  null, null, null,
      F3,  null, null, null,
      G3,  null, null, null,
    ],
    hats:   [0.7, 0.3, 0.7, 0.3,  0.7, 0.3, 0.7, 0.3,  0.7, 0.3, 0.7, 0.3,  0.7, 0.3, 0.7, 0.3],
    kicks:  [1,   0,   0,   0,     1,   0,   0,   0,     1,   0,   0,   0,     1,   0,   0,   0  ],
    snares: [0,   0,   0,   0,     1,   0,   0,   0,     0,   0,   0,   0,     1,   0,   0,   0  ],
    melodyType: 'square',
  },

  // ── 1: Chiptune ── 95 BPM, C major pentatonic, pure 8-bit ─────────────────
  {
    id: 'chiptune', label: 'Chiptune',
    stepSec: 0.16, // ≈ 94 BPM
    melody: [
      C5,  null, E5,  G5,
      A5,  G5,   E5,  C5,
      D5,  null, G5,  E5,
      D5,  C5,   E5,  G5,
    ],
    bass: [
      C3,  null, null, null,
      G3,  null, null, null,
      A3,  null, null, null,
      G3,  null, null, null,
    ],
    hats:   [1.0, 0.3, 0.6, 0.3,  1.0, 0.3, 0.6, 0.3,  1.0, 0.3, 0.6, 0.3,  1.0, 0.3, 0.6, 0.5],
    kicks:  [0,   0,   0,   0,     0,   0,   0,   0,     0,   0,   0,   0,     0,   0,   0,   0  ],
    snares: [0,   0,   0,   0,     0,   0,   0,   0,     0,   0,   0,   0,     0,   0,   0,   0  ],
    melodyType: 'square',
  },

  // ── 2: Synthwave ── 120 BPM, A minor pentatonic, sawtooth + drums ──────────
  {
    id: 'synthwave', label: 'Synthwave',
    stepSec: 60 / (120 * 4), // = 0.125 s per 16th note
    melody: [
      A5,  null, G5,  E5,
      A5,  G5,   E5,  D5,
      E5,  null, G5,  A5,
      E5,  D5,   null, A4,
    ],
    bass: [
      A3,  null, null, null,
      E3,  null, null, null,
      A3,  null, null, null,
      G3,  null, null, null,
    ],
    hats:   [0.5, 0,   0.5, 0,    0.5, 0,   0.5, 0,    0.5, 0,   0.5, 0,    0.5, 0,   0.5, 0  ],
    kicks:  [1,   0,   0,   0,     1,   0,   0,   0,     1,   0,   0,   0,     1,   0,   0,   0  ],
    snares: [0,   0,   0,   0,     1,   0,   0,   0,     0,   0,   0,   0,     1,   0,   0,   0  ],
    melodyType: 'sawtooth',
  },
];

// ─── Storage ─────────────────────────────────────────────────────────────────
function readStoredMute(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('bb-muted') === '1';
  } catch { return false; }
}

function writeStoredMute(m: boolean) {
  try { localStorage.setItem('bb-muted', m ? '1' : '0'); } catch { /* */ }
}

function readStoredTrack(): number {
  try {
    const v = localStorage.getItem('bb-track');
    const n = v !== null ? parseInt(v, 10) : 0;
    return (isNaN(n) || n < 0 || n >= TRACKS.length) ? 0 : n;
  } catch { return 0; }
}

function writeStoredTrack(idx: number) {
  try { localStorage.setItem('bb-track', String(idx)); } catch { /* */ }
}

// ─── Audio context ───────────────────────────────────────────────────────────
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx && ctx.state !== 'closed') return ctx;
  try {
    const Ctor: typeof AudioContext =
      window.AudioContext ||
      // @ts-expect-error legacy webkit
      window.webkitAudioContext;
    ctx = new Ctor();
  } catch { return null; }
  return ctx;
}

function getNoiseBuffer(ac: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ac.sampleRate) return noiseBuffer;
  const len = Math.floor(ac.sampleRate * 0.08);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

// ─── Synthesisers ────────────────────────────────────────────────────────────
interface NoteOpts {
  freq: number; dur: number; when: number;
  vol?: number; type?: OscillatorType;
}

function tone({ freq, dur, when, vol = 0.04, type = 'square' }: NoteOpts) {
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  const atk = 0.006;
  const rel = Math.max(0.05, dur - atk);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(vol, when + atk);
  gain.gain.exponentialRampToValueAtTime(0.001, when + atk + rel);
  osc.connect(gain).connect(masterGain);
  osc.start(when);
  osc.stop(when + atk + rel + 0.04);
}

function hat(when: number, vol: number) {
  if (!ctx || !masterGain) return;
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 5000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(vol, when + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
  src.connect(hp).connect(gain).connect(masterGain);
  src.start(when);
  src.stop(when + 0.08);
}

/** 808-style sine kick — pitch sweeps 150 → 40 Hz. */
function kick(when: number, vel: number) {
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, when);
  osc.frequency.exponentialRampToValueAtTime(40, when + 0.08);
  gain.gain.setValueAtTime(0.65 * vel, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.35);
  osc.connect(gain).connect(masterGain);
  osc.start(when);
  osc.stop(when + 0.4);
}

/** Bandpass noise + triangle snap = snare. */
function snare(when: number, vel: number) {
  if (!ctx || !masterGain) return;
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2000;
  bp.Q.value = 0.7;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.32 * vel, when);
  ng.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
  src.connect(bp).connect(ng).connect(masterGain);
  src.start(when);
  src.stop(when + 0.15);

  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 220;
  og.gain.setValueAtTime(0.1 * vel, when);
  og.gain.exponentialRampToValueAtTime(0.001, when + 0.07);
  osc.connect(og).connect(masterGain);
  osc.start(when);
  osc.stop(when + 0.09);
}

// ─── Scheduler ───────────────────────────────────────────────────────────────
function scheduleStep(step: number, when: number) {
  const trk = TRACKS[trackIdx];
  const ss = trk.stepSec;

  const m = trk.melody[step];
  if (m) tone({ freq: m, dur: ss * 1.5, when, vol: 0.042, type: trk.melodyType });

  const b = trk.bass[step];
  if (b) {
    tone({ freq: b,     dur: ss * 3.5, when, vol: 0.055, type: 'triangle' });
    tone({ freq: b * 2, dur: ss * 3.0, when, vol: 0.022, type: 'triangle' });
  }

  const hv = trk.hats[step];
  if (hv) hat(when, 0.018 * hv);

  const kv = trk.kicks[step];
  if (kv) kick(when, kv);

  const sv = trk.snares[step];
  if (sv) snare(when, sv);
}

function loop() {
  if (!ctx || !playing) return;
  const ss = TRACKS[trackIdx].stepSec;
  while (nextNoteTime < ctx.currentTime + LOOK_AHEAD) {
    scheduleStep(stepIdx, nextNoteTime);
    stepIdx = (stepIdx + 1) % PATTERN_LEN;
    nextNoteTime += ss;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────
export const music = {
  start() {
    if (playing || muted) return;
    const ac = getCtx();
    if (!ac) return;
    if (!masterGain) {
      masterGain = ac.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ac.destination);
    }
    playing = true;
    stepIdx = 0;
    nextNoteTime = ac.currentTime + 0.08;
    masterGain.gain.cancelScheduledValues(ac.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.6, ac.currentTime + 0.6);

    const tick = () => loop();
    timer = setInterval(tick, 80);
    tick();

    if (ac.state === 'suspended') {
      const resume = () => {
        ac.resume().catch(() => {});
        if (gestureCleanup) gestureCleanup();
      };
      window.addEventListener('click', resume, { once: true });
      window.addEventListener('touchstart', resume, { once: true });
      gestureCleanup = () => {
        window.removeEventListener('click', resume);
        window.removeEventListener('touchstart', resume);
        gestureCleanup = null;
      };
    }
  },

  stop() {
    if (!playing) return;
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (gestureCleanup) gestureCleanup();
    const ac = ctx;
    if (ac && masterGain) {
      masterGain.gain.cancelScheduledValues(ac.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ac.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.3);
    }
  },

  setMuted(m: boolean) {
    muted = m;
    writeStoredMute(m);
    if (m) this.stop();
  },

  isMuted()  { return muted; },
  isPlaying() { return playing; },

  /** Cycle to the next track. Resets the pattern; the change takes effect within ~80 ms. */
  nextTrack() {
    const newIdx = (trackIdx + 1) % TRACKS.length;
    trackIdx = newIdx;
    stepIdx = 0;
    if (ctx && playing) nextNoteTime = ctx.currentTime + 0.05;
    writeStoredTrack(newIdx);
  },

  getTrackLabel() { return TRACKS[trackIdx].label; },
  getTrackCount() { return TRACKS.length; },
  getTrackIdx()   { return trackIdx; },
};
