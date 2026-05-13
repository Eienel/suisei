import type { BlockType, Vec3 } from '@/types';

/**
 * BlockBuilders lessons — quiz-only flow.
 *
 * Each correct answer drops one block into the world at a pre-planned
 * coordinate. By the end of all 6 lessons the user has unknowingly
 * assembled a small crypto-themed town with 6 districts:
 *
 *                            ZK lab (north)
 *                                |
 *   Wallet homes  ---  TOWN  ---  Validator HQ
 *      (west)         CENTRE         (east)
 *                       |
 *                  Tokens & DeFi
 *                     (south)
 *
 * Lessons stage: READ -> CHECK (quiz drops blocks live) -> DONE.
 * No separate "build" stage — the quiz IS the build.
 */

export interface ReadPage {
  heading: string;
  body: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Block placed in the world when this question is first answered correctly. */
  reward: { type: BlockType; position: Vec3 };
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
  // -------------- 1. WALLETS — west district -----------------------------
  {
    id: 'wallets',
    title: 'Wallets',
    blurb: 'The keychain that proves you are you.',
    district: 'The wallet homes',
    pages: [
      {
        heading: 'A wallet is a keychain',
        body:
          'A wallet does NOT hold coins. It holds a tiny secret code called a private key. The key is what proves you control your address. Lose the key, lose the money. Keep it safe.',
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
        options: ['Cryptocurrency coins', 'Your keys', 'Your password', 'A list of contacts'],
        correctIndex: 1,
        reward: { type: 'wallet_keystone', position: [-5, 0, -1] },
      },
      {
        prompt: 'Which key do you share with people who want to pay you?',
        options: ['Your private key', 'Your public key', 'Both keys', 'Neither key'],
        correctIndex: 1,
        reward: { type: 'wallet_keystone', position: [-5, 0, 0] },
      },
      {
        prompt: 'If you lose your private key…',
        options: [
          'Customer support will email it back',
          'A new key is auto-generated',
          'You lose access — there is no recovery',
          'The chain freezes for safety',
        ],
        correctIndex: 2,
        reward: { type: 'wallet_keystone', position: [-5, 0, 1] },
      },
      {
        prompt: 'A wallet "signs" a transaction. What does that do?',
        options: [
          'Encrypts the transaction so nobody can read it',
          'Proves the transaction came from this wallet, without revealing the key',
          'Sends a fee to the network',
          'Writes the transaction onto paper',
        ],
        correctIndex: 1,
        reward: { type: 'wallet_keystone', position: [-5, 1, 0] },
      },
    ],
  },

