import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

/**
 * Bags / Solana hook. Returns null/false when no env config is provided
 * so the UI is graceful before the $BLOCK mint exists.
 *
 * Sprint 4 contract:
 *  - wallet:      from Wallet Standard adapter
 *  - holdsToken:  true if wallet owns >0 of VITE_BLOCK_TOKEN_MINT
 *  - cosmetics:   skins unlocked by holding $BLOCK
 *  - connect/disconnect: open/close wallet modal
 *  - mintBadge:   STUB — drop in real Bags SDK call. Returns { tx } on success.
 */
export interface BagsState {
  wallet: { address: string } | null;
  connecting: boolean;
  holdsToken: boolean;
  blockBalance: number;
  cosmetics: string[];
  connect: () => void;
  disconnect: () => Promise<void>;
  mintBadge: () => Promise<{ tx: string } | null>;
}

const BLOCK_MINT_ENV = import.meta.env.VITE_BLOCK_TOKEN_MINT as string | undefined;

export function useBags(): BagsState {
  const { publicKey, connecting, disconnect, select, wallets } = useWallet();
  const { connection } = useConnection();
  const [blockBalance, setBlockBalance] = useState(0);

  const wallet = publicKey ? { address: publicKey.toBase58() } : null;

  // Open the wallet modal via wallet-adapter-react-ui's button event.
  // We expose a simple connect() that triggers the standard modal.
  const connect = useCallback(() => {
    // Prefer first installed wallet if any; else the modal opens via WalletMultiButton.
    const installed = wallets.find((w) => w.readyState === 'Installed');
    if (installed) select(installed.adapter.name);
    // If no wallets are installed the WalletMultiButton in HUD will prompt install.
  }, [wallets, select]);

  // Refresh $BLOCK balance whenever the wallet changes.
  useEffect(() => {
    if (!publicKey || !BLOCK_MINT_ENV) {
      setBlockBalance(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mint = new PublicKey(BLOCK_MINT_ENV);
        const res = await connection.getParsedTokenAccountsByOwner(publicKey, { mint });
        const total = res.value.reduce((sum, acc) => {
          const info = acc.account.data.parsed?.info?.tokenAmount;
          return sum + (info?.uiAmount ?? 0);
        }, 0);
        if (!cancelled) setBlockBalance(total);
      } catch {
        if (!cancelled) setBlockBalance(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  const holdsToken = blockBalance > 0;
  const cosmetics = holdsToken ? ['gold-stud'] : [];

  const mintBadge = useCallback(async (): Promise<{ tx: string } | null> => {
    if (!publicKey) return null;
    // TODO(Sprint 4 final): replace this with a real Bags SDK call once
    // the SDK + program addresses are pinned. The shape we return matches
    // what the HUD expects ({ tx } = signature). For now, no-op.
    console.warn('[bags] mintBadge() stub — wire Bags SDK here.');
    return null;
  }, [publicKey]);

  return {
    wallet,
    connecting,
    holdsToken,
    blockBalance,
    cosmetics,
    connect,
    disconnect,
    mintBadge,
  };
}
