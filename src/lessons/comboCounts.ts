import type { BrickType } from '@/game/bricks/brickTypes';

export interface ComboCount {
  type: BrickType;
  count: number;
}

/** Collapse a combo array into [{type, count}] preserving first-seen order. */
export function comboCounts(combo: readonly BrickType[]): ComboCount[] {
  const order: BrickType[] = [];
  const counts = new Map<BrickType, number>();
  for (const t of combo) {
    if (!counts.has(t)) order.push(t);
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return order.map((t) => ({ type: t, count: counts.get(t)! }));
}
