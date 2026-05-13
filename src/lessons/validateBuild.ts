import type { Block, BlockType, Vec3 } from '@/types';
import type { TargetBlock } from '@/data/lessons';

/**
 * Translation-tolerant shape match.
 *
 * Anchors both sets at their bounding-box min-corner, then checks the
 * resulting (type, normalized-position) multisets are identical.
 *
 * This means the user can build the structure anywhere on the grid as
 * long as the relative shape is right. Rotation is NOT tolerated in V2
 * (kept simple — easier to teach, more readable).
 */
export interface MatchResult {
  ok: boolean;
  /** How many target cells are correctly filled when matched at the user's anchor. */
  matched: number;
  /** Total target cells. */
  total: number;
}

export function checkBuildMatches(
  placed: readonly Block[],
  target: readonly TargetBlock[]
): MatchResult {
  if (placed.length === 0 || target.length === 0) {
    return { ok: false, matched: 0, total: target.length };
  }
  if (placed.length !== target.length) {
    // Count off — but still report partial-match progress for UI.
    return { ok: false, matched: countOverlap(placed, target), total: target.length };
  }

  const targetSet = normalize(target.map((b) => ({ type: b.type, position: b.position })));
  const placedSet = normalize(placed.map((b) => ({ type: b.type, position: b.position })));

  if (sameMultiset(targetSet, placedSet)) {
    return { ok: true, matched: target.length, total: target.length };
  }
  return { ok: false, matched: countOverlap(placed, target), total: target.length };
}

interface Cell {
  type: BlockType;
  position: Vec3;
}

/** Subtract the bounding-box min-corner from every position. */
function normalize(cells: Cell[]): string[] {
  const min: Vec3 = cells.reduce<Vec3>(
    (acc, c) => [
      Math.min(acc[0], c.position[0]),
      Math.min(acc[1], c.position[1]),
      Math.min(acc[2], c.position[2]),
    ],
    [Infinity, Infinity, Infinity]
  );
  return cells
    .map((c) => `${c.type}:${c.position[0] - min[0]},${c.position[1] - min[1]},${c.position[2] - min[2]}`)
    .sort();
}

function sameMultiset(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Best-case overlap when shifting placed to align with target — for partial progress UI. */
function countOverlap(placed: readonly Block[], target: readonly TargetBlock[]): number {
  if (placed.length === 0) return 0;
  // Pick each placed block as the anchor candidate; align it to each target
  // block of the same type and count matches; return the best.
  let best = 0;
  for (const p of placed) {
    for (const t of target) {
      if (p.type !== t.type) continue;
      const dx = t.position[0] - p.position[0];
      const dy = t.position[1] - p.position[1];
      const dz = t.position[2] - p.position[2];
      const shifted = new Set(
        placed.map((b) => `${b.type}:${b.position[0] + dx},${b.position[1] + dy},${b.position[2] + dz}`)
      );
      let count = 0;
      for (const tb of target) {
        const key = `${tb.type}:${tb.position[0]},${tb.position[1]},${tb.position[2]}`;
        if (shifted.has(key)) count++;
      }
      if (count > best) best = count;
    }
  }
  return best;
}
