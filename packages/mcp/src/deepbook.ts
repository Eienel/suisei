import type { Network } from './sui-client.js';

/**
 * DeepBook v3 on-chain constants, verified against @mysten/deepbook-v3
 * (the official SDK) source. We hand-build the swap PTB on @mysten/sui v1
 * rather than depend on that SDK, which now requires @mysten/sui v2.
 *
 * These are upgrade-stable but can change when DeepBook redeploys; every
 * tool input can be overridden explicitly, so the registry is a
 * convenience, not a hard dependency.
 */

export const DEEPBOOK_PACKAGE_ID: Record<Network, string> = {
  testnet: '0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c',
  mainnet: '0x0e735f8c93a95722efd73521aca7a7652c0bb71ed1daf41b26dfd7d1ff71f748',
  devnet: '',
};

/** DEEP coin type (used to pay trading fees) per network. */
export const DEEP_TYPE: Record<Network, string> = {
  testnet: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
  mainnet: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
  devnet: '',
};

export interface PoolInfo {
  pool_id: string;
  base_type: string;
  quote_type: string;
}

const SUI = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
const T_DBUSDC =
  '0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC';
const T_DEEP = DEEP_TYPE.testnet;
const M_USDC = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
const M_DEEP = DEEP_TYPE.mainnet;

/** Flagship pools by key. Override pool_id/base_type/quote_type to use others. */
export const POOLS: Partial<Record<Network, Record<string, PoolInfo>>> = {
  testnet: {
    SUI_DBUSDC: {
      pool_id: '0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
      base_type: SUI,
      quote_type: T_DBUSDC,
    },
    DEEP_SUI: {
      pool_id: '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f',
      base_type: T_DEEP,
      quote_type: SUI,
    },
    DEEP_DBUSDC: {
      pool_id: '0xe86b991f8632217505fd859445f9803967ac84a9d4a1219065bf191fcb74b622',
      base_type: T_DEEP,
      quote_type: T_DBUSDC,
    },
  },
  mainnet: {
    SUI_USDC: {
      pool_id: '0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407',
      base_type: SUI,
      quote_type: M_USDC,
    },
    DEEP_SUI: {
      pool_id: '0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22',
      base_type: M_DEEP,
      quote_type: SUI,
    },
    DEEP_USDC: {
      pool_id: '0xf948981b806057580f91622417534f491da5f61aeaf33d0ed8e69fd5691c95ce',
      base_type: M_DEEP,
      quote_type: M_USDC,
    },
  },
};
