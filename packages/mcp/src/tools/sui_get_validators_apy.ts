import { clientFor, type Network } from '../sui-client.js';

interface Args {
  network: Network;
  validator?: string;
  limit?: number;
  sort?: boolean;
}

/**
 * Current APY for every active validator, as the network computes it from
 * recent epoch rewards. Read-only. This is the APR/APY feed a staking app
 * shows to help a user pick a validator before sui_stake.
 *
 * Returns apy as a fraction (0.041 = 4.1%) plus apy_percent for display.
 * Pass `validator` to get a single one, `sort` to rank highest-first, and
 * `limit` to cap the list.
 */
export async function suiGetValidatorsApy(raw: unknown): Promise<string> {
  const { network, validator, limit, sort } = raw as Args;
  const client = clientFor(network);
  const { epoch, apys } = await client.getValidatorsApy();

  let rows = apys.map((a) => ({
    validator_address: a.address,
    apy: a.apy,
    apy_percent: Number((a.apy * 100).toFixed(4)),
  }));

  if (validator) {
    rows = rows.filter((r) => r.validator_address === validator);
  }
  if (sort) {
    rows.sort((x, y) => y.apy - x.apy);
  }
  if (typeof limit === 'number') {
    rows = rows.slice(0, limit);
  }

  return JSON.stringify({
    network,
    epoch,
    validator_count: rows.length,
    validators: rows,
    note: 'apy is a fraction (0.041 = 4.1%). Newly-onboarded validators may report apy 0 until they have reward history.',
  });
}
