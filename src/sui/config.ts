/**
 * Sui / Walrus / Enoki config read from VITE_* env. All optional so
 * the app degrades gracefully when not yet provisioned.
 */
import { getFullnodeUrl } from '@mysten/sui/client';

type Network = 'testnet' | 'mainnet' | 'devnet';

const NETWORK = (import.meta.env.VITE_SUI_NETWORK ?? 'testnet') as Network;

export const SUI_NETWORK: Network = NETWORK;
export const SUI_RPC_URL = getFullnodeUrl(NETWORK);

/** Move package id with the `badge` module. Required for badge mints. */
export const BADGE_PACKAGE_ID =
  import.meta.env.VITE_BADGE_PACKAGE_ID ?? '';

/** Fully-qualified Badge struct type for owned-object queries. */
export const BADGE_TYPE = BADGE_PACKAGE_ID
  ? `${BADGE_PACKAGE_ID}::badge::Badge`
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

export const BADGE_CONFIGURED = !!BADGE_PACKAGE_ID;

/**
 * Sponsor service base URL. The sponsor signs the gas object so the
 * user pays zero. Without this, sponsored mints fall back to a local
 * mock so the demo still runs end-to-end.
 *
 * Expected shape (Enoki-style two-step):
 *   POST {SPONSOR_URL}/sponsor   { sender, txKindBytes } → { txBytes, signature }
 *   POST {SPONSOR_URL}/execute   { txBytes, signature }  → { digest }
 */
export const SPONSOR_URL = import.meta.env.VITE_SPONSOR_URL ?? '';
export const SPONSOR_CONFIGURED = !!SPONSOR_URL;

/**
 * DeepBook indexer (REST) for live orderbook reads. Defaults to the
 * public testnet indexer. Reading the book needs no funds or signing,
 * so Quest 8 can show real market state even for a fresh zkLogin
 * wallet. Order placement itself is simulated against this live data.
 */
export const DEEPBOOK_INDEXER_URL =
  import.meta.env.VITE_DEEPBOOK_INDEXER_URL ??
  (NETWORK === 'mainnet'
    ? 'https://deepbook-indexer.mainnet.mystenlabs.com'
    : 'https://deepbook-indexer.testnet.mystenlabs.com');

/** Pool name (indexer convention, e.g. "SUI_DBUSDC") for Quest 8. */
export const DEEPBOOK_POOL =
  import.meta.env.VITE_DEEPBOOK_POOL ??
  (NETWORK === 'mainnet' ? 'SUI_USDC' : 'SUI_DBUSDC');
