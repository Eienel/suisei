import type { BlockType, Vec3 } from '@/types';

/**
 * Six core crypto lessons. Each lesson is a 3-stage flow:
 *   READ  — short copy explaining the concept (1-2 pages)
 *   CHECK — multiple-choice quiz to confirm comprehension
 *   BUILD — place blocks in the 3D world to match a target structure
 *
 * Lesson 1 is unlocked by default; each next lesson unlocks when the
 * previous is completed (build accepted). Sandbox unlocks after lesson 3.
 */

export interface ReadPage {
  heading: string;
  body: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface TargetBlock {
  type: BlockType;
  /** Position in the lesson's local frame (origin at center, y>=0). */
  position: Vec3;
}

export interface Lesson {
  id: string;
  title: string;
  blurb: string;
  pages: ReadPage[];
  quiz: QuizQuestion[];
  target: TargetBlock[];
  /** One-line task description shown next to the blueprint. */
  challenge: string;
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'wallets',
    title: 'Wallets',
    blurb: 'The keychain that proves you are you.',
    pages: [
      {
        heading: 'A wallet is a keychain',
        body:
          "A wallet does NOT actually hold coins. It holds a tiny secret code called a private key. That key is what proves you control your address. Lose the key, lose the money. Keep it safe.",
      },
      {
        heading: 'Public and private',
        body:
          "Every wallet has TWO keys. The public key (or address) is like your email — you can share it. The private key is like your password — you keep it secret. Anything signed with your private key can be checked with your public key. That's the magic.",
      },
    ],
    quiz: [
      {
        prompt: 'What does a wallet actually hold?',
        options: ['Cryptocurrency coins', 'Your keys', 'Your password', 'A list of your friends'],
        correctIndex: 1,
      },
      {
        prompt: 'Which key do you share with people who pay you?',
        options: ['Your private key', 'Your public key (address)', 'Both keys', 'Neither'],
        correctIndex: 1,
      },
    ],
    challenge: 'Build a keychain — 3 wallets in a row.',
    target: [
      { type: 'wallet_keystone', position: [-1, 0, 0] },
      { type: 'wallet_keystone', position: [0, 0, 0] },
      { type: 'wallet_keystone', position: [1, 0, 0] },
    ],
  },

  {
    id: 'tokens',
    title: 'Tokens',
    blurb: 'Programmable units of value.',
    pages: [
      {
        heading: 'Tokens are numbers',
        body:
          "A token is a programmable unit of value living on a chain. It can be money, a game item, a ticket, or a share. The chain just keeps score of who owns how many.",
      },
      {
        heading: 'Sending a token',
        body:
          "When you 'send' a token, no physical thing moves. The chain just updates a ledger: 'A goes down by 5, B goes up by 5.' That ledger is public and locked in forever. No bank involved.",
      },
    ],
    quiz: [
      {
        prompt: 'When you send 5 tokens to a friend, what actually moves?',
        options: [
          'A physical coin travels on the network',
          'Nothing — the ledger just updates two rows',
          'The token is teleported',
          'Your wallet flies across the internet',
        ],
        correctIndex: 1,
      },
      {
        prompt: 'Who keeps the official record of who owns how many tokens?',
        options: ['A bank', 'The chain itself', 'A trusted person', 'Nobody'],
        correctIndex: 1,
      },
    ],
    challenge: 'Two wallets, one token bridge — token flows between them.',
    target: [
      { type: 'wallet_keystone', position: [-2, 0, 0] },
      { type: 'token_prism', position: [-1, 0, 0] },
      { type: 'token_prism', position: [0, 0, 0] },
      { type: 'token_prism', position: [1, 0, 0] },
      { type: 'wallet_keystone', position: [2, 0, 0] },
    ],
  },

  {
    id: 'smart-contracts',
    title: 'Smart Contracts',
    blurb: 'Code that runs on the chain.',
    pages: [
      {
        heading: "It's just code",
        body:
          "A smart contract is a small program parked on the chain. Send it a transaction and it runs — the same way for everyone, every time. No one can change the rules halfway.",
      },
      {
        heading: 'Holding value',
        body:
          "Smart contracts can hold tokens. They can lend them, swap them, lock them, give them back when conditions are met. That's how DeFi, NFTs, and on-chain games work — programs holding the bag.",
      },
    ],
    quiz: [
      {
        prompt: 'What is a smart contract?',
        options: [
          'A legal document signed by both parties',
          'A program that lives on the chain and runs when called',
          'An AI agent',
          "A type of NFT",
        ],
        correctIndex: 1,
      },
      {
        prompt: "Can a smart contract's rules be changed after deployment?",
        options: [
          'Yes, anytime by the owner',
          'No — the code is what runs, every time',
          'Only on Tuesdays',
          'Only if the user pays a fee',
        ],
        correctIndex: 1,
      },
    ],
    challenge: 'A contract holding two tokens — code in the middle, value on the sides.',
    target: [
      { type: 'token_prism', position: [-1, 0, 0] },
      { type: 'contract_obelisk', position: [0, 0, 0] },
      { type: 'token_prism', position: [1, 0, 0] },
    ],
  },

