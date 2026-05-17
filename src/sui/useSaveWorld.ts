import { create } from 'zustand';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useCallback } from 'react';
import { useWorld } from '@/state/world';
import { sfx } from '@/audio/sfx';
import {
  useUserWorld,
  SANDBOX_NAME_PREFIX,
  LESSONS_NAME_PREFIX,
} from './useUserWorld';
import { uploadBlob, jsonToBytes } from './walrus';
import { WORLD_PACKAGE_ID, PACKAGE_CONFIGURED } from './config';

export type SavePhase = 'idle' | 'uploading' | 'signing' | 'success' | 'error';

interface SaveStatus {
  phase: SavePhase;
  error: string | null;
  txDigest: string | null;
  blobId: string | null;
  kind: 'sandbox' | 'lessons' | null;
  set: (s: Partial<Omit<SaveStatus, 'set'>>) => void;
}

const useSaveStatus = create<SaveStatus>((set) => ({
  phase: 'idle',
  error: null,
  txDigest: null,
  blobId: null,
  kind: null,
  set: (s) => set(s),
}));

const enc = new TextEncoder();
function bytes(s: string): number[] {
  return Array.from(enc.encode(s));
}

/**
 * Orchestrates Save World for either NFT kind:
 *
 *   kind='sandbox' → user's creative land. Mint once, update on every
 *                    subsequent save. Anyone can visit.
 *   kind='lessons' → the commemorative town built from quiz answers.
 *                    Minted once when all lessons are done. Effectively
 *                    immutable (the player has nothing to update).
 *
 * The on-chain `name` carries a one-letter prefix ("S:" / "L:") so
 * useUserWorld can split kinds without fetching every Walrus blob.
 */
export function useSaveWorld() {
  const account = useCurrentAccount();
  const { sandbox, lessons, refetch } = useUserWorld();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const status = useSaveStatus();

  const save = useCallback(
    async ({
      worldName,
      kind = 'sandbox',
    }: { worldName?: string; kind?: 'sandbox' | 'lessons' } = {}) => {
      if (!PACKAGE_CONFIGURED) {
        status.set({ phase: 'error', error: 'Move package not configured', kind });
        return;
      }
      if (!account?.address) {
        status.set({ phase: 'error', error: 'Connect a wallet first', kind });
        return;
      }

      // Pull blocks from whichever world the snapshot maps to.
      const state = useWorld.getState();
      const blocks =
        kind === 'lessons' ? state.lessonBlocks : state.sandboxBlocks;

      if (blocks.length === 0) {
        status.set({ phase: 'error', error: 'Nothing to save — place some blocks first', kind });
        return;
      }

      try {
        status.set({
          phase: 'uploading',
          error: null,
          txDigest: null,
          blobId: null,
          kind,
        });

        const payload = { blocks, kind, version: 1, savedAt: Date.now() };
        const blob = await uploadBlob(jsonToBytes(payload));

        status.set({ phase: 'signing', blobId: blob.blobId });

        const existing = kind === 'lessons' ? lessons : sandbox;
        const tx = new Transaction();
        if (existing) {
          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::world::update_world`,
            arguments: [
              tx.object(existing.objectId),
              tx.pure.vector('u8', bytes(blob.uri)),
              tx.pure.u64(blocks.length),
            ],
          });
        } else {
          const prefix = kind === 'lessons' ? LESSONS_NAME_PREFIX : SANDBOX_NAME_PREFIX;
          const display = (worldName ?? (kind === 'lessons' ? 'Crypto 101' : 'My Land')).slice(0, 60);
          const name = `${prefix}${display}`;
          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::world::mint_world`,
            arguments: [
              tx.pure.vector('u8', bytes(name)),
              tx.pure.vector('u8', bytes(blob.uri)),
              tx.pure.u64(blocks.length),
            ],
          });
        }

        const result = await signAndExecute({ transaction: tx as never });
        sfx.sparkle();
        status.set({ phase: 'success', txDigest: result.digest });
        setTimeout(() => refetch(), 2000);
      } catch (err) {
        status.set({
          phase: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [account?.address, signAndExecute, sandbox, lessons, refetch, status]
  );

  return {
    ...status,
    save,
    canSave: !!account?.address && PACKAGE_CONFIGURED,
    hasSandbox: !!sandbox,
    hasLessons: !!lessons,
  };
}
