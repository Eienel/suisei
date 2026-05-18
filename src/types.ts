/**
 * Domain types shared across the app.
 * The "world" is a single immutable JSON object — list of blocks at
 * integer grid coordinates. AI actions and manual edits both flow
 * through the same reducers in src/state/world.ts.
 */

export type BlockType =
  | 'zk_crystal'
  | 'data_core'
  | 'defi_vault'
  | 'governance_marble'
  | 'ai_neural'
  | 'security_bunker'
  | 'wallet_keystone'
  | 'oracle_lens'
  | 'token_prism'
  | 'contract_obelisk'
  // --- content pack (Phase 3) ---
  | 'road'
  | 'water'
  | 'foliage'
  | 'streetlight'
  | 'timber'
  | 'roof'
  | 'door'
  | 'window'
  | 'grass';

/** Geometry variants — turns voxels into architecture. */
export type BlockShape = 'cube' | 'slab' | 'pole' | 'panel' | 'ramp' | 'tree';

export type Vec3 = [number, number, number];

export interface Block {
  id: string;
  type: BlockType;
  /** Integer grid coordinates: x (right), y (up), z (forward). */
  position: Vec3;
  /** Euler rotation in radians. Snaps to 90° steps around Y. */
  rotation: Vec3;
  /** Geometry variant. Absent = 'cube' (back-compat with old saves). */
  shape?: BlockShape;
  /** Hex tint override. Absent = the block type's default colour. */
  color?: string;
}

export interface WorldSnapshot {
  blocks: Block[];
  /** Schema version, incremented on breaking changes. */
  version: number;
  /**
   * Which kind of world this snapshot represents.
   *  - 'sandbox': the user's creative land — anyone can visit.
   *  - 'lessons': the commemorative town built through quiz answers,
   *               minted once after all lessons are complete.
   */
  kind?: 'sandbox' | 'lessons';
}

export type Tool = 'place' | 'select';
