import { useSuiClientQuery, useCurrentAccount } from '@mysten/dapp-kit';
import { WORLD_TYPE, PACKAGE_CONFIGURED } from './config';

export interface UserWorld {
  objectId: string;
  name: string;
  metadataUri: string;
  version: number;
  blockCount: number;
}

/**
 * Fetches the connected wallet's first World NFT (if any) by querying
 * owned objects filtered by the World struct type. Returns null while
 * disconnected or when no World has been minted yet.
 */
export function useUserWorld() {
  const account = useCurrentAccount();
  const address = account?.address;

  const query = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: address ?? '',
      filter: WORLD_TYPE ? { StructType: WORLD_TYPE } : undefined,
      options: { showContent: true, showType: true },
      limit: 5,
    },
    {
      enabled: !!address && PACKAGE_CONFIGURED,
    }
  );

  const first = query.data?.data?.[0];
  let world: UserWorld | null = null;
  if (first?.data?.content?.dataType === 'moveObject') {
    const fields = (first.data.content as { fields: Record<string, unknown> }).fields;
    world = {
      objectId: first.data.objectId,
      name: String(fields.name ?? ''),
      metadataUri: String(fields.metadata_uri ?? ''),
      version: Number(fields.version ?? 0),
      blockCount: Number(fields.block_count ?? 0),
    };
  }

  return {
    world,
    refetch: query.refetch,
    isLoading: query.isLoading,
  };
}
