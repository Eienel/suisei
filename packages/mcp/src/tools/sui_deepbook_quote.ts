import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { clientFor, type Network } from '../sui-client.js';
import { DEEPBOOK_PACKAGE_ID, POOLS } from '../deepbook.js';

interface Args {
  network: Network;
  direction: 'base_to_quote' | 'quote_to_base';
  amount: string;
  pool?: string;
  pool_id?: string;
  base_type?: string;
  quote_type?: string;
  deepbook_package?: string;
  sender?: string;
}

/**
 * Read-only DeepBook v3 quote. Calls pool::get_quote_quantity_out (selling
 * base) or get_base_quantity_out (selling quote) via devInspect — no gas,
 * no signing, no funds. Returns the expected output and the DEEP fee
 * required, so an agent can size min_out for sui_deepbook_swap before
 * building the real transaction.
 *
 * All values are raw smallest-units (matching sui_deepbook_swap), so the
 * quote's expected_out can be fed straight into the swap's min_out (minus
 * whatever slippage the agent chooses).
 */
export async function suiDeepbookQuote(raw: unknown): Promise<string> {
  const a = raw as Args;
  const network = a.network;
  const pkg = a.deepbook_package ?? DEEPBOOK_PACKAGE_ID[network];
  if (!pkg) throw new Error(`No DeepBook package for ${network}; pass deepbook_package.`);

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
  const fn = baseToQuote ? 'get_quote_quantity_out' : 'get_base_quantity_out';

  const tx = new Transaction();
  // devInspect needs a sender; any address works for a read. Use 0x0.
  tx.setSender(a.sender ?? '0x0000000000000000000000000000000000000000000000000000000000000000');
  tx.moveCall({
    target: `${pkg}::pool::${fn}`,
    arguments: [tx.object(poolId), tx.pure.u64(BigInt(a.amount)), tx.object.clock()],
    typeArguments: [baseType, quoteType],
  });

  const client = clientFor(network);
  const res = await client.devInspectTransactionBlock({
    sender: a.sender ?? '0x0000000000000000000000000000000000000000000000000000000000000000',
    transactionBlock: tx,
  });

  const status = res.effects?.status?.status ?? 'unknown';
  if (status !== 'success') {
    throw new Error(`Quote inspect failed: ${res.effects?.status?.error ?? 'unknown error'}`);
  }
  const ret = res.results?.[0]?.returnValues;
  if (!ret || ret.length < 3) {
    throw new Error(`Unexpected quote result shape from ${fn}.`);
  }
  // Each returnValue is [bytes[], type]. Move returns (baseOut, quoteOut, deepRequired) as u64.
  const u64 = (i: number) => bcs.U64.parse(Uint8Array.from(ret[i][0])).toString();
  const baseOut = u64(0);
  const quoteOut = u64(1);
  const deepRequired = u64(2);
  const expectedOut = baseToQuote ? quoteOut : baseOut;

  return JSON.stringify({
    network,
    pool_id: poolId,
    base_type: baseType,
    quote_type: quoteType,
    direction: a.direction,
    amount_in: a.amount,
    expected_out: expectedOut,
    base_out: baseOut,
    quote_out: quoteOut,
    deep_required: deepRequired,
    next_step:
      'Use expected_out (minus your slippage) as min_out, and deep_required as deep_amount, in sui_deepbook_swap.',
  });
}
