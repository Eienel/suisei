/**
 * Brick taxonomy. Adding a new brick = adding a row here.
 * Sprint 0 only renders Block live; the rest are greyed in the palette.
 */
export type BrickType =
  | 'wallet'
  | 'block'
  | 'tx'
  | 'token'
  | 'validator'
  | 'miner'
  | 'smart-contract'
  | 'oracle';

export interface BrickDef {
  id: BrickType;
  label: string;
  shortLabel: string;
  color: string;
  studColor: string;
  blurb: string;
  enabled: boolean;
}

export const BRICK_DEFS: readonly BrickDef[] = [
  {
    id: 'wallet',
    label: 'Wallet',
    shortLabel: 'WLT',
    color: '#FFC83D',
    studColor: '#E0A91A',
    blurb: 'Holds your keys. The thing that proves you, you.',
    enabled: false,
  },
  {
    id: 'block',
    label: 'Block',
    shortLabel: 'BLK',
    color: '#1E6BFF',
    studColor: '#5C95FF',
    blurb: 'A box of transactions stamped with time and a hash.',
    enabled: true,
  },
  {
    id: 'tx',
    label: 'Transaction',
    shortLabel: 'TX',
    color: '#22C55E',
    studColor: '#4ADE80',
    blurb: 'A signed message: "I send X to Y."',
    enabled: false,
  },
  {
    id: 'token',
    label: 'Token',
    shortLabel: 'TKN',
    color: '#F472B6',
    studColor: '#F9A8D4',
    blurb: 'Programmable units of value living on a chain.',
    enabled: false,
  },
  {
    id: 'validator',
    label: 'Validator',
    shortLabel: 'VAL',
    color: '#A855F7',
    studColor: '#C084FC',
    blurb: 'Checks blocks and gets rewarded for honest work.',
    enabled: false,
  },
  {
    id: 'miner',
    label: 'Miner',
    shortLabel: 'MNR',
    color: '#F97316',
    studColor: '#FB923C',
    blurb: 'Burns energy to earn the right to add a block.',
    enabled: false,
  },
  {
    id: 'smart-contract',
    label: 'Smart Contract',
    shortLabel: 'SC',
    color: '#06B6D4',
    studColor: '#22D3EE',
    blurb: 'Code that runs when you send it a transaction.',
    enabled: false,
  },
  {
    id: 'oracle',
    label: 'Oracle',
    shortLabel: 'ORC',
    color: '#EAB308',
    studColor: '#FACC15',
    blurb: 'Pipes outside-world data onto the chain.',
    enabled: false,
  },
];

export const BRICK_BY_ID: Record<BrickType, BrickDef> = BRICK_DEFS.reduce(
  (acc, def) => {
    acc[def.id] = def;
    return acc;
  },
  {} as Record<BrickType, BrickDef>
);
