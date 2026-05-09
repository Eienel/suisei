import type { BrickType } from '@/game/bricks/brickTypes';

/**
 * Lesson registry. Each lesson is unlocked when its triggerCombo
 * (a multiset of brick types) is present on the board.
 *
 * Tone target: kids 8–14. Short sentences, concrete metaphors,
 * no jargon dumps. One idea per lesson.
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
    title: 'A block is a sealed box',
    triggerCombo: ['block'],
    body: 'A block is a box of records. Once it is sealed, you cannot sneak anything in or out. Snap blocks in a row and you have a chain — every box points back to the one before it.',
  },
  {
    id: 'wallet-basics',
    title: 'Wallets hold keys, not coins',
    triggerCombo: ['wallet'],
    body: 'A wallet does not actually hold money. It holds a secret key — a tiny code that proves you are you. Lose the key, lose the money. Keep it safe.',
  },
  {
    id: 'tx-basics',
    title: 'A transaction is a signed note',
    triggerCombo: ['tx'],
    body: 'A transaction is a tiny note that says "send X from A to B." Anyone can read the note, but only the right key could have signed it. That signature is what makes it real.',
  },
  {
    id: 'block-of-txs',
    title: 'Blocks bundle transactions',
    triggerCombo: ['block', 'tx'],
    body: 'Each new block scoops up a pile of pending transactions. A block has a size limit, so people offer small fees to skip the line. Higher fee, faster ride.',
  },
  {
    id: 'wallet-signs-tx',
    title: 'Your wallet signs the note',
    triggerCombo: ['wallet', 'tx'],
    body: 'When you tap "send," your wallet uses its secret key to sign the transaction. The whole network can check the signature without ever seeing the key. Magic? No — math.',
  },
  {
    id: 'validators-validate',
    title: 'Validators keep the chain honest',
    triggerCombo: ['validator', 'block'],
    body: 'Validators check every transaction in a block before it is sealed. Play fair and they earn rewards. Cheat and they lose their stake. The rules do the policing.',
  },
  {
    id: 'tokens-on-chain',
    title: 'Tokens are programmable money',
    triggerCombo: ['token', 'wallet'],
    body: 'A token is a unit of value that lives on the chain. Your wallet just keeps score of what you can move and where. Tokens can be money, game items, tickets — anything you can count.',
  },
  {
    id: 'smart-contract-runs',
    title: 'Smart contracts are code on the chain',
    triggerCombo: ['smart-contract', 'tx'],
    body: 'A smart contract is a tiny program parked on the chain. Send it a transaction and it runs — the same way for everyone, every time. No one can change the rules mid-game.',
  },
  {
    id: 'oracle-feeds',
    title: 'Oracles bring the outside in',
    triggerCombo: ['oracle', 'smart-contract'],
    body: 'Smart contracts cannot read websites or the news. Oracles fetch real-world data — prices, weather, scores — and pipe it onto the chain so contracts can react to it.',
  },
  {
    id: 'mini-chain',
    title: 'You just built a mini blockchain',
    triggerCombo: ['wallet', 'tx', 'block', 'validator'],
    body: 'Wallet signs → transaction is valid → validator includes it in a block → block links to the chain. That is the whole loop, in four bricks. Everything else is detail.',
  },
];

export const LESSON_BY_ID: Record<string, Lesson> = LESSONS.reduce(
  (acc, l) => {
    acc[l.id] = l;
    return acc;
  },
  {} as Record<string, Lesson>
);
