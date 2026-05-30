import { Transaction } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';
import { buildToB64 } from '../tx.js';

interface Args {
  sender: string;
  recipient: string;
  amount_mist?: string;
  object_ids?: string[];
  network: Network;
}

/**
 * Build (do not sign) a transfer. Provide `amount_mist` to send SUI
 * (split from the gas coin) and/or `object_ids` to send whole objects.
 */
export async function suiTransfer(raw: unknown): Promise<string> {
  const { sender, recipient, amount_mist, object_ids, network } = raw as Args;
  if (!amount_mist && !(object_ids && object_ids.length > 0)) {
    throw new Error('Nothing to transfer: provide amount_mist and/or object_ids.');
  }

  const client = clientFor(network);
  const tx = new Transaction();
  tx.setSender(sender);

  if (amount_mist) {
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(amount_mist))]);
    tx.transferObjects([coin], tx.pure.address(recipient));
  }
  if (object_ids && object_ids.length > 0) {
    tx.transferObjects(
      object_ids.map((id) => tx.object(id)),
      tx.pure.address(recipient),
    );
  }

  const tx_bytes_base64 = await buildToB64(tx, client);
  return JSON.stringify({
    tx_bytes_base64,
    sender,
    recipient,
    amount_mist: amount_mist ?? null,
    object_ids: object_ids ?? [],
    network,
    next_step: 'Sign and submit with sui_execute_signed_tx.',
  });
}
