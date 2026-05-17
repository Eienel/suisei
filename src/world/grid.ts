import type { Vec3 } from '../types.js';

/** World units per grid cell. One block = 1 cell. */
export const CELL = 1;

/** Half-extent of the buildable area; AI and manual placement clamp to this. */
export const WORLD_HALF_EXTENT = 32;

/** Bottom row sits at y=0; blocks stack up the Y axis. */
export const FLOOR_Y = 0;

export function snapToGrid(v: Vec3): Vec3 {
  return [Math.round(v[0]), Math.max(FLOOR_Y, Math.round(v[1])), Math.round(v[2])];
}

export function inBounds(v: Vec3): boolean {
  return (
    Math.abs(v[0]) <= WORLD_HALF_EXTENT &&
    v[1] >= FLOOR_Y &&
    v[1] <= WORLD_HALF_EXTENT * 2 &&
    Math.abs(v[2]) <= WORLD_HALF_EXTENT
  );
}

export function positionKey(v: Vec3): string {
  return `${v[0]},${v[1]},${v[2]}`;
}

/** True if two positions occupy the same cell. */
export function sameCell(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
