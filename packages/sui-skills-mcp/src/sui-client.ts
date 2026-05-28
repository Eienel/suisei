import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export type Network = 'testnet' | 'mainnet' | 'devnet';

const cache = new Map<Network, SuiClient>();

export function clientFor(network: Network): SuiClient {
  let c = cache.get(network);
  if (!c) {
    c = new SuiClient({ url: getFullnodeUrl(network) });
    cache.set(network, c);
  }
  return c;
}
