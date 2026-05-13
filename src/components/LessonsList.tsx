import { useApp, LESSONS, SANDBOX_UNLOCK_COUNT } from '@/state/app';
import { isLessonUnlocked } from '@/data/lessons';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import { Lock, Check, ArrowRight, Cuboid, Sparkles } from 'lucide-react';

export function LessonsList() {
  const completed = useApp((s) => s.completedLessons);
  const openLesson = useApp((s) => s.openLesson);
  const setScreen = useApp((s) => s.setScreen);
  const sandboxUnlocked = useApp((s) => s.isSandboxUnlocked());

  return (
    <div className="fixed inset-0 overflow-y-auto bg-ink">
      {/* Hero */}
      <header className="max-w-5xl mx-auto px-6 sm:px-10 pt-12 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan mb-3">
          BlockBuilders · Sui Overflow
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-fg mb-3">
          Learn crypto by building it.
        </h1>
        <p className="text-fg-mute text-base sm:text-lg max-w-2xl leading-relaxed">
          Read a lesson, answer a quick check, then prove you got it by snapping the
          right blocks together in a 3D world. Save your progress as a World NFT on Sui.
        </p>
      </header>

      {/* Lessons grid */}
      <main className="max-w-5xl mx-auto px-6 sm:px-10 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LESSONS.map((l, idx) => {
            const isDone = completed.includes(l.id);
            const isUnlocked = isLessonUnlocked(l.id, completed);
            const targetTypes = Array.from(new Set(l.target.map((b) => b.type)));

            return (
              <button
                key={l.id}
                type="button"
                onClick={() => isUnlocked && openLesson(l.id)}
                disabled={!isUnlocked}
                className={`group text-left glass rounded-2xl p-5 transition-all relative overflow-hidden ${
                  isUnlocked
                    ? 'hover:border-accent-cyan/40 hover:shadow-glow-soft cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-fg-mute mb-1">
                      Lesson {idx + 1}
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

                <div className="flex items-center gap-1.5">
                  {targetTypes.map((t) => {
                    const def = BLOCK_BY_ID[t];
                    return (
                      <span
                        key={t}
                        className="flex items-center gap-1 rounded-full px-2 py-1 bg-ink-soft/80 border border-ink-line/80"
                        title={def.label}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded"
                          style={{ background: def.color, boxShadow: `0 0 6px ${def.color}88` }}
                        />
                        <span className="text-[10px] font-mono text-fg-mute">{def.short}</span>
                      </span>
                    );
                  })}
                  <span className="ml-auto text-[10px] font-mono text-fg-mute">
                    {l.target.length} blocks
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sandbox card */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => sandboxUnlocked && setScreen('sandbox')}
            disabled={!sandboxUnlocked}
            className={`w-full glass rounded-2xl p-5 transition-all flex items-center gap-4 text-left ${
              sandboxUnlocked
                ? 'hover:border-accent-violet/40 hover:shadow-glow-soft cursor-pointer'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-accent-violet/15 text-accent-violet flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-fg">Sandbox</h3>
                {!sandboxUnlocked && (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-fg-mute bg-ink-line px-2 py-0.5 rounded">
                    Finish {SANDBOX_UNLOCK_COUNT} lessons to unlock
                  </span>
                )}
              </div>
              <p className="text-sm text-fg-mute mt-0.5">
                Free-play mode with the AI Builder Agent. Prompt anything, build anything.
              </p>
            </div>
            <Cuboid size={20} className="text-fg-mute group-hover:text-fg" />
          </button>
        </div>

        <p className="mt-10 text-center text-xs text-fg-mute font-mono">
          {completed.length} / {LESSONS.length} lessons completed
        </p>
      </main>
    </div>
  );
}
