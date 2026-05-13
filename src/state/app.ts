import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LESSONS, SANDBOX_UNLOCK_COUNT, questionId } from '@/data/lessons';

export type Screen = 'landing' | 'lessons' | 'lesson' | 'sandbox';
export type LessonStage = 'read' | 'check' | 'done';

interface AppState {
  screen: Screen;
  currentLessonId: string | null;
  lessonStage: LessonStage;
  completedLessons: string[];
  /** Stable ids of questions answered correctly — prevents double-placing blocks on revisit. */
  correctlyAnswered: string[];
  seenHowTo: boolean;

  setScreen: (s: Screen) => void;
  openLesson: (id: string) => void;
  closeLesson: () => void;
  setLessonStage: (s: LessonStage) => void;
  completeLesson: (id: string) => void;
  recordCorrect: (lessonId: string, idx: number) => boolean; // returns true if newly correct
  hasAnsweredCorrect: (lessonId: string, idx: number) => boolean;
  markHowToSeen: () => void;
  resetHowTo: () => void;
  resetProgress: () => void;

  isSandboxUnlocked: () => boolean;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'landing',
      currentLessonId: null,
      lessonStage: 'read',
      completedLessons: [],
      correctlyAnswered: [],
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
      recordCorrect: (lessonId, idx) => {
        const key = questionId(lessonId, idx);
        const { correctlyAnswered } = get();
        if (correctlyAnswered.includes(key)) return false;
        set({ correctlyAnswered: [...correctlyAnswered, key] });
        return true;
      },
      hasAnsweredCorrect: (lessonId, idx) =>
        get().correctlyAnswered.includes(questionId(lessonId, idx)),
      markHowToSeen: () => set({ seenHowTo: true }),
      resetHowTo: () => set({ seenHowTo: false }),
      resetProgress: () =>
        set({
          completedLessons: [],
          correctlyAnswered: [],
          currentLessonId: null,
          lessonStage: 'read',
          screen: 'landing',
        }),

      isSandboxUnlocked: () => get().completedLessons.length >= SANDBOX_UNLOCK_COUNT,
    }),
    {
      name: 'blockbuilders-app',
      partialize: (s) => ({
        completedLessons: s.completedLessons,
        correctlyAnswered: s.correctlyAnswered,
        seenHowTo: s.seenHowTo,
        screen: s.screen,
      }),
    }
  )
);

export { LESSONS, SANDBOX_UNLOCK_COUNT };
