import { useApp } from '@/state/app';
import { AuthButton } from './AuthButton';

/**
 * Play — quest hub + active quest renderer. Sprint 1 wires the quest
 * components in here. For now: stub that proves auth + nav works.
 */
export function Play() {
  const setScreen = useApp((s) => s.setScreen);
  const badges = useApp((s) => s.badges);

  return (
    <div className="fixed inset-0 bg-ink text-fg overflow-y-auto">
      <header className="border-b border-ink-line/40 px-6 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setScreen('landing')}
          className="font-mono text-sm text-fg-dim hover:text-fg transition-colors"
        >
          ← Suisei
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setScreen('leaderboard')}
            className="font-mono text-xs text-fg-mute hover:text-fg transition-colors"
          >
            Leaderboard
          </button>
          <AuthButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-mute mb-6">
          Quests · {badges.length} / 8 complete
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Pick a quest</h1>
        <p className="text-fg-mute leading-relaxed mb-8">
          Quest UI lands next sprint. For now this confirms auth + Suisei chat
          will live on the right side of this view.
        </p>
      </main>
    </div>
  );
}
