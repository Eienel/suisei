/**
 * Procedural game music — bouncy chiptune loop in C major pentatonic.
 * No assets, generated on the fly via WebAudio. Three voices:
 *   - Square-wave melody arpeggiating through the scale
 *   - Triangle-wave bass walking I → V → vi → V
 *   - Noise-burst "drum" hits on every downbeat for groove
 *
 * 16 sixteenth-note steps × 0.16s = ~2.6s loop @ ~95 BPM.
 *
 * Browsers require a user gesture before audio starts, so start()
 * also attaches a one-shot click listener that resumes if the
 * initial start was blocked.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let playing = false;
let timer: ReturnType<typeof setInterval> | null = null;
let muted = readStoredMute();
let stepIdx = 0;
let nextNoteTime = 0;
let gestureCleanup: (() => void) | null = null;

const STEP_SEC = 0.16; // 16th-note duration → ~95 BPM
const LOOK_AHEAD = 0.35;
const PATTERN_LEN = 16;

// C major pentatonic — bright, never dissonant
const C3 = 130.81, G3 = 196.0, A3 = 220.0;
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880.0;

// 16-step melody — bouncy ascending then descending pentatonic phrase
const MELODY: ReadonlyArray<number | null> = [
  C5,  null, E5,  G5,
  A5,  G5,  E5,  C5,
  D5,  null, G5,  E5,
  D5,  C5,  E5,  G5,
];

// Walking bass: I (C) — V (G) — vi (A) — V (G) over the 16 steps
const BASS: ReadonlyArray<number | null> = [
  C3, null, null, null,
  G3, null, null, null,
  A3, null, null, null,
  G3, null, null, null,
];

// Hihat-style noise burst pattern. Every step gets a tiny hit;
// downbeats are louder. Gives the loop its forward motion.
const HAT_VEL: ReadonlyArray<number> = [
  1.0, 0.3, 0.6, 0.3,
  1.0, 0.3, 0.6, 0.3,
  1.0, 0.3, 0.6, 0.3,
  1.0, 0.3, 0.6, 0.5,
];

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

/** A tiny burst of white noise — sounds like a closed hi-hat tick. */
function getNoiseBuffer(ac: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ac.sampleRate) return noiseBuffer;
  const len = Math.floor(ac.sampleRate * 0.08);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

interface NoteOpts {
  freq: number;
  dur: number;
  when: number;
  vol?: number;
  type?: OscillatorType;
}

/** Plain envelope-shaped oscillator note. */
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

/** High-passed noise burst — a hi-hat-ish tick. */
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

function scheduleStep(step: number, when: number) {
  // Melody — square wave so it cuts through (chiptune lead)
  const m = MELODY[step];
  if (m) tone({ freq: m, dur: STEP_SEC * 1.6, when, vol: 0.045, type: 'square' });

  // Bass — triangle wave, longer sustain
  const b = BASS[step];
  if (b) {
    tone({ freq: b, dur: STEP_SEC * 3.6, when, vol: 0.06, type: 'triangle' });
    // Octave double for fullness
    tone({ freq: b * 2, dur: STEP_SEC * 3.2, when, vol: 0.025, type: 'triangle' });
  }

  // Hi-hat
  const hv = HAT_VEL[step];
  if (hv) hat(when, 0.02 * hv);
}

function loop() {
  if (!ctx || !playing) return;
  while (nextNoteTime < ctx.currentTime + LOOK_AHEAD) {
    scheduleStep(stepIdx, nextNoteTime);
    stepIdx = (stepIdx + 1) % PATTERN_LEN;
    nextNoteTime += STEP_SEC;
  }
}

export const music = {
  /**
   * Start the loop. Safe to call repeatedly. Browsers require a
   * gesture before audio can start; a one-shot click listener is
   * attached as a fallback if the AudioContext is suspended.
   */
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
    // Fade in over 0.6s — punchier than the old slow swell
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

  /** Stop the loop. Fades the master gain out to avoid a click. */
  stop() {
    if (!playing) return;
    playing = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
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

  isMuted() {
    return muted;
  },

  isPlaying() {
    return playing;
  },
};
