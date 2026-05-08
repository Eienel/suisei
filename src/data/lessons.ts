import type { BrickType } from '@/game/bricks/brickTypes';

/**
 * Lesson registry. Each lesson is unlocked when its triggerCombo
 * (a multiset of brick types) is present on the board.
 *
 * Sprint 0: data only. Sprint 2 wires the combo detector and modal.
 */
export interface Lesson {
  id: string;
  title: string;
  triggerCombo: BrickType[];
  body: string;
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'first-block',
    title: 'What is a block?',
    triggerCombo: ['block'],
    body: 'A block is a sealed box. Inside: a list of transactions, a timestamp, and a fingerprint (hash) of the box before it. Snap them in a row and you have a chain.',
  },
  {
    id: 'wallet-basics',
    title: 'Your wallet is a keychain',
    triggerCombo: ['wallet'],
    body: 'A wallet does not actually hold coins — it holds keys. The keys prove you control an address. Lose the keys, lose the funds. Keep them safe.',
  },
  {
    id: 'tx-basics',
    title: 'A transaction is a signed note',
    triggerCombo: ['tx'],
    body: 'A transaction is a tiny, signed message: "send X from A to B." Anyone can read it; only the holder of A\'s private key could have signed it.',
  },
  {
    id: 'block-of-txs',
    title: 'Blocks bundle transactions',
    triggerCombo: ['block', 'tx'],
    body: 'Validators bundle pending transactions into the next block. More transactions = more useful, but blocks have a size limit, so fees decide who gets in.',
  },
  {
    id: 'wallet-signs-tx',
    title: 'Wallets sign transactions',
    triggerCombo: ['wallet', 'tx'],
    body: 'When you "send" something, your wallet signs the transaction with your private key. The network verifies the signature before letting it into a block.',
  },
  {
    id: 'validators-validate',
    title: 'Validators keep the chain honest',
    triggerCombo: ['validator', 'block'],
    body: 'Validators check every transaction in a block, vote on it, and earn rewards if they play fair. Cheat and you lose your stake.',
  },
  {
    id: 'tokens-on-chain',
    title: 'Tokens are programmable money',
    triggerCombo: ['token', 'wallet'],
    body: 'Tokens live on a chain like apps live on a phone. Your wallet just keeps track of how many you can move and where.',
  },
  {
    id: 'smart-contract-runs',
    title: 'Smart contracts: code on the chain',
    triggerCombo: ['smart-contract', 'tx'],
    body: 'A smart contract is a program parked on the chain. Send it a transaction and it runs — the same way for everyone, every time.',
  },
  {
    id: 'oracle-feeds',
    title: 'Oracles bring outside data in',
    triggerCombo: ['oracle', 'smart-contract'],
    body: 'Smart contracts cannot read the internet. Oracles pipe in things like prices, weather, or scores so contracts can react to the real world.',
  },
  {
    id: 'mini-chain',
    title: 'You built a mini chain',
    triggerCombo: ['wallet', 'tx', 'block', 'validator'],
    body: 'Wallet signs → transaction is valid → validator includes it in a block → block links to the chain. That is, in four bricks, the whole loop.',
  },
];

export const LESSON_BY_ID: Record<string, Lesson> = LESSONS.reduce(
  (acc, l) => {
    acc[l.id] = l;
    return acc;
  },
  {} as Record<string, Lesson>
);
