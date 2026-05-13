import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LESSONS, SANDBOX_UNLOCK_COUNT } from '@/data/lessons';

export type Screen = 'landing' | 'lessons' | 'lesson' | 'sandbox';
export type LessonStage = 'read' | 'check' | 'build' | 'done';

interface AppState {
  screen: Screen;
  currentLessonId: string | null;
  lessonStage: LessonStage;
  completedLessons: string[];
  seenHowTo: boolean;

  setScreen: (s: Screen) => void;
  openLesson: (id: string) => void;
  closeLesson: () => void;
  setLessonStage: (s: LessonStage) => void;
  completeLesson: (id: string) => void;
  markHowToSeen: () => void;
  resetHowTo: () => void;

  isSandboxUnlocked: () => boolean;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'landing',
      currentLessonId: null,
      lessonStage: 'read',
      completedLessons: [],
      seenHowTo: false,

      setScreen: (s) => set({ screen: s }),
      openLesson: (id) =>
        set({
          screen: 'lesson',
          currentLessonId: id,
          lessonStage: 'read',
        }),
      closeLesson: () =>
        set({
          screen: 'lessons',
          currentLessonId: null,
          lessonStage: 'read',
        }),
      setLessonStage: (lessonStage) => set({ lessonStage }),
      completeLesson: (id) =>
        set((state) =>
          state.completedLessons.includes(id)
            ? state
            : { completedLessons: [...state.completedLessons, id] }
        ),
      markHowToSeen: () => set({ seenHowTo: true }),
      resetHowTo: () => set({ seenHowTo: false }),

      isSandboxUnlocked: () => get().completedLessons.length >= SANDBOX_UNLOCK_COUNT,
    }),
    {
      name: 'blockbuilders-app',
      partialize: (s) => ({
        completedLessons: s.completedLessons,
        seenHowTo: s.seenHowTo,
        screen: s.screen,
      }),
    }
  )
);

// Re-export for convenience so consumers don't need two imports
export { LESSONS, SANDBOX_UNLOCK_COUNT };
