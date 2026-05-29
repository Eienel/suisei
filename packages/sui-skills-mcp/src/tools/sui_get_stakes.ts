import { clientFor, type Network } from '../sui-client.js';

interface Args {
  address: string;
  network: Network;
}

const toSui = (mist: string | number | bigint) => Number(BigInt(mist)) / 1e9;

/**
 * List an address's active native stakes, grouped by validator. For each
 * StakedSui the chain returns the principal, the (estimated) rewards
 * accrued so far, and the activation epoch — everything a staking app
 * needs to show "you staked X, you've earned Y". Read-only: no gas, no
 * signing.
 *
 * Pair with sui_get_validators_apy to project forward returns, and
 * sui_unstake (which takes a staked_sui_id from here) to withdraw.
 */
export async function suiGetStakes(raw: unknown): Promise<string> {
  const { address, network } = raw as Args;
  const client = clientFor(network);
  const delegated = await client.getStakes({ owner: address });

  let totalPrincipalMist = 0n;
  let totalRewardMist = 0n;

  const validators = delegated.map((d) => {
    const stakes = d.stakes.map((s) => {
      const principal = BigInt(s.principal);
      const reward = BigInt('estimatedReward' in s && s.estimatedReward ? s.estimatedReward : '0');
      totalPrincipalMist += principal;
      totalRewardMist += reward;
      return {
        staked_sui_id: s.stakedSuiId,
        status: s.status,
        stake_active_epoch: s.stakeActiveEpoch,
        stake_request_epoch: s.stakeRequestEpoch,
        principal_mist: s.principal,
        principal_sui: toSui(s.principal),
        estimated_reward_mist:
          'estimatedReward' in s && s.estimatedReward ? s.estimatedReward : null,
        estimated_reward_sui:
          'estimatedReward' in s && s.estimatedReward ? toSui(s.estimatedReward) : null,
      };
    });
    return {
      validator_address: d.validatorAddress,
      staking_pool: d.stakingPool,
      stakes,
    };
  });

  return JSON.stringify({
    address,
    network,
    validator_count: validators.length,
    total_principal_mist: totalPrincipalMist.toString(),
    total_principal_sui: toSui(totalPrincipalMist),
    total_estimated_reward_mist: totalRewardMist.toString(),
    total_estimated_reward_sui: toSui(totalRewardMist),
    validators,
    note:
      'estimated_reward is only populated for stakes that are Active (rewards begin the epoch after activation). Use staked_sui_id with sui_unstake to withdraw.',
  });
}
