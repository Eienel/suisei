import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import type { BadgeRef, QuestId } from '@/types';
import { questById } from '@/data/quests';
import { BADGE_PACKAGE_ID, BADGE_CONFIGURED } from './config';

/**
 * Build the `suisei::badge::mint` PTB. The clock object id is the
 * well-known `0x6` system clock; passing it lets the badge record
 * its mint timestamp on-chain (used by the leaderboard).
 */
export function buildBadgeMintTx(opts: {
  recipient: string;
  questId: QuestId;
}): Transaction {
  const quest = questById(opts.questId);
  if (!quest) throw new Error(`unknown quest: ${opts.questId}`);
  if (!BADGE_CONFIGURED) {
    throw new Error('Badge package not configured. Set VITE_BADGE_PACKAGE_ID.');
  }
  const tx = new Transaction();
  tx.moveCall({
    target: `${BADGE_PACKAGE_ID}::badge::mint`,
    arguments: [
      tx.pure.address(opts.recipient),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(opts.questId))),
      tx.pure.u8(quest.number),
      tx.object('0x6'),
    ],
  });
  return tx;
}

/**
 * Mocked mint for dev / demo without a deployed badge package. Returns
 * a plausible-looking BadgeRef so the UI can advance through the badge
 * phase. The leaderboard ignores entries with `mock-` prefixed digests.
 */
export function mockBadge(questId: QuestId, recipient: string): BadgeRef {
  const seed = `${questId}-${recipient}-${Date.now()}`;
  return {
    objectId: `0xMOCK${hash(seed).slice(0, 60).padEnd(60, '0')}`,
    questId,
    txDigest: `mock-${hash(seed).slice(0, 40)}`,
    mintedAt: Date.now(),
  };
}

/**
 * Read the mint result from a tx digest, returning the freshly-created
 * Badge's object id. Falls back to the first created object if the
 * type-tag match fails (older RPC versions return slightly different
 * shapes for `objectChanges`).
 */
export async function badgeFromTxResult(
  client: SuiClient,
  digest: string,
  questId: QuestId,
): Promise<BadgeRef> {
  const result = await client.waitForTransaction({
    digest,
    options: { showObjectChanges: true, showEffects: true },
  });
  const changes = result.objectChanges ?? [];
  const created = changes.find(
    (c) =>
      c.type === 'created' &&
      'objectType' in c &&
      typeof c.objectType === 'string' &&
      c.objectType.endsWith('::badge::Badge'),
  );
  if (!created || created.type !== 'created') {
    throw new Error('Mint succeeded but no Badge object found in changes');
  }
  return {
    objectId: created.objectId,
    questId,
    txDigest: digest,
    mintedAt: Date.now(),
  };
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16);
}
