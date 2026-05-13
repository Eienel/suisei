import { useEffect, useMemo, useState } from 'react';
import { Check, X, ArrowRight, BookOpen } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { World } from './World';
import type { Lesson } from '@/data/lessons';
import { useApp } from '@/state/app';
import { useWorld } from '@/state/world';
import { sfx } from '@/audio/sfx';

/**
 * Quiz screen, live-build edition.
 * Each correct answer drops the question's `reward` block into the world.
 * The split view keeps both halves visible — question + the growing town.
 */
export function LessonCheck({
  lesson,
  onPass,
  onReread,
}: {
  lesson: Lesson;
  onPass: () => void;
  onReread: () => void;
}) {
  const recordCorrect = useApp((s) => s.recordCorrect);
  const hasAnsweredCorrect = useApp((s) => s.hasAnsweredCorrect);
  const placeBlock = useWorld((s) => s.placeBlock);

  // Start at the first un-answered question (so resuming a half-done quiz works).
  const [qi, setQi] = useState(
    () => Math.max(0, lesson.quiz.findIndex((_, i) => !hasAnsweredCorrect(lesson.id, i)))
  );
  const [picked, setPicked] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const total = lesson.quiz.length;
  const q = lesson.quiz[Math.min(qi, total - 1)];

  const correctSoFar = useMemo(
    () => lesson.quiz.filter((_, i) => hasAnsweredCorrect(lesson.id, i)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lesson.id, qi, reveal]
  );

  const allDone = correctSoFar === total;

  // If already complete coming in, advance.
  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => onPass(), 600);
      return () => clearTimeout(t);
    }
  }, [allDone, onPass]);

  const choose = (idx: number) => {
    if (reveal || allDone) return;
    setPicked(idx);
    setReveal(true);
    if (idx === q.correctIndex) {
      const wasNew = recordCorrect(lesson.id, qi);
      if (wasNew) {
        placeBlock(q.reward.type, q.reward.position);
        sfx.sparkle();
      }
    } else {
      sfx.error();
    }
  };

  const next = () => {
    if (!reveal) return;
    const correct = picked === q.correctIndex;
    if (!correct) {
      // Wrong — give them another shot at the same question.
      setReveal(false);
      setPicked(null);
      return;
    }
    if (qi >= total - 1) {
      onPass();
      return;
    }
    setQi((i) => i + 1);
    setReveal(false);
    setPicked(null);
  };

  return (
    <div className="fixed inset-0 bg-ink flex flex-col">
      {/* Top bar */}
      <header className="px-4 sm:px-6 py-3 flex items-center gap-3 border-b border-ink-line/60 z-30 shrink-0">
        <button type="button" onClick={onReread} className="btn-ghost flex items-center gap-1.5 text-sm">
          <BookOpen size={14} />
          Re-read
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-fg-mute">
            Lesson · {lesson.title}
          </div>
          <div className="text-xs text-fg-dim truncate">{lesson.district} · {lesson.blurb}</div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded-full border border-ink-line text-fg-mute">
          {correctSoFar}/{total} blocks
        </span>
      </header>

      {/* Split: 3D world + question */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_440px] overflow-hidden">
        {/* World */}
        <div className="relative min-h-[260px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-ink-line/60">
          <ErrorBoundary>
            <World />
          </ErrorBoundary>
          <BuildBanner correctSoFar={correctSoFar} total={total} />
        </div>

        {/* Question */}
        <main className="overflow-y-auto p-6 sm:p-8 flex flex-col">
          <div className="font-mono text-[10px] uppercase tracking-widest text-fg-mute mb-2">
            Question {qi + 1} / {total}
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-fg mb-6 leading-snug">
            {q.prompt}
          </h2>
          <div className="space-y-2 mb-6">
            {q.options.map((opt, idx) => {
              const isPicked = picked === idx;
              const isRight = idx === q.correctIndex;
              const showState = reveal && (isPicked || isRight);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => choose(idx)}
                  disabled={reveal || allDone}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    !reveal
                      ? 'bg-ink-soft/60 border-ink-line hover:border-accent-cyan/40 hover:bg-ink-soft'
                      : showState && isRight
                        ? 'bg-accent-cyan/15 border-accent-cyan text-fg'
                        : isPicked
                          ? 'bg-accent-magenta/15 border-accent-magenta'
                          : 'bg-ink-soft/30 border-ink-line/60 opacity-50'
                  }`}
                >
                  <span className="text-fg text-sm sm:text-base leading-snug">{opt}</span>
                  {showState && isRight && <Check size={16} className="text-accent-cyan shrink-0" />}
                  {showState && !isRight && isPicked && (
                    <X size={16} className="text-accent-magenta shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {reveal && (
            <p
              className={`text-sm leading-relaxed mb-4 animate-fade-in ${
                picked === q.correctIndex ? 'text-accent-cyan' : 'text-accent-magenta'
              }`}
            >
              {picked === q.correctIndex
                ? 'Nice — a block just dropped into your world.'
                : 'Not quite. Try again — no penalty.'}
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={next}
              disabled={!reveal}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-40"
            >
              {!reveal
                ? 'Pick an answer'
                : picked === q.correctIndex
                  ? qi >= total - 1
                    ? 'Lesson done →'
                    : 'Next question'
                  : 'Try again'}
              {reveal && picked === q.correctIndex && <ArrowRight size={14} />}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function BuildBanner({ correctSoFar, total }: { correctSoFar: number; total: number }) {
  return (
    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
      <div className="glass rounded-full px-3 py-1.5 text-[11px] font-mono text-fg-dim">
        watch your town grow as you answer
      </div>
      <div className="glass rounded-full px-3 py-1.5 text-[11px] font-mono text-fg-dim">
        {correctSoFar} / {total} placed
      </div>
    </div>
  );
}
