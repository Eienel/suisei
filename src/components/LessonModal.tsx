import { useEffect, useState } from 'react';
import { LESSON_BY_ID } from '@/data/lessons';
import { BRICK_BY_ID } from '@/game/bricks/brickTypes';
import { comboCounts } from '@/lessons/comboCounts';

export function LessonModal({
  lessonId,
  queueLength,
  onClose,
}: {
  lessonId: string | null;
  queueLength: number;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);

  // Reset closing state when a new lesson appears.
  useEffect(() => {
    setClosing(false);
  }, [lessonId]);

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
        <div className="flex items-center justify-between mb-3">
          <p className="text-brand-blue font-bold uppercase tracking-widest text-xs">
            Lesson unlocked
          </p>
          {queueLength > 1 && (
            <span className="text-xs font-bold text-brand-ink-soft">
              +{queueLength - 1} more
            </span>
          )}
        </div>
        <h3 className="font-extrabold text-2xl text-brand-ink mb-2">{lesson.title}</h3>
        <div className="flex flex-wrap gap-1 mb-4">
          {comboCounts(lesson.triggerCombo).map(({ type, count }) => {
            const def = BRICK_BY_ID[type];
            return (
              <span
                key={type}
                className="text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full"
                style={{ backgroundColor: def.color }}
              >
                {def.shortLabel}
                {count > 1 ? ` ×${count}` : ''}
              </span>
            );
          })}
        </div>
        <p className="text-brand-ink-soft leading-relaxed mb-6">{lesson.body}</p>
        <button
          type="button"
          onClick={handleClose}
          className="bg-brand-blue text-white font-bold px-5 py-3 rounded-brick shadow-brick"
        >
          {queueLength > 1 ? 'Next →' : 'Got it'}
        </button>
      </div>
    </div>
  );
}
