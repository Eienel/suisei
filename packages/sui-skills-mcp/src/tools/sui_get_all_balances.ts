import { clientFor, type Network } from '../sui-client.js';

interface Args {
  address: string;
  network: Network;
}

/**
 * Every coin balance an address holds, not just SUI. Use this when the
 * wallet might own tokens beyond the native coin.
 */
export async function suiGetAllBalances(raw: unknown): Promise<string> {
  const { address, network } = raw as Args;
  const client = clientFor(network);
  const balances = await client.getAllBalances({ owner: address });

  return JSON.stringify({
    address,
    network,
    count: balances.length,
    balances: balances.map((b) => ({
      coin_type: b.coinType,
      total_mist: b.totalBalance,
      coin_object_count: b.coinObjectCount,
    })),
  });
}
