/**
 * Module-scoped, mutable sky/time state. Read by anything that wants to
 * react to time-of-day (lights, fog, materials) without going through
 * React state churn at 60fps.
 *
 * Phase: 0 = noon, 0.5 = sunset, 1 = midnight, 1.5 = dawn, 2 ≡ 0.
 * `nightFactor` is a smoothed 0..1 where 1 = full night.
 */
export const sky = {
  /** Continuous time, wraps every CYCLE seconds. */
  t: 0,
  /** 0..1 — how "night" it currently is. Updated by the cycle. */
  nightFactor: 0,
  /** Sun azimuth (radians) — drives the directional light position. */
  sunAngle: 0,
};

/** Total seconds for one full day-night cycle. ~3 minutes feels alive but not annoying. */
export const CYCLE_SECONDS = 180;

export function advanceSky(deltaSeconds: number) {
  sky.t = (sky.t + deltaSeconds / CYCLE_SECONDS) % 1;
  // sunAngle: 0 at sunrise (east), pi/2 at noon, pi at sunset, 3pi/2 at midnight
  sky.sunAngle = sky.t * Math.PI * 2;
  // nightFactor: 0 at noon (sun overhead), 1 at midnight
  // Use cosine: -cos(sunAngle) maps [-1..1], then remap to [0..1]
  // sunAngle=0 (sunrise) → nightFactor 0.5
  // sunAngle=π/2 (noon)  → nightFactor 0
  // sunAngle=π (sunset)  → nightFactor 0.5
  // sunAngle=3π/2 (mid)  → nightFactor 1
  // We want nightFactor ≈ -cos(sunAngle) clamped, but better:
  // Use sin(sunAngle) for sun height; nightFactor = max(0, -sin)
  const sunHeight = Math.sin(sky.sunAngle);
  // Smooth from full day to full night across the dusk window
  sky.nightFactor = clamp01(-sunHeight * 1.1);
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** Set the cycle to a specific phase (0..1). Useful for the demo. */
export function setSkyPhase(phase: number) {
  sky.t = ((phase % 1) + 1) % 1;
  sky.sunAngle = sky.t * Math.PI * 2;
  sky.nightFactor = clamp01(-Math.sin(sky.sunAngle) * 1.1);
}
