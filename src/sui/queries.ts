import type { SuiClient } from '@mysten/sui/client';
import type { BadgeRef, QuestId } from '@/types';
import { BADGE_PACKAGE_ID, BADGE_TYPE } from './config';

/**
 * Read every Suisei Badge object owned by `address`. Returns a list
 * shaped like the locally-persisted BadgeRef so callers can merge by
 * objectId without branching.
 *
 * Returns an empty array when the badge package isn't configured
 * (dev mode) so this can be called unconditionally.
 */
export async function fetchOwnedBadges(
  client: SuiClient,
  address: string,
): Promise<BadgeRef[]> {
  if (!BADGE_PACKAGE_ID) return [];

  const out: BadgeRef[] = [];
  let cursor: string | null | undefined = undefined;
  // The vast majority of users will own <50 badges, but page anyway.
  for (;;) {
    const page = await client.getOwnedObjects({
      owner: address,
      filter: { StructType: BADGE_TYPE },
      options: { showContent: true, showType: true, showPreviousTransaction: true },
      cursor: cursor ?? null,
    });
    for (const o of page.data ?? []) {
      const content = o.data?.content;
      const fields =
        content && content.dataType === 'moveObject'
          ? (content.fields as Record<string, unknown>)
          : null;
      const questId = bytesFieldToString(fields?.quest_id);
      const mintedAt = numberField(fields?.minted_at_ms);
      if (!o.data?.objectId || !questId) continue;
      out.push({
        objectId: o.data.objectId,
        questId: questId as QuestId,
        txDigest: o.data.previousTransaction ?? '',
        mintedAt: mintedAt ?? Date.now(),
      });
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}

function bytesFieldToString(field: unknown): string | undefined {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) {
    try {
      return new TextDecoder().decode(new Uint8Array(field as number[]));
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function numberField(field: unknown): number | undefined {
  if (typeof field === 'number') return field;
  if (typeof field === 'string') {
    const n = Number(field);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
