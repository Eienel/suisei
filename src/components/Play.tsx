import { useApp } from '@/state/app';
import { AuthButton } from './AuthButton';
import { SuiseiChat } from './SuiseiChat';
import { QuestRouter } from '@/quests/QuestRouter';
import { ArrowLeft } from 'lucide-react';

/**
 * Play — top-level layout for the quest experience. Header (nav +
 * auth) on top, scrolling main column with the current quest in the
 * center, persistent Suisei chat panel on the right.
 */
export function Play() {
  const setScreen = useApp((s) => s.setScreen);
  const currentQuest = useApp((s) => s.currentQuest);
  const closeQuest = useApp((s) => s.closeQuest);
  const badges = useApp((s) => s.badges);

  return (
    <div className="fixed inset-0 bg-ink text-fg flex flex-col">
      <header className="border-b border-ink-line/40 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setScreen('landing')}
            className="font-mono text-sm text-fg-dim hover:text-fg transition-colors"
          >
            ← Suisei
          </button>
          {currentQuest && (
            <button
              type="button"
              onClick={closeQuest}
              className="btn-ghost text-xs inline-flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              Hub
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-fg-mute hidden sm:inline">
            {badges.length} / 8 badges
          </span>
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

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <QuestRouter />
        </main>
        <SuiseiChat />
      </div>
    </div>
  );
}
