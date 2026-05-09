import { useMemo, type ReactNode, type ComponentType } from 'react';
import {
  ConnectionProvider as RawConnectionProvider,
  WalletProvider as RawWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider as RawWalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

const DEFAULT_RPC = 'https://api.devnet.solana.com';

// The wallet adapter packages ship typings against React 19, which conflicts
// with our React 18 types. Re-cast their components to ComponentType at the
// import seam (instead of polluting consumer files with `as any`).
const ConnectionProvider = RawConnectionProvider as unknown as ComponentType<{
  endpoint: string;
  children: ReactNode;
}>;
const WalletProvider = RawWalletProvider as unknown as ComponentType<{
  wallets: unknown[];
  autoConnect?: boolean;
  children: ReactNode;
}>;
const WalletModalProvider = RawWalletModalProvider as unknown as ComponentType<{
  children: ReactNode;
}>;

/**
 * Wraps the sandbox in Solana wallet plumbing. Lives inside GameShell so
 * the wallet adapter stays in the lazy chunk (landing remains tiny).
 *
 * Wallet Standard auto-discovers Phantom / Backpack / Solflare etc., so
 * we pass an empty `wallets` list rather than hard-coding adapters.
 */
export function BagsProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () => import.meta.env.VITE_SOLANA_RPC_URL || DEFAULT_RPC,
    []
  );
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
