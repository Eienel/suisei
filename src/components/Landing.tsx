import { useApp } from '@/state/app';

/**
 * Landing — placeholder shell. Final design lands in Sprint 3 with the
 * brand-styling spec applied. For now: enough to navigate into the app
 * and verify the build pipeline.
 */
export function Landing() {
  const setScreen = useApp((s) => s.setScreen);
  return (
    <div className="fixed inset-0 bg-ink text-fg overflow-y-auto">
      <main className="max-w-3xl mx-auto px-6 py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-mute mb-6">
          Suisei · alpha
        </p>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.95] mb-8">
          Learn Sui by{' '}
          <span className="text-accent-cyan">doing</span> Sui.
        </h1>
        <p className="text-fg-mute text-lg leading-relaxed max-w-xl mb-10">
          An AI agent that uses the full Sui Stack — zkLogin, sponsored gas,
          Move, PTBs, Walrus, Seal — to teach you the Sui Stack. Eight quests,
          each one ending in a real on-chain deployment.
        </p>
        <button
          type="button"
          onClick={() => setScreen('play')}
          className="bg-fg text-ink px-6 py-3 rounded-md font-semibold hover:bg-white transition-colors"
        >
          Begin →
        </button>
        <p className="mt-12 font-mono text-xs text-fg-mute">
          Built for Sui Overflow 2026 · Agentic Web
        </p>
      </main>
    </div>
  );
}
