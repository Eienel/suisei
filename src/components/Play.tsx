import { useApp } from '@/state/app';
import { AuthButton } from './AuthButton';
import { SuiseiChat } from './SuiseiChat';
import { QuestRouter } from '@/quests/QuestRouter';
import { ArrowLeft } from 'lucide-react';

/**
 * Play — warm-dark surface for the quest experience. Header on top
 * (nav + auth), scrolling main with current quest in center, persistent
 * Suisei chat on the right.
 */
export function Play() {
  const setScreen = useApp((s) => s.setScreen);
  const currentQuest = useApp((s) => s.currentQuest);
  const closeQuest = useApp((s) => s.closeQuest);
  const badges = useApp((s) => s.badges);

  return (
    <div className="surface-night fixed inset-0 flex flex-col">
      <header className="px-6 py-3.5 flex items-center justify-between shrink-0 border-b border-night-line/70">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen('landing')}
            className="font-display font-semibold text-cream hover:text-paper transition-colors text-[15px] flex items-center gap-1.5"
          >
            <ArrowLeft size={14} className="text-cream-mute" />
            Suisei
          </button>
          {currentQuest && (
            <>
              <span className="text-cream-mute">·</span>
              <button
                type="button"
                onClick={closeQuest}
                className="btn-ghost text-sm py-1.5"
              >
                Quest hub
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="chip-night hidden sm:inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-butter" />
            {badges.length} / 8 badges
          </span>
          <button
            type="button"
            onClick={() => setScreen('leaderboard')}
            className="btn-ghost text-sm py-1.5"
          >
            Leaderboard
          </button>
          <AuthButton />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 overflow-y-auto px-6 py-10">
          <QuestRouter />
        </main>
        <SuiseiChat />
      </div>
    </div>
  );
}
