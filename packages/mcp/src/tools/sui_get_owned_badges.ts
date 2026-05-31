import { clientFor, type Network } from '../sui-client.js';

interface Args {
  address: string;
  badge_package?: string;
  network: Network;
}

/**
 * Canonical Suisei badge packages per network. Hardcode the published id
 * here after running scripts/publish-badge.sh so the tool works with no
 * arguments. Until then, callers can set the SUISEI_BADGE_PACKAGE env var
 * or pass `badge_package` explicitly.
 */
const DEFAULT_BADGE_PACKAGE: Partial<Record<Network, string>> = {
  // testnet: '0x...',  // paste published package id here
  // mainnet: '0x...',
};

export async function suiGetOwnedBadges(raw: unknown): Promise<string> {
  const { address, badge_package, network } = raw as Args;
  const pkg =
    badge_package ??
    process.env.SUISEI_BADGE_PACKAGE ??
    DEFAULT_BADGE_PACKAGE[network];
  if (!pkg) {
    throw new Error(
      `No badge package for ${network}. Set SUISEI_BADGE_PACKAGE, pass badge_package, or hardcode DEFAULT_BADGE_PACKAGE.`,
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
