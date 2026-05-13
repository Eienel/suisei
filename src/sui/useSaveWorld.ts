import { create } from 'zustand';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useCallback } from 'react';
import { useWorld } from '@/state/world';
import { useUserWorld } from './useUserWorld';
import { uploadBlob, jsonToBytes } from './walrus';
import { WORLD_PACKAGE_ID, PACKAGE_CONFIGURED } from './config';

export type SavePhase = 'idle' | 'uploading' | 'signing' | 'success' | 'error';

interface SaveStatus {
  phase: SavePhase;
  error: string | null;
  txDigest: string | null;
  blobId: string | null;
  set: (s: Partial<Omit<SaveStatus, 'set'>>) => void;
}

const useSaveStatus = create<SaveStatus>((set) => ({
  phase: 'idle',
  error: null,
  txDigest: null,
  blobId: null,
  set: (s) => set(s),
}));

const enc = new TextEncoder();
function bytes(s: string): number[] {
  return Array.from(enc.encode(s));
}

/**
 * Orchestrates "Save World":
 *  1. Serialize world state to JSON
 *  2. Upload to Walrus → get blobId / uri
 *  3. If user has no World NFT yet → moveCall mint_world(name, uri, count)
 *     else                        → moveCall update_world(world, uri, count)
 *  4. Sign + execute via the connected wallet (or Enoki zkLogin)
 */
export function useSaveWorld() {
  const account = useCurrentAccount();
  const { world: userWorld, refetch } = useUserWorld();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const status = useSaveStatus();

  const save = useCallback(
    async ({ worldName }: { worldName?: string }) => {
      if (!PACKAGE_CONFIGURED) {
        status.set({ phase: 'error', error: 'Move package not configured' });
        return;
      }
      if (!account?.address) {
        status.set({ phase: 'error', error: 'Connect a wallet first' });
        return;
      }

      const blocks = useWorld.getState().blocks;
      try {
        status.set({ phase: 'uploading', error: null, txDigest: null, blobId: null });

        const payload = { blocks, version: 1, savedAt: Date.now() };
        const blob = await uploadBlob(jsonToBytes(payload));

        status.set({ phase: 'signing', blobId: blob.blobId });

        const tx = new Transaction();
        if (userWorld) {
          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::world::update_world`,
            arguments: [
              tx.object(userWorld.objectId),
              tx.pure.vector('u8', bytes(blob.uri)),
              tx.pure.u64(blocks.length),
            ],
          });
        } else {
          const name = (worldName ?? 'My World').slice(0, 64);
          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::world::mint_world`,
            arguments: [
              tx.pure.vector('u8', bytes(name)),
              tx.pure.vector('u8', bytes(blob.uri)),
              tx.pure.u64(blocks.length),
            ],
          });
        }

        // dapp-kit and @mysten/sui resolve Transaction across nested
        // package copies; the runtime shape matches.
        const result = await signAndExecute({ transaction: tx as never });
        status.set({ phase: 'success', txDigest: result.digest });
        // Give Sui a beat then refetch so the next save updates rather than mints.
        setTimeout(() => refetch(), 2000);
      } catch (err) {
        status.set({
          phase: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [account?.address, signAndExecute, userWorld, refetch, status]
  );

  return {
    ...status,
    save,
    canSave: !!account?.address && PACKAGE_CONFIGURED,
    hasExisting: !!userWorld,
  };
}