  // -------------- 2. TOKENS — south district -----------------------------
  {
    id: 'tokens',
    title: 'Tokens',
    blurb: 'Programmable units of value.',
    district: 'The marketplace',
    pages: [
      {
        heading: 'Tokens are numbers',
        body:
          'A token is a programmable unit of value living on a chain. It can be money, a game item, a ticket, or a share. The chain just keeps score of who owns how many.',
      },
      {
        heading: "Sending without moving",
        body:
          "When you 'send' a token, no physical thing moves. The chain just updates a ledger: A goes down by 5, B goes up by 5. That ledger is public and locked in forever. No bank involved.",
      },
    ],
    quiz: [
      {
        prompt: 'When you send 5 tokens to a friend, what really happens?',
        options: [
          'A physical coin travels on the network',
          'Nothing — two ledger rows just update',
          'The token teleports',
          'A bank logs the transfer',
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', position: [-1, 0, 4] },
      },
      {
        prompt: 'Who keeps the official record of token ownership?',
        options: ['A bank', 'The chain itself', 'A trusted person', 'Nobody'],
        correctIndex: 1,
        reward: { type: 'token_prism', position: [0, 0, 4] },
      },
      {
        prompt: 'Two tokens with the same name from different chains are…',
        options: [
          'Always the same token',
          'Different — they live on separate ledgers',
          'Mergeable by a bank',
          "Always exchangeable 1-for-1",
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', position: [1, 0, 4] },
      },
      {
        prompt: 'Can a token represent something other than money?',
        options: [
          'No, only money',
          'Yes — game items, tickets, shares, anything countable',
          'Only with permission',
          'Only on Solana',
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', position: [0, 1, 4] },
      },
    ],
  },

  // -------------- 3. SMART CONTRACTS — north-west district ---------------
  {
    id: 'smart-contracts',
    title: 'Smart Contracts',
    blurb: 'Code that runs on the chain.',
    district: 'The code towers',
    pages: [
      {
        heading: "It's just code",
        body:
          'A smart contract is a small program parked on the chain. Send it a transaction and it runs — the same way for everyone, every time. No one can change the rules halfway.',
      },
      {
        heading: 'Holding value',
        body:
          'Smart contracts can hold tokens. They lend, swap, lock, return them when conditions are met. DeFi, NFTs, on-chain games — all of it is programs holding the bag and following code.',
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
        reward: { type: 'contract_obelisk', position: [-3, 0, -4] },
      },
      {
        prompt: "Can a deployed contract's rules be changed by the author later?",
        options: [
          'Yes, any time',
          'No — the code that runs is locked in (usually)',
          'Only on weekends',
          "Only if the user pays a fee",
        ],
        correctIndex: 1,
        reward: { type: 'contract_obelisk', position: [-3, 1, -4] },
      },
      {
        prompt: "Why do people say smart contracts are 'trustless'?",
        options: [
          "Because the author can't be trusted",
          'Because anyone can read the code and the network runs it as written',
          "Because they don't work",
          'Because trust is illegal in DeFi',
        ],
        correctIndex: 1,
        reward: { type: 'contract_obelisk', position: [-3, 2, -4] },
      },
      {
        prompt: 'What can a smart contract hold?',
        options: [
          'Tokens, on-chain data, NFTs, basically anything the chain tracks',
          'Only one specific token',
          "Nothing — contracts can't hold value",
          "Only the chain's native coin",
        ],
        correctIndex: 0,
        reward: { type: 'data_core', position: [-4, 0, -4] },
      },
    ],
  },

  // -------------- 4. VALIDATORS — east district --------------------------
  {
    id: 'validators',
    title: 'Validators',
    blurb: 'Who keeps the chain honest.',
    district: 'The validator HQ',
    pages: [
      {
        heading: 'Skin in the game',
        body:
          'Validators are the network watchdogs. They lock up money as a deposit (called staking), then take turns proposing new blocks. Play fair and earn rewards. Cheat and lose your stake.',
      },
      {
        heading: 'Governance lives here',
        body:
          'Many networks let validators (and token holders) vote on upgrades. A vote weighted by stake decides where the chain goes. The same group that secures the network also steers it.',
      },
    ],
    quiz: [
      {
        prompt: 'What does a validator lock up as a deposit?',
        options: ['A house', 'Tokens (called the stake)', 'Their identity', 'Nothing'],
        correctIndex: 1,
        reward: { type: 'security_bunker', position: [4, 0, -1] },
      },
      {
        prompt: 'What happens to a validator that cheats?',
        options: [
          'They get a warning',
          'Part of their stake is destroyed (slashed)',
          'Their account is frozen for a day',
          'Nothing — there are no consequences',
        ],
        correctIndex: 1,
        reward: { type: 'security_bunker', position: [4, 0, 1] },
      },
      {
        prompt: 'Who decides on big upgrades to a proof-of-stake chain?',
        options: [
          'A single CEO',
          'Validators and stakers via on-chain votes',
          'Random users',
          'The chain decides automatically',
        ],
        correctIndex: 1,
        reward: { type: 'governance_marble', position: [4, 0, 0] },
      },
      {
        prompt: 'Why does staking make the chain secure?',
        options: [
          'Validators are paid extra to be careful',
          'Cheating costs more than playing fair — incentives align with honesty',
          "They're all watched by a referee",
          'Cheaters get banned by social media',
        ],
        correctIndex: 1,
        reward: { type: 'governance_marble', position: [4, 1, 0] },
      },
    ],
  },

  // -------------- 5. ZERO KNOWLEDGE — north district ---------------------
  {
    id: 'zk',
    title: 'Zero Knowledge',
    blurb: 'Prove a fact without revealing it.',
    district: 'The proof lab',
    pages: [
      {
        heading: 'Math that hides',
        body:
          'A zero-knowledge proof lets you prove something is true WITHOUT showing the data behind it. Prove you know a password without typing it. Prove you are over 18 without showing your ID.',
      },
      {
        heading: 'Why crypto cares',
        body:
          'ZK lets blockchains stay private AND verifiable. You can show your tax was paid without revealing your income. You can prove a transaction is valid without leaking who sent what. Huge unlock for privacy.',
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
        reward: { type: 'zk_crystal', position: [-1, 0, -4] },
      },
      {
        prompt: 'A real-world use of ZK is…',
        options: [
          'Proving age without showing ID',
          'Posting your password to the chain',
          'Sharing your full medical record publicly',
          'Sending a normal email',
        ],
        correctIndex: 0,
        reward: { type: 'zk_crystal', position: [0, 0, -4] },
      },
      {
        prompt: 'Why is ZK useful for blockchains specifically?',
        options: [
          'It lets you keep data private while still being verifiable on-chain',
          'It makes blocks bigger',
          'It removes the need for validators',
          'It runs the chain itself',
        ],
        correctIndex: 0,
        reward: { type: 'zk_crystal', position: [1, 0, -4] },
      },
      {
        prompt: 'A ZK proof feeds on…',
        options: [
          'Validator votes',
          'Math + the secret data you want to keep hidden',
          'Random network noise',
          'A trusted authority',
        ],
        correctIndex: 1,
        reward: { type: 'data_core', position: [2, 0, -4] },
      },
    ],
  },

  // -------------- 6. DEFI — south-east district --------------------------
  {
    id: 'defi',
    title: 'DeFi',
    blurb: 'Banking without the bank.',
    district: 'The vault',
    pages: [
      {
        heading: 'A bank made of code',
        body:
          'DeFi (Decentralized Finance) is when banks are replaced by smart contracts. Lending, borrowing, swapping, saving — all done by code that anyone can use, no signup required.',
      },
      {
        heading: 'Vaults and pools',
        body:
          'A DeFi vault holds tokens from many users. The contract decides how to use them — earn interest, swap for other tokens, lend to borrowers. You can withdraw your share. The contract is the bank.',
      },
    ],
    quiz: [
      {
        prompt: 'What replaces the bank in DeFi?',
        options: ['A government', 'A smart contract', 'A celebrity', 'A telephone hotline'],
        correctIndex: 1,
        reward: { type: 'defi_vault', position: [3, 0, 4] },
      },
      {
        prompt: "What's typically inside a DeFi vault?",
        options: [
          'Physical gold',
          'A pile of tokens managed by code',
          'A list of bank customers',
          "Just contracts, no tokens",
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', position: [4, 0, 4] },
      },
      {
        prompt: 'A "yield" in DeFi is…',
        options: [
          'A traffic sign',
          'The return your deposited tokens earn from being lent or used',
          'A penalty for withdrawing',
          'A bank fee',
        ],
        correctIndex: 1,
        reward: { type: 'token_prism', position: [3, 0, 5] },
      },
      {
        prompt: 'Why is DeFi available to everyone, 24/7?',
        options: [
          'A bank app is always running',
          "The contracts live on-chain — there's no office, no closing hours",
          'Governments require it',
          'Validators take shifts',
        ],
        correctIndex: 1,
        reward: { type: 'contract_obelisk', position: [3, 1, 4] },
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

export function totalBlocks(): number {
  return LESSONS.reduce((s, l) => s + l.quiz.length, 0);
}

/** Stable id for tracking which questions a player has nailed. */
export function questionId(lessonId: string, idx: number): string {
  return `${lessonId}:${idx}`;
}
