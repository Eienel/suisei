import { useCallback, useState } from 'react';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';

/**
 * Native Sui staking — the bulletproof onchain backbone for the Bank
 * building. Calls `0x3::sui_system::request_add_stake`, which is part
 * of the Sui framework, so there's no third-party SDK that can break.
 *
 * The signed tx creates a `StakedSui` object the user owns immediately.
 * Real per-epoch rewards accrue on the validator's side; they're claimed
 * by unstaking (a follow-up flow we don't need for v1).
 */

const SUI_SYSTEM_STATE_OBJECT_ID = '0x5';
const STAKE_TARGET = '0x3::sui_system::request_add_stake';
const MIN_STAKE_MIST = 1_000_000_000n; // 1 SUI — protocol minimum

export type StakePhase = 'idle' | 'signing' | 'success' | 'error';

export interface ValidatorOption {
  address: string;
  name: string;
  /** Total stake in MIST (string to dodge JS bigint serialisation). */
  totalStake: string;
}

/** Active validators on the current network, sorted by stake (largest first). */
export function useValidators() {
  const client = useSuiClient();
  return useQuery<ValidatorOption[]>({
    queryKey: ['sui-validators'],
    staleTime: 60_000,
    queryFn: async () => {
      const state = await client.getLatestSuiSystemState();
      const all = state.activeValidators.map((v) => ({
        address: v.suiAddress,
        name: v.name,
        totalStake: v.stakingPoolSuiBalance,
      }));
      // Largest stake first — most reliable validators in front.
      all.sort((a, b) => (BigInt(b.totalStake) > BigInt(a.totalStake) ? 1 : -1));
      return all;
    },
  });
}

interface StakeArgs {
  /** Validator address; if omitted, the top-staked active validator is used. */
  validatorAddress?: string;
  /** Amount in MIST (default: 1 SUI, the protocol minimum). */
  amountMist?: bigint;
}

interface StakeResult {
  phase: StakePhase;
  error: string | null;
  txDigest: string | null;
  /** ObjectId of the created `StakedSui` object, if we can extract it. */
  stakedSuiId: string | null;
  stake: (args?: StakeArgs) => Promise<void>;
  reset: () => void;
  canStake: boolean;
}

export function useStake(): StakeResult {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { data: validators } = useValidators();

  const [phase, setPhase] = useState<StakePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [stakedSuiId, setStakedSuiId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setError(null);
    setTxDigest(null);
    setStakedSuiId(null);
  }, []);

  const stake = useCallback(
    async (args: StakeArgs = {}) => {
      if (!account?.address) {
        setPhase('error');
        setError('Connect a wallet first');
        return;
      }
      const validator = args.validatorAddress ?? validators?.[0]?.address;
      if (!validator) {
        setPhase('error');
        setError('No validators available yet — retry in a moment');
        return;
      }
      const amount = args.amountMist ?? MIN_STAKE_MIST;
      if (amount < MIN_STAKE_MIST) {
        setPhase('error');
        setError(`Minimum stake is 1 SUI (${MIN_STAKE_MIST.toString()} MIST)`);
        return;
      }

      setPhase('signing');
      setError(null);

      try {
        const tx = new Transaction();
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
        tx.moveCall({
          target: STAKE_TARGET,
          arguments: [
            tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
            coin,
            tx.pure.address(validator),
          ],
        });

        const result = await signAndExecute({ transaction: tx as never });
        setTxDigest(result.digest);

        // Find the newly-created StakedSui object in the tx effects.
        // dapp-kit's signAndExecute returns digest + rawEffects but not
        // parsed objectChanges, so we re-fetch with the option set.
        try {
          const full = await client.getTransactionBlock({
            digest: result.digest,
            options: { showObjectChanges: true },
          });
          const created = full.objectChanges?.find(
            (c) => c.type === 'created' && /::staking_pool::StakedSui$/.test(c.objectType),
          );
          if (created && 'objectId' in created) setStakedSuiId(created.objectId);
        } catch {
          // Non-fatal — digest is enough proof for the UI.
        }

        setPhase('success');
      } catch (err) {
        setPhase('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [account?.address, client, signAndExecute, validators],
  );

  return {
    phase,
    error,
    txDigest,
    stakedSuiId,
    stake,
    reset,
    canStake: !!account?.address && !!validators?.length,
  };
}