  {
    id: 'validators',
    title: 'Validators',
    blurb: 'Who keeps the chain honest.',
    pages: [
      {
        heading: 'Skin in the game',
        body:
          'Validators are the network watchdogs. They lock up money as a deposit (called staking), then take turns proposing new blocks. Play fair and earn rewards. Cheat and lose your stake.',
      },
      {
        heading: 'Governance lives here',
        body:
          'Many networks let validators (and token holders) vote on upgrades. A vote weighted by stake decides the future of the chain. The same group that secures the network also decides where it goes.',
      },
    ],
    quiz: [
      {
        prompt: 'What happens to a validator that tries to cheat?',
        options: [
          'They get a warning',
          'They lose part of their stake',
          'Their account is frozen',
          'Nothing — there are no consequences',
        ],
        correctIndex: 1,
      },
      {
        prompt: 'Who decides on big upgrades to a proof-of-stake chain?',
        options: [
          'A single CEO',
          'Stakers and validators voting',
          'Random users',
          'The chain decides automatically',
        ],
        correctIndex: 1,
      },
    ],
    challenge: 'Two security bunkers flanking a governance pillar.',
    target: [
      { type: 'security_bunker', position: [-1, 0, 0] },
      { type: 'governance_marble', position: [0, 0, 0] },
      { type: 'governance_marble', position: [0, 1, 0] },
      { type: 'security_bunker', position: [1, 0, 0] },
    ],
  },

  {
    id: 'zk',
    title: 'Zero Knowledge',
    blurb: 'Prove a fact without revealing it.',
    pages: [
      {
        heading: 'Math that hides',
        body:
          'A zero-knowledge proof lets you prove something is true WITHOUT showing the data behind it. Like proving you know a password without typing it. Or proving you are over 18 without showing your ID.',
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
          'Nothing besides that the claim is true',
          'Half the data',
          "Only the person's name",
        ],
        correctIndex: 1,
      },
      {
        prompt: 'A real-world use of ZK is...',
        options: [
          'Proving age without showing ID',
          'Sharing your full medical record publicly',
          'Posting your password to the chain',
          'Sending a normal email',
        ],
        correctIndex: 0,
      },
    ],
    challenge: 'A ZK crystal verifying two data cores.',
    target: [
      { type: 'data_core', position: [-1, 0, 0] },
      { type: 'zk_crystal', position: [0, 0, 0] },
      { type: 'zk_crystal', position: [0, 1, 0] },
      { type: 'data_core', position: [1, 0, 0] },
    ],
  },

  {
    id: 'defi',
    title: 'DeFi',
    blurb: 'Banking without the bank.',
    pages: [
      {
        heading: 'A bank made of code',
        body:
          'DeFi (Decentralized Finance) is when banks are replaced by smart contracts. Lending, borrowing, swapping, saving — all done by code that anyone can use, no signup required.',
      },
      {
        heading: 'Vaults and pools',
        body:
          'A DeFi vault holds tokens from many users. The contract decides how to use them — earn interest, swap for other tokens, lend to borrowers. You can pull your share out anytime (usually). The contract is the bank.',
      },
    ],
    quiz: [
      {
        prompt: 'What replaces the bank in DeFi?',
        options: ['A government', 'A smart contract', 'A celebrity', 'A telephone hotline'],
        correctIndex: 1,
      },
      {
        prompt: "What's typically inside a DeFi vault?",
        options: [
          'Physical gold',
          "A pile of tokens managed by code",
          'A list of bank customers',
          'Smart contracts only, no tokens',
        ],
        correctIndex: 1,
      },
    ],
    challenge: 'A DeFi vault flanked by tokens, with a contract overseeing.',
    target: [
      { type: 'token_prism', position: [-1, 0, 0] },
      { type: 'defi_vault', position: [0, 0, 0] },
      { type: 'token_prism', position: [1, 0, 0] },
      { type: 'contract_obelisk', position: [0, 1, 0] },
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

/** Sandbox unlocks after this many lessons are completed. */
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
