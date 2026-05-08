import { useState } from 'react';
import { LESSON_BY_ID } from '@/data/lessons';

/**
 * Sprint 0: stub. Sprint 2 will mount this from the combo detector.
 * For now, exposes a toggleable shell so we can preview styling later.
 */
export function LessonModal({
  lessonId,
  onClose,
}: {
  lessonId: string | null;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  if (!lessonId) return null;
  const lesson = LESSON_BY_ID[lessonId];
  if (!lesson) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 150);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        closing ? 'opacity-0' : 'opacity-100'
      } transition-opacity bg-brand-ink/40 backdrop-blur-sm`}
      onClick={handleClose}
    >
      <div
        className="bg-brand-cream max-w-md w-full rounded-2xl shadow-brick-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-brand-blue font-bold uppercase tracking-widest text-xs mb-2">
          Lesson unlocked
        </p>
        <h3 className="font-extrabold text-2xl text-brand-ink mb-3">{lesson.title}</h3>
        <p className="text-brand-ink-soft leading-relaxed mb-6">{lesson.body}</p>
        <button
          type="button"
          onClick={handleClose}
          className="bg-brand-blue text-white font-bold px-5 py-3 rounded-brick shadow-brick"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
