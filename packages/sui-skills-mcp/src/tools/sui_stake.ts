import { Transaction } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';
import { buildToB64 } from '../tx.js';

interface Args {
  sender: string;
  amount_mist: string;
  validator: string;
  network: Network;
}

/**
 * Build (do not sign) a native staking transaction: split `amount_mist`
 * from gas and delegate it to `validator` via 0x3::sui_system. The host
 * signs and submits; the resulting StakedSui object lands in the sender.
 */
export async function suiStake(raw: unknown): Promise<string> {
  const { sender, amount_mist, validator, network } = raw as Args;
  const client = clientFor(network);

  const tx = new Transaction();
  tx.setSender(sender);
  const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(amount_mist))]);
  tx.moveCall({
    target: '0x3::sui_system::request_add_stake',
    arguments: [tx.object('0x5'), stakeCoin, tx.pure.address(validator)],
  });

  const tx_bytes_base64 = await buildToB64(tx, client);
  return JSON.stringify({
    tx_bytes_base64,
    sender,
    amount_mist,
    validator,
    network,
    next_step: 'Sign and submit with sui_execute_signed_tx.',
  });
}
