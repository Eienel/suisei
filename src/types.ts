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
  | 'contract_obelisk';

export type Vec3 = [number, number, number];

export interface Block {
  id: string;
  type: BlockType;
  /** Integer grid coordinates: x (right), y (up), z (forward). */
  position: Vec3;
  /** Euler rotation in radians. V1 snaps to 90° steps around Y. */
  rotation: Vec3;
}

export interface WorldSnapshot {
  blocks: Block[];
  /** Schema version, incremented on breaking changes. */
  version: number;
}

export type Tool = 'place' | 'select' | 'pan';
