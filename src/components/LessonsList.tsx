import { useState } from 'react';
import { useApp, LESSONS, SANDBOX_UNLOCK_COUNT } from '@/state/app';
import { isLessonUnlocked, totalQuestions, builtinCompletedCount } from '@/data/lessons';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import { useWorld } from '@/state/world';
import { useCustomLessons } from '@/state/customLessons';
import { Lock, Check, ArrowRight, ArrowLeft, Cuboid, Sparkles, RotateCcw, Wand2, Trash2 } from 'lucide-react';
import { AuthButton } from './AuthButton';
import { SaveWorldButton } from './SaveWorldButton';
import { ShareButton } from './ShareButton';
import { CustomLessonModal } from './CustomLessonModal';

export function LessonsList() {
  const completed = useApp((s) => s.completedLessons);
  const openLesson = useApp((s) => s.openLesson);
  const setScreen = useApp((s) => s.setScreen);
  const sandboxUnlocked = useApp((s) => s.isSandboxUnlocked());
  const correctlyAnswered = useApp((s) => s.correctlyAnswered);
  const resetProgress = useApp((s) => s.resetProgress);
  const clearWorld = useWorld((s) => s.clearWorld);

  const placed = useWorld((s) => s.blocks.length);
  const totalQs = totalQuestions();
  const customLessons = useCustomLessons((s) => s.lessons);
  const removeCustom = useCustomLessons((s) => s.remove);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const builtinDone = builtinCompletedCount(completed);

  const onReset = () => {
    if (confirm('Reset all progress and clear the town? This cannot be undone.')) {
      clearWorld();
      resetProgress();
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-ink">
      <header className="max-w-5xl mx-auto px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setScreen('landing')}
          className="inline-flex items-center gap-1.5 text-fg-mute hover:text-fg transition-colors text-sm font-medium"
        >
          <ArrowLeft size={14} />
          Home
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <ShareButton />
          <SaveWorldButton />
          <AuthButton />
        </div>
      </header>
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-4 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-fg-mute mb-2">
            BlockBuilders
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-2">
            Six lessons. One town.
          </h1>
          <p className="text-fg-mute max-w-xl leading-relaxed">
            Read each lesson, then answer the questions. Every right answer earns
            you a Tetris-style piece. Drop it on the map wherever you like —
            you decide how your town takes shape.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-xs text-fg-mute">blocks placed</div>
          <div className="font-mono text-2xl font-semibold text-fg">
            {placed}
          </div>
          <div className="font-mono text-[10px] text-fg-mute mt-0.5">
            from {totalQs} possible questions
          </div>
        </div>
      </section>

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

        {/* Custom AI-generated lessons */}
        {customLessons.length > 0 && (
          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Wand2 size={14} className="text-accent-violet" />
                <h2 className="text-sm font-mono uppercase tracking-widest text-fg-dim">
                  Your custom lessons
                </h2>
              </div>
              <span className="text-[10px] font-mono text-fg-mute">extras — won't count toward Crypto 101</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customLessons.map((l) => {
                const isDone = completed.includes(l.id);
                const placedHere = l.quiz.filter((_, qi) =>
                  correctlyAnswered.includes(`${l.id}:${qi}`)
                ).length;
                return (
                  <div
                    key={l.id}
                    className="group rounded-2xl p-5 border bg-ink-soft/60 border-ink-line hover:border-accent-violet/40 transition-all relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeCustom(l.id)}
                      className="absolute top-3 right-3 p-1 rounded-md text-fg-mute hover:text-accent-magenta hover:bg-ink-line/60 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Remove lesson"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openLesson(l.id)}
                      className="text-left w-full pr-8"
                    >
                      <div className="font-mono text-[10px] uppercase tracking-widest text-accent-violet mb-1">
                        AI lesson · {l.district}
                      </div>
                      <h3 className="text-xl font-semibold text-fg leading-tight mb-2">{l.title}</h3>
                      <p className="text-sm text-fg-mute mb-3 leading-relaxed">{l.blurb}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-accent-cyan">
                            <Check size={11} /> done
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-fg-dim">
                            <ArrowRight size={11} /> start
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-fg-mute">
                          {placedHere}/{l.quiz.length} blocks
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="mt-12 flex items-center justify-between gap-3 flex-wrap text-xs font-mono text-fg-mute">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              {builtinDone} / {LESSONS.length} lessons complete
            </span>
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="inline-flex items-center gap-1.5 text-accent-violet hover:text-accent-violet/80 transition-colors"
              title="Generate a custom lesson with AI"
            >
              <Wand2 size={11} />
              create your own
            </button>
          </div>
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

      {showCustomModal && (
        <CustomLessonModal onClose={() => setShowCustomModal(false)} />
      )}
    </div>
  );
}
