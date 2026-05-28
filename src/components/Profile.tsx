import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useApp } from '@/state/app';
import { questById } from '@/data/quests';
import { BADGE_CONFIGURED, SUI_NETWORK } from '@/sui/config';
import { fetchOwnedBadges } from '@/sui/queries';
import { ExternalLink, RefreshCw } from 'lucide-react';

/**
 * Profile — your collected badges. When signed in + badge package is
 * configured, hydrates from on-chain owned-objects so the page reflects
 * the wallet's actual state, not just locally-persisted mocks.
 */
export function Profile() {
  const setScreen = useApp((s) => s.setScreen);
  const badges = useApp((s) => s.badges);
  const mergeOnChainBadges = useApp((s) => s.mergeOnChainBadges);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    if (!account || !BADGE_CONFIGURED) return;
    setRefreshing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fetched = await fetchOwnedBadges(suiClient as any, account.address);
      mergeOnChainBadges(fetched);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[profile] fetchOwnedBadges failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
    // intentional one-shot on mount; the "Refresh" button is for re-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address]);

  return (
    <div className="fixed inset-0 bg-night text-cream overflow-y-auto">
      <header className="border-b border-night-line/70 px-6 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setScreen('play')}
          className="font-mono text-sm text-cream-dim hover:text-cream transition-colors"
        >
          ← Quests
        </button>
        <span className="eyebrow text-cream-mute">Profile</span>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="eyebrow text-butter">{badges.length} of 8 badges</p>
          {account && BADGE_CONFIGURED && (
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="btn-ghost text-xs disabled:opacity-50"
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'syncing…' : 'sync from chain'}
            </button>
          )}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-[-0.015em] font-semibold text-cream mb-4">
          Your collection
        </h1>
        <p className="text-cream-dim leading-relaxed text-[17px] max-w-xl mb-10">
          {badges.length === 0
            ? "No badges yet. Finish a quest and you'll get a soulbound NFT minted to your wallet."
            : 'Each badge is a real on-chain object. Click through to view it on Suiscan.'}
        </p>

        {badges.length > 0 && (
          <ul className="space-y-3">
            {badges.map((b) => {
              const q = questById(b.questId);
              const isMock = b.txDigest.startsWith('mock-');
              const explorer = isMock
                ? null
                : `https://suiscan.xyz/${SUI_NETWORK}/tx/${b.txDigest}`;
              return (
                <li
                  key={b.objectId}
                  className="card-night p-5 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="eyebrow text-cream-mute mb-1.5">
                      Quest {q ? String(q.number).padStart(2, '0') : '??'} ·{' '}
                      {q?.concept}
                    </p>
                    <p className="font-display font-semibold text-cream text-[17px] mb-2">
                      {q?.title ?? b.questId}
                    </p>
                    <p className="font-mono text-[11px] text-cream-dim break-all">
                      {b.objectId}
                    </p>
                  </div>
                  {explorer && (
                    <a
                      href={explorer}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost text-sm shrink-0"
                    >
                      <ExternalLink size={13} />
                      Suiscan
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
