/**
 * Module-scoped, mutable sky/time state.
 *
 * Timing: 30 min bright day → 1 min dusk → 3 min deep night → 1 min dawn → repeat.
 * nightFactor: 0 = full day, 1 = full night.
 * sunAngle: 0 = sunrise (east horizon), π/2 = noon, π = sunset (west horizon).
 */
export const sky = {
  t: 0,
  nightFactor: 0,
  sunAngle: 0,
};

const DAY_SECS   = 1800; // 30 min full daylight
const DUSK_SECS  = 60;   // 1 min sunset transition
const NIGHT_SECS = 180;  // 3 min deep night
const DAWN_SECS  = 60;   // 1 min sunrise transition
export const CYCLE_SECONDS = DAY_SECS + DUSK_SECS + NIGHT_SECS + DAWN_SECS; // 35 min total

const DUSK_START  = DAY_SECS;
const NIGHT_START = DAY_SECS + DUSK_SECS;
const DAWN_START  = DAY_SECS + DUSK_SECS + NIGHT_SECS;

function computeState(elapsed: number) {
  if (elapsed < DUSK_START) {
    sky.nightFactor = 0;
  } else if (elapsed < NIGHT_START) {
    sky.nightFactor = (elapsed - DUSK_START) / DUSK_SECS;
  } else if (elapsed < DAWN_START) {
    sky.nightFactor = 1;
  } else {
    sky.nightFactor = 1 - (elapsed - DAWN_START) / DAWN_SECS;
  }

  // Sun above horizon during day (0 → π), below during night (π → 2π)
  if (elapsed <= DUSK_START) {
    sky.sunAngle = (elapsed / DUSK_START) * Math.PI;
  } else {
    const ne = elapsed - DUSK_START;
    sky.sunAngle = Math.PI + (ne / (CYCLE_SECONDS - DUSK_START)) * Math.PI;
  }
}

export function advanceSky(deltaSeconds: number) {
  sky.t = (sky.t + deltaSeconds / CYCLE_SECONDS) % 1;
  computeState(sky.t * CYCLE_SECONDS);
}

export function setSkyPhase(phase: number) {
  sky.t = ((phase % 1) + 1) % 1;
  computeState(sky.t * CYCLE_SECONDS);
}
