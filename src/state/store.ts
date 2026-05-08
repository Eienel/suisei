import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlacedBrick, Screen } from '@/types';

interface AppState {
  screen: Screen;
  placedBricks: PlacedBrick[];
  unlockedLessons: string[];

  setScreen: (s: Screen) => void;
  addPlacedBrick: (b: PlacedBrick) => void;
  movePlacedBrick: (uid: string, gridX: number, gridY: number) => void;
  removePlacedBrick: (uid: string) => void;
  unlockLesson: (id: string) => void;
  resetBoard: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      screen: 'landing',
      placedBricks: [],
      unlockedLessons: [],

      setScreen: (s) => set({ screen: s }),
      addPlacedBrick: (b) =>
        set((state) => ({ placedBricks: [...state.placedBricks, b] })),
      movePlacedBrick: (uid, gridX, gridY) =>
        set((state) => ({
          placedBricks: state.placedBricks.map((b) =>
            b.uid === uid ? { ...b, gridX, gridY } : b
          ),
        })),
      removePlacedBrick: (uid) =>
        set((state) => ({
          placedBricks: state.placedBricks.filter((b) => b.uid !== uid),
        })),
      unlockLesson: (id) =>
        set((state) =>
          state.unlockedLessons.includes(id)
            ? state
            : { unlockedLessons: [...state.unlockedLessons, id] }
        ),
      resetBoard: () => set({ placedBricks: [] }),
    }),
    {
      name: 'blockbuilders-state',
      partialize: (s) => ({
        placedBricks: s.placedBricks,
        unlockedLessons: s.unlockedLessons,
      }),
    }
  )
);
