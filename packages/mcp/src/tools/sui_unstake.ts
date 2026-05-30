import { Transaction } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';
import { buildToB64 } from '../tx.js';

interface Args {
  sender: string;
  staked_sui_id: string;
  network: Network;
}

/**
 * Build (do not sign) a withdraw-stake transaction for a StakedSui
 * object. Returns principal plus earned rewards to the sender when the
 * host signs and submits.
 */
export async function suiUnstake(raw: unknown): Promise<string> {
  const { sender, staked_sui_id, network } = raw as Args;
  const client = clientFor(network);

  const tx = new Transaction();
  tx.setSender(sender);
  tx.moveCall({
    target: '0x3::sui_system::request_withdraw_stake',
    arguments: [tx.object('0x5'), tx.object(staked_sui_id)],
  });

  const tx_bytes_base64 = await buildToB64(tx, client);
  return JSON.stringify({
    tx_bytes_base64,
    sender,
    staked_sui_id,
    network,
    next_step: 'Sign and submit with sui_execute_signed_tx.',
  });
}
