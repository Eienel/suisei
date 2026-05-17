import { ArrowLeft, Loader2, AlertCircle, Trophy, ExternalLink, GraduationCap, Sparkles } from 'lucide-react';
import { useLeaderboard } from '@/sui/useLeaderboard';
import { useApp } from '@/state/app';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { classifyByName, stripKindPrefix } from '@/sui/useUserWorld';

/**
 * Top builders, sorted by on-chain block count. Reads WorldUpdated
 * events from our Move package — every Save World writes one with
 * the latest block_count, so the leaderboard is essentially free.
 */
export function Leaderboard() {
  const setScreen = useApp((s) => s.setScreen);
  const { loading, error, rows } = useLeaderboard();
  const me = useCurrentAccount();

  const goVisit = (address: string) => {
    window.history.pushState({}, '', `/town/${address}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-ink">
      <header className="max-w-3xl mx-auto px-6 sm:px-10 pt-6 sm:pt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setScreen('landing')}
          className="btn-ghost text-sm flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Home
        </button>
        <div className="text-right">
          <p className="font-mono text-[11px] text-fg-mute uppercase tracking-widest">
            Onchain stats
          </p>
          <h1 className="text-xl font-semibold text-fg tracking-tight flex items-center gap-2 justify-end">
            <Trophy size={18} className="text-accent-amber" />
            Leaderboard
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-10 pt-8 pb-12">
        <p className="text-fg-mute text-sm leading-relaxed max-w-xl mb-6">
          Top builders by total blocks placed in their saved world. Every Save World
          tx bumps the count on chain — no off-chain bookkeeping. Tap any row to visit.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-fg-mute font-mono text-sm py-12">
            <Loader2 size={14} className="animate-spin" />
            tallying onchain blocks…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-accent-magenta font-mono text-sm py-6 px-4 rounded-xl border border-accent-magenta/40 bg-accent-magenta/5">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="text-fg-mute text-sm py-12 text-center">
            No worlds saved yet. Be the first — finish a lesson and hit Save.
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <ol className="divide-y divide-ink-line/60 border border-ink-line/60 rounded-2xl overflow-hidden bg-ink-soft/40">
            {rows.slice(0, 25).map((r, i) => {
              const isMe = !!me && me.address === r.owner;
              const rankClass =
                i === 0
                  ? 'text-accent-amber'
                  : i === 1
                    ? 'text-fg-dim'
                    : i === 2
                      ? 'text-accent-violet'
                      : 'text-fg-mute';
              const kind = classifyByName(r.name ?? '');
              const displayName = stripKindPrefix(r.name ?? '');
              return (
                <li key={r.worldId}>
                  <button
                    type="button"
                    onClick={() => goVisit(r.owner)}
                    className={`group w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 text-left transition-colors ${
                      isMe ? 'bg-accent-cyan/10' : 'hover:bg-ink-line/40'
                    }`}
                  >
                    <span className={`font-mono text-lg sm:text-2xl font-bold w-8 sm:w-10 shrink-0 ${rankClass}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${
                        kind === 'lessons' ? 'bg-accent-amber/15 text-accent-amber' : 'bg-accent-cyan/15 text-accent-cyan'
                      }`}
                      title={kind === 'lessons' ? 'Crypto 101 (lessons NFT)' : 'Sandbox land'}
                    >
                      {kind === 'lessons' ? <GraduationCap size={14} /> : <Sparkles size={14} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      {displayName && (
                        <div className="font-semibold text-fg truncate text-sm sm:text-base">
                          {displayName}
                        </div>
                      )}
                      <div className="font-mono text-[11px] sm:text-xs text-fg-mute truncate">
                        {r.owner.slice(0, 8)}…{r.owner.slice(-4)}
                        {isMe && (
                          <span className="ml-2 text-[10px] uppercase tracking-widest text-accent-cyan font-semibold">
                            you
                          </span>
                        )}
                        <span className="ml-2">
                          v{r.version}
                          {r.updatedAt && ` · ${timeAgo(r.updatedAt)}`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-base sm:text-lg font-semibold text-fg">
                        {r.blockCount}
                      </div>
                      <div className="text-[10px] font-mono text-fg-mute uppercase tracking-widest">
                        blocks
                      </div>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-fg-mute group-hover:text-accent-cyan transition-colors shrink-0 hidden sm:block"
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-8 flex items-center justify-between text-xs font-mono text-fg-mute">
          <button
            type="button"
            onClick={() => setScreen('gallery')}
            className="hover:text-fg transition-colors"
          >
            ← Browse all towns
          </button>
          <button
            type="button"
            onClick={() => setScreen('lessons')}
            className="hover:text-fg transition-colors"
          >
            Build your own →
          </button>
        </div>
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
