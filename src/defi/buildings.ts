import type { Block, BlockType, Vec3 } from '@/types';
import { positionKey } from '@/world/grid';

/**
 * DeFi district — "build a complete building → it triggers a real onchain
 * DeFi action" (not per-block). Each building is a guided blueprint pinned
 * to a plot: the player fills the ghost outline with the right blocks, and
 * when every cell is satisfied the building "activates" and offers its
 * onchain action (stake / swap / add-liquidity).
 *
 * This module is pure data + detection — no chain calls. The activation
 * wiring lives elsewhere so the blueprint geometry stays easy to tune.
 */

export type DefiAction = 'stake' | 'swap' | 'liquidity';

/** One required cell of a blueprint, relative to the plot anchor. */
export interface BlueprintCell {
  /** Offset from the plot anchor: [dx, dy, dz]. */
  offset: Vec3;
  /** Any one of these block types satisfies the cell. */
  accepts: BlockType[];
  role: 'wall' | 'door' | 'window' | 'roof' | 'feature';
}

export interface BuildingBlueprint {
  id: string;
  label: string;
  action: DefiAction;
  /** One-line teaching blurb for the plot + activation panel. */
  blurb: string;
  /** Ground anchor cell (the plot's near-left corner, y = 0). */
  anchor: Vec3;
  cells: BlueprintCell[];
  /** v1 ships stake + swap; liquidity is a stretch, gated off until ready. */
  enabled: boolean;
}

export interface BuildingProgress {
  filled: number;
  total: number;
  complete: boolean;
  /** Cells still needing the correct block (for ghost hints). */
  missing: BlueprintCell[];
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/**
 * Generates a small house footprint: a `w × d` perimeter of walls
 * `wallHeight` tall (front-centre is a door), with a roof over the top.
 * Geometry is intentionally tunable — bump wallHeight or swap accepts to
 * restyle a building without touching the detector.
 */
function house(opts: {
  w?: number;
  d?: number;
  wallHeight?: number;
  /** Extra distinguishing block on the centre of the floor (e.g. a vault). */
  feature?: BlockType;
}): BlueprintCell[] {
  const { w = 3, d = 3, wallHeight = 1, feature } = opts;
  const cells: BlueprintCell[] = [];
  const isPerimeter = (x: number, z: number) =>
    x === 0 || x === w - 1 || z === 0 || z === d - 1;
  const frontDoorX = Math.floor(w / 2);

  for (let y = 0; y < wallHeight; y++) {
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        if (!isPerimeter(x, z)) continue;
        if (y === 0 && x === frontDoorX && z === 0) {
          cells.push({ offset: [x, y, z], accepts: ['door'], role: 'door' });
        } else if (y === wallHeight - 1 && (x === 0 || x === w - 1) && z === Math.floor(d / 2)) {
          cells.push({ offset: [x, y, z], accepts: ['window', 'timber'], role: 'window' });
        } else {
          cells.push({ offset: [x, y, z], accepts: ['timber'], role: 'wall' });
        }
      }
    }
  }

  // Roof caps the whole footprint one level above the walls.
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      cells.push({ offset: [x, wallHeight, z], accepts: ['roof'], role: 'roof' });
    }
  }

  if (feature) {
    cells.push({
      offset: [Math.floor(w / 2), 0, Math.floor(d / 2)],
      accepts: [feature],
      role: 'feature',
    });
  }
  return cells;
}

/**
 * v1 building set. Anchors are placeholders for a dedicated DeFi-district
 * layout; spread out so plots never overlap.
 */
export const BUILDINGS: readonly BuildingBlueprint[] = [
  {
    id: 'bank',
    label: 'The Bank',
    action: 'stake',
    blurb: 'Build the bank, then deposit your SUI. It stakes onchain and pays you a liquid staking token you keep.',
    anchor: [-7, 0, -3],
    cells: house({ w: 3, d: 3, wallHeight: 1, feature: 'wallet_keystone' }),
    enabled: true,
  },
  {
    id: 'market',
    label: 'The Market',
    action: 'swap',
    blurb: 'Build the market, then trade one token for another through a real onchain liquidity pool.',
    anchor: [2, 0, -3],
    cells: house({ w: 3, d: 3, wallHeight: 1, feature: 'token_prism' }),
    enabled: true,
  },
  {
    id: 'pool',
    label: 'The Liquidity Pool',
    action: 'liquidity',
    blurb: 'Build the pool house to supply liquidity and earn a share of trading fees. (Coming soon.)',
    anchor: [-2, 0, 4],
    cells: house({ w: 3, d: 3, wallHeight: 1, feature: 'defi_vault' }),
    enabled: false,
  },
];

/** Checks how much of a blueprint is satisfied by the placed blocks. */
export function evaluateBuilding(
  blueprint: BuildingBlueprint,
  blocks: Block[],
): BuildingProgress {
  const byCell = new Map<string, BlockType>();
  for (const b of blocks) byCell.set(positionKey(b.position), b.type);

  let filled = 0;
  const missing: BlueprintCell[] = [];
  for (const cell of blueprint.cells) {
    const type = byCell.get(positionKey(add(blueprint.anchor, cell.offset)));
    if (type && cell.accepts.includes(type)) filled += 1;
    else missing.push(cell);
  }

  const total = blueprint.cells.length;
  return { filled, total, complete: filled === total, missing };
}

/** Progress for every building, keyed by id. */
export function evaluateAll(blocks: Block[]): Record<string, BuildingProgress> {
  const out: Record<string, BuildingProgress> = {};
  for (const b of BUILDINGS) out[b.id] = evaluateBuilding(b, blocks);
  return out;
}
