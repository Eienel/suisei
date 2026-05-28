import { clientFor, type Network } from '../sui-client.js';

interface Args {
  address: string;
  struct_type?: string;
  cursor?: string;
  limit: number;
  network: Network;
}

/**
 * List objects owned by an address, optionally filtered to one Move
 * struct type. Paginated: pass the returned `next_cursor` to continue.
 */
export async function suiGetOwnedObjects(raw: unknown): Promise<string> {
  const { address, struct_type, cursor, limit, network } = raw as Args;
  const client = clientFor(network);

  const res = await client.getOwnedObjects({
    owner: address,
    filter: struct_type ? { StructType: struct_type } : undefined,
    cursor: cursor ?? null,
    limit,
    options: { showType: true },
  });

  const objects = (res.data ?? []).map((o) => ({
    object_id: o.data?.objectId,
    type: o.data?.type,
    version: o.data?.version,
    digest: o.data?.digest,
  }));

  return JSON.stringify({
    address,
    network,
    struct_type: struct_type ?? null,
    count: objects.length,
    has_next_page: res.hasNextPage,
    next_cursor: res.nextCursor ?? null,
    objects,
  });
}
