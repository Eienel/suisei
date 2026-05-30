import { clientFor, type Network } from '../sui-client.js';

interface Args {
  agent: string;
  network: Network;
}

/**
 * Read an agent wallet's spendable state: native SUI balance and how many
 * coin objects back it. Read-only. Use before asking the agent to spend,
 * to confirm the allowance is funded and isn't empty.
 */
export async function agentWalletStatus(raw: unknown): Promise<string> {
  const { agent, network } = raw as Args;
  const client = clientFor(network);
  const balance = await client.getBalance({ owner: agent });
  const mist = BigInt(balance.totalBalance);

  return JSON.stringify({
    agent,
    network,
    balance_mist: balance.totalBalance,
    balance_sui: Number(mist) / 1e9,
    coin_object_count: balance.coinObjectCount,
    funded: mist > 0n,
    note: 'Fund with agent_wallet_fund (owner-signed); drain with agent_wallet_sweep.',
  });
}
