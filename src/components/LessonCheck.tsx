import { useEffect, useMemo, useState } from 'react';
import { Check, X, ArrowRight, BookOpen, MousePointer2, RotateCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { World } from './World';
import type { Lesson } from '@/data/lessons';
import { useApp } from '@/state/app';
import { useWorld } from '@/state/world';
import { sfx } from '@/audio/sfx';

type Phase = 'asking' | 'placing' | 'placed';

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
  const startPiece = useWorld((s) => s.startPiece);
  const cancelPiece = useWorld((s) => s.cancelPiece);
  const pendingPiece = useWorld((s) => s.pendingPiece);

  const [qi, setQi] = useState(
    () => Math.max(0, lesson.quiz.findIndex((_, i) => !hasAnsweredCorrect(lesson.id, i)))
  );
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('asking');
  const total = lesson.quiz.length;
  const safeQi = Math.min(qi, total - 1);
  const q = lesson.quiz[safeQi];

  const correctSoFar = useMemo(
    () => lesson.quiz.filter((_, i) => hasAnsweredCorrect(lesson.id, i)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lesson.id, qi, phase]
  );

  // When the user actually drops the piece, pendingPiece clears → advance.
  useEffect(() => {
    if (phase === 'placing' && pendingPiece === null) {
      setPhase('placed');
    }
  }, [pendingPiece, phase]);

  // Auto-advance when current lesson's quiz is fully answered.
  useEffect(() => {
    if (correctSoFar === total) {
      const t = setTimeout(() => onPass(), 700);
      return () => clearTimeout(t);
    }
  }, [correctSoFar, total, onPass]);

  // Cancel any pending piece if user navigates away.
  useEffect(() => {
    return () => {
      cancelPiece();
    };
  }, [cancelPiece]);

  const choose = (idx: number) => {
    if (phase !== 'asking') return;
    setPicked(idx);
    if (idx === q.correctIndex) {
      const wasNew = recordCorrect(lesson.id, safeQi);
      sfx.sparkle();
      if (wasNew) {
        startPiece(q.reward.pieceKey, q.reward.type);
      }
      setPhase('placing');
    } else {
      sfx.error();
    }
  };

  const tryAgain = () => {
    setPicked(null);
    setPhase('asking');
  };

  const advance = () => {
    if (safeQi >= total - 1) {
      onPass();
      return;
    }
    setQi((i) => i + 1);
    setPicked(null);
    setPhase('asking');
  };

  return (
    <div className="fixed inset-0 bg-ink flex flex-col">
      <header className="px-4 sm:px-6 py-3 flex items-center gap-3 border-b border-ink-line/60 z-30 shrink-0">
        <button type="button" onClick={onReread} className="btn-ghost flex items-center gap-1.5 text-sm">
          <BookOpen size={14} />
          Re-read
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-fg-mute">
            Lesson · {lesson.title}
          </div>
          <div className="text-xs text-fg-dim truncate">{lesson.district}</div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded-full border border-ink-line text-fg-mute">
          {correctSoFar}/{total}
        </span>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_440px] overflow-hidden">
        {/* World canvas */}
        <div className="relative min-h-[260px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-ink-line/60">
          <ErrorBoundary>
            <World />
          </ErrorBoundary>

          {phase === 'placing' && (
            <PlacementOverlay />
          )}
        </div>

        {/* Question panel */}
        <main className="overflow-y-auto p-6 sm:p-8 flex flex-col">
          <div className="font-mono text-[10px] uppercase tracking-widest text-fg-mute mb-2">
            Question {safeQi + 1} / {total}
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-fg mb-6 leading-snug">
            {q.prompt}
          </h2>

          <div className="space-y-2 mb-6">
            {q.options.map((opt, idx) => {
              const isPicked = picked === idx;
              const isRight = idx === q.correctIndex;
              const reveal = phase !== 'asking';
              const showState = reveal && (isPicked || isRight);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => choose(idx)}
                  disabled={phase !== 'asking'}
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

          {phase === 'placing' && (
            <div className="rounded-xl border border-accent-cyan/40 bg-accent-cyan/10 p-3 text-sm animate-fade-in">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan mb-1">
                Correct
              </p>
              <p className="text-fg leading-relaxed">
                You earned a piece. Drag your cursor over the map and click to drop it.
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-mono text-fg-mute">
                <span className="flex items-center gap-1">
                  <MousePointer2 size={11} /> click to place
                </span>
                <span className="flex items-center gap-1">
                  <RotateCw size={11} /> <span className="kbd">R</span> to rotate
                </span>
              </div>
            </div>
          )}

          {picked !== null && picked !== q.correctIndex && phase !== 'placing' && (
            <p className="text-sm text-accent-magenta animate-fade-in">
              Not quite — try again. No penalty.
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center justify-end gap-2">
            {phase === 'asking' && (
              <span className="text-xs font-mono text-fg-mute">
                {picked !== null && picked !== q.correctIndex ? 'wrong — pick again' : 'pick an answer'}
              </span>
            )}
            {phase === 'placing' && (
              <span className="text-xs font-mono text-fg-mute">
                place your piece on the map
              </span>
            )}
            {phase === 'placed' && (
              <button
                type="button"
                onClick={advance}
                className="btn-primary flex items-center gap-1.5"
              >
                {safeQi >= total - 1 ? 'Finish lesson →' : 'Next question'}
                <ArrowRight size={14} />
              </button>
            )}
            {picked !== null && picked !== q.correctIndex && (
              <button type="button" onClick={tryAgain} className="btn-ghost">
                Try again
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function PlacementOverlay() {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <div className="bg-accent-cyan/15 border border-accent-cyan/40 rounded-full px-4 py-1.5 text-xs font-mono text-accent-cyan flex items-center gap-2 animate-pulse-soft">
        <MousePointer2 size={12} />
        click anywhere on the map to drop your piece — R rotates
      </div>
    </div>
  );
}
