import { type Network } from '../sui-client.js';
import { suiGetAllBalances } from './sui_get_all_balances.js';
import { suiGetStakes } from './sui_get_stakes.js';

interface Args {
  address: string;
  network: Network;
}

const SUI_TYPE = '0x2::sui::SUI';
const toSui = (mist: string | number | bigint) => Number(BigInt(mist)) / 1e9;

/**
 * One call, a wallet's whole financial picture: every coin balance plus
 * every active stake (principal + accrued rewards), with a single SUI-
 * exposure summary on top.
 *
 * The toolkit already exposes the parts (sui_get_all_balances,
 * sui_get_stakes); an agent had to fan out and join them by hand to
 * answer "what do I have on Sui?". This fuses them so the most common
 * question a user actually asks - "show me my position" - is one tool
 * call. That accessibility (DeFi legible to non-experts) is the gap Sui
 * itself calls out as the thing it most needs.
 *
 * Read-only: no gas, no signing. Non-SUI coins are returned raw (with
 * their coin_type) so the caller can resolve symbols/decimals via
 * sui_get_coin_metadata only for the ones it wants to display.
 */
export async function suiGetPortfolio(raw: unknown): Promise<string> {
  const { address, network } = raw as Args;

  const balances = JSON.parse(await suiGetAllBalances({ address, network })) as {
    balances: { coin_type: string; total_mist: string; coin_object_count: number }[];
  };
  const stakes = JSON.parse(await suiGetStakes({ address, network })) as {
    validator_count: number;
    total_principal_mist: string;
    total_principal_sui: number;
    total_estimated_reward_mist: string;
    total_estimated_reward_sui: number;
    validators: unknown[];
  };

  const suiBalance = balances.balances.find((b) => b.coin_type === SUI_TYPE);
  const liquidSuiMist = BigInt(suiBalance?.total_mist ?? '0');
  const otherCoins = balances.balances.filter((b) => b.coin_type !== SUI_TYPE);

  const stakedPrincipalMist = BigInt(stakes.total_principal_mist);
  const rewardMist = BigInt(stakes.total_estimated_reward_mist);
  const totalSuiExposureMist = liquidSuiMist + stakedPrincipalMist + rewardMist;

  return JSON.stringify({
    address,
    network,
    liquid: {
      sui_mist: liquidSuiMist.toString(),
      sui: toSui(liquidSuiMist),
      other_coin_count: otherCoins.length,
      other_coins: otherCoins,
    },
    staked: {
      validator_count: stakes.validator_count,
      total_principal_sui: stakes.total_principal_sui,
      total_estimated_reward_sui: stakes.total_estimated_reward_sui,
      validators: stakes.validators,
    },
    summary: {
      liquid_sui: toSui(liquidSuiMist),
      staked_sui: stakes.total_principal_sui,
      reward_sui: stakes.total_estimated_reward_sui,
      total_sui_exposure: toSui(totalSuiExposureMist),
      distinct_coin_types: balances.balances.length,
    },
    note:
      'total_sui_exposure = liquid SUI + staked principal + accrued rewards. Other coins are listed raw; resolve symbols/decimals with sui_get_coin_metadata as needed. Project staking returns forward with sui_get_validators_apy.',
  });
}
