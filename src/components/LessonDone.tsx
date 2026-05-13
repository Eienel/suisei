import { Check, ArrowRight, Home, Cuboid } from 'lucide-react';
import type { Lesson } from '@/data/lessons';
import { LESSONS, SANDBOX_UNLOCK_COUNT } from '@/data/lessons';
import { useApp } from '@/state/app';
import { useWorld } from '@/state/world';

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
  const placed = useWorld((s) => s.blocks.length);
  const isFinal = completed.length === LESSONS.length;

  return (
    <div className="fixed inset-0 bg-ink flex items-center justify-center p-6">
      <div className="rounded-2xl p-8 max-w-md w-full bg-ink-soft border border-ink-line text-center animate-rise-in">
        <div className="w-16 h-16 rounded-full bg-accent-cyan/15 text-accent-cyan flex items-center justify-center mx-auto mb-4">
          <Check size={32} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan mb-1">
          {isFinal ? 'All lessons complete' : 'Lesson complete'}
        </p>
        <h2 className="text-2xl font-semibold text-fg mb-2 tracking-tight">{lesson.title}</h2>
        <p className="text-sm text-fg-mute mb-4">
          {lesson.district} added. {placed} of {LESSONS.reduce((s, l) => s + l.quiz.length, 0)}{' '}
          blocks placed.
        </p>

        {isFinal && (
          <div className="mt-4 mb-2 rounded-xl border border-accent-cyan/40 bg-accent-cyan/10 p-3 text-left">
            <p className="text-accent-cyan text-xs font-mono uppercase tracking-widest mb-1">
              Town built
            </p>
            <p className="text-fg-dim text-sm leading-relaxed">
              You finished every lesson — your full crypto town is on the map.
              Head to the Sandbox and keep building.
            </p>
          </div>
        )}

        {!isFinal && justUnlockedSandbox && (
          <div className="mt-4 mb-2 rounded-xl border border-accent-violet/40 bg-accent-violet/10 p-3 text-left">
            <p className="text-accent-violet text-xs font-mono uppercase tracking-widest mb-1">
              Sandbox unlocked
            </p>
            <p className="text-fg-dim text-sm leading-relaxed">
              You finished 3 lessons — free-play with the AI Builder Agent is now open.
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
          {(isFinal || justUnlockedSandbox) && (
            <button
              type="button"
              onClick={() => setScreen('sandbox')}
              className="rounded-lg px-4 py-2 font-semibold bg-accent-violet text-ink hover:bg-accent-violet/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <Cuboid size={14} />
              Open Sandbox
            </button>
          )}
          <button
            type="button"
            onClick={onHome}
            className="btn-ghost flex items-center justify-center gap-1.5"
          >
            <Home size={14} />
            Back to lessons
          </button>
        </div>
      </div>
    </div>
  );
}
