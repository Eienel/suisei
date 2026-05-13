import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Block, BlockType, Tool, Vec3, WorldSnapshot } from '@/types';
import { inBounds, positionKey, sameCell, snapToGrid } from '@/world/grid';

export const WORLD_SCHEMA_VERSION = 1;

interface WorldState {
  blocks: Block[];
  selectedBlockId: string | null;
  hoveredCell: Vec3 | null;

  activeBlockType: BlockType;
  tool: Tool;

  /** Mutators — used by both AI action executor and manual UI. */
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
}

function blockIdAt(blocks: Block[], pos: Vec3): string | null {
  const hit = blocks.find((b) => sameCell(b.position, pos));
  return hit?.id ?? null;
}

function newId(): string {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useWorld = create<WorldState>()(
  persist(
    (set, get) => ({
      blocks: [],
      selectedBlockId: null,
      hoveredCell: null,
      activeBlockType: 'zk_crystal',
      tool: 'place',

      setActiveBlockType: (t) => set({ activeBlockType: t }),
      setTool: (t) => set({ tool: t }),
      setHoveredCell: (c) => set({ hoveredCell: c }),
      setSelected: (id) => set({ selectedBlockId: id }),

      placeBlock: (type, rawPos, rotation = [0, 0, 0]) => {
        const position = snapToGrid(rawPos);
        if (!inBounds(position)) return null;
        const { blocks } = get();
        if (blockIdAt(blocks, position)) return null; // cell occupied
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

      clearWorld: () => set({ blocks: [], selectedBlockId: null }),

      loadSnapshot: (snap) =>
        set({
          blocks: snap.blocks.slice(),
          selectedBlockId: null,
        }),

      snapshot: () => ({
        blocks: get().blocks,
        version: WORLD_SCHEMA_VERSION,
      }),
    }),
    {
      name: 'blockbuilders-world',
      version: WORLD_SCHEMA_VERSION,
      partialize: (s) => ({ blocks: s.blocks }),
    }
  )
);

/** Devtools-only — handy in console: `__world` */
declare global {
  interface Window {
    __world?: () => WorldSnapshot;
  }
}
if (typeof window !== 'undefined') {
  window.__world = () => useWorld.getState().snapshot();
}

export { positionKey };
