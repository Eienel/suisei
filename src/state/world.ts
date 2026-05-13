import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Block, BlockType, Tool, Vec3, WorldSnapshot } from '@/types';
import { inBounds, sameCell, snapToGrid, positionKey } from '@/world/grid';
import { PIECES, resolveCells, type PieceKey } from '@/world/pieces';

export const WORLD_SCHEMA_VERSION = 1;

/**
 * A piece queued for placement after a correct quiz answer.
 * The player drags it around the grid; clicking commits it.
 */
export interface PendingPiece {
  /** Piece identifier from the PIECES library. */
  pieceKey: PieceKey;
  /** Visual style for every cell in the piece. */
  type: BlockType;
  /** 0..3 — 90° rotation steps around Y. */
  rotation: number;
  /** Grid cell the anchor follows. null = no preview yet. */
  hoverCell: Vec3 | null;
  /** Used to group the placed cells in transactions / history. */
  groupId: string;
}

interface WorldState {
  blocks: Block[];
  selectedBlockId: string | null;
  hoveredCell: Vec3 | null;

  activeBlockType: BlockType;
  tool: Tool;

  pendingPiece: PendingPiece | null;

  setActiveBlockType: (t: BlockType) => void;
  setTool: (t: Tool) => void;
  setHoveredCell: (c: Vec3 | null) => void;
  setSelected: (id: string | null) => void;

  placeBlock: (type: BlockType, position: Vec3, rotation?: Vec3) => Block | null;
  moveBlock: (id: string, position: Vec3) => void;
  rotateBlock: (id: string, rotation: Vec3) => void;
  removeBlock: (id: string) => void;
  clearWorld: () => void;
  loadSnapshot: (snap: WorldSnapshot) => void;
  snapshot: () => WorldSnapshot;

  /** Queue a Tetris-style piece for placement. */
  startPiece: (pieceKey: PieceKey, type: BlockType) => void;
  cancelPiece: () => void;
  setPieceHover: (cell: Vec3 | null) => void;
  rotatePiece: () => void;
  /** Attempt to drop the pending piece at anchor (snapped). Returns placed Block[] or null. */
  commitPiece: (anchor: Vec3) => Block[] | null;
}

function blockIdAt(blocks: Block[], pos: Vec3): string | null {
  const hit = blocks.find((b) => sameCell(b.position, pos));
  return hit?.id ?? null;
}

function newId(prefix = 'b'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useWorld = create<WorldState>()(
  persist(
    (set, get) => ({
      blocks: [],
      selectedBlockId: null,
      hoveredCell: null,
      activeBlockType: 'zk_crystal',
      tool: 'place',
      pendingPiece: null,

      setActiveBlockType: (t) => set({ activeBlockType: t }),
      setTool: (t) => set({ tool: t }),
      setHoveredCell: (c) => set({ hoveredCell: c }),
      setSelected: (id) => set({ selectedBlockId: id }),

      placeBlock: (type, rawPos, rotation = [0, 0, 0]) => {
        const position = snapToGrid(rawPos);
        if (!inBounds(position)) return null;
        const { blocks } = get();
        if (blockIdAt(blocks, position)) return null;
        const block: Block = { id: newId(), type, position, rotation };
        set({ blocks: [...blocks, block] });
        return block;
      },

      moveBlock: (id, rawPos) => {
        const position = snapToGrid(rawPos);
        if (!inBounds(position)) return;
        set((s) => {
          if (blockIdAt(s.blocks, position) && blockIdAt(s.blocks, position) !== id) return s;
          return {
            blocks: s.blocks.map((b) => (b.id === id ? { ...b, position } : b)),
          };
        });
      },

      rotateBlock: (id, rotation) =>
        set((s) => ({
          blocks: s.blocks.map((b) => (b.id === id ? { ...b, rotation } : b)),
        })),

      removeBlock: (id) =>
        set((s) => ({
          blocks: s.blocks.filter((b) => b.id !== id),
          selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
        })),

      clearWorld: () => set({ blocks: [], selectedBlockId: null, pendingPiece: null }),

      loadSnapshot: (snap) =>
        set({
          blocks: snap.blocks.slice(),
          selectedBlockId: null,
        }),

      snapshot: () => ({
        blocks: get().blocks,
        version: WORLD_SCHEMA_VERSION,
      }),

      // --- Pending piece flow ---

      startPiece: (pieceKey, type) =>
        set({
          pendingPiece: {
            pieceKey,
            type,
            rotation: 0,
            hoverCell: null,
            groupId: newId('g'),
          },
        }),

      cancelPiece: () => set({ pendingPiece: null }),

      setPieceHover: (cell) =>
        set((s) =>
          s.pendingPiece
            ? { pendingPiece: { ...s.pendingPiece, hoverCell: cell } }
            : s
        ),

      rotatePiece: () =>
        set((s) =>
          s.pendingPiece
            ? {
                pendingPiece: {
                  ...s.pendingPiece,
                  rotation: (s.pendingPiece.rotation + 1) % 4,
                },
              }
            : s
        ),

      commitPiece: (anchor) => {
        const { pendingPiece, blocks } = get();
        if (!pendingPiece) return null;
        const piece = PIECES[pendingPiece.pieceKey];
        if (!piece) return null;
        const cells = resolveCells(piece, pendingPiece.rotation);
        const anchorSnapped = snapToGrid(anchor);

        // Validate every cell: in-bounds + not already occupied + no duplicates inside the piece
        const occupied = new Set(blocks.map((b) => positionKey(b.position)));
        const newPositions: Vec3[] = [];
        for (const [dx, dz] of cells) {
          const pos: Vec3 = [anchorSnapped[0] + dx, 0, anchorSnapped[2] + dz];
          if (!inBounds(pos)) return null;
          const key = positionKey(pos);
          if (occupied.has(key)) return null;
          occupied.add(key);
          newPositions.push(pos);
        }

        const newBlocks: Block[] = newPositions.map((pos) => ({
          id: newId(),
          type: pendingPiece.type,
          position: pos,
          rotation: [0, 0, 0],
        }));
        set({
          blocks: [...blocks, ...newBlocks],
          pendingPiece: null,
        });
        return newBlocks;
      },
    }),
    {
      name: 'blockbuilders-world',
      version: WORLD_SCHEMA_VERSION,
      partialize: (s) => ({ blocks: s.blocks }),
    }
  )
);

declare global {
  interface Window {
    __world?: () => WorldSnapshot;
  }
}
if (typeof window !== 'undefined') {
  window.__world = () => useWorld.getState().snapshot();
}

export { positionKey };
