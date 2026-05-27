import type { QuestDef, QuestId } from '@/types';

/**
 * The 7+1 quest curriculum. Order = play order. Each tile shows
 * `number · title` on the hub. `hook` is the emotional one-liner.
 */
export const QUESTS: QuestDef[] = [
  {
    id: 'zklogin',
    number: 1,
    title: 'Sign in without a seed phrase',
    concept: 'zkLogin',
    hook: 'Google → wallet. No extension, no seed, no fear.',
    minutes: 3,
    bounty: 'agentic',
  },
  {
    id: 'sponsored',
    number: 2,
    title: 'Your first $0 transaction',
    concept: 'Sponsored Tx + Object Model',
    hook: 'The app pays the gas. Your NFT is a real on-chain object.',
    minutes: 4,
    bounty: 'agentic',
  },
  {
    id: 'abilities',
    number: 3,
    title: 'The compiler that refuses to let you lose things',
    concept: 'Move Abilities',
    hook: 'key, store, copy, drop — type-level safety the EVM cannot copy.',
    minutes: 5,
    bounty: 'agentic',
  },
  {
    id: 'capability',
    number: 4,
    title: 'Admin power as a physical object',
    concept: 'Capability Pattern',
    hook: 'You don’t check addresses — you hold a key.',
    minutes: 5,
    bounty: 'agentic',
  },
  {
    id: 'soulbound',
    number: 5,
    title: 'A badge that cannot leave your wallet',
    concept: 'Soulbound NFT',
    hook: 'Try to transfer it. The compiler will laugh.',
    minutes: 4,
    bounty: 'agentic',
  },
  {
    id: 'ptb',
    number: 6,
    title: 'Five operations, one atomic block',
    concept: 'Programmable Transaction Blocks',
    hook: 'Compose with the move set of a fighting game.',
    minutes: 4,
    bounty: 'agentic',
  },
  {
    id: 'walrus_seal',
    number: 7,
    title: 'A secret only NFT holders can read',
    concept: 'Walrus + Seal',
    hook: 'Decentralized storage gated by a Move policy.',
    minutes: 5,
    bounty: 'walrus',
  },
  {
    id: 'deepbook_grad',
    number: 8,
    title: 'Graduate: deploy a real trading bot',
    concept: 'DeepBook',
    hook: 'Real orders on a real orderbook. Sui Stack Graduate badge.',
    minutes: 5,
    bounty: 'deepbook',
  },
];

export function questById(id: QuestId): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}
