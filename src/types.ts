/**
 * Domain types shared across Suisei.
 *
 * A quest is a 3-5 minute interactive lesson that teaches one Sui
 * primitive and ends with the user minting a soulbound badge.
 */

export type QuestId =
  | 'zklogin'
  | 'sponsored'
  | 'abilities'
  | 'capability'
  | 'soulbound'
  | 'ptb'
  | 'walrus_seal'
  | 'deepbook_grad';

export type QuestPhase =
  | 'intro'      // Suisei narrates the concept
  | 'scaffold'   // user reads / edits the Move code
  | 'deploy'    // compile + deploy in progress
  | 'interact' // user interacts with the deployed contract
  | 'badge'     // minting the soulbound completion badge
  | 'done';     // wrap-up + next-quest CTA

export interface QuestDef {
  id: QuestId;
  number: number;
  title: string;
  concept: string;
  /** One-line emotional hook for the quest tile. */
  hook: string;
  /** Approximate duration in minutes for the tile. */
  minutes: number;
  /** Bounty track this quest reinforces, for the pitch story. */
  bounty?: 'agentic' | 'walrus' | 'deepbook';
}

export interface BadgeRef {
  /** Soulbound NFT object id minted on completion. */
  objectId: string;
  /** Quest the badge proves completion of. */
  questId: QuestId;
  /** Tx digest for the mint, for the leaderboard + share card. */
  txDigest: string;
  /** Unix ms timestamp of the mint, for the leaderboard ordering. */
  mintedAt: number;
}
