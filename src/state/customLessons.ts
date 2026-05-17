import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lesson } from '@/data/lessons';

/**
 * AI-generated lessons live separately from the curriculum so the
 * built-in Crypto 101 progression isn't muddied. They use the same
 * Lesson shape — render path, reducers, and rewards are all reused.
 */

interface CustomLessonsState {
  lessons: Lesson[];
  add: (lesson: Lesson) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCustomLessons = create<CustomLessonsState>()(
  persist(
    (set) => ({
      lessons: [],
      add: (lesson) =>
        set((s) => ({
          lessons: s.lessons.some((l) => l.id === lesson.id)
            ? s.lessons
            : [lesson, ...s.lessons].slice(0, 12),
        })),
      remove: (id) =>
        set((s) => ({ lessons: s.lessons.filter((l) => l.id !== id) })),
      clear: () => set({ lessons: [] }),
    }),
    { name: 'blockbuilders-custom-lessons' }
  )
);

export function customLessonId(topic: string): string {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `custom:${slug || 'lesson'}-${Date.now().toString(36).slice(-4)}`;
}
