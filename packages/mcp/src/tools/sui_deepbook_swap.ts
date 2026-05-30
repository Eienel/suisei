import { Transaction } from '@mysten/sui/transactions';
import { coinWithBalance } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';
import { buildToB64 } from '../tx.js';
import { DEEPBOOK_PACKAGE_ID, DEEP_TYPE, POOLS } from '../deepbook.js';

interface Args {
  sender: string;
  network: Network;
  direction: 'base_to_quote' | 'quote_to_base';
  amount: string;
  min_out: string;
  deep_amount: string;
  pool?: string;
  pool_id?: string;
  base_type?: string;
  quote_type?: string;
  deepbook_package?: string;
  deep_type?: string;
}

/**
 * Build (do not sign) a DeepBook v3 market swap. Mirrors the exact PTB the
 * official @mysten/deepbook-v3 SDK emits — pool::swap_exact_base_for_quote
 * / swap_exact_quote_for_base — but on @mysten/sui v1, so the toolkit
 * stays non-custodial and on its current SDK.
 *
 * Amounts are raw smallest-unit strings (like MIST): the caller handles
 * decimals and picks min_out for slippage. The swap returns three coins
 * (leftover base, output quote, leftover DEEP); we transfer all three back
 * to the sender so nothing is dropped.
 *
 * DeepBook charges fees in DEEP. Whitelisted pools take deep_amount "0";
 * others require the sender to hold DEEP (set deep_amount accordingly).
 */
export async function suiDeepbookSwap(raw: unknown): Promise<string> {
  const a = raw as Args;
  const network = a.network;
  const pkg = a.deepbook_package ?? DEEPBOOK_PACKAGE_ID[network];
  const deepType = a.deep_type ?? DEEP_TYPE[network];
  if (!pkg) throw new Error(`No DeepBook package for ${network}; pass deepbook_package.`);
  if (!deepType) throw new Error(`No DEEP coin type for ${network}; pass deep_type.`);

  // Resolve pool: explicit ids win, else look up the named pool.
  const known = a.pool ? POOLS[network]?.[a.pool] : undefined;
  const poolId = a.pool_id ?? known?.pool_id;
  const baseType = a.base_type ?? known?.base_type;
  const quoteType = a.quote_type ?? known?.quote_type;
  if (!poolId || !baseType || !quoteType) {
    throw new Error(
      `Unknown pool. Pass a known "pool" key for ${network} (${Object.keys(
        POOLS[network] ?? {},
      ).join(', ') || 'none'}) or pass pool_id + base_type + quote_type.`,
    );
  }

  const baseToQuote = a.direction === 'base_to_quote';
  const inputType = baseToQuote ? baseType : quoteType;
  const fn = baseToQuote ? 'swap_exact_base_for_quote' : 'swap_exact_quote_for_base';

  const tx = new Transaction();
  tx.setSender(a.sender);

  const inputCoin = coinWithBalance({ type: inputType, balance: BigInt(a.amount) });
  const deepCoin = coinWithBalance({ type: deepType, balance: BigInt(a.deep_amount) });

  const [baseOut, quoteOut, deepOut] = tx.moveCall({
    target: `${pkg}::pool::${fn}`,
    arguments: [
      tx.object(poolId),
      inputCoin,
      deepCoin,
      tx.pure.u64(BigInt(a.min_out)),
      tx.object.clock(),
    ],
    typeArguments: [baseType, quoteType],
  });
  tx.transferObjects([baseOut, quoteOut, deepOut], tx.pure.address(a.sender));

  const client = clientFor(network);
  const tx_bytes_base64 = await buildToB64(tx, client);
  return JSON.stringify({
    tx_bytes_base64,
    target: `${pkg}::pool::${fn}`,
    pool_id: poolId,
    base_type: baseType,
    quote_type: quoteType,
    direction: a.direction,
    amount: a.amount,
    min_out: a.min_out,
    deep_amount: a.deep_amount,
    network,
    next_step:
      'Dry-run with sui_dry_run to confirm output and gas, then sign and submit with sui_execute_signed_tx.',
  });
}
