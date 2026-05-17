import { useSuiClientQuery, useCurrentAccount } from '@mysten/dapp-kit';
import { WORLD_TYPE, PACKAGE_CONFIGURED } from './config';

export type WorldKind = 'sandbox' | 'lessons';

export interface UserWorld {
  objectId: string;
  name: string;
  metadataUri: string;
  version: number;
  blockCount: number;
  kind: WorldKind;
}

/** Name prefix convention so we can distinguish kinds without fetching the blob. */
export const SANDBOX_NAME_PREFIX = 'S:';
export const LESSONS_NAME_PREFIX = 'L:';

export function classifyByName(name: string): WorldKind {
  if (name.startsWith(LESSONS_NAME_PREFIX)) return 'lessons';
  return 'sandbox'; // default — pre-prefix worlds + everything else
}

export function stripKindPrefix(name: string): string {
  if (name.startsWith(SANDBOX_NAME_PREFIX)) return name.slice(SANDBOX_NAME_PREFIX.length);
  if (name.startsWith(LESSONS_NAME_PREFIX)) return name.slice(LESSONS_NAME_PREFIX.length);
  return name;
}

/**
 * Returns the connected wallet's World NFTs, split into sandbox vs
 * lessons. Each kind keeps the highest-version object found (in case
 * a user has multiple of one kind from past mints).
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
      limit: 25,
    },
    {
      enabled: !!address && PACKAGE_CONFIGURED,
    }
  );

  let sandbox: UserWorld | null = null;
  let lessons: UserWorld | null = null;

  for (const obj of query.data?.data ?? []) {
    if (obj.data?.content?.dataType !== 'moveObject') continue;
    const fields = (obj.data.content as { fields: Record<string, unknown> }).fields;
    const name = String(fields.name ?? '');
    const kind = classifyByName(name);
    const w: UserWorld = {
      objectId: obj.data.objectId,
      name,
      metadataUri: String(fields.metadata_uri ?? ''),
      version: Number(fields.version ?? 0),
      blockCount: Number(fields.block_count ?? 0),
      kind,
    };
    if (kind === 'sandbox') {
      if (!sandbox || w.version > sandbox.version) sandbox = w;
    } else {
      if (!lessons || w.version > lessons.version) lessons = w;
    }
  }

  return {
    sandbox,
    lessons,
    refetch: query.refetch,
    isLoading: query.isLoading,
  };
}
