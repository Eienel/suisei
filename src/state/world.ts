import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Block, BlockShape, BlockType, Tool, Vec3, WorldSnapshot } from '@/types';
import { inBounds, sameCell, snapToGrid, positionKey } from '@/world/grid';
import { PIECES, resolveCells, type PieceKey } from '@/world/pieces';

export const WORLD_SCHEMA_VERSION = 3;

/**
 * Two separate worlds per player:
 *   - lessons  → built passively from correct quiz answers; minted ONCE
 *                as a commemorative "Crypto 101" NFT after all lessons
 *                are completed. The town a learner walks away with.
 *   - sandbox  → the player's creative land. Anyone can visit it via
 *                /town/<address>. Updates on every Save World.
 *
 * The `mode` flag chooses which set the reducers act on. Components
 * read `blocks` which proxies to the active set; we keep both arrays
 * persisted so switching screens doesn't blow anything away.
 */
export type WorldMode = 'lessons' | 'sandbox';

export interface PendingPiece {
  pieceKey: PieceKey;
  type: BlockType;
  rotation: number;
  hoverCell: Vec3 | null;
  groupId: string;
}

interface WorldState {
  mode: WorldMode;
  lessonBlocks: Block[];
  sandboxBlocks: Block[];

  /** Active blocks (derived from `mode`). Components should read this. */
  blocks: Block[];

  selectedBlockId: string | null;
  hoveredCell: Vec3 | null;

  activeBlockType: BlockType;
  activeShape: BlockShape;
  activeColor: string | null;
  tool: Tool;

  pendingPiece: PendingPiece | null;

  setMode: (m: WorldMode) => void;
  setActiveBlockType: (t: BlockType) => void;
  setActiveShape: (s: BlockShape) => void;
  setActiveColor: (c: string | null) => void;
  setTool: (t: Tool) => void;
  setHoveredCell: (c: Vec3 | null) => void;
  setSelected: (id: string | null) => void;

  placeBlock: (
    type: BlockType,
    position: Vec3,
    opts?: { rotation?: Vec3; shape?: BlockShape; color?: string | null },
  ) => Block | null;
  moveBlock: (id: string, position: Vec3) => void;
  rotateBlock: (id: string, rotation: Vec3) => void;
  recolorBlock: (id: string, color: string | null) => void;
  reshapeBlock: (id: string, shape: BlockShape) => void;
  removeBlock: (id: string) => void;
  clearWorld: () => void;
  loadSnapshot: (snap: WorldSnapshot) => void;
  /** Snapshot of whatever mode is active (used by Save flows). */
  snapshot: () => WorldSnapshot;

  startPiece: (pieceKey: PieceKey, type: BlockType) => void;
  cancelPiece: () => void;
  setPieceHover: (cell: Vec3 | null) => void;
  rotatePiece: () => void;
  commitPiece: (anchor: Vec3) => Block[] | null;
}

function blockIdAt(blocks: Block[], pos: Vec3): string | null {
  const hit = blocks.find((b) => sameCell(b.position, pos));
  return hit?.id ?? null;
}

function newId(prefix = 'b'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Helper — mutate only the slice owned by `mode`. */
function withMode<S extends { mode: WorldMode; lessonBlocks: Block[]; sandboxBlocks: Block[] }>(
  s: S,
  next: Block[],
): Partial<S> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (s.mode === 'lessons' ? { lessonBlocks: next } : { sandboxBlocks: next }) as any;
}

