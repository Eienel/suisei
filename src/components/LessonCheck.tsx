import { useState } from 'react';
import { Check, X, ArrowRight, HelpCircle } from 'lucide-react';
import type { Lesson } from '@/data/lessons';

export function LessonCheck({
  lesson,
  onPass,
  onRetry,
}: {
  lesson: Lesson;
  onPass: () => void;
  onRetry: () => void;
}) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const q = lesson.quiz[qi];
  const total = lesson.quiz.length;

  const choose = (idx: number) => {
    if (reveal) return;
    setPicked(idx);
    setReveal(true);
  };

  const isCorrect = picked !== null && picked === q.correctIndex;
  const isLast = qi === total - 1;

  const next = () => {
    if (!reveal) return;
    if (!isCorrect) {
      // Wrong on this question → bounce back to read.
      onRetry();
      return;
    }
    if (isLast) {
      onPass();
      return;
    }
    setQi((i) => i + 1);
    setPicked(null);
    setReveal(false);
  };

  return (
    <div className="fixed inset-0 bg-ink flex flex-col">
      <header className="px-6 sm:px-10 py-5 flex items-center gap-3 border-b border-ink-line/60">
        <HelpCircle size={18} className="text-accent-amber" />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-fg-mute">
            Quick check · {lesson.title}
          </div>
          <div className="text-xs text-fg-dim">
            Question {qi + 1} / {total}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-12">
        <div className="max-w-2xl mx-auto animate-rise-in">
          <h2 className="text-2xl sm:text-3xl font-semibold text-fg mb-6 leading-snug">
            {q.prompt}
          </h2>
          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              const isPicked = picked === idx;
              const isRight = idx === q.correctIndex;
              const showState = reveal && (isPicked || isRight);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => choose(idx)}
                  disabled={reveal}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    !reveal
                      ? 'bg-ink-soft/60 border-ink-line hover:border-accent-cyan/40 hover:bg-ink-soft'
                      : showState && isRight
                        ? 'bg-accent-cyan/15 border-accent-cyan text-fg'
                        : isPicked
                          ? 'bg-accent-magenta/15 border-accent-magenta'
                          : 'bg-ink-soft/30 border-ink-line/60 opacity-50'
                  }`}
                >
                  <span className="text-fg text-base leading-snug">{opt}</span>
                  {showState && isRight && <Check size={18} className="text-accent-cyan shrink-0" />}
                  {showState && !isRight && isPicked && (
                    <X size={18} className="text-accent-magenta shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {reveal && (
            <div className="mt-6 text-sm leading-relaxed animate-fade-in">
              {isCorrect ? (
                <p className="text-accent-cyan font-medium">Nice. {isLast ? 'Onto the build.' : 'Next one.'}</p>
              ) : (
                <p className="text-accent-magenta font-medium">
                  Not quite. Let's flip back to the reading and try the quiz again.
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="px-6 sm:px-10 py-5 border-t border-ink-line/60 flex items-center justify-end">
        <button
          type="button"
          onClick={next}
          disabled={!reveal}
          className={`flex items-center gap-1.5 disabled:opacity-40 ${
            reveal && !isCorrect ? 'btn-ghost' : 'btn-primary'
          }`}
        >
          {!reveal ? 'Pick an answer' : isCorrect ? (isLast ? 'Build it →' : 'Next question') : 'Re-read'}
          {reveal && <ArrowRight size={14} />}
        </button>
      </footer>
    </div>
  );
}
