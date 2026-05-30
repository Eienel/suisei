import { Transaction } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';
import { buildToB64 } from '../tx.js';

interface Args {
  agent: string;
  owner: string;
  object_ids?: string[];
  network: Network;
}

/**
 * Build (do not sign) the agent-wallet kill switch: send the agent's
 * entire native SUI balance back to the owner. Transferring the gas coin
 * moves its leftover (the whole balance minus gas) to the owner, emptying
 * the wallet. Pass `object_ids` to also pull back specific non-SUI objects.
 *
 * The agent signs this with its own key (or the host signs on its behalf).
 * Sweeping is how an owner revokes a Tier-1 allowance wallet: drain it and
 * stop funding it.
 */
export async function agentWalletSweep(raw: unknown): Promise<string> {
  const { agent, owner, object_ids, network } = raw as Args;
  const client = clientFor(network);

  const tx = new Transaction();
  tx.setSender(agent);
  // Transferring the gas coin sends its remaining balance (after gas) to
  // the owner — i.e. sweeps all native SUI.
  const toMove = [tx.gas, ...(object_ids ?? []).map((id) => tx.object(id))];
  tx.transferObjects(toMove, tx.pure.address(owner));

  const tx_bytes_base64 = await buildToB64(tx, client);
  return JSON.stringify({
    tx_bytes_base64,
    agent,
    owner,
    object_ids: object_ids ?? [],
    network,
    note: 'Sweeps all native SUI (via the gas coin leftover) plus any object_ids back to the owner.',
    next_step: 'Sign with the agent key and submit with sui_execute_signed_tx.',
  });
}
