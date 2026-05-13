import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Share2, Check } from 'lucide-react';

/**
 * Copies the visitor URL for the connected wallet — friends can browse
 * the town read-only at `/town/<address>`. Hidden when no wallet is
 * connected (no address to share).
 */
export function ShareButton() {
  const account = useCurrentAccount();
  const [copied, setCopied] = useState(false);

  if (!account) return null;

  const url = `${window.location.origin}/town/${account.address}`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My BlockBuilders town',
          text: 'I built a crypto town in BlockBuilders — come visit.',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user dismissed share sheet — ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="btn-ghost text-sm flex items-center gap-1.5"
      title={url}
    >
      {copied ? (
        <>
          <Check size={14} className="text-accent-cyan" />
          copied
        </>
      ) : (
        <>
          <Share2 size={14} />
          share town
        </>
      )}
    </button>
  );
}
