import { useEffect, useState } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { SUI_RPC_URL, WORLD_PACKAGE_ID } from './config';

export interface GalleryEntry {
  owner: string;
  worldId: string;
  metadataUri: string;
  /** Block timestamp, ms */
  mintedAt?: number;
}

export interface GalleryState {
  loading: boolean;
  error: string | null;
  worlds: GalleryEntry[];
}

const PAGE = 50;

/**
 * Lists recent World NFTs by querying our Move package's WorldMinted
 * events on Sui. Dedups by owner (keeps the latest mint per owner).
 *
 * No wallet required — this works for any anonymous visitor.
 */
export function useGallery(): GalleryState {
  const [state, setState] = useState<GalleryState>({
    loading: true,
    error: null,
    worlds: [],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!WORLD_PACKAGE_ID) {
        setState({ loading: false, error: 'Move package not configured', worlds: [] });
        return;
      }
      try {
        const client = new SuiClient({ url: SUI_RPC_URL });
        const res = await client.queryEvents({
          query: { MoveEventType: `${WORLD_PACKAGE_ID}::world::WorldMinted` },
          limit: PAGE,
          order: 'descending',
        });
        if (cancelled) return;

        const seenOwners = new Set<string>();
        const worlds: GalleryEntry[] = [];
        for (const e of res.data) {
          const json = e.parsedJson as
            | { world_id?: string; owner?: string; metadata_uri?: string }
            | undefined;
          if (!json?.owner || !json.world_id) continue;
          if (seenOwners.has(json.owner)) continue;
          seenOwners.add(json.owner);
          worlds.push({
            owner: json.owner,
            worldId: json.world_id,
            metadataUri: json.metadata_uri ?? '',
            mintedAt: e.timestampMs ? Number(e.timestampMs) : undefined,
          });
        }

        setState({ loading: false, error: null, worlds });
      } catch (err) {
        if (cancelled) return;
        setState({
          loading: false,
          error: err instanceof Error ? err.message : String(err),
          worlds: [],
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
