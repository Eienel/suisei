import { clientFor, type Network } from '../sui-client.js';
import { findCoin } from '../coins.js';

interface Args {
  network: Network;
  coin_type?: string;
  symbol?: string;
}

/**
 * Live coin metadata: symbol, name, decimals, description, icon URL. Pass
 * coin_type (e.g. "0x2::sui::SUI") or symbol (e.g. "USDC"). With symbol,
 * the local registry resolves to a coin_type first - this works even when
 * the on-chain CoinMetadata is absent or slow.
 *
 * Decimals are critical for every DeFi flow: a "5 USDC" transfer is 5e6
 * smallest units (6 decimals), not 5e9.
 */
export async function suiGetCoinMetadata(raw: unknown): Promise<string> {
  const a = raw as Args;
  let coinType = a.coin_type;

  if (!coinType && a.symbol) {
    const known = findCoin(a.network, a.symbol);
    if (!known) {
      throw new Error(
        `Unknown symbol "${a.symbol}" on ${a.network}. Pass coin_type explicitly or use sui_resolve_coin.`,
      );
    }
    coinType = known.coin_type;
  }
  if (!coinType) throw new Error('Pass coin_type or symbol.');

  const client = clientFor(a.network);
  const meta = await client.getCoinMetadata({ coinType });
  const fromRegistry = findCoin(a.network, a.symbol ?? meta?.symbol ?? '');

  return JSON.stringify({
    network: a.network,
    coin_type: coinType,
    decimals: meta?.decimals ?? fromRegistry?.decimals ?? null,
    symbol: meta?.symbol ?? fromRegistry?.symbol ?? null,
    name: meta?.name ?? null,
    description: meta?.description ?? fromRegistry?.description ?? null,
    icon_url: meta?.iconUrl ?? null,
    note:
      'Multiply human amounts by 10^decimals to get smallest-unit values that every transfer / swap / stake tool expects.',
  });
}
