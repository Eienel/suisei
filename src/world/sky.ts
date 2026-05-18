/**
 * Real-world-time sky state. Samples the system clock each frame so the
 * game's day/night matches the player's actual local time — no artificial
 * timers. Sunrise ≈ 6 AM, sunset ≈ 6 PM in the player's timezone.
 *
 * nightFactor: 0 = full day, 1 = full night. Smoothly transitions through
 *   a ~30-min twilight band around sunrise/sunset (civil twilight model).
 *
 * sunAngle: 0 = sunrise (east horizon), π/2 = solar noon,
 *           π = sunset (west horizon), 3π/2 = midnight (underground).
 */
export const sky = {
  /** Fraction of the 24-hour day (0 = midnight, 0.25 = 6 AM, 0.5 = noon). */
  t: 0,
  /** 0 = full day, 1 = full night. */
  nightFactor: 0,
  /** Radians — drives directional-light position. */
  sunAngle: 0,
};

/** Kept for callers that reference it; now represents seconds in a full day. */
export const CYCLE_SECONDS = 86400;

/** Width of the twilight transition band (sin of ~7°). */
const TWILIGHT = 0.12;

function applyAngle(angle: number) {
  sky.sunAngle = angle;
  const h = Math.sin(angle); // sun height above/below horizon
  sky.nightFactor =
    h >= TWILIGHT  ? 0 :
    h <= -TWILIGHT ? 1 :
    0.5 - h / (2 * TWILIGHT);
}

/** Called every frame by DayNightCycle. Reads the real system clock. */
export function advanceSky(_dt: number) {
  const now = new Date();
  const s =
    now.getHours()        * 3600 +
    now.getMinutes()      * 60   +
    now.getSeconds()             +
    now.getMilliseconds() / 1000;
  sky.t = s / 86400;
  // sunAngle orbit: 0 at 6 AM, π/2 at noon, π at 6 PM, 3π/2 at midnight.
  const angle = ((sky.t - 0.25) * Math.PI * 2 + Math.PI * 2) % (Math.PI * 2);
  applyAngle(angle);
}

/** Manual override for demos/tests; next advanceSky() call will revert to real time. */
export function setSkyPhase(phase: number) {
  sky.t = ((phase % 1) + 1) % 1;
  const angle = ((sky.t - 0.25) * Math.PI * 2 + Math.PI * 2) % (Math.PI * 2);
  applyAngle(angle);
}
