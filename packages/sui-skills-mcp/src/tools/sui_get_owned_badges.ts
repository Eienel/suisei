import { clientFor, type Network } from '../sui-client.js';

interface Args {
  address: string;
  badge_package?: string;
  network: Network;
}

/**
 * Canonical Suisei badge packages per network. Populated as we publish
 * the badge module. Until then the user must pass `badge_package`.
 */
const DEFAULT_BADGE_PACKAGE: Partial<Record<Network, string>> = {
  // testnet: '0x…',  // filled in by Sprint 1 publish
  // mainnet: '0x…',  // filled in by Sprint 4 publish
};

export async function suiGetOwnedBadges(raw: unknown): Promise<string> {
  const { address, badge_package, network } = raw as Args;
  const pkg = badge_package ?? DEFAULT_BADGE_PACKAGE[network];
  if (!pkg) {
    throw new Error(
      `No badge_package configured for ${network}. Pass badge_package explicitly.`,
    );
  }

  const client = clientFor(network);
  const badgeType = `${pkg}::badge::Badge`;
  const owned = await client.getOwnedObjects({
    owner: address,
    filter: { StructType: badgeType },
    options: { showContent: true, showType: true },
  });

  const badges = (owned.data ?? [])
    .map((o) => {
      const content = o.data?.content;
      const fields =
        content && content.dataType === 'moveObject'
          ? (content.fields as Record<string, unknown>)
          : null;
      return {
        object_id: o.data?.objectId,
        type: o.data?.type,
        quest_id: bytesFieldToString(fields?.quest_id),
        quest_number: fields?.quest_number,
        minted_at_ms: fields?.minted_at_ms,
      };
    })
    .filter((b) => !!b.object_id);

  return JSON.stringify({
    address,
    badge_package: pkg,
    network,
    count: badges.length,
    badges,
  });
}

/** Move byte-vector fields come back as either string or number[]. Normalize. */
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
