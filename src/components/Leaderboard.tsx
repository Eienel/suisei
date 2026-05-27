import { useApp } from '@/state/app';

/**
 * Leaderboard — top badge-holders, ranked by graduate NFT first then
 * total badge count. Sprint 3 wires the on-chain indexer. For now: shell.
 */
export function Leaderboard() {
  const setScreen = useApp((s) => s.setScreen);

  return (
    <div className="fixed inset-0 bg-ink text-fg overflow-y-auto">
      <header className="border-b border-ink-line/40 px-6 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setScreen('play')}
          className="font-mono text-sm text-fg-dim hover:text-fg transition-colors"
        >
          ← Quests
        </button>
        <span className="font-mono text-xs text-fg-mute">Leaderboard</span>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Sui Stack Graduates</h1>
        <p className="text-fg-mute leading-relaxed">
          On-chain badge-holder ranking lands in Sprint 3.
        </p>
      </main>
    </div>
  );
}
