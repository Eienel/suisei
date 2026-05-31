import type { Network } from '../sui-client.js';
import { COINS, findCoin, knownSymbols } from '../coins.js';

interface Args {
  network: Network;
  symbol?: string;
}

/**
 * Resolve a coin symbol (e.g. "USDC", "DEEP", "SUI") to its fully-qualified
 * coin type on the chosen network. Without a symbol, lists every known
 * symbol - useful when the agent isn't sure what's available.
 *
 * This is the coin-side mirror of sui_resolve_address: stops the agent
 * from hallucinating coin types ("oh USDC must be 0x2::usdc::USDC right?").
 */
export async function suiResolveCoin(raw: unknown): Promise<string> {
  const { network, symbol } = raw as Args;
  if (!symbol) {
    const table = COINS[network] ?? {};
    return JSON.stringify({
      network,
      known_symbols: knownSymbols(network),
      coins: Object.values(table),
    });
  }
  const info = findCoin(network, symbol);
  if (!info) {
    throw new Error(
      `Unknown symbol "${symbol}" on ${network}. Known: ${knownSymbols(network).join(', ') || 'none'}. Pass the full coin_type to any tool to use a coin not in the registry.`,
    );
  }
  return JSON.stringify({ network, ...info });
}
