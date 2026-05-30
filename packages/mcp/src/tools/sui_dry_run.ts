import { clientFor, type Network } from '../sui-client.js';
import { fromB64 } from '../tx.js';

interface Args {
  tx_bytes_base64: string;
  network: Network;
}

/**
 * Simulate a built (unsigned) transaction without spending gas. Returns
 * the execution status, gas cost, and balance/object changes so an agent
 * can verify a transaction before asking the host to sign it.
 */
export async function suiDryRun(raw: unknown): Promise<string> {
  const { tx_bytes_base64, network } = raw as Args;
  const client = clientFor(network);

  const res = await client.dryRunTransactionBlock({
    transactionBlock: fromB64(tx_bytes_base64),
  });

  return JSON.stringify({
    network,
    status: res.effects.status.status,
    error: res.effects.status.error ?? null,
    gas_used: res.effects.gasUsed,
    balance_changes: res.balanceChanges,
    object_changes_count: res.objectChanges?.length ?? 0,
    events_count: res.events?.length ?? 0,
  });
}
