import { useState } from 'react';
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
  useWallets,
  useConnectWallet,
} from '@mysten/dapp-kit';
import { isEnokiWallet, type EnokiWallet, type AuthProvider } from '@mysten/enoki';
import { LogIn, LogOut, ChevronDown } from 'lucide-react';
import { ENOKI_CONFIGURED } from '@/sui/config';

/**
 * Top-right auth control.
 *  - Disconnected: shows "Sign in with Google" (when Enoki configured)
 *    + "Connect Wallet" (always).
 *  - Connected: shows truncated address + disconnect.
 */
export function AuthButton() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();
  const { mutate: connectWallet } = useConnectWallet();
  const [showConnect, setShowConnect] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const googleWallet = wallets.find(
    (w): w is EnokiWallet =>
      isEnokiWallet(w) && (w as EnokiWallet).provider === ('google' as AuthProvider)
  );

  const handleGoogle = () => {
    if (!googleWallet) return;
    connectWallet({ wallet: googleWallet });
  };

  if (account) {
    const short = `${account.address.slice(0, 6)}…${account.address.slice(-4)}`;
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-pill px-3 py-1.5 flex items-center gap-2 text-sm font-mono bg-night-soft border border-night-line text-cream-dim hover:text-cream transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-sage" />
          {short}
          <ChevronDown size={12} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 bg-night-soft border border-night-line rounded-card py-1.5 min-w-44 shadow-night-card animate-fade-in"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => {
                disconnect();
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-cream-dim hover:text-terracotta hover:bg-night-line/60 flex items-center gap-2"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {ENOKI_CONFIGURED && googleWallet && (
        <button
          type="button"
          onClick={handleGoogle}
          className="bg-cream text-ink font-semibold text-sm px-3 py-1.5 rounded-pill hover:bg-paper transition-colors flex items-center gap-1.5"
        >
          <GoogleG />
          Sign in
        </button>
      )}
      <button
        type="button"
        onClick={() => setShowConnect(true)}
        className="btn-ghost text-sm flex items-center gap-1.5"
      >
        <LogIn size={14} />
        Connect Wallet
      </button>
      <ConnectModal open={showConnect} onOpenChange={setShowConnect} trigger={<span />} />
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.33v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.11z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
