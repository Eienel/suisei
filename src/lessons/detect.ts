import type { BrickType } from '@/game/bricks/brickTypes';
import { LESSONS, type Lesson } from '@/data/lessons';

/**
 * True if every brick in `combo` appears at least that many times in `placed`
 * (multiset containment). Order doesn't matter.
 */
export function comboMatches(combo: BrickType[], placed: BrickType[]): boolean {
  const counts = new Map<BrickType, number>();
  for (const t of placed) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (const t of combo) {
    const n = counts.get(t) ?? 0;
    if (n < 1) return false;
    counts.set(t, n - 1);
  }
  return true;
}

/**
 * Returns the lessons whose triggerCombo is satisfied by `placedTypes`
 * AND that are NOT already in `alreadyUnlocked`.
 */
export function findNewlyUnlocked(
  placedTypes: BrickType[],
  alreadyUnlocked: ReadonlySet<string>
): Lesson[] {
  return LESSONS.filter(
    (l) => !alreadyUnlocked.has(l.id) && comboMatches(l.triggerCombo, placedTypes)
  );
}
