import { clientFor, type Network } from '../sui-client.js';

interface Args {
  tx_bytes_base64: string;
  signatures: string[];
  network: Network;
}

/**
 * Submit a host-signed transaction. The toolkit never holds keys: the
 * caller signs the bytes from a tx-builder tool elsewhere and passes the
 * signature(s) here. Returns the digest and execution effects.
 */
export async function suiExecuteSignedTx(raw: unknown): Promise<string> {
  const { tx_bytes_base64, signatures, network } = raw as Args;
  const client = clientFor(network);

  const res = await client.executeTransactionBlock({
    transactionBlock: tx_bytes_base64,
    signature: signatures,
    options: { showEffects: true, showEvents: true, showBalanceChanges: true },
  });

  return JSON.stringify({
    network,
    digest: res.digest,
    status: res.effects?.status.status ?? 'unknown',
    error: res.effects?.status.error ?? null,
    gas_used: res.effects?.gasUsed ?? null,
    balance_changes: res.balanceChanges ?? [],
    events_count: res.events?.length ?? 0,
  });
}
