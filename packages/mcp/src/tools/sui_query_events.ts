import { clientFor, type Network } from '../sui-client.js';

interface Args {
  network: Network;
  // exactly one of these three filter selectors is required (validated at runtime)
  package?: string;
  module?: string;
  event_type?: string;
  sender?: string;
  transaction?: string;
  cursor_tx_digest?: string;
  cursor_event_seq?: string;
  limit?: number;
  descending?: boolean;
}

/**
 * Query historical events. Powers reactive agents: react to swaps on a
 * pool, badge mints, NFT transfers - anything that emits a Move event.
 * Filter by full event_type, by Move module (package + module - both
 * required together), by sender, or by transaction. Paginated; pass back
 * next_cursor_* to continue.
 *
 * Sui's event index requires at least one filter; an unfiltered scan
 * would return the whole chain. Package-only filtering is not supported
 * by the fullnode - pair package with module.
 */
export async function suiQueryEvents(raw: unknown): Promise<string> {
  const a = raw as Args;
  const client = clientFor(a.network);

  // Build the EventFilter discriminated union the SDK expects.
  let query: Record<string, unknown>;
  if (a.event_type) query = { MoveEventType: a.event_type };
  else if (a.module && a.package) query = { MoveModule: { package: a.package, module: a.module } };
  else if (a.sender) query = { Sender: a.sender };
  else if (a.transaction) query = { Transaction: a.transaction };
  else if (a.package && !a.module) {
    throw new Error(
      'package alone is not a supported event filter. Pass module too (MoveModule = package + module), or use event_type / sender / transaction.',
    );
  } else {
    throw new Error(
      'Pass at least one filter: event_type, package+module, sender, or transaction.',
    );
  }

  const cursor =
    a.cursor_tx_digest && a.cursor_event_seq
      ? { txDigest: a.cursor_tx_digest, eventSeq: a.cursor_event_seq }
      : null;

  const res = await client.queryEvents({
    query: query as Parameters<typeof client.queryEvents>[0]['query'],
    cursor,
    limit: a.limit,
    order: a.descending === false ? 'ascending' : 'descending',
  });

  return JSON.stringify({
    network: a.network,
    count: res.data.length,
    has_next_page: res.hasNextPage,
    next_cursor_tx_digest: res.nextCursor?.txDigest ?? null,
    next_cursor_event_seq: res.nextCursor?.eventSeq ?? null,
    events: res.data.map((e) => ({
      tx_digest: e.id.txDigest,
      event_seq: e.id.eventSeq,
      type: e.type,
      package: e.packageId,
      module: e.transactionModule,
      sender: e.sender,
      timestamp_ms: e.timestampMs,
      parsed_json: e.parsedJson,
    })),
  });
}
