import { Check, ArrowRight, Home } from 'lucide-react';
import type { Lesson } from '@/data/lessons';
import { useApp } from '@/state/app';
import { LESSONS, SANDBOX_UNLOCK_COUNT } from '@/data/lessons';

export function LessonDone({
  lesson,
  onNext,
  onHome,
}: {
  lesson: Lesson;
  onNext: (() => void) | null;
  onHome: () => void;
}) {
  const completed = useApp((s) => s.completedLessons);
  const setScreen = useApp((s) => s.setScreen);
  const sandboxUnlocked = useApp((s) => s.isSandboxUnlocked());
  const justUnlockedSandbox =
    completed.length === SANDBOX_UNLOCK_COUNT && sandboxUnlocked;

  return (
    <div className="fixed inset-0 bg-ink flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glass text-center animate-rise-in">
        <div className="w-16 h-16 rounded-full bg-accent-cyan/15 text-accent-cyan flex items-center justify-center mx-auto mb-4">
          <Check size={32} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan mb-1">
          Lesson complete
        </p>
        <h2 className="text-2xl font-semibold text-fg mb-2 tracking-tight">{lesson.title}</h2>
        <p className="text-sm text-fg-mute mb-1">
          {completed.length} of {LESSONS.length} lessons mastered.
        </p>

        {justUnlockedSandbox && (
          <div className="mt-4 mb-2 rounded-xl border border-accent-violet/40 bg-accent-violet/10 p-3 text-left animate-fade-in">
            <p className="text-accent-violet text-xs font-mono uppercase tracking-widest mb-1">
              Sandbox unlocked
            </p>
            <p className="text-fg-dim text-sm leading-relaxed">
              You finished 3 lessons — free-play mode with the AI Builder Agent is now available.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-6">
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="btn-primary flex items-center justify-center gap-1.5"
            >
              Next lesson
              <ArrowRight size={14} />
            </button>
          )}
          {justUnlockedSandbox && (
            <button
              type="button"
              onClick={() => setScreen('sandbox')}
              className="rounded-lg px-4 py-2 font-semibold bg-accent-violet text-ink hover:bg-accent-violet/90 transition-colors"
            >
              Try the Sandbox
            </button>
          )}
          <button
            type="button"
            onClick={onHome}
            className="btn-ghost flex items-center justify-center gap-1.5"
          >
            <Home size={14} />
            All lessons
          </button>
        </div>
      </div>
    </div>
  );
}