export const useWorld = create<WorldState>()(
  persist(
    (set, get) => ({
      mode: 'sandbox',
      lessonBlocks: [],
      sandboxBlocks: [],
      // Mirror of whichever array `mode` points at. Kept in sync by reducers.
      blocks: [],

      selectedBlockId: null,
      hoveredCell: null,
      activeBlockType: 'timber',
      activeShape: 'cube',
      activeColor: null,
      tool: 'place',
      pendingPiece: null,

      setMode: (m) =>
        set((s) => ({
          mode: m,
          selectedBlockId: null,
          pendingPiece: null,
          blocks: m === 'lessons' ? s.lessonBlocks : s.sandboxBlocks,
        })),

      setActiveBlockType: (t) => set({ activeBlockType: t }),
      setActiveShape: (s) => set({ activeShape: s }),
      setActiveColor: (c) => set({ activeColor: c }),
      setTool: (t) => set({ tool: t }),
      setHoveredCell: (c) => set({ hoveredCell: c }),
      setSelected: (id) => set({ selectedBlockId: id }),

      placeBlock: (type, rawPos, opts = {}) => {
        const position = snapToGrid(rawPos);
        if (!inBounds(position)) return null;
        const s = get();
        const blocks = s.mode === 'lessons' ? s.lessonBlocks : s.sandboxBlocks;
        if (blockIdAt(blocks, position)) return null;
        const block: Block = {
          id: newId(),
          type,
          position,
          rotation: opts.rotation ?? [0, 0, 0],
          shape: opts.shape ?? s.activeShape,
          color: opts.color ?? s.activeColor ?? undefined,
        };
        const next = [...blocks, block];
        set({ ...withMode(s, next), blocks: next });
        return block;
      },

      moveBlock: (id, rawPos) => {
        const position = snapToGrid(rawPos);
        if (!inBounds(position)) return;
        set((s) => {
          const blocks = s.mode === 'lessons' ? s.lessonBlocks : s.sandboxBlocks;
          if (blockIdAt(blocks, position) && blockIdAt(blocks, position) !== id) return s;
          const next = blocks.map((b) => (b.id === id ? { ...b, position } : b));
          return { ...withMode(s, next), blocks: next };
        });
      },

      rotateBlock: (id, rotation) =>
        set((s) => {
          const blocks = s.mode === 'lessons' ? s.lessonBlocks : s.sandboxBlocks;
          const next = blocks.map((b) => (b.id === id ? { ...b, rotation } : b));
          return { ...withMode(s, next), blocks: next };
        }),

      recolorBlock: (id, color) =>
        set((s) => {
          const blocks = s.mode === 'lessons' ? s.lessonBlocks : s.sandboxBlocks;
          const next = blocks.map((b) => (b.id === id ? { ...b, color: color ?? undefined } : b));
          return { ...withMode(s, next), blocks: next };
        }),

      reshapeBlock: (id, shape) =>
        set((s) => {
          const blocks = s.mode === 'lessons' ? s.lessonBlocks : s.sandboxBlocks;
          const next = blocks.map((b) => (b.id === id ? { ...b, shape } : b));
          return { ...withMode(s, next), blocks: next };
        }),

      removeBlock: (id) =>
        set((s) => {
          const blocks = s.mode === 'lessons' ? s.lessonBlocks : s.sandboxBlocks;
          const next = blocks.filter((b) => b.id !== id);
          return {
            ...withMode(s, next),
            blocks: next,
            selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
          };
        }),

      clearWorld: () =>
        set((s) => {
          const next: Block[] = [];
          return {
            ...withMode(s, next),
            blocks: next,
            selectedBlockId: null,
            pendingPiece: null,
          };
        }),

      loadSnapshot: (snap) =>
        set((s) => {
          const next = snap.blocks.slice();
          return {
            ...withMode(s, next),
            blocks: next,
            selectedBlockId: null,
          };
        }),

      snapshot: () => ({
        blocks: get().mode === 'lessons' ? get().lessonBlocks : get().sandboxBlocks,
        version: WORLD_SCHEMA_VERSION,
        kind: get().mode,
      }),

      // --- Pending piece flow (works in either mode) ---

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
        const s = get();
        const { pendingPiece } = s;
        if (!pendingPiece) return null;
        const piece = PIECES[pendingPiece.pieceKey];
        if (!piece) return null;
        const cells = resolveCells(piece, pendingPiece.rotation);
        const anchorSnapped = snapToGrid(anchor);

        const current = s.mode === 'lessons' ? s.lessonBlocks : s.sandboxBlocks;
        const occupied = new Set(current.map((b) => positionKey(b.position)));
        const newPositions: Vec3[] = [];
        for (const [dx, dz] of cells) {
          const pos: Vec3 = [
            anchorSnapped[0] + dx,
            anchorSnapped[1],
            anchorSnapped[2] + dz,
          ];
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
          shape: 'cube',
        }));
        const next = [...current, ...newBlocks];
        set({ ...withMode(s, next), blocks: next, pendingPiece: null });
        return newBlocks;
      },
    }),
    {
      name: 'blockbuilders-world',
      version: WORLD_SCHEMA_VERSION,
      // Persist both worlds + mode.
      partialize: (s) => ({
        mode: s.mode,
        lessonBlocks: s.lessonBlocks,
        sandboxBlocks: s.sandboxBlocks,
      }),
      // Migrate v2 → v3: old `blocks` field becomes sandbox.
      migrate: (state: unknown, version: number) => {
        if (version < 3 && state && typeof state === 'object') {
          const old = state as { blocks?: Block[]; lessonBlocks?: Block[]; sandboxBlocks?: Block[] };
          return {
            mode: 'sandbox',
            lessonBlocks: old.lessonBlocks ?? [],
            sandboxBlocks: old.sandboxBlocks ?? old.blocks ?? [],
          };
        }
        return state as never;
      },
      // After hydration, sync the derived `blocks` getter.
      onRehydrateStorage: () => (s) => {
        if (s) {
          // Force blocks to reflect mode after persisted load.
          s.blocks = s.mode === 'lessons' ? s.lessonBlocks : s.sandboxBlocks;
        }
      },
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
