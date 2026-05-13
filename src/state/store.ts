import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlacedBrick, Screen } from '@/types';
import { LESSONS } from '@/data/lessons';

interface AppState {
  screen: Screen;
  currentLessonId: string | null;

  placedBricks: PlacedBrick[];
  unlockedLessons: string[];   // sandbox combo discoveries
  completedLessons: string[];  // lessons-mode finishes (with puzzle solved)
  seenHowTo: boolean;

  setScreen: (s: Screen) => void;
  openLesson: (id: string) => void;
  closeLesson: () => void;

  addPlacedBrick: (b: PlacedBrick) => void;
  movePlacedBrick: (uid: string, gridX: number, gridY: number) => void;
  removePlacedBrick: (uid: string) => void;
  unlockLesson: (id: string) => void;     // sandbox combo found
  completeLesson: (id: string) => void;   // puzzle solved
  resetBoard: () => void;
  markHowToSeen: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      screen: 'landing',
      currentLessonId: null,

      placedBricks: [],
      unlockedLessons: [],
      completedLessons: [],
      seenHowTo: false,

      setScreen: (s) => set({ screen: s }),
      openLesson: (id) => set({ screen: 'lesson', currentLessonId: id }),
      closeLesson: () => set({ screen: 'lessons', currentLessonId: null }),

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
      completeLesson: (id) =>
        set((state) =>
          state.completedLessons.includes(id)
            ? state
            : { completedLessons: [...state.completedLessons, id] }
        ),
      resetBoard: () => set({ placedBricks: [] }),
      markHowToSeen: () => set({ seenHowTo: true }),
    }),
    {
      name: 'blockbuilders-state',
      partialize: (s) => ({
        placedBricks: s.placedBricks,
        unlockedLessons: s.unlockedLessons,
        completedLessons: s.completedLessons,
        seenHowTo: s.seenHowTo,
      }),
    }
  )
);

/** A lesson is unlocked if it's the first one OR the previous is completed. */
export function isLessonUnlocked(lessonId: string, completed: string[]): boolean {
  const i = LESSONS.findIndex((l) => l.id === lessonId);
  if (i <= 0) return true;
  const prev = LESSONS[i - 1];
  return completed.includes(prev.id);
}
