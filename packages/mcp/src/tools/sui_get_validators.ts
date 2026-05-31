import { clientFor, type Network } from '../sui-client.js';

interface Args {
  network: Network;
  limit?: number;
}

const toSui = (mist: string | number | bigint) => Number(BigInt(mist)) / 1e9;

/**
 * The active validator set plus epoch context, from the Sui system state.
 * Read-only. Gives a staking app the human-readable name, the staking
 * address to pass to sui_stake, the commission rate (validators keep a cut
 * of rewards), and the total stake behind each validator. Combine with
 * sui_get_validators_apy (matched on validator_address) to render a full
 * "pick a validator" table: name + APY + commission + size.
 */
export async function suiGetValidators(raw: unknown): Promise<string> {
  const { network, limit } = raw as Args;
  const client = clientFor(network);
  const state = await client.getLatestSuiSystemState();

  let validators = state.activeValidators.map((v) => ({
    name: v.name,
    validator_address: v.suiAddress,
    description: v.description,
    image_url: v.imageUrl,
    project_url: v.projectUrl,
    commission_rate_bps: Number(v.commissionRate),
    commission_percent: Number(v.commissionRate) / 100,
    staking_pool_sui_balance_mist: v.stakingPoolSuiBalance,
    staking_pool_sui_balance_sui: toSui(v.stakingPoolSuiBalance),
    next_epoch_stake_mist: v.nextEpochStake,
    voting_power: Number(v.votingPower),
  }));

  // Largest first - a reasonable default for a validator picker.
  validators.sort(
    (a, b) =>
      Number(BigInt(b.staking_pool_sui_balance_mist) - BigInt(a.staking_pool_sui_balance_mist)),
  );
  if (typeof limit === 'number') {
    validators = validators.slice(0, limit);
  }

  return JSON.stringify({
    network,
    epoch: state.epoch,
    protocol_version: state.protocolVersion,
    epoch_start_timestamp_ms: state.epochStartTimestampMs,
    epoch_duration_ms: state.epochDurationMs,
    total_stake_mist: state.totalStake,
    total_stake_sui: toSui(state.totalStake),
    active_validator_count: state.activeValidators.length,
    validators,
    note: 'commission_rate_bps is in basis points (10000 = 100%). validator_address is what sui_stake expects. Match validator_address against sui_get_validators_apy for APY.',
  });
}
