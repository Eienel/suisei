import { clientFor, type Network } from '../sui-client.js';

interface Args {
  parent_id: string;
  cursor?: string;
  limit?: number;
  network: Network;
}

/**
 * List the dynamic fields attached to a parent object - the way Sui
 * stores Tables, Bags, and other on-chain collections. Returns each
 * field's name, type, and the child object id. Paginated.
 */
export async function suiGetDynamicFields(raw: unknown): Promise<string> {
  const { parent_id, cursor, limit, network } = raw as Args;
  const client = clientFor(network);

  const res = await client.getDynamicFields({
    parentId: parent_id,
    cursor: cursor ?? null,
    limit,
  });

  return JSON.stringify({
    parent_id,
    network,
    count: res.data.length,
    has_next_page: res.hasNextPage,
    next_cursor: res.nextCursor ?? null,
    fields: res.data.map((f) => ({
      name: f.name,
      type: f.type,
      object_type: f.objectType,
      object_id: f.objectId,
      digest: f.digest,
    })),
  });
}
