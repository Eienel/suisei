import { Transaction } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';
import { buildToB64 } from '../tx.js';

interface Args {
  owner: string;
  agent: string;
  amount_mist: string;
  network: Network;
}

/**
 * Build (do not sign) a tx that funds an agent wallet: split `amount_mist`
 * from the owner's gas coin and send it to the agent address. The owner
 * signs this (a real wallet / connected signer); the agent never touches
 * the owner's key.
 *
 * This is the "allowance" in the Tier-1 agent wallet: the agent's spending
 * power is bounded by whatever the owner funds here. Top up by funding
 * again; cut the agent off with agent_wallet_sweep.
 */
export async function agentWalletFund(raw: unknown): Promise<string> {
  const { owner, agent, amount_mist, network } = raw as Args;
  const client = clientFor(network);

  const tx = new Transaction();
  tx.setSender(owner);
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(amount_mist))]);
  tx.transferObjects([coin], tx.pure.address(agent));

  const tx_bytes_base64 = await buildToB64(tx, client);
  return JSON.stringify({
    tx_bytes_base64,
    owner,
    agent,
    amount_mist,
    network,
    next_step:
      'Owner signs and submits with sui_execute_signed_tx. After it lands, the agent wallet can spend up to its balance.',
  });
}
