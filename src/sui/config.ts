/**
 * Sui / Walrus / Enoki config read from VITE_* env. All optional so
 * the app degrades gracefully when not yet provisioned.
 */
import { getFullnodeUrl } from '@mysten/sui/client';

type Network = 'testnet' | 'mainnet' | 'devnet';

const NETWORK = (import.meta.env.VITE_SUI_NETWORK ?? 'testnet') as Network;

export const SUI_NETWORK: Network = NETWORK;
export const SUI_RPC_URL = getFullnodeUrl(NETWORK);

/** Move package id with the `world` module. Required for save-world. */
export const WORLD_PACKAGE_ID =
  import.meta.env.VITE_WORLD_NFT_PACKAGE_ID ?? '';

/** Fully-qualified World struct type for queries / type filters. */
export const WORLD_TYPE = WORLD_PACKAGE_ID
  ? `${WORLD_PACKAGE_ID}::world::World`
  : '';

/** Public Walrus testnet endpoints. Override via env if needed. */
export const WALRUS_PUBLISHER =
  import.meta.env.VITE_WALRUS_PUBLISHER_URL ??
  'https://publisher.walrus-testnet.walrus.space';

export const WALRUS_AGGREGATOR =
  import.meta.env.VITE_WALRUS_AGGREGATOR_URL ??
  'https://aggregator.walrus-testnet.walrus.space';

/** Enoki — optional. If missing, the Google sign-in button hides itself. */
export const ENOKI_API_KEY = import.meta.env.VITE_ENOKI_API_KEY ?? '';
export const ENOKI_GOOGLE_CLIENT_ID =
  import.meta.env.VITE_ENOKI_GOOGLE_CLIENT_ID ?? '';
export const ENOKI_CONFIGURED = !!(ENOKI_API_KEY && ENOKI_GOOGLE_CLIENT_ID);

export const PACKAGE_CONFIGURED = !!WORLD_PACKAGE_ID;
