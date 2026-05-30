import { Transaction } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';
import { buildToB64 } from '../tx.js';

interface Args {
  sender: string;
  network: Network;
  recipients: string[];
  amounts_mist: string[];
}

/**
 * Build (do not sign) a many-to-many SUI payout in a single PTB: split N
 * coins out of gas and send each to its matching recipient. Powers
 * airdrops, payroll, batch refunds, splitter contracts.
 *
 * recipients and amounts_mist must be the same length and same order:
 * amounts_mist[i] goes to recipients[i]. Amounts are MIST strings to avoid
 * precision loss.
 */
export async function suiPayMany(raw: unknown): Promise<string> {
  const { sender, network, recipients, amounts_mist } = raw as Args;
  if (recipients.length === 0) throw new Error('recipients is empty.');
  if (recipients.length !== amounts_mist.length) {
    throw new Error(
      `recipients (${recipients.length}) and amounts_mist (${amounts_mist.length}) must be the same length.`,
    );
  }

  const tx = new Transaction();
  tx.setSender(sender);

  const splits = tx.splitCoins(
    tx.gas,
    amounts_mist.map((a) => tx.pure.u64(BigInt(a))),
  );
  // splitCoins returns an array of TransactionResult handles, one per amount.
  recipients.forEach((r, i) => {
    tx.transferObjects([splits[i]], tx.pure.address(r));
  });

  const client = clientFor(network);
  const tx_bytes_base64 = await buildToB64(tx, client);

  const total = amounts_mist.reduce((acc, x) => acc + BigInt(x), 0n).toString();
  return JSON.stringify({
    tx_bytes_base64,
    sender,
    network,
    payout_count: recipients.length,
    total_mist: total,
    total_sui: Number(BigInt(total)) / 1e9,
    next_step:
      'Dry-run with sui_dry_run, sign, and submit with sui_execute_signed_tx. All N payouts settle atomically — they all land or none do.',
  });
}
