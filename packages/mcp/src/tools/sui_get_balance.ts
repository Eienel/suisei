import { clientFor, type Network } from '../sui-client.js';

interface Args {
  address: string;
  network: Network;
}

export async function suiGetBalance(raw: unknown): Promise<string> {
  const { address, network } = raw as Args;
  const client = clientFor(network);
  const balance = await client.getBalance({ owner: address });
  const mist = BigInt(balance.totalBalance);
  const sui = Number(mist) / 1e9;
  return JSON.stringify({
    address,
    network,
    coin_type: balance.coinType,
    total_mist: balance.totalBalance,
    total_sui: sui,
    coin_object_count: balance.coinObjectCount,
  });
}
