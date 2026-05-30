import { clientFor, type Network } from '../sui-client.js';

interface Args {
  address: string;
  coin_type?: string;
  cursor?: string;
  limit: number;
  network: Network;
}

/**
 * List individual coin objects of one type held by an address. Unlike
 * sui_get_balance (which sums), this returns the concrete coin object ids
 * an agent needs to pass into a sui_move_call or split. Paginated.
 */
export async function suiGetCoins(raw: unknown): Promise<string> {
  const { address, coin_type, cursor, limit, network } = raw as Args;
  const client = clientFor(network);

  const res = await client.getCoins({
    owner: address,
    coinType: coin_type, // undefined → native 0x2::sui::SUI
    cursor: cursor ?? null,
    limit,
  });

  return JSON.stringify({
    address,
    network,
    coin_type: coin_type ?? '0x2::sui::SUI',
    count: res.data.length,
    has_next_page: res.hasNextPage,
    next_cursor: res.nextCursor ?? null,
    coins: res.data.map((c) => ({
      coin_object_id: c.coinObjectId,
      balance: c.balance,
      version: c.version,
      digest: c.digest,
    })),
  });
}
