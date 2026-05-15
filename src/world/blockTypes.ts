import type { BlockType, BlockShape } from '../types';

/**
 * Visual identity per block type. Block "type" drives the material
 * family (crystal, metal, marble, etc); shape + per-instance colour
 * tint are independent so users can build expressively without us
 * needing 200 type combos.
 */
export interface BlockDef {
  id: BlockType;
  label: string;
  /** Short 2-3 letter code shown on small chips. */
  short: string;
  /** Conceptual domain — drives material category. */
  category:
    | 'zk' | 'data' | 'defi' | 'governance' | 'ai' | 'security'
    | 'wallet' | 'oracle' | 'token' | 'contract'
    // content pack
    | 'road' | 'water' | 'foliage' | 'light' | 'timber';
  /** Base color (used as default tint). */
  color: string;
  /** Brief description used in tooltips / AI prompt context. */
  blurb: string;
  /** Default geometry shape when this type is placed manually. */
  defaultShape?: BlockShape;
  /** Whether this type emits light at night (drives day/night look). */
  emitsAtNight?: boolean;
  /** Whether this type animates (water surface). */
  animated?: boolean;
  /** If set, the user needs at least this many lessons completed to use it. */
  unlockAfterLessons?: number;
}

/** Returns whether a type is currently usable given the player's progress. */
export function isBlockUnlocked(
  def: BlockDef,
  completedLessons: number,
): boolean {
  return completedLessons >= (def.unlockAfterLessons ?? 0);
}

export const BLOCK_DEFS: readonly BlockDef[] = [
  // -------- conceptual blocks (lessons + AI prompts use these) --------
  {
    id: 'zk_crystal', label: 'ZK Crystal', short: 'ZK', category: 'zk',
    color: '#00E5FF', emitsAtNight: true,
    blurb: 'A translucent crystal that proves a fact without revealing it. Zero-knowledge.',
  },
  {
    id: 'data_core', label: 'Data Core', short: 'DAT', category: 'data',
    color: '#8B5CF6', emitsAtNight: true,
    blurb: 'A pulsing cube of raw on-chain data — events, state, history.',
  },
  {
    id: 'defi_vault', label: 'DeFi Vault', short: 'DFI', category: 'defi',
    color: '#FFB020',
    blurb: 'Metallic vault holding pooled liquidity. Programmable banking primitive.',
  },
  {
    id: 'governance_marble', label: 'Governance Marble', short: 'GOV', category: 'governance',
    color: '#F5F7FF',
    blurb: 'A marble pillar — votes, proposals, the slow architecture of decisions.',
    defaultShape: 'pole',
  },
  {
    id: 'ai_neural', label: 'AI Neural Node', short: 'AI', category: 'ai',
    color: '#FF2D92', emitsAtNight: true,
    blurb: 'A node humming with model weights, an inference endpoint made tactile.',
  },
  {
    id: 'security_bunker', label: 'Security Bunker', short: 'SEC', category: 'security',
    color: '#3B82F6',
    blurb: 'Reinforced industrial block. Audit trails, key vaults, defense in depth.',
  },
  {
    id: 'wallet_keystone', label: 'Wallet Keystone', short: 'WLT', category: 'wallet',
    color: '#FACC15',
    blurb: 'Etched stone that holds keys. The thing that proves you are you.',
  },
  {
    id: 'oracle_lens', label: 'Oracle Lens', short: 'ORC', category: 'oracle',
    color: '#22D3EE', emitsAtNight: true,
    blurb: 'A lens that pipes outside-world data on-chain. Prices, scores, weather.',
  },
  {
    id: 'token_prism', label: 'Token Prism', short: 'TKN', category: 'token',
    color: '#F472B6', emitsAtNight: true,
    blurb: 'Programmable units of value, faceted like a prism. Money that is also code.',
  },
  {
    id: 'contract_obelisk', label: 'Contract Obelisk', short: 'CTR', category: 'contract',
    color: '#06B6D4', emitsAtNight: true,
    blurb: 'A monolith of code, parked on-chain. Send it a transaction, it runs.',
    defaultShape: 'pole',
  },

  // ----------- content pack — the city-building staples ---------------
  {
    id: 'timber', label: 'Timber', short: 'WD', category: 'timber',
    color: '#A0673A',
    blurb: 'Warm wood. House walls, fences (panels), beams (poles).',
    // Always available — every builder needs a base material.
  },
  {
    id: 'road', label: 'Road', short: 'RD', category: 'road',
    color: '#2A2F3D', defaultShape: 'slab',
    blurb: 'Dark slab — pave streets, plazas, paths.',
    unlockAfterLessons: 1,
  },
  {
    id: 'foliage', label: 'Foliage', short: 'TRE', category: 'foliage',
    color: '#22C55E',
    blurb: 'Hedges, treetops, parks. Stack a pole + foliage = tree.',
    unlockAfterLessons: 2,
  },
  {
    id: 'streetlight', label: 'Streetlight', short: 'LMP', category: 'light',
    color: '#FFD27A', defaultShape: 'pole', emitsAtNight: true,
    blurb: 'Glows warm at night. Line a road with these for streetlamps.',
    unlockAfterLessons: 3,
  },
  {
    id: 'water', label: 'Water', short: 'H₂O', category: 'water',
    color: '#1E6BFF', defaultShape: 'slab', animated: true,
    blurb: 'Animated water — for rivers, lakes, moats.',
    unlockAfterLessons: 4,
  },
];

export const BLOCK_BY_ID: Record<BlockType, BlockDef> = BLOCK_DEFS.reduce(
  (acc, d) => {
    acc[d.id] = d;
    return acc;
  },
  {} as Record<BlockType, BlockDef>
);

/** Convenience: list of all valid type strings, for runtime validation. */
export const BLOCK_TYPE_IDS: readonly BlockType[] = BLOCK_DEFS.map((d) => d.id);

/** Higher-level grouping for the palette UI. */
export const BLOCK_GROUPS: Array<{ label: string; types: BlockType[] }> = [
  {
    label: 'City',
    types: ['road', 'water', 'streetlight', 'foliage', 'timber'],
  },
  {
    label: 'Crypto',
    types: [
      'wallet_keystone', 'token_prism', 'contract_obelisk',
      'defi_vault', 'governance_marble',
      'zk_crystal', 'data_core', 'ai_neural',
      'security_bunker', 'oracle_lens',
    ],
  },
];
