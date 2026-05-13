import { useApp, LESSONS, SANDBOX_UNLOCK_COUNT } from '@/state/app';
import { isLessonUnlocked, totalBlocks } from '@/data/lessons';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import { useWorld } from '@/state/world';
import { Lock, Check, ArrowRight, Cuboid, Sparkles, RotateCcw } from 'lucide-react';

export function LessonsList() {
  const completed = useApp((s) => s.completedLessons);
  const openLesson = useApp((s) => s.openLesson);
  const setScreen = useApp((s) => s.setScreen);
  const sandboxUnlocked = useApp((s) => s.isSandboxUnlocked());
  const correctlyAnswered = useApp((s) => s.correctlyAnswered);
  const resetProgress = useApp((s) => s.resetProgress);
  const clearWorld = useWorld((s) => s.clearWorld);

  const placed = useWorld((s) => s.blocks.length);
  const totalToPlace = totalBlocks();

  const onReset = () => {
    if (confirm('Reset all progress and clear the town? This cannot be undone.')) {
      clearWorld();
      resetProgress();
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-ink">
      <header className="max-w-5xl mx-auto px-6 sm:px-10 pt-10 pb-6 flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-fg-mute mb-2">
            BlockBuilders
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-2">
            Six lessons. One town.
          </h1>
          <p className="text-fg-mute max-w-xl leading-relaxed">
            Read each lesson, then answer the questions. Every right answer drops
            a block into your world. Finish all six and you'll have built a small crypto town.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-xs text-fg-mute">blocks placed</div>
          <div className="font-mono text-2xl font-semibold text-fg">
            {placed}
            <span className="text-fg-mute">/{totalToPlace}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-10 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LESSONS.map((l, idx) => {
            const isDone = completed.includes(l.id);
            const isUnlocked = isLessonUnlocked(l.id, completed);
            const districtTypes = Array.from(new Set(l.quiz.map((q) => q.reward.type)));
            const placedHere = l.quiz.filter((_, qi) =>
              correctlyAnswered.includes(`${l.id}:${qi}`)
            ).length;

            return (
              <button
                key={l.id}
                type="button"
                onClick={() => isUnlocked && openLesson(l.id)}
                disabled={!isUnlocked}
                className={`group text-left rounded-2xl p-5 border transition-all relative overflow-hidden ${
                  isUnlocked
                    ? 'bg-ink-soft/60 border-ink-line hover:border-accent-cyan/40 cursor-pointer'
                    : 'bg-ink-soft/30 border-ink-line/40 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-fg-mute mb-1">
                      Lesson {idx + 1} · {l.district}
                    </div>
                    <h3 className="text-xl font-semibold text-fg leading-tight">{l.title}</h3>
                  </div>
                  <div className="shrink-0">
                    {isDone ? (
                      <div className="w-8 h-8 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center">
                        <Check size={16} />
                      </div>
                    ) : !isUnlocked ? (
                      <div className="w-8 h-8 rounded-full bg-ink-line/60 text-fg-mute flex items-center justify-center">
                        <Lock size={14} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-ink-line/60 text-fg-dim flex items-center justify-center group-hover:bg-accent-cyan group-hover:text-ink transition-colors">
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-fg-mute mb-4 leading-relaxed">{l.blurb}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex -space-x-1">
                    {districtTypes.map((t) => {
                      const def = BLOCK_BY_ID[t];
                      return (
                        <span
                          key={t}
                          title={def.label}
                          className="w-4 h-4 rounded-sm border-2 border-ink-soft"
                          style={{ background: def.color, boxShadow: `0 0 6px ${def.color}88` }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-mono text-fg-mute">
                    {placedHere}/{l.quiz.length} blocks
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sandbox card */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => sandboxUnlocked && setScreen('sandbox')}
            disabled={!sandboxUnlocked}
            className={`w-full rounded-2xl p-5 border transition-all flex items-center gap-4 text-left ${
              sandboxUnlocked
                ? 'bg-ink-soft/60 border-ink-line hover:border-accent-violet/40 cursor-pointer'
                : 'bg-ink-soft/30 border-ink-line/40 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-accent-violet/15 text-accent-violet flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-fg">Sandbox</h3>
                {!sandboxUnlocked && (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-fg-mute bg-ink-line px-2 py-0.5 rounded">
                    Finish {SANDBOX_UNLOCK_COUNT} lessons to unlock
                  </span>
                )}
              </div>
              <p className="text-sm text-fg-mute mt-0.5">
                Free-play with the AI Builder Agent. Prompt anything, build anything.
              </p>
            </div>
            <Cuboid size={20} className="text-fg-mute" />
          </button>
        </div>

        <footer className="mt-12 flex items-center justify-between text-xs font-mono text-fg-mute">
          <span>
            {completed.length} / {LESSONS.length} lessons complete
          </span>
          {placed > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="hover:text-accent-magenta flex items-center gap-1.5 transition-colors"
              title="Wipe town and start over"
            >
              <RotateCcw size={11} />
              reset progress
            </button>
          )}
        </footer>
      </main>
    </div>
  );
}
