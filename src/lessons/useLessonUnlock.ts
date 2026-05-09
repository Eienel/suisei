import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '@/state/store';
import { findNewlyUnlocked } from './detect';
import { sfx } from '@/audio/sfx';

/**
 * Subscribes to placedBricks. Whenever the board changes, checks every
 * not-yet-unlocked lesson; queues newly satisfied ones for the modal.
 *
 * Returns:
 *  - currentLessonId: the lesson at the head of the queue (or null)
 *  - dismissCurrent: drop the current lesson and advance to the next
 */
export function useLessonUnlock() {
  const placedBricks = useApp((s) => s.placedBricks);
  const unlockedLessons = useApp((s) => s.unlockedLessons);
  const unlockLesson = useApp((s) => s.unlockLesson);

  const [queue, setQueue] = useState<string[]>([]);
  // Track lessons already added to queue so we don't re-queue across re-renders.
  const seenRef = useRef<Set<string>>(new Set(unlockedLessons));

  useEffect(() => {
    const placedTypes = placedBricks.map((b) => b.type);
    const fresh = findNewlyUnlocked(placedTypes, seenRef.current);
    if (fresh.length === 0) return;
    fresh.forEach((l) => {
      seenRef.current.add(l.id);
      unlockLesson(l.id);
    });
    sfx.chime();
    setQueue((q) => [...q, ...fresh.map((l) => l.id)]);
  }, [placedBricks, unlockLesson]);

  const dismissCurrent = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  return {
    currentLessonId: queue[0] ?? null,
    queueLength: queue.length,
    dismissCurrent,
  };
}
