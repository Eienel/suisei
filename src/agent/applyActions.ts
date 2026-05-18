import { useWorld } from '@/state/world';
import { sameCell } from '@/world/grid';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import type { BlockType } from '@/types';
import type { Action } from './schema.js';

const STEP_MS = 90;

/**
 * Apply AI actions to the world, paced so the user sees the structure
 * build up in front of them rather than popping in all at once.
 *
 * Returns a Promise resolved when the queue empties (or rejected on abort).
 */
export async function applyActions(
  actions: Action[],
  signal?: AbortSignal
): Promise<void> {
  for (const action of actions) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    applyOne(action);
    await wait(STEP_MS, signal);
  }
}

function applyOne(action: Action) {
  const state = useWorld.getState();
  if (action.type === 'place_block') {
    if (!action.block) return;
    // Each block type carries a defaultShape so AI placements respect
    // semantic geometry (foliage → tree, roof → ramp, road → slab, …).
    // Cube remains the catch-all for types without an opinion.
    const def = BLOCK_BY_ID[action.block as BlockType];
    state.placeBlock(action.block as never, action.position, {
      rotation: action.rotation ?? [0, 0, 0],
      shape: def?.defaultShape ?? 'cube',
      color: null,
    });
  } else if (action.type === 'remove_block') {
    const hit = state.blocks.find((b) => sameCell(b.position, action.position));
    if (hit) state.removeBlock(hit.id);
  }
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal?.aborted) {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
