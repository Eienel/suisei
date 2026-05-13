import { useEffect, useState } from 'react';
import { Save, Check, Loader2, AlertCircle } from 'lucide-react';
import { useSaveWorld } from '@/sui/useSaveWorld';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useWorld } from '@/state/world';
import { PACKAGE_CONFIGURED } from '@/sui/config';

/**
 * "Save World" CTA in the HUD. Surfaces full lifecycle:
 *  idle → uploading (Walrus) → signing (wallet) → success → idle.
 * Auto-clears the success state after 4s.
 */
export function SaveWorldButton() {
  const account = useCurrentAccount();
  const blockCount = useWorld((s) => s.blocks.length);
  const { phase, error, txDigest, save, hasExisting } = useSaveWorld();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [name, setName] = useState('My World');

  useEffect(() => {
    if (phase === 'success') {
      const t = setTimeout(() => useSaveWorld.bind(null), 4000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const onClick = () => {
    if (!account || blockCount === 0) return;
    if (!hasExisting) {
      setShowNamePrompt(true);
    } else {
      save({});
    }
  };

  const confirmMint = () => {
    setShowNamePrompt(false);
    save({ worldName: name });
  };

  const disabled =
    !PACKAGE_CONFIGURED ||
    !account ||
    blockCount === 0 ||
    phase === 'uploading' ||
    phase === 'signing';

  let label = 'Save World';
  let icon = <Save size={14} />;
  let tone = 'btn-ghost';

  if (phase === 'uploading') {
    label = 'Uploading to Walrus…';
    icon = <Loader2 size={14} className="animate-spin" />;
  } else if (phase === 'signing') {
    label = 'Sign in wallet…';
    icon = <Loader2 size={14} className="animate-spin" />;
  } else if (phase === 'success') {
    label = 'Saved on Sui ✓';
    icon = <Check size={14} />;
    tone = 'bg-accent-cyan text-ink rounded-md px-3 py-1.5 font-semibold text-sm';
  } else if (phase === 'error') {
    label = 'Retry save';
    icon = <AlertCircle size={14} />;
  } else if (!account) {
    label = 'Connect to save';
  } else if (blockCount === 0) {
    label = 'Place blocks first';
  } else if (hasExisting) {
    label = 'Update World';
  } else {
    label = 'Mint World';
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {phase === 'error' && error && (
          <span className="text-xs text-accent-magenta font-mono max-w-[280px] truncate" title={error}>
            {error}
          </span>
        )}
        {phase === 'success' && txDigest && (
          <a
            href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-fg-mute hover:text-accent-cyan font-mono"
            title={txDigest}
          >
            view tx
          </a>
        )}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`${tone} text-sm flex items-center gap-1.5 disabled:opacity-50`}
        >
          {icon}
          {label}
        </button>
      </div>

      {showNamePrompt && (
        <div className="fixed inset-0 z-40 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass rounded-2xl p-6 max-w-sm w-full shadow-glass">
            <h3 className="font-semibold text-fg mb-1">Mint your World</h3>
            <p className="text-sm text-fg-mute mb-4">
              This creates an NFT on Sui testnet that holds your world's metadata.
              You can re-save anytime to update it.
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 64))}
              placeholder="World name"
              className="w-full bg-ink-soft border border-ink-line rounded-lg px-3 py-2 text-fg outline-none focus:border-accent-cyan transition-colors mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNamePrompt(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMint}
                disabled={!name.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Mint World
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
