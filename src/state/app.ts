import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BadgeRef, QuestId, QuestPhase } from '@/types';

/**
 * App-level screen routing + persisted quest progress. Keeps the
 * surface intentionally small: which screen is showing, which quest
 * the player is in, and the soulbound badges they've collected. Per-
 * quest state (Move code drafts, deploy attempts, etc.) lives in the
 * quest components themselves.
 */
export type Screen = 'landing' | 'play' | 'leaderboard' | 'profile';

interface AppState {
  screen: Screen;
  currentQuest: QuestId | null;
  questPhase: QuestPhase;
  badges: BadgeRef[];

  setScreen: (s: Screen) => void;
  openQuest: (id: QuestId) => void;
  closeQuest: () => void;
  setQuestPhase: (p: QuestPhase) => void;
  awardBadge: (b: BadgeRef) => void;
  resetProgress: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      screen: 'landing',
      currentQuest: null,
      questPhase: 'intro',
      badges: [],

      setScreen: (s) => set({ screen: s }),
      openQuest: (id) => set({ screen: 'play', currentQuest: id, questPhase: 'intro' }),
      closeQuest: () => set({ currentQuest: null, questPhase: 'intro' }),
      setQuestPhase: (p) => set({ questPhase: p }),
      awardBadge: (b) =>
        set((s) =>
          s.badges.some((x) => x.questId === b.questId)
            ? s
            : { badges: [...s.badges, b] }
        ),
      resetProgress: () =>
        set({ badges: [], currentQuest: null, questPhase: 'intro', screen: 'landing' }),
    }),
    {
      name: 'suisei-app',
      partialize: (s) => ({
        screen: s.screen,
        badges: s.badges,
      }),
    }
  )
);
