import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Block, BlockShape, BlockType, Tool, Vec3, WorldSnapshot } from '@/types';
import { inBounds, sameCell, snapToGrid, positionKey } from '@/world/grid';
import { PIECES, resolveCells, type PieceKey } from '@/world/pieces';

export const WORLD_SCHEMA_VERSION = 4;

/**
 * Three separate worlds per player:
 *   - lessons  → built passively from correct quiz answers; minted ONCE
 *                as a commemorative "Crypto 101" NFT after all lessons
 *                are completed. The town a learner walks away with.
 *   - sandbox  → the player's creative land. Anyone can visit it via
 *                /town/<address>. Updates on every Save World.
 *   - defi     → the DeFi district. Fixed blueprint plots; completing a
 *                building triggers a real onchain action (stake/swap/LP).
 *
 * The `mode` flag chooses which set the reducers act on. Components
 * read `blocks` which proxies to the active set; we keep all three
 * persisted so switching screens doesn't blow anything away.
 */
export type WorldMode = 'lessons' | 'sandbox' | 'defi';

export interface PendingPiece {
  pieceKey: PieceKey;
  type: BlockType;
  rotation: number;
  hoverCell: Vec3 | null;
  groupId: string;
}

/**
 * A completed DeFi building (e.g. the Bank) staged for transfer from the
 * district into the player's sandbox town. Carries the exact block types
 * the player placed plus the onchain receipt (StakedSui id, tx digest) so
 * the moved building keeps its provenance.
 */
export interface PendingTransfer {
  blueprintId: string;
  /** Plot anchor in the defi world — used to wipe the source after move. */
  sourceAnchor: Vec3;
  /** Captured cells: offset + the actual block the player placed there. */
  cells: Array<{ offset: Vec3; type: BlockType; shape?: BlockShape; color?: string }>;
  stakedSuiId?: string;
  txDigest?: string;
  hoverCell: Vec3 | null;
}

interface WorldState {
  mode: WorldMode;
  lessonBlocks: Block[];
  sandboxBlocks: Block[];
  defiBlocks: Block[];

  /** Active blocks (derived from `mode`). Components should read this. */
  blocks: Block[];

  selectedBlockId: string | null;
  hoveredCell: Vec3 | null;

  activeBlockType: BlockType;
  activeShape: BlockShape;
  activeColor: string | null;
  tool: Tool;

  pendingPiece: PendingPiece | null;
  pendingTransfer: PendingTransfer | null;

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

  /** Stage a completed defi building for placement in the sandbox. */
  startTransfer: (opts: Omit<PendingTransfer, 'hoverCell'>) => void;
  setTransferHover: (cell: Vec3 | null) => void;
  cancelTransfer: () => void;
  /**
   * Move the staged building to the sandbox at `anchor`. Validates bounds
   * + non-collision; returns the new sandbox blocks on success, null on
   * conflict. Also wipes the source cells from defiBlocks so the plot is
   * ready to be rebuilt.
   */
  commitTransfer: (anchor: Vec3) => Block[] | null;
}

function blockIdAt(blocks: Block[], pos: Vec3): string | null {
  const hit = blocks.find((b) => sameCell(b.position, pos));
  return hit?.id ?? null;
}

function newId(prefix = 'b'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Helper — mutate only the slice owned by `mode`. */
function withMode<S extends { mode: WorldMode; lessonBlocks: Block[]; sandboxBlocks: Block[]; defiBlocks: Block[] }>(
  s: S,
  next: Block[],
): Partial<S> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (s.mode === 'lessons') return { lessonBlocks: next } as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (s.mode === 'defi') return { defiBlocks: next } as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { sandboxBlocks: next } as any;
}

/** Helper — read the slice owned by `mode`. */
function pickBlocks(s: { mode: WorldMode; lessonBlocks: Block[]; sandboxBlocks: Block[]; defiBlocks: Block[] }): Block[] {
  if (s.mode === 'lessons') return s.lessonBlocks;
  if (s.mode === 'defi') return s.defiBlocks;
  return s.sandboxBlocks;
}

