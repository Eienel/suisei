import { useApp } from '@/state/app';

/**
 * Leaderboard — top badge-holders, ranked by graduate NFT first then
 * total badge count. Sprint 3 wires the on-chain indexer. For now: shell.
 */
export function Leaderboard() {
  const setScreen = useApp((s) => s.setScreen);

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
        <span className="eyebrow text-cream-mute">Leaderboard</span>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="eyebrow text-butter mb-3">Public alpha</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-[-0.015em] font-semibold text-cream mb-4">
          Sui Stack Graduates
        </h1>
        <p className="text-cream-dim leading-relaxed text-[17px] max-w-xl">
          On-chain badge-holder ranking lands in Sprint 3. The leaderboard will
          read badges directly off Sui — no off-chain database, no opt-in.
        </p>
      </main>
    </div>
  );
}
