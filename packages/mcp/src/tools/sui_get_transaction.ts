import { clientFor, type Network } from '../sui-client.js';

interface Args {
  digest: string;
  network: Network;
}

/**
 * Fetch a finalized transaction by digest: status, gas, balance changes,
 * and event count. Use to inspect the result of a tx submitted earlier
 * (the same digest sui_execute_signed_tx returns).
 */
export async function suiGetTransaction(raw: unknown): Promise<string> {
  const { digest, network } = raw as Args;
  const client = clientFor(network);

  const res = await client.getTransactionBlock({
    digest,
    options: { showEffects: true, showEvents: true, showBalanceChanges: true },
  });

  return JSON.stringify({
    digest: res.digest,
    network,
    status: res.effects?.status.status ?? 'unknown',
    error: res.effects?.status.error ?? null,
    timestamp_ms: res.timestampMs ?? null,
    checkpoint: res.checkpoint ?? null,
    gas_used: res.effects?.gasUsed ?? null,
    balance_changes: res.balanceChanges ?? [],
    events_count: res.events?.length ?? 0,
  });
}