export const useWorld = create<WorldState>()(
  persist(
    (set, get) => ({
      mode: 'sandbox',
      lessonBlocks: [],
      sandboxBlocks: [],
      defiBlocks: [],
      // Mirror of whichever array `mode` points at. Kept in sync by reducers.
      blocks: [],

      selectedBlockId: null,
      hoveredCell: null,
      activeBlockType: 'timber',
      activeShape: 'cube',
      activeColor: null,
      tool: 'place',
      pendingPiece: null,
      pendingTransfer: null,

      setMode: (m) =>
        set((s) => ({
          mode: m,
          selectedBlockId: null,
          pendingPiece: null,
          blocks: pickBlocks({ ...s, mode: m }),
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
        const blocks = pickBlocks(s);
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
          const blocks = pickBlocks(s);
          if (blockIdAt(blocks, position) && blockIdAt(blocks, position) !== id) return s;
          const next = blocks.map((b) => (b.id === id ? { ...b, position } : b));
          return { ...withMode(s, next), blocks: next };
        });
      },

      rotateBlock: (id, rotation) =>
        set((s) => {
          const blocks = pickBlocks(s);
          const next = blocks.map((b) => (b.id === id ? { ...b, rotation } : b));
          return { ...withMode(s, next), blocks: next };
        }),

      removeBlock: (id) =>
        set((s) => {
          const blocks = pickBlocks(s);
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
        blocks: pickBlocks(get()),
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

        const current = pickBlocks(s);
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

      // --- Defi building → sandbox transfer ---

      startTransfer: (opts) =>
        set({ pendingTransfer: { ...opts, hoverCell: null } }),

      setTransferHover: (cell) =>
        set((s) =>
          s.pendingTransfer
            ? { pendingTransfer: { ...s.pendingTransfer, hoverCell: cell } }
            : s
        ),

      cancelTransfer: () => set({ pendingTransfer: null }),

      commitTransfer: (rawAnchor) => {
        const s = get();
        const { pendingTransfer } = s;
        if (!pendingTransfer) return null;
        const anchor = snapToGrid(rawAnchor);

        // Validate every target cell before mutating anything.
        const occupied = new Set(s.sandboxBlocks.map((b) => positionKey(b.position)));
        const targets: Vec3[] = [];
        for (const c of pendingTransfer.cells) {
          const pos: Vec3 = [
            anchor[0] + c.offset[0],
            anchor[1] + c.offset[1],
            anchor[2] + c.offset[2],
          ];
          if (!inBounds(pos)) return null;
          const key = positionKey(pos);
          if (occupied.has(key)) return null;
          occupied.add(key);
          targets.push(pos);
        }

        // Build the new sandbox blocks (fresh ids; preserve type/shape/color).
        const newBlocks: Block[] = pendingTransfer.cells.map((c, i) => ({
          id: newId(),
          type: c.type,
          position: targets[i],
          rotation: [0, 0, 0],
          shape: c.shape,
          color: c.color,
        }));

        // Wipe the source cells from defiBlocks (matched by position) so the
        // plot is ready to be rebuilt for another stake.
        const sourceKeys = new Set(
          pendingTransfer.cells.map((c) =>
            positionKey([
              pendingTransfer.sourceAnchor[0] + c.offset[0],
              pendingTransfer.sourceAnchor[1] + c.offset[1],
              pendingTransfer.sourceAnchor[2] + c.offset[2],
            ])
          )
        );
        const nextDefi = s.defiBlocks.filter((b) => !sourceKeys.has(positionKey(b.position)));
        const nextSandbox = [...s.sandboxBlocks, ...newBlocks];

        set({
          defiBlocks: nextDefi,
          sandboxBlocks: nextSandbox,
          // If we're already in sandbox mode, mirror onto `blocks`.
          blocks: s.mode === 'sandbox' ? nextSandbox : s.mode === 'defi' ? nextDefi : s.blocks,
          pendingTransfer: null,
        });
        return newBlocks;
      },
    }),
    {
      name: 'blockbuilders-world',
      version: WORLD_SCHEMA_VERSION,
      // Persist all three worlds + mode.
      partialize: (s) => ({
        mode: s.mode,
        lessonBlocks: s.lessonBlocks,
        sandboxBlocks: s.sandboxBlocks,
        defiBlocks: s.defiBlocks,
      }),
      // Migrate v2 → v3: old `blocks` field becomes sandbox.
      // Migrate v3 → v4: add empty defiBlocks.
      migrate: (state: unknown, version: number) => {
        if (state && typeof state === 'object') {
          const old = state as {
            mode?: WorldMode;
            blocks?: Block[];
            lessonBlocks?: Block[];
            sandboxBlocks?: Block[];
            defiBlocks?: Block[];
          };
          const empty: Block[] = [];
          if (version < 3) {
            return {
              mode: 'sandbox' as WorldMode,
              lessonBlocks: old.lessonBlocks ?? empty,
              sandboxBlocks: old.sandboxBlocks ?? old.blocks ?? empty,
              defiBlocks: empty,
            };
          }
          if (version < 4) {
            return {
              mode: (old.mode ?? 'sandbox') as WorldMode,
              lessonBlocks: old.lessonBlocks ?? empty,
              sandboxBlocks: old.sandboxBlocks ?? empty,
              defiBlocks: empty,
            };
          }
        }
        return state as never;
      },
      // After hydration, sync the derived `blocks` getter.
      onRehydrateStorage: () => (s) => {
        if (s) {
          // Force blocks to reflect mode after persisted load.
          s.blocks = pickBlocks(s);
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
