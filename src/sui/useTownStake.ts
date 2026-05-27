import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';

/**
 * Live total stake a wallet owns on the current Sui network. Sums the
 * principal of every `0x3::staking_pool::StakedSui` object the address
 * holds. This is the "Town Value" we display in the sandbox HUD — every
 * Bank you move into your town is backed by one of these objects.
 *
 * Rewards accrue per-epoch on Sui (≈ 24h on testnet) so we don't try to
 * surface a ticking yield counter; the principal is the honest number to
 * show without lying about how fast yield grows.
 */

const STAKED_SUI_TYPE = '0x3::staking_pool::StakedSui';

interface StakeSummary {
  totalMist: bigint;
  count: number;
  /** Most recent activation epoch (for "earning since epoch X" copy). */
  latestActivationEpoch: number | null;
}

export function useTownStake() {
  const account = useCurrentAccount();
  const client = useSuiClient();

  return useQuery<StakeSummary>({
    queryKey: ['town-stake', account?.address ?? null],
    enabled: !!account?.address,
    staleTime: 30_000,
    queryFn: async () => {
      if (!account?.address) return { totalMist: 0n, count: 0, latestActivationEpoch: null };

      let totalMist = 0n;
      let count = 0;
      let latestActivationEpoch: number | null = null;
      let cursor: string | null | undefined = null;

      do {
        const page = await client.getOwnedObjects({
          owner: account.address,
          filter: { StructType: STAKED_SUI_TYPE },
          options: { showContent: true },
          cursor: cursor ?? undefined,
        });
        for (const o of page.data) {
          const c = o.data?.content;
          if (c && 'fields' in c) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const f = (c as any).fields as { principal?: string; stake_activation_epoch?: string };
            if (f?.principal) totalMist += BigInt(f.principal);
            const ep = f?.stake_activation_epoch ? Number(f.stake_activation_epoch) : null;
            if (ep !== null && (latestActivationEpoch === null || ep > latestActivationEpoch)) {
              latestActivationEpoch = ep;
            }
            count += 1;
          }
        }
        cursor = page.hasNextPage ? page.nextCursor : null;
      } while (cursor);

      return { totalMist, count, latestActivationEpoch };
    },
  });
}

/** Formats MIST as a short, human-friendly SUI string (e.g. "1.50 SUI"). */
export function formatSui(mist: bigint): string {
  if (mist === 0n) return '0 SUI';
  // 1 SUI = 1e9 MIST. Render with 2 decimals, no trailing zeros bloat.
  const whole = mist / 1_000_000_000n;
  const frac = mist % 1_000_000_000n;
  const fracStr = (Number(frac) / 1_000_000_000).toFixed(2).slice(2); // "50"
  return `${whole}.${fracStr} SUI`;
}
