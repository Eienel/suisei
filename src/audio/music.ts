/**
 * Procedural ambient music — a slow A-minor pentatonic loop generated
 * on the fly via WebAudio. No assets, ~6s loop, low volume so it sits
 * behind SFX rather than fighting them.
 *
 * Layers:
 *   - sustained pad chord on the downbeat (A or G root, 1.5x and 2x harmonics)
 *   - low sub-bass pulse on beats 1 and 5
 *   - sparse pentatonic arpeggio (high register) sprinkled across the loop
 *
 * Browsers require a user gesture before audio starts, so start()
 * will resume() and also attach a one-shot click listener that resumes
 * if the initial start was blocked.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let playing = false;
let timer: ReturnType<typeof setInterval> | null = null;
let muted = readStoredMute();
let stepIdx = 0;
let nextNoteTime = 0;
let gestureCleanup: (() => void) | null = null;

const STEP_SEC = 0.45; // ~133 bpm eighth notes
const LOOK_AHEAD = 0.4; // schedule this many seconds in advance
const PATTERN_LEN = 16; // 16 steps × 0.45s = 7.2s loop

// A minor pentatonic — always reads as "calm/melodic", never dissonant
const PENT = {
  A3: 220.0, C4: 261.6, D4: 293.7, E4: 329.6, G4: 392.0,
  A4: 440.0, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784.0,
};

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

interface NoteOpts {
  freq: number;
  dur: number;
  when: number;
  vol?: number;
  type?: OscillatorType;
  /** Detune in cents — small drift gives a richer pad. */
  detune?: number;
}

function note({ freq, dur, when, vol = 0.025, type = 'sine', detune = 0 }: NoteOpts) {
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (detune) osc.detune.setValueAtTime(detune, when);
  const atk = Math.min(0.4, dur * 0.35);
  const tail = Math.max(0.2, dur * 0.55);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(vol, when + atk);
  gain.gain.exponentialRampToValueAtTime(0.0008, when + atk + tail);
  osc.connect(gain).connect(masterGain);
  osc.start(when);
  osc.stop(when + atk + tail + 0.1);
}

/** Drop a pad chord (root + 5th + octave) starting at `when`. */
function padChord(root: number, when: number, dur: number, vol = 0.012) {
  note({ freq: root, dur, when, vol, type: 'sine', detune: -4 });
  note({ freq: root * 1.5, dur, when, vol: vol * 0.8, type: 'sine', detune: +5 });
  note({ freq: root * 2, dur, when, vol: vol * 0.55, type: 'sine', detune: +2 });
}

function scheduleStep(step: number, when: number) {
  // === Pad: alternating Am and G major chords every 8 steps ===
  if (step === 0) padChord(PENT.A3, when, STEP_SEC * 7.5);
  if (step === 8) padChord(PENT.G4 / 2 /* G3 */, when, STEP_SEC * 7.5);

  // === Sub-bass pulse on downbeats ===
  if (step === 0) note({ freq: PENT.A3 / 4 /* A1-ish */, dur: 0.9, when, vol: 0.04, type: 'sine' });
  if (step === 8) note({ freq: PENT.A3 / 4 * (196 / 220) /* G1 */, dur: 0.9, when, vol: 0.04, type: 'sine' });

  // === Sparse melodic notes (pentatonic) at fixed steps for repeatability ===
  // Eighth-note positions in the 16-step loop.
  const MELODY: Record<number, number | undefined> = {
    2: PENT.E4,
    5: PENT.G4,
    7: PENT.A4,
    10: PENT.D4,
    12: PENT.C4,
    14: PENT.E4,
  };
  const f = MELODY[step];
  if (f) note({ freq: f, dur: STEP_SEC * 1.8, when, vol: 0.022, type: 'triangle' });

  // === High shimmer — a single bell-ish note once per loop on step 6 ===
  if (step === 6) {
    note({ freq: PENT.C5, dur: 1.2, when: when + 0.05, vol: 0.015, type: 'sine' });
    note({ freq: PENT.E5, dur: 1.2, when: when + 0.18, vol: 0.012, type: 'sine' });
  }
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
   * Start the ambient loop. Safe to call repeatedly — it's a no-op
   * if already playing or if the user has muted music. Browsers
   * require a gesture before audio can start; we attach a one-shot
   * click listener as a fallback if the AudioContext is suspended.
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
    nextNoteTime = ac.currentTime + 0.1;
    // Fade in over 1.5s
    masterGain.gain.cancelScheduledValues(ac.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.55, ac.currentTime + 1.5);

    const tick = () => loop();
    timer = setInterval(tick, 120);
    tick();

    // If the context is still suspended (autoplay blocked), arm a
    // one-shot listener so the next user gesture kicks it off.
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

  /** Stop the loop. Fades the master gain out so it doesn't click. */
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
      masterGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4);
    }
  },

  /** Apply the persisted mute preference. */
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
