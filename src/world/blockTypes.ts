import type { BlockType } from '@/types';

/**
 * Visual identity per block type. Phase 1 ships the taxonomy + a
 * basic material; Phase 2 swaps in distinct shaders/materials per
 * category (crystal, marble, neural, etc.).
 */
export interface BlockDef {
  id: BlockType;
  label: string;
  /** Short 2-3 letter code shown on small chips. */
  short: string;
  /** Conceptual domain — drives material category in Phase 2. */
  category: 'zk' | 'data' | 'defi' | 'governance' | 'ai' | 'security' | 'wallet' | 'oracle' | 'token' | 'contract';
  /** Base color (used as emissive tint, palette accent). */
  color: string;
  /** Brief description used in tooltips / AI prompt context. */
  blurb: string;
}

export const BLOCK_DEFS: readonly BlockDef[] = [
  {
    id: 'zk_crystal',
    label: 'ZK Crystal',
    short: 'ZK',
    category: 'zk',
    color: '#00E5FF',
    blurb: 'A translucent crystal that proves a fact without revealing it. Zero-knowledge.',
  },
  {
    id: 'data_core',
    label: 'Data Core',
    short: 'DAT',
    category: 'data',
    color: '#8B5CF6',
    blurb: 'A pulsing cube of raw on-chain data — events, state, history.',
  },
  {
    id: 'defi_vault',
    label: 'DeFi Vault',
    short: 'DFI',
    category: 'defi',
    color: '#FFB020',
    blurb: 'Metallic vault holding pooled liquidity. Programmable banking primitive.',
  },
  {
    id: 'governance_marble',
    label: 'Governance Marble',
    short: 'GOV',
    category: 'governance',
    color: '#F5F7FF',
    blurb: 'A marble pillar — votes, proposals, the slow architecture of decisions.',
  },
  {
    id: 'ai_neural',
    label: 'AI Neural Node',
    short: 'AI',
    category: 'ai',
    color: '#FF2D92',
    blurb: 'A node humming with model weights, an inference endpoint made tactile.',
  },
  {
    id: 'security_bunker',
    label: 'Security Bunker',
    short: 'SEC',
    category: 'security',
    color: '#3B82F6',
    blurb: 'Reinforced industrial block. Audit trails, key vaults, defense in depth.',
  },
  {
    id: 'wallet_keystone',
    label: 'Wallet Keystone',
    short: 'WLT',
    category: 'wallet',
    color: '#FACC15',
    blurb: 'Etched stone that holds keys. The thing that proves you are you.',
  },
  {
    id: 'oracle_lens',
    label: 'Oracle Lens',
    short: 'ORC',
    category: 'oracle',
    color: '#22D3EE',
    blurb: 'A lens that pipes outside-world data on-chain. Prices, scores, weather.',
  },
  {
    id: 'token_prism',
    label: 'Token Prism',
    short: 'TKN',
    category: 'token',
    color: '#F472B6',
    blurb: 'Programmable units of value, faceted like a prism. Money that is also code.',
  },
  {
    id: 'contract_obelisk',
    label: 'Contract Obelisk',
    short: 'CTR',
    category: 'contract',
    color: '#06B6D4',
    blurb: 'A monolith of code, parked on-chain. Send it a transaction, it runs.',
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
