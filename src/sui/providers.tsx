import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider, useSuiClient } from '@mysten/dapp-kit';
import { registerEnokiWallets, isEnokiWallet } from '@mysten/enoki';
import '@mysten/dapp-kit/dist/index.css';
import {
  SUI_NETWORK,
  SUI_RPC_URL,
  ENOKI_API_KEY,
  ENOKI_GOOGLE_CLIENT_ID,
  ENOKI_CONFIGURED,
} from './config';

const queryClient = new QueryClient();

const networks = {
  testnet: { url: SUI_RPC_URL },
  mainnet: { url: SUI_RPC_URL },
  devnet: { url: SUI_RPC_URL },
} as const;

/** Registers Enoki wallets with dapp-kit so they appear in the wallet list
 *  AND can be triggered programmatically by a "Sign in with Google" button. */
function EnokiRegistrar() {
  const suiClient = useSuiClient();
  useEffect(() => {
    if (!ENOKI_CONFIGURED) return;
    // dapp-kit and Enoki resolve @mysten/sui to slightly different
    // package copies during TS check; the runtime shapes match. Cast.
    const result = registerEnokiWallets({
      apiKey: ENOKI_API_KEY,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: suiClient as any,
      network: SUI_NETWORK,
      providers: {
        google: { clientId: ENOKI_GOOGLE_CLIENT_ID },
      },
    });
    return () => {
      result?.unregister?.();
    };
  }, [suiClient]);
  return null;
}

export function SuiProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={SUI_NETWORK}>
        <EnokiRegistrar />
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export { isEnokiWallet };
