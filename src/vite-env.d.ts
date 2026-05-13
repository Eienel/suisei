/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUI_NETWORK?: 'testnet' | 'mainnet' | 'devnet';
  readonly VITE_ENOKI_API_KEY?: string;
  readonly VITE_ENOKI_GOOGLE_CLIENT_ID?: string;
  readonly VITE_WORLD_NFT_PACKAGE_ID?: string;
  readonly VITE_WALRUS_PUBLISHER_URL?: string;
  readonly VITE_WALRUS_AGGREGATOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
