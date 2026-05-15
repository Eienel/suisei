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
}

export interface LeaderboardState {
  loading: boolean;
  error: string | null;
  rows: LeaderboardRow[];
}

/**
 * Builds a leaderboard from on-chain events. Every Save World emits a
 * WorldUpdated event with the new block_count + version. We dedupe by
 * world_id (keeping the highest-version row) and sort by block_count.
 *
 * For first-time mints we also read WorldMinted events — block_count
 * is carried there too.
 *
 * No wallet required.
 */
const PAGE = 100;

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

        // Pull recent mints + updates in parallel
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
        // also seed block_count=1's metadata from mints in case there are no updates
        const seedFromMint = new Map<string, { metadata: string; ts?: number }>();
        for (const e of mints.data) {
          const json = e.parsedJson as {
            world_id?: string; owner?: string; metadata_uri?: string;
          } | undefined;
          if (!json?.world_id || !json.owner) continue;
          if (!ownerOf.has(json.world_id)) ownerOf.set(json.world_id, json.owner);
          if (!seedFromMint.has(json.world_id)) {
            seedFromMint.set(json.world_id, {
              metadata: json.metadata_uri ?? '',
              ts: e.timestampMs ? Number(e.timestampMs) : undefined,
            });
          }
        }

        // Latest-version row per world_id (from updates)
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

        // Mints with no updates: seed a row with block_count not known on-chain,
        // but available from the mint payload if the contract emitted it.
        for (const [worldId, mintData] of seedFromMint.entries()) {
          if (latest.has(worldId)) continue;
          latest.set(worldId, {
            worldId,
            owner: ownerOf.get(worldId) ?? '',
            blockCount: 0,
            version: 1,
            metadataUri: mintData.metadata,
            updatedAt: mintData.ts,
          });
        }

        // Sort by blockCount desc, tiebreak by version
        const rows = Array.from(latest.values())
          .filter((r) => r.owner) // need an owner to link to
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
