import { useEffect, useState } from 'react';
import { Save, Check, Loader2, AlertCircle, Trophy } from 'lucide-react';
import { useSaveWorld } from '@/sui/useSaveWorld';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useWorld } from '@/state/world';
import { PACKAGE_CONFIGURED } from '@/sui/config';

interface Props {
  /**
   * Which NFT to mint/update. Defaults to the current world.mode so
   * the Sandbox HUD saves the sandbox NFT, the LessonDone screen
   * saves the lessons NFT, etc.
   */
  kind?: 'sandbox' | 'lessons';
  /** Override the default label (e.g. "Mint Crypto 101" on lesson finish). */
  labelOverride?: { idle?: string; firstMint?: string };
}

/**
 * "Save World" CTA. Surfaces full save lifecycle. Handles BOTH NFT
 * kinds — sandbox (creative land) and lessons (commemorative town).
 */
export function SaveWorldButton({ kind: kindProp, labelOverride }: Props = {}) {
  const account = useCurrentAccount();
  const mode = useWorld((s) => s.mode);
  const lessonBlocks = useWorld((s) => s.lessonBlocks);
  const sandboxBlocks = useWorld((s) => s.sandboxBlocks);
  const kind: 'sandbox' | 'lessons' = kindProp ?? mode;
  const blockCount = kind === 'lessons' ? lessonBlocks.length : sandboxBlocks.length;
  const { phase, error, txDigest, kind: savedKind, save, hasSandbox, hasLessons } = useSaveWorld();
  const hasExisting = kind === 'lessons' ? hasLessons : hasSandbox;

  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [name, setName] = useState(kind === 'lessons' ? 'Crypto 101' : 'My Land');

  // Only react to this kind's save phase
  const ownsPhase = savedKind === null || savedKind === kind;
  const localPhase = ownsPhase ? phase : 'idle';

  useEffect(() => {
    if (localPhase === 'success') {
      const t = setTimeout(() => {}, 4000);
      return () => clearTimeout(t);
    }
  }, [localPhase]);

  const onClick = () => {
    if (!account || blockCount === 0) return;
    if (!hasExisting) {
      setShowNamePrompt(true);
    } else {
      save({ kind });
    }
  };

  const confirmMint = () => {
    setShowNamePrompt(false);
    save({ worldName: name, kind });
  };

  const disabled =
    !PACKAGE_CONFIGURED ||
    !account ||
    blockCount === 0 ||
    localPhase === 'uploading' ||
    localPhase === 'signing';

  const defaultIdle =
    kind === 'lessons' ? 'Mint Crypto 101' : 'Save World';
  const defaultFirstMint =
    kind === 'lessons' ? 'Mint Crypto 101' : 'Mint World';

  let label = labelOverride?.idle ?? defaultIdle;
  let icon = kind === 'lessons' ? <Trophy size={14} /> : <Save size={14} />;
  let tone = kind === 'lessons' ? 'rounded-md px-3 py-1.5 font-semibold text-sm bg-accent-amber text-ink hover:bg-accent-amber/90' : 'btn-ghost';

  if (localPhase === 'uploading') {
    label = 'Uploading to Walrus…';
    icon = <Loader2 size={14} className="animate-spin" />;
  } else if (localPhase === 'signing') {
    label = 'Sign in wallet…';
    icon = <Loader2 size={14} className="animate-spin" />;
  } else if (localPhase === 'success') {
    label = kind === 'lessons' ? 'Minted ✓' : 'Saved on Sui ✓';
    icon = <Check size={14} />;
    tone = 'bg-accent-cyan text-ink rounded-md px-3 py-1.5 font-semibold text-sm';
  } else if (localPhase === 'error') {
    label = 'Retry';
    icon = <AlertCircle size={14} />;
  } else if (!account) {
    label = 'Connect to save';
  } else if (blockCount === 0) {
    label = kind === 'lessons' ? 'Finish lessons first' : 'Place blocks first';
  } else if (hasExisting) {
    label = kind === 'lessons' ? 'Update Crypto 101' : 'Update World';
  } else {
    label = labelOverride?.firstMint ?? defaultFirstMint;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {localPhase === 'error' && error && (
          <span className="text-xs text-accent-magenta font-mono max-w-[220px] truncate" title={error}>
            {error}
          </span>
        )}
        {localPhase === 'success' && txDigest && (
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
            <h3 className="font-semibold text-fg mb-1">
              {kind === 'lessons' ? 'Mint your Crypto 101 NFT' : 'Mint your World'}
            </h3>
            <p className="text-sm text-fg-mute mb-4">
              {kind === 'lessons'
                ? 'A commemorative NFT on Sui testnet showing the town you built from quiz answers. Mint once — it freezes as a record of completion.'
                : 'Creates an NFT on Sui testnet that holds your land\'s metadata. You can re-save anytime to update it. Anyone with the URL can visit.'}
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder={kind === 'lessons' ? 'Crypto 101' : 'My Land'}
              className="w-full bg-ink-soft border border-ink-line rounded-lg px-3 py-2 text-fg outline-none focus:border-accent-cyan transition-colors mb-4"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNamePrompt(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMint}
                disabled={!name.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {kind === 'lessons' ? 'Mint NFT' : 'Mint World'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
