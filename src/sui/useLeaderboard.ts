import { useEffect, useState } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { SUI_RPC_URL, WORLD_PACKAGE_ID } from './config';

export interface LeaderboardRow {
  owner: string;
  worldId: string;
  blockCount: number;
  version: number;
  metadataUri: string;
  /** Last update timestamp ms (so we can show recency). */
  updatedAt?: number;
  /** "L:..." or "S:..." or whatever the owner picked. */
  name?: string;
}

export interface LeaderboardState {
  loading: boolean;
  error: string | null;
  rows: LeaderboardRow[];
}

const PAGE = 100;

/**
 * Builds a leaderboard from on-chain events + object reads.
 *
 *  1. Pull recent WorldMinted + WorldUpdated events.
 *  2. Latest version per world_id wins (via WorldUpdated).
 *  3. For worlds that were minted but never updated, multiGetObjects
 *     fills in the current block_count + name (mint events don't
 *     carry block_count).
 *  4. Sort by block_count desc.
 *
 * No wallet required — public RPC reads.
 */
export function useLeaderboard(): LeaderboardState {
  const [state, setState] = useState<LeaderboardState>({
    loading: true,
    error: null,
    rows: [],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!WORLD_PACKAGE_ID) {
        setState({ loading: false, error: 'Move package not configured', rows: [] });
        return;
      }
      try {
        const client = new SuiClient({ url: SUI_RPC_URL });

        const [mints, updates] = await Promise.all([
          client.queryEvents({
            query: { MoveEventType: `${WORLD_PACKAGE_ID}::world::WorldMinted` },
            limit: PAGE,
            order: 'descending',
          }),
          client.queryEvents({
            query: { MoveEventType: `${WORLD_PACKAGE_ID}::world::WorldUpdated` },
            limit: PAGE,
            order: 'descending',
          }),
        ]);
        if (cancelled) return;

        // owner per world_id (from mints)
        const ownerOf = new Map<string, string>();
        const mintTimestamps = new Map<string, number>();
        for (const e of mints.data) {
          const json = e.parsedJson as { world_id?: string; owner?: string } | undefined;
          if (!json?.world_id || !json.owner) continue;
          if (!ownerOf.has(json.world_id)) ownerOf.set(json.world_id, json.owner);
          if (e.timestampMs && !mintTimestamps.has(json.world_id)) {
            mintTimestamps.set(json.world_id, Number(e.timestampMs));
          }
        }

        // Latest version per world_id from WorldUpdated
        const latest = new Map<string, LeaderboardRow>();
        for (const e of updates.data) {
          const json = e.parsedJson as {
            world_id?: string;
            version?: number | string;
            metadata_uri?: string;
            block_count?: number | string;
          } | undefined;
          if (!json?.world_id) continue;
          const version = Number(json.version ?? 0);
          const existing = latest.get(json.world_id);
          if (existing && existing.version >= version) continue;
          latest.set(json.world_id, {
            worldId: json.world_id,
            owner: ownerOf.get(json.world_id) ?? '',
            blockCount: Number(json.block_count ?? 0),
            version,
            metadataUri: String(json.metadata_uri ?? ''),
            updatedAt: e.timestampMs ? Number(e.timestampMs) : undefined,
          });
        }

        // For worlds that have a mint but no update events, fetch the
        // object directly to read its block_count + name. Batched
        // via multiGetObjects for efficiency.
        const needsFetch = Array.from(mintTimestamps.keys()).filter(
          (worldId) => !latest.has(worldId),
        );
        if (needsFetch.length > 0) {
          const fetched = await client.multiGetObjects({
            ids: needsFetch,
            options: { showContent: true },
          });
          for (const obj of fetched) {
            const id = obj.data?.objectId;
            if (!id) continue;
            if (obj.data?.content?.dataType !== 'moveObject') continue;
            const fields = (obj.data.content as { fields: Record<string, unknown> }).fields;
            latest.set(id, {
              worldId: id,
              owner: ownerOf.get(id) ?? '',
              blockCount: Number(fields.block_count ?? 0),
              version: Number(fields.version ?? 1),
              metadataUri: String(fields.metadata_uri ?? ''),
              name: String(fields.name ?? ''),
              updatedAt: mintTimestamps.get(id),
            });
          }
        }

        // Pull name onto rows from updates+fetched, where available
        const rows = Array.from(latest.values())
          .filter((r) => r.owner)
          .sort((a, b) =>
            b.blockCount === a.blockCount ? b.version - a.version : b.blockCount - a.blockCount,
          );

        setState({ loading: false, error: null, rows });
      } catch (err) {
        if (cancelled) return;
        setState({
          loading: false,
          error: err instanceof Error ? err.message : String(err),
          rows: [],
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
