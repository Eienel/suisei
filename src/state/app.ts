import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  seenHowTo: boolean;
  markHowToSeen: () => void;
  resetHowTo: () => void;
}

/** Cross-cutting UI flags (onboarding, etc.) — persisted to localStorage. */
export const useApp = create<AppState>()(
  persist(
    (set) => ({
      seenHowTo: false,
      markHowToSeen: () => set({ seenHowTo: true }),
      resetHowTo: () => set({ seenHowTo: false }),
    }),
    { name: 'blockbuilders-app' }
  )
);
