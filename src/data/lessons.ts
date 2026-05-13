import type { BrickType } from '@/game/bricks/brickTypes';

/**
 * Each lesson is a guided micro-tutorial:
 *   1. READ — short kid-tone intro
 *   2. BUILD — step-bricks appear scrambled; player drags each into the
 *              correct numbered slot (left-to-right). Wrong slot rejects.
 *   3. RECAP — one-line takeaway and "Next lesson →"
 *
 * `steps` defines the expected order. Each step's `type` picks the brick's
 * visual style (color + glyph) from the existing palette; `label` is the
 * short text shown on the brick itself; `blurb` shows when correctly placed.
 *
 * `triggerCombo` is kept so the bonus Sandbox mode can still surface
 * lesson titles as "secret discoveries" via the existing combo detector.
 */
export interface LessonStep {
  type: BrickType;
  label: string;
  blurb: string;
}

export interface Lesson {
  id: string;
  title: string;
  intro: string;
  recap: string;
  steps: LessonStep[];
  triggerCombo: BrickType[];
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'wallets',
    title: 'Wallets',
    intro:
      "A wallet does NOT hold money. It holds keys — tiny secret codes that prove you are you. Lose the keys, lose the money. Let's walk through how a wallet comes to life.",
    recap:
      'A wallet is just a keychain. The address is public, the seed is sacred, the signature is what makes you, you.',
    steps: [
      { type: 'wallet', label: 'Generate keys', blurb: 'Math creates a public + private key pair from random noise.' },
      { type: 'wallet', label: 'Save seed', blurb: '12-24 words that can rebuild your keys. Write them down. Never type them online.' },
      { type: 'wallet', label: 'Get address', blurb: 'A short string people can send to. Derived from your public key.' },
      { type: 'token', label: 'Receive token', blurb: 'Anyone can send to your address. Your balance updates on-chain — your wallet just reads it.' },
      { type: 'tx', label: 'Sign tx', blurb: 'Your private key signs an outgoing transaction. The whole world can verify it. Only you could have made it.' },
    ],
    triggerCombo: ['wallet', 'tx'],
  },
  {
    id: 'transactions',
    title: 'Transactions',
    intro:
      "A transaction is a tiny signed note: 'send X from A to B.' It's the only way anything moves on a blockchain. Here's the life of one transaction.",
    recap:
      "Every transaction is just: write → sign → pay fee → broadcast → confirmed. Five steps, the same every time.",
    steps: [
      { type: 'tx', label: 'Write transfer', blurb: 'Specify from, to, and amount. Just data — no money has moved yet.' },
      { type: 'wallet', label: 'Sign with key', blurb: 'Your wallet stamps the note with a signature only your private key could have made.' },
      { type: 'token', label: 'Add fee', blurb: 'Tiny tip for the network. Higher fee = faster inclusion when blocks are full.' },
      { type: 'tx', label: 'Broadcast', blurb: 'Send to a node. The node gossips it across the network within seconds.' },
      { type: 'block', label: 'Confirmed', blurb: 'A validator includes it in a block. Now it is permanent. Welcome to the chain.' },
    ],
    triggerCombo: ['wallet', 'tx', 'block'],
  },
  {
    id: 'blocks',
    title: 'Blocks',
    intro:
      "A block is a sealed box of transactions, stamped with time and a fingerprint of the previous block. That fingerprint chain is what makes tampering loud.",
    recap:
      "Blocks bundle transactions, get hashed, and link to the previous block. Mess with one — every later hash breaks. That's the chain.",
    steps: [
      { type: 'tx', label: 'Collect txs', blurb: 'Pull the pending transactions floating around the network.' },
      { type: 'tx', label: 'Order by fee', blurb: 'Higher fees ride up front. There\'s only so much room per block.' },
      { type: 'block', label: 'Bundle', blurb: 'Pack the chosen transactions into a fresh block.' },
      { type: 'block', label: 'Link prev hash', blurb: "Stamp the previous block's fingerprint inside this one. That's the chain link." },
      { type: 'validator', label: 'Stamp + hash', blurb: 'Add a timestamp, hash the whole thing. The new fingerprint identifies this block forever.' },
    ],
    triggerCombo: ['block', 'tx', 'validator'],
  },
  {
    id: 'mining',
    title: 'Mining (Proof of Work)',
    intro:
      "Some chains (like Bitcoin) decide who gets to add the next block by burning energy. Miners race to solve a puzzle. Winner writes the block. Here's the loop.",
    recap:
      "Mining is a number-guessing race. Lots of energy, lots of guesses, one winner per block. That cost is what makes rewriting history expensive.",
    steps: [
      { type: 'miner', label: 'Pick txs', blurb: 'Miner builds a candidate block from pending transactions.' },
      { type: 'miner', label: 'Try nonce', blurb: 'Tweak one number (the nonce) inside the block, then hash it.' },
      { type: 'miner', label: 'Check hash', blurb: 'Is the hash below the difficulty target? If not, try again.' },
      { type: 'miner', label: 'Try again', blurb: 'Trillions of attempts per second. The puzzle has no shortcut — only brute force.' },
      { type: 'block', label: 'Broadcast block', blurb: 'Found it! Tell the network. Other miners verify in milliseconds and start the next race.' },
    ],
    triggerCombo: ['miner', 'block'],
  },
  {
    id: 'validators',
    title: 'Validators (Proof of Stake)',
    intro:
      "Newer chains (like Solana, Ethereum) skip the energy race. Validators put up money as a deposit and take turns. Cheat → lose your deposit. Honest → earn fees.",
    recap:
      "Stake = skin in the game. Honest work pays. Cheating burns your stake. The economics do the policing.",
    steps: [
      { type: 'token', label: 'Stake tokens', blurb: 'Lock up tokens as a security deposit. The amount affects how often you get picked.' },
      { type: 'validator', label: 'Get slot', blurb: 'The protocol assigns you a turn to propose the next block.' },
      { type: 'validator', label: 'Build block', blurb: 'Pack valid transactions, hash, sign, propose.' },
      { type: 'validator', label: 'Vote on it', blurb: 'Other validators check your block and vote. Most must agree.' },
      { type: 'block', label: 'Earn or slash', blurb: 'Honest block: get rewards. Bad block or downtime: a slice of your stake gets burned.' },
    ],
    triggerCombo: ['validator', 'token', 'block'],
  },
  {
    id: 'tokens',
    title: 'Tokens',
    intro:
      "A token is a programmable unit of value living on a chain. It can be money, a game item, a ticket, a share. The chain just keeps score.",
    recap:
      "Tokens never physically move — only the ledger row that says 'who owns how many' changes. The chain is the world's most boring spreadsheet.",
    steps: [
      { type: 'smart-contract', label: 'Deploy contract', blurb: 'A small contract defines the token: name, symbol, supply rules.' },
      { type: 'token', label: 'Mint supply', blurb: 'The contract creates the initial tokens and credits them to a wallet.' },
      { type: 'tx', label: 'Send to wallet', blurb: 'A transaction tells the contract: move N tokens from A to B.' },
      { type: 'wallet', label: 'Balance updates', blurb: 'The contract updates two ledger rows: A goes down, B goes up. Done.' },
      { type: 'wallet', label: 'Send onward', blurb: 'B can now send their tokens to anyone. No bank, no permission.' },
    ],
    triggerCombo: ['token', 'wallet'],
  },
  {
    id: 'smart-contracts',
    title: 'Smart Contracts',
    intro:
      "A smart contract is a tiny program parked on the chain. Send it a transaction and it runs — the same way for everyone, every time. Code IS the rules.",
    recap:
      "Write code → deploy → anyone can call it → it runs deterministically → result is locked in a block. No mid-game rule changes.",
    steps: [
      { type: 'smart-contract', label: 'Write code', blurb: 'A short program with functions, storage, and rules.' },
      { type: 'smart-contract', label: 'Deploy', blurb: 'Send a special tx that uploads the code. The chain assigns it an address.' },
      { type: 'tx', label: 'Send call tx', blurb: 'Anyone with a wallet can send a transaction calling one of its functions.' },
      { type: 'validator', label: 'Code runs', blurb: 'Every node in the network runs the same code with the same inputs. Identical result.' },
      { type: 'block', label: 'Result recorded', blurb: 'Storage updates and events get written into the next block. Permanent.' },
    ],
    triggerCombo: ['smart-contract', 'tx'],
  },
  {
    id: 'oracles',
    title: 'Oracles',
    intro:
      "Smart contracts can't read websites or check the weather. Oracles are bridges that pipe outside-world data on-chain so contracts can react to it.",
    recap:
      "Without oracles, smart contracts only know the chain. With oracles, they can act on real prices, real scores, real anything.",
    steps: [
      { type: 'oracle', label: 'World has data', blurb: 'Real-world fact lives somewhere off-chain (a price feed, a sports score).' },
      { type: 'oracle', label: 'Oracle fetches', blurb: 'An oracle node reads it from a trusted source.' },
      { type: 'tx', label: 'Posts on-chain', blurb: 'The oracle wraps the data in a transaction and broadcasts it.' },
      { type: 'smart-contract', label: 'Contract reads', blurb: 'A waiting smart contract pulls the value from the latest oracle update.' },
      { type: 'block', label: 'Contract acts', blurb: 'Maybe pay out a bet, trigger a buy, mint an NFT — whatever the contract is coded to do.' },
    ],
    triggerCombo: ['oracle', 'smart-contract'],
  },
  {
    id: 'nfts',
    title: 'NFTs',
    intro:
      "An NFT is a token with a serial number. Each one is unique — token #1 ≠ token #2 even from the same collection. The chain proves who owns which.",
    recap:
      "NFTs are receipts. The chain remembers who minted, who owns, who sold. The image / song / item it points to lives elsewhere — the proof of ownership lives here.",
    steps: [
      { type: 'smart-contract', label: 'Deploy collection', blurb: 'A contract that knows how to mint unique numbered tokens.' },
      { type: 'token', label: 'Mint #N', blurb: 'Create token number N. Attach a metadata link (image, name, traits).' },
      { type: 'wallet', label: 'Wallet owns it', blurb: 'The contract records: token #N belongs to this wallet address.' },
      { type: 'tx', label: 'Transfer it', blurb: 'A signed transaction reassigns ownership of #N to a new wallet.' },
      { type: 'wallet', label: 'New owner', blurb: 'New wallet sees #N in their collection. Old wallet does not. Single source of truth.' },
    ],
    triggerCombo: ['smart-contract', 'token', 'wallet'],
  },
  {
    id: 'defi-swap',
    title: 'DeFi Swap',
    intro:
      "A swap trades one token for another — without a bank or a broker. A smart contract called an AMM (automated market maker) holds both tokens in a pool and quotes you a price on the spot.",
    recap:
      "You connect, approve, swap. The contract balances itself by raising the price of whichever token is leaving. No order book. No counterparty. Just math.",
    steps: [
      { type: 'wallet', label: 'Open swap', blurb: 'Visit a DeFi app, connect your wallet, pick Token A → Token B and an amount.' },
      { type: 'smart-contract', label: 'Approve spend', blurb: 'A first transaction lets the swap contract move your Token A. (Only needed once per token.)' },
      { type: 'tx', label: 'Send swap tx', blurb: 'Sign the actual swap — the wallet broadcasts it.' },
      { type: 'token', label: 'Pool swaps', blurb: 'The pool contract takes Token A from you and sends Token B back, recalculating the price as it goes.' },
      { type: 'wallet', label: 'Receive Token B', blurb: 'Token B arrives in your wallet seconds later. Whole thing settled, no middleman.' },
    ],
    triggerCombo: ['wallet', 'smart-contract', 'token'],
  },
];

export const LESSON_BY_ID: Record<string, Lesson> = LESSONS.reduce(
  (acc, l) => {
    acc[l.id] = l;
    return acc;
  },
  {} as Record<string, Lesson>
);

export function lessonIndex(id: string): number {
  return LESSONS.findIndex((l) => l.id === id);
}

export function nextLessonId(currentId: string): string | null {
  const i = lessonIndex(currentId);
  if (i < 0 || i >= LESSONS.length - 1) return null;
  return LESSONS[i + 1].id;
}
