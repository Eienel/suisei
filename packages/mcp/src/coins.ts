import type { Network } from './sui-client.js';

/**
 * Coin metadata registry — the "what is USDC's coin type" table. Static
 * because mainnet/testnet coin types are upgrade-stable; if Sui ever
 * redeploys one, override the type explicitly in any tool that takes
 * coin_type, or update this file. Decimals are cached here so an agent
 * can size amounts without an extra RPC call, but sui_get_coin_metadata
 * is the authoritative live lookup.
 */

export interface CoinInfo {
  symbol: string;
  coin_type: string;
  decimals: number;
  description?: string;
}

const SUI = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';

/** Common coins by symbol (case-insensitive lookup). */
export const COINS: Record<Network, Record<string, CoinInfo>> = {
  testnet: {
    SUI: { symbol: 'SUI', coin_type: SUI, decimals: 9, description: 'Native Sui coin.' },
    DBUSDC: {
      symbol: 'DBUSDC',
      coin_type:
        '0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC',
      decimals: 6,
      description: 'DeepBook test USDC (testnet).',
    },
    DEEP: {
      symbol: 'DEEP',
      coin_type:
        '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
      decimals: 6,
      description: 'DeepBook utility token (testnet).',
    },
  },
  mainnet: {
    SUI: { symbol: 'SUI', coin_type: SUI, decimals: 9, description: 'Native Sui coin.' },
    USDC: {
      symbol: 'USDC',
      coin_type:
        '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      decimals: 6,
      description: 'Native USDC on Sui (Circle).',
    },
    USDT: {
      symbol: 'USDT',
      coin_type:
        '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
      decimals: 6,
      description: 'Wormhole USDT (canonical bridged).',
    },
    DEEP: {
      symbol: 'DEEP',
      coin_type:
        '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
      decimals: 6,
      description: 'DeepBook utility token.',
    },
    WAL: {
      symbol: 'WAL',
      coin_type:
        '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',
      decimals: 9,
      description: 'Walrus native token.',
    },
  },
  devnet: {
    SUI: { symbol: 'SUI', coin_type: SUI, decimals: 9, description: 'Native Sui coin.' },
  },
};

/** Look up a coin by symbol on a network. Case-insensitive. */
export function findCoin(network: Network, symbol: string): CoinInfo | undefined {
  const table = COINS[network] ?? {};
  return table[symbol.toUpperCase()];
}

/** List known coin symbols for a network. */
export function knownSymbols(network: Network): string[] {
  return Object.keys(COINS[network] ?? {});
}
