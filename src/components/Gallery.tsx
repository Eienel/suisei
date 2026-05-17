import { ArrowLeft, Loader2, AlertCircle, ExternalLink, Trophy } from 'lucide-react';
import { useGallery } from '@/sui/useGallery';
import { useApp } from '@/state/app';

/**
 * Public worlds gallery — lists recent BlockBuilders towns minted on
 * Sui via the WorldMinted event stream. Click a card → opens that
 * town's read-only viewer at /town/<address>.
 *
 * Lives outside the lessons/sandbox flow so visitors who don't sign
 * in can still browse.
 */
export function Gallery() {
  const setScreen = useApp((s) => s.setScreen);
  const { loading, error, worlds } = useGallery();

  const goVisit = (address: string) => {
    window.history.pushState({}, '', `/town/${address}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-ink">
      <header className="max-w-5xl mx-auto px-6 sm:px-10 pt-6 sm:pt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setScreen('landing')}
          className="btn-ghost text-sm flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Home
        </button>
        <button
          type="button"
          onClick={() => setScreen('leaderboard')}
          className="btn-ghost text-sm flex items-center gap-1.5"
        >
          <Trophy size={14} className="text-accent-amber" />
          Leaderboard
        </button>
        <div className="text-right">
          <p className="font-mono text-[11px] text-fg-mute uppercase tracking-widest">
            Public worlds
          </p>
          <h1 className="text-xl font-semibold text-fg tracking-tight">Visit a town</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-10 pt-8 pb-12">
        <p className="text-fg-mute text-sm leading-relaxed max-w-xl mb-6">
          Recent BlockBuilders towns minted on Sui testnet. Tap any card to walk through
          someone else's world. Towns auto-update when their owner saves new edits.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-fg-mute font-mono text-sm py-12">
            <Loader2 size={14} className="animate-spin" />
            looking up worlds on sui…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-accent-magenta font-mono text-sm py-6 px-4 rounded-xl border border-accent-magenta/40 bg-accent-magenta/5">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {!loading && !error && worlds.length === 0 && (
          <div className="text-fg-mute text-sm py-12 text-center">
            No worlds minted yet. Be the first — finish a lesson and hit Save.
          </div>
        )}

        {!loading && !error && worlds.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {worlds.map((w) => (
              <button
                key={w.worldId}
                type="button"
                onClick={() => goVisit(w.owner)}
                className="group text-left rounded-2xl p-5 border border-ink-line bg-ink-soft/60 hover:border-accent-cyan/40 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-fg-mute">
                      Builder
                    </p>
                    <p className="font-mono text-sm text-fg">
                      {w.owner.slice(0, 8)}…{w.owner.slice(-4)}
                    </p>
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-fg-mute group-hover:text-accent-cyan transition-colors"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-fg-mute">
                  <span>{w.mintedAt ? timeAgo(w.mintedAt) : 'recent'}</span>
                  <span className="truncate ml-2 max-w-[140px]" title={w.metadataUri}>
                    {w.metadataUri.replace(/^walrus:\/\//, '@')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
