/**
 * Tetris-style piece library. Pieces lie flat on the y=0 plane in V1
 * (no vertical stacking yet — coming as a polish in a later phase).
 *
 * Each piece is a list of (x, z) cell offsets from the piece's anchor.
 * The anchor is the cell under the player's cursor when placing.
 */

export type CellOffset = readonly [number, number];

export interface Piece {
  key: PieceKey;
  /** Human-friendly name (used in tooltips). */
  name: string;
  /** Cell offsets in canonical orientation (rotation 0). */
  shape: readonly CellOffset[];
}

export type PieceKey =
  | 'DOT'
  | 'DUO'
  | 'LINE_3'
  | 'TRI_L'
  | 'LINE_4'
  | 'SQUARE'
  | 'T'
  | 'L'
  | 'S'
  | 'Z';

export const PIECES: Record<PieceKey, Piece> = {
  DOT: { key: 'DOT', name: 'single', shape: [[0, 0]] },
  DUO: { key: 'DUO', name: 'duo', shape: [[0, 0], [1, 0]] },
  LINE_3: { key: 'LINE_3', name: 'line-3', shape: [[0, 0], [1, 0], [2, 0]] },
  TRI_L: { key: 'TRI_L', name: 'corner', shape: [[0, 0], [1, 0], [0, 1]] },
  LINE_4: { key: 'LINE_4', name: 'line-4', shape: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  SQUARE: { key: 'SQUARE', name: 'square', shape: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { key: 'T', name: 'T', shape: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  L: { key: 'L', name: 'L', shape: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  S: { key: 'S', name: 'S', shape: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { key: 'Z', name: 'Z', shape: [[0, 0], [1, 0], [1, 1], [2, 1]] },
};

/** Rotate a shape 90° clockwise around origin in the (x, z) plane. */
function rotate90(shape: readonly CellOffset[]): CellOffset[] {
  return shape.map(([x, z]) => [-z, x]);
}

/** Normalize so min(x) and min(z) are both 0 — gives a stable anchor at top-left. */
function normalize(shape: readonly CellOffset[]): CellOffset[] {
  if (shape.length === 0) return [];
  let minX = Infinity;
  let minZ = Infinity;
  for (const [x, z] of shape) {
    if (x < minX) minX = x;
    if (z < minZ) minZ = z;
  }
  return shape.map(([x, z]) => [x - minX, z - minZ]);
}

/**
 * Resolve a piece + rotation into final cell offsets (normalized).
 * rotation ∈ {0,1,2,3} maps to {0°, 90°, 180°, 270°}.
 */
export function resolveCells(piece: Piece, rotation: number): CellOffset[] {
  let shape: readonly CellOffset[] = piece.shape;
  const r = ((rotation % 4) + 4) % 4;
  for (let i = 0; i < r; i++) shape = rotate90(shape);
  return normalize(shape);
}

/** Bounding extent of a resolved shape — useful for ghost rendering. */
export function shapeExtent(cells: readonly CellOffset[]): { w: number; d: number } {
  if (cells.length === 0) return { w: 0, d: 0 };
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of cells) {
    if (x > maxX) maxX = x;
    if (z > maxZ) maxZ = z;
  }
  return { w: maxX + 1, d: maxZ + 1 };
}
