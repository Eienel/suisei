import type { BrickType } from '@/game/bricks/brickTypes';

/**
 * Each lesson is a small *build*: place the right pile of bricks
 * (multiset, order doesn't matter, position doesn't matter) and the
 * lesson opens, explaining what you just constructed and why it's the
 * shape it is in real crypto.
 *
 * Tone: kids 8-14. Short sentences. Concrete metaphors. One idea per lesson.
 */
export interface Lesson {
  id: string;
  title: string;
  triggerCombo: BrickType[];
  body: string;
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'stack-a-chain',
    title: 'You stacked a chain',
    triggerCombo: ['block', 'block', 'block'],
    body:
      "Three sealed boxes in a row — that's the chain. Each block carries a fingerprint of the one before it, so swapping any block in the middle breaks every fingerprint after it. Tampering is loud.",
  },
  {
    id: 'sign-a-note',
    title: 'A wallet just signed a note',
    triggerCombo: ['wallet', 'tx', 'tx'],
    body:
      "You built a wallet with two transactions next to it. Think of the wallet as the pen: every transaction it touches gets a signature only this wallet could have made. Anyone can read the signature. Nobody can fake it.",
  },
  {
    id: 'bundle-of-notes',
    title: 'A block bundles transactions',
    triggerCombo: ['block', 'tx', 'tx', 'tx'],
    body:
      "One block, three transactions. That's how the network ships things — it scoops a pile of pending notes and seals them into the next block. Block size is limited, so people offer fees to ride the front of the line.",
  },
  {
    id: 'two-wallets-one-transfer',
    title: 'Sending value, wallet to wallet',
    triggerCombo: ['wallet', 'wallet', 'tx', 'tx'],
    body:
      "Two wallets, two transactions: one to send, one to confirm. The sending wallet signs; the receiving wallet just needs an address. No middleman handles the move — the network witnesses it and writes it down forever.",
  },
  {
    id: 'token-changes-hands',
    title: 'A token changes hands',
    triggerCombo: ['wallet', 'wallet', 'token', 'tx'],
    body:
      "Tokens don't move physically — they're just numbers stored on the chain. The transaction reassigns 'who owns how many.' Both wallets just see their balance update. The token is the same; the ledger row is what changed.",
  },
  {
    id: 'validator-checks',
    title: 'A validator polices a block',
    triggerCombo: ['validator', 'block', 'block', 'tx', 'tx'],
    body:
      "The validator looks at every transaction in every block and checks: signatures real? balances enough? rules followed? Honest work earns rewards. Approving a fake block costs the validator their stake. The rules pay better than cheating.",
  },
  {
    id: 'miner-race',
    title: 'Miners race for the next block',
    triggerCombo: ['miner', 'miner', 'block', 'tx'],
    body:
      "Two miners both want the right to add the next block. They burn energy solving a puzzle; whoever wins first gets the block reward. Everyone else accepts their answer and moves on to the next race. That's proof-of-work in two bricks.",
  },
  {
    id: 'smart-contract-fires',
    title: 'A smart contract runs on demand',
    triggerCombo: ['wallet', 'smart-contract', 'tx', 'tx'],
    body:
      "Your wallet sends a transaction to the smart contract. The contract is just code parked on the chain — when poked, it executes the same way for everyone. Two transactions = two runs. No one can change the rules between calls.",
  },
  {
    id: 'oracle-feeds-contract',
    title: 'An oracle pipes the world in',
    triggerCombo: ['oracle', 'smart-contract', 'tx', 'block'],
    body:
      "Smart contracts can't read the internet on their own. The oracle posts real-world data (prices, scores, weather) onto the chain as a transaction. The contract reads it, runs its logic, and the block records the result. Outside world → on-chain reality.",
  },
  {
    id: 'full-mini-chain',
    title: "You built the whole loop",
    triggerCombo: ['wallet', 'wallet', 'tx', 'tx', 'block', 'block', 'validator', 'token'],
    body:
      "Wallets sign transactions → transactions move tokens → validators check the work → blocks lock it in → the chain grows. That's the entire engine, in eight bricks. Everything else (DeFi, NFTs, DAOs, games) is built on top of this exact loop.",
  },
];

export const LESSON_BY_ID: Record<string, Lesson> = LESSONS.reduce(
  (acc, l) => {
    acc[l.id] = l;
    return acc;
  },
  {} as Record<string, Lesson>
);
