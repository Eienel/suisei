import { clientFor, type Network } from '../sui-client.js';

interface Args {
  validator_address: string;
  network: Network;
}

const toSui = (mist: string | number | bigint) => Number(BigInt(mist)) / 1e9;

/**
 * One validator's full picture, with APY merged: name, address, commission,
 * total stake, voting power, project URL — plus the live APY the chain
 * computes from recent epoch rewards. Fuses sui_get_validators and
 * sui_get_validators_apy into a single read so a staking app doesn't have
 * to join them by hand.
 */
export async function suiGetValidator(raw: unknown): Promise<string> {
  const { validator_address, network } = raw as Args;
  const client = clientFor(network);

  const [state, apys] = await Promise.all([
    client.getLatestSuiSystemState(),
    client.getValidatorsApy(),
  ]);

  const v = state.activeValidators.find((x) => x.suiAddress === validator_address);
  if (!v) {
    throw new Error(
      `Validator ${validator_address} not in the active set on ${network} (epoch ${state.epoch}). Use sui_get_validators to list.`,
    );
  }
  const apyRow = apys.apys.find((a) => a.address === validator_address);
  const apy = apyRow?.apy ?? null;

  return JSON.stringify({
    network,
    epoch: state.epoch,
    name: v.name,
    validator_address: v.suiAddress,
    description: v.description,
    image_url: v.imageUrl,
    project_url: v.projectUrl,
    commission_rate_bps: Number(v.commissionRate),
    commission_percent: Number(v.commissionRate) / 100,
    staking_pool_id: v.stakingPoolId,
    staking_pool_sui_balance_mist: v.stakingPoolSuiBalance,
    staking_pool_sui_balance_sui: toSui(v.stakingPoolSuiBalance),
    next_epoch_stake_mist: v.nextEpochStake,
    voting_power: Number(v.votingPower),
    apy,
    apy_percent: apy !== null ? Number((apy * 100).toFixed(4)) : null,
    note: 'apy is a fraction (0.041 = 4.1%); commission_rate_bps is basis points (10000 = 100%).',
  });
}
