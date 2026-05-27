import { useApp } from '@/state/app';

/**
 * Profile — public-shareable page of a wallet's badge collection. URL
 * shape: /u/0x… via the screen state. Sprint 3 builds the share card
 * (OG image + tweet button). For now: shell.
 */
export function Profile() {
  const setScreen = useApp((s) => s.setScreen);
  const badges = useApp((s) => s.badges);

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
        <span className="font-mono text-xs text-fg-mute">Profile</span>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Your badges</h1>
        <p className="text-fg-mute leading-relaxed mb-6">
          {badges.length === 0
            ? 'No badges yet. Complete a quest to earn your first soulbound NFT.'
            : `You have ${badges.length} badge${badges.length === 1 ? '' : 's'}.`}
        </p>
      </main>
    </div>
  );
}
