import { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
import type { BadgeRef, QuestId } from '@/types';
import { buildBadgeMintTx } from './badge';
import {
  BADGE_CONFIGURED,
  SPONSOR_CONFIGURED,
  SPONSOR_URL,
} from './config';

/**
 * Mints the quest-completion badge through a sponsor service so the
 * user pays zero gas. Returns the resulting BadgeRef.
 *
 * Resolution order:
 *   1. If both sponsor and badge package are configured, do the real
 *      two-step (sponsor → user signs → execute).
 *   2. Otherwise mock the mint locally so the UX still flows.
 *
 * `signPersonal` is the dapp-kit signer adapted to take raw tx bytes.
 * Quest components pass `useSignTransaction().mutateAsync` already
 * bound; this module stays free of React.
 */
export async function mintSponsoredBadge(opts: {
  client: SuiClient;
  recipient: string;
  questId: QuestId;
  signTxBytes: (txBytes: Uint8Array) => Promise<{ signature: string }>;
}): Promise<BadgeRef> {
  const { recipient, questId, signTxBytes, client } = opts;

  if (!SPONSOR_CONFIGURED || !BADGE_CONFIGURED) {
    return mockSponsoredBadge(questId, recipient);
  }

  const tx = buildBadgeMintTx({ recipient, questId });
  tx.setSender(recipient);
  const kindBytes = await tx.build({ client, onlyTransactionKind: true });

  // Step 1: sponsor signs the gas object and returns wire-ready txBytes.
  const sponsorResp = await fetch(`${SPONSOR_URL}/sponsor`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: recipient,
      txKindBytes: bytesToB64(kindBytes),
    }),
  });
  if (!sponsorResp.ok) {
    throw new Error(`sponsor returned ${sponsorResp.status}`);
  }
  const { txBytes, signature: sponsorSig } = (await sponsorResp.json()) as {
    txBytes: string;
    signature: string;
  };

  // Step 2: user signs the sponsored tx with their zkLogin / wallet key.
  const userTxBytes = b64ToBytes(txBytes);
  const { signature: userSig } = await signTxBytes(userTxBytes);

  // Step 3: submit both signatures to the sponsor's execute endpoint.
  const execResp = await fetch(`${SPONSOR_URL}/execute`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ txBytes, signatures: [userSig, sponsorSig] }),
  });
  if (!execResp.ok) {
    throw new Error(`sponsor execute returned ${execResp.status}`);
  }
  const { digest } = (await execResp.json()) as { digest: string };

  // Reuse the badge indexer from quest 1 to extract the BadgeRef.
  const { badgeFromTxResult } = await import('./badge');
  return badgeFromTxResult(client, digest, questId);
}

function mockSponsoredBadge(questId: QuestId, recipient: string): BadgeRef {
  const seed = `sponsored-${questId}-${recipient}-${Date.now()}`;
  return {
    objectId: `0xSPONSOR${hash(seed).slice(0, 56).padEnd(56, '0')}`,
    questId,
    txDigest: `mock-sponsor-${hash(seed).slice(0, 32)}`,
    mintedAt: Date.now(),
  };
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16);
}

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return typeof btoa !== 'undefined' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
}

function b64ToBytes(b64: string): Uint8Array {
  const s = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

// Suppress unused-import warning when sponsor path is dead in this codepath.
export type { Transaction };
