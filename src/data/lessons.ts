import type { BlockType } from '@/types';
import type { PieceKey } from '@/world/pieces';

/**
 * BlockBuilders lesson + quiz model.
 *
 * Each lesson:
 *   1. READ  — short kid-tone copy. AI tutor button can rephrase any page.
 *   2. CHECK — multiple-choice quiz. Each correct answer hands the player
 *              a Tetris-style piece to place anywhere on their map.
 *   3. DONE  — celebration + auto-save bumps the World NFT on Sui.
 */

export interface ReadPage {
  heading: string;
  body: string;
}

export interface PieceReward {
  type: BlockType;
  pieceKey: PieceKey;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  reward: PieceReward;
}

export interface Lesson {
  id: string;
  title: string;
  blurb: string;
  district: string;
  pages: ReadPage[];
  quiz: QuizQuestion[];
}

export const LESSONS: readonly Lesson[] = [
  // -------------- 1. WALLETS — small homely pieces -------------------
  {
    id: 'wallets',
    title: 'Wallets',
    blurb: 'The keychain that proves you are you.',
    district: 'Wallet homes',
    pages: [
      {
        heading: 'A wallet is a keychain',
        body:
          'A wallet does NOT hold coins. It holds a tiny secret code called a private key. The key is what proves you control your address. Lose the key, lose the money.',
      },
      {
        heading: 'Public and private',
        body:
          "Every wallet has TWO keys. The public key (or address) is like your email — share it freely. The private key is like your password — keep it secret. Anything signed with your private key can be verified with your public key. That's the math trick that powers everything else.",
      },
    ],
    quiz: [
      {
        prompt: 'What does a wallet actually hold?',
        options: ['Coins', 'Your keys', 'Your password', 'A contact list'],
        correctIndex: 1,
        reward: { type: 'wallet_keystone', pieceKey: 'DOT' },
      },
      {
        prompt: 'Which key do you share with people who want to pay you?',
        options: ['Private', 'Public (address)', 'Both', 'Neither'],
        correctIndex: 1,
        reward: { type: 'wallet_keystone', pieceKey: 'DUO' },
      },
      {
        prompt: 'If you lose your private key…',
        options: [
          'Support emails it back',
          'A new one is auto-generated',
          'You lose access — no recovery',
          'The chain freezes for safety',
        ],
        correctIndex: 2,
        reward: { type: 'wallet_keystone', pieceKey: 'TRI_L' },
      },
      {
        prompt: 'What does "signing" a transaction do?',
        options: [
          'Encrypts it so nobody can read it',
          'Proves it came from this wallet, no key revealed',
          'Sends a network fee',
          'Writes it on paper',
        ],
        correctIndex: 1,
        reward: { type: 'wallet_keystone', pieceKey: 'TRI_L' },
      },
    ],
  },

  // -------------- 2. TOKENS — small marketplace pieces ----------------
  {
    id: 'tokens',
    title: 'Tokens',
    blurb: 'Programmable units of value.',
    district: 'The marketplace',
    pages: [
      {
        heading: 'Tokens are numbers',
        body:
          'A token is a programmable unit of value on a chain. It can be money, a game item, a ticket, or a share. The chain just keeps score of who owns how many.',
      },
      {
        heading: 'Sending without moving',
        body:
          'When you send tokens, no physical thing moves. The chain just updates a ledger: A goes down, B goes up. That ledger is public and locked in forever. No bank involved.',
      },
    ],
    quiz: [
      {
        prompt: 'When you send 5 tokens, what really happens?',
        options: [
          'A coin travels on the network',
          'Two ledger rows update — nothing moves',
          'The token teleports',
          'A bank logs the transfer',
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', pieceKey: 'DOT' },
      },
      {
        prompt: 'Who keeps the official record of token ownership?',
        options: ['A bank', 'The chain itself', 'A trusted person', 'Nobody'],
        correctIndex: 1,
        reward: { type: 'token_prism', pieceKey: 'DUO' },
      },
      {
        prompt: 'Two tokens with the same name on different chains are…',
        options: [
          'Always the same token',
          'Different — separate ledgers',
          'Mergeable by a bank',
          'Always 1-for-1 exchangeable',
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', pieceKey: 'LINE_3' },
      },
      {
        prompt: 'Can a token represent something besides money?',
        options: [
          'No, only money',
          'Yes — items, tickets, shares, anything countable',
          'Only with permission',
          'Only on Solana',
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', pieceKey: 'TRI_L' },
      },
    ],
  },

  // -------------- 3. SMART CONTRACTS — tall code-tower pieces --------
  {
    id: 'smart-contracts',
    title: 'Smart Contracts',
    blurb: 'Code that runs on the chain.',
    district: 'Code towers',
    pages: [
      {
        heading: "It's just code",
        body:
          'A smart contract is a small program parked on the chain. Send it a transaction and it runs — the same way for everyone, every time. No one can change the rules halfway.',
      },
      {
        heading: 'Holding value',
        body:
          'Smart contracts can hold tokens. They lend, swap, lock, return them when conditions are met. DeFi, NFTs, on-chain games — all programs holding the bag and following code.',
      },
    ],
    quiz: [
      {
        prompt: 'What is a smart contract?',
        options: [
          'A legal document on paper',
          'A program on the chain that runs when called',
          'An AI chatbot',
          'A type of wallet',
        ],
        correctIndex: 1,
        reward: { type: 'contract_obelisk', pieceKey: 'DOT' },
      },
      {
        prompt: "Can a deployed contract's rules be changed later?",
        options: [
          'Yes, anytime',
          'No — the code that runs is locked in (usually)',
          'Only on weekends',
          'Only with a fee',
        ],
        correctIndex: 1,
        reward: { type: 'contract_obelisk', pieceKey: 'DUO' },
      },
      {
        prompt: "Why are smart contracts called 'trustless'?",
        options: [
          "The author isn't trustworthy",
          'Anyone can read the code; the network runs it as written',
          "They don't work",
          'Trust is illegal in DeFi',
        ],
        correctIndex: 1,
        reward: { type: 'contract_obelisk', pieceKey: 'TRI_L' },
      },
      {
        prompt: 'What can a smart contract hold?',
        options: [
          'Tokens, NFTs, any chain-tracked value',
          'One specific token only',
          'Nothing',
          "Only the chain's native coin",
        ],
        correctIndex: 0,
        reward: { type: 'data_core', pieceKey: 'DUO' },
      },
    ],
  },

  // -------------- 4. VALIDATORS — big fortress pieces ----------------
  {
    id: 'validators',
    title: 'Validators',
    blurb: 'Who keeps the chain honest.',
    district: 'Validator HQ',
    pages: [
      {
        heading: 'Skin in the game',
        body:
          'Validators lock up money as a deposit (staking), then take turns proposing new blocks. Play fair and earn rewards. Cheat and lose your stake.',
      },
      {
        heading: 'Governance lives here',
        body:
          'Many networks let validators (and stakers) vote on upgrades. A vote weighted by stake decides where the chain goes. The same group that secures the network also steers it.',
      },
    ],
    quiz: [
      {
        prompt: 'What does a validator lock up as deposit?',
        options: ['A house', 'Tokens (the stake)', 'Their identity', 'Nothing'],
        correctIndex: 1,
        reward: { type: 'security_bunker', pieceKey: 'DUO' },
      },
      {
        prompt: 'What happens to a validator that cheats?',
        options: [
          'A warning',
          'Part of stake is destroyed (slashed)',
          'Frozen for a day',
          'Nothing',
        ],
        correctIndex: 1,
        reward: { type: 'security_bunker', pieceKey: 'TRI_L' },
      },
      {
        prompt: 'Who decides upgrades to a proof-of-stake chain?',
        options: [
          'A single CEO',
          'Validators + stakers via on-chain votes',
          'Random users',
          'The chain alone',
        ],
        correctIndex: 1,
        reward: { type: 'governance_marble', pieceKey: 'DOT' },
      },
      {
        prompt: 'Why does staking make the chain secure?',
        options: [
          'Validators are paid extra',
          'Cheating costs more than playing fair — incentives align',
          'A referee watches them',
          'Social-media bans cheaters',
        ],
        correctIndex: 1,
        reward: { type: 'governance_marble', pieceKey: 'SQUARE' },
      },
    ],
  },

  // -------------- 5. ZERO KNOWLEDGE — crystal grid -------------------
  {
    id: 'zk',
    title: 'Zero Knowledge',
    blurb: 'Prove a fact without revealing it.',
    district: 'Proof lab',
    pages: [
      {
        heading: 'Math that hides',
        body:
          'A zero-knowledge proof lets you prove something is true without showing the data behind it. Prove you know a password without typing it. Prove you are over 18 without showing your ID.',
      },
      {
        heading: 'Why crypto cares',
        body:
          'ZK lets blockchains stay private AND verifiable. Show your tax was paid without revealing your income. Prove a transaction is valid without leaking who sent what.',
      },
    ],
    quiz: [
      {
        prompt: 'What does a zero-knowledge proof reveal?',
        options: [
          'All the underlying data',
          'Nothing — besides that the claim is true',
          'Half the data',
          "Just the person's name",
        ],
        correctIndex: 1,
        reward: { type: 'zk_crystal', pieceKey: 'DOT' },
      },
      {
        prompt: 'A real-world use of ZK is…',
        options: [
          'Proving age without showing ID',
          'Posting your password to the chain',
          'Sharing your medical record publicly',
          'Sending email',
        ],
        correctIndex: 0,
        reward: { type: 'zk_crystal', pieceKey: 'DUO' },
      },
      {
        prompt: 'Why ZK + blockchains specifically?',
        options: [
          'Keeps data private while still verifiable on-chain',
          'Makes blocks bigger',
          'Removes the need for validators',
          'Runs the chain itself',
        ],
        correctIndex: 0,
        reward: { type: 'zk_crystal', pieceKey: 'LINE_3' },
      },
      {
        prompt: 'A ZK proof needs…',
        options: [
          'Validator votes',
          'Math + the secret data you hide',
          'Network noise',
          'A trusted authority',
        ],
        correctIndex: 1,
        reward: { type: 'data_core', pieceKey: 'DUO' },
      },
    ],
  },

  // -------------- 6. DEFI — big vault pieces -------------------------
  {
    id: 'defi',
    title: 'DeFi',
    blurb: 'Banking without the bank.',
    district: 'The vault',
    pages: [
      {
        heading: 'A bank made of code',
        body:
          'DeFi (Decentralized Finance) replaces banks with smart contracts. Lending, borrowing, swapping, saving — all done by code anyone can use, no signup.',
      },
      {
        heading: 'Vaults and pools',
        body:
          'A DeFi vault holds tokens from many users. The contract decides how to use them — earn interest, swap, lend. You can withdraw your share. The contract IS the bank.',
      },
    ],
    quiz: [
      {
        prompt: 'What replaces the bank in DeFi?',
        options: ['A government', 'A smart contract', 'A celebrity', 'A phone hotline'],
        correctIndex: 1,
        reward: { type: 'defi_vault', pieceKey: 'SQUARE' },
      },
      {
        prompt: "What's typically inside a DeFi vault?",
        options: [
          'Physical gold',
          'A pile of tokens managed by code',
          'A bank customer list',
          'Just contracts, no tokens',
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', pieceKey: 'TRI_L' },
      },
      {
        prompt: 'A "yield" in DeFi is…',
        options: [
          'A traffic sign',
          'The return your deposited tokens earn',
          'A withdrawal penalty',
          'A bank fee',
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', pieceKey: 'DUO' },
      },
      {
        prompt: 'Why is DeFi available 24/7 globally?',
        options: [
          'A bank app is always running',
          "The contracts live on-chain — no office, no closing hours",
          'Governments require it',
          'Validators take shifts',
        ],
        correctIndex: 1,
        reward: { type: 'contract_obelisk', pieceKey: 'DOT' },
      },
    ],
  },
];

export const LESSON_BY_ID: Record<string, Lesson> = LESSONS.reduce(
  (acc, l) => {
    acc[l.id] = l;
    return acc;
  },
  {} as Record<string, Lesson>
);

/** Sandbox unlocks after this many lessons completed. */
export const SANDBOX_UNLOCK_COUNT = 3;

export function lessonIndex(id: string): number {
  return LESSONS.findIndex((l) => l.id === id);
}

export function nextLessonId(id: string): string | null {
  const i = lessonIndex(id);
  if (i < 0 || i >= LESSONS.length - 1) return null;
  return LESSONS[i + 1].id;
}

export function isLessonUnlocked(id: string, completed: readonly string[]): boolean {
  const i = lessonIndex(id);
  if (i <= 0) return true;
  return completed.includes(LESSONS[i - 1].id);
}

export function totalQuestions(): number {
  return LESSONS.reduce((s, l) => s + l.quiz.length, 0);
}

export function questionId(lessonId: string, idx: number): string {
  return `${lessonId}:${idx}`;
}
