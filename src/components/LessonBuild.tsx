import { useEffect, useMemo, useState } from 'react';
import { Check, Lightbulb, RotateCcw, X } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { World } from './World';
import { Toolbar } from './Toolbar';
import { BlueprintPreview } from './BlueprintPreview';
import type { Lesson } from '@/data/lessons';
import { useWorld } from '@/state/world';
import { checkBuildMatches } from '@/lessons/validateBuild';
import { sfx } from '@/audio/sfx';

export function LessonBuild({
  lesson,
  onComplete,
  onBack,
}: {
  lesson: Lesson;
  onComplete: () => void;
  onBack: () => void;
}) {
  const blocks = useWorld((s) => s.blocks);
  const clearWorld = useWorld((s) => s.clearWorld);

  // Clear the world when entering build mode; we want a clean canvas.
  useEffect(() => {
    clearWorld();
    return () => clearWorld(); // also clear on leave so sandbox isn't polluted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const status = useMemo(() => checkBuildMatches(blocks, lesson.target), [blocks, lesson.target]);

  // Fire completion the moment they match.
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    if (status.ok && !accepted) {
      setAccepted(true);
      sfx.chime();
      setTimeout(() => onComplete(), 900);
    }
  }, [status.ok, accepted, onComplete]);

  return (
    <div className="fixed inset-0 bg-ink flex flex-col">
      {/* Top bar */}
      <header className="px-4 sm:px-6 py-3 flex items-center gap-3 border-b border-ink-line/60 z-30">
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost flex items-center gap-1.5 text-sm"
        >
          <X size={14} />
          Quit lesson
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-fg-mute">
            Build · {lesson.title}
          </div>
          <div className="text-sm text-fg-dim truncate">{lesson.challenge}</div>
        </div>
        <ProgressBadge matched={status.matched} total={status.total} ok={status.ok} />
        <button
          type="button"
          onClick={() => clearWorld()}
          className="btn-ghost flex items-center gap-1.5 text-sm"
          title="Reset canvas"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </header>

      {/* Main split: canvas | blueprint */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] overflow-hidden">
        {/* Canvas */}
        <div className="relative">
          <ErrorBoundary>
            <World />
          </ErrorBoundary>

          {/* Floating toolbar at the bottom of the canvas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <Toolbar />
          </div>

          {/* Success overlay */}
          {accepted && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-fade-in pointer-events-none">
              <div className="glass rounded-2xl p-6 max-w-sm text-center shadow-glass">
                <div className="w-12 h-12 rounded-full bg-accent-cyan text-ink flex items-center justify-center mx-auto mb-3">
                  <Check size={24} />
                </div>
                <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan mb-1">
                  Build matched
                </p>
                <h3 className="text-xl font-semibold text-fg">Lesson complete!</h3>
              </div>
            </div>
          )}
        </div>

        {/* Blueprint panel */}
        <aside className="border-t lg:border-t-0 lg:border-l border-ink-line/60 bg-ink-soft/60 flex flex-col">
          <div className="p-4 border-b border-ink-line/60">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-accent-amber" />
              <h3 className="font-semibold text-sm text-fg">Blueprint</h3>
            </div>
            <p className="text-xs text-fg-mute mt-1 leading-relaxed">
              Match this shape on the canvas — exact spot doesn't matter, just the relative layout.
            </p>
          </div>
          <div className="flex-1 min-h-[200px] lg:min-h-0 relative">
            <BlueprintPreview target={lesson.target} />
          </div>
          <div className="p-4 border-t border-ink-line/60">
            <div className="text-[11px] font-mono text-fg-mute mb-2 uppercase tracking-widest">
              Needs
            </div>
            <BlockChecklist target={lesson.target} placed={blocks.map((b) => b.type)} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProgressBadge({
  matched,
  total,
  ok,
}: {
  matched: number;
  total: number;
  ok: boolean;
}) {
  return (
    <div
      className={`font-mono text-xs px-2.5 py-1 rounded-full border ${
        ok
          ? 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan'
          : 'bg-ink-soft/60 border-ink-line text-fg-mute'
      }`}
    >
      {matched}/{total}
    </div>
  );
}

function BlockChecklist({
  target,
  placed,
}: {
  target: readonly { type: string }[];
  placed: readonly string[];
}) {
  const targetCounts = countBy(target.map((t) => t.type));
  const placedCounts = countBy(placed);
  const types = Object.keys(targetCounts);
  return (
    <div className="space-y-1">
      {types.map((t) => {
        const need = targetCounts[t];
        const have = placedCounts[t] ?? 0;
        const ok = have >= need;
        return (
          <div key={t} className="flex items-center justify-between text-xs">
            <span className={`font-mono ${ok ? 'text-fg-dim' : 'text-fg-mute'}`}>{t}</span>
            <span className={`font-mono ${ok ? 'text-accent-cyan' : 'text-fg-mute'}`}>
              {Math.min(have, need)} / {need}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function countBy(xs: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of xs) out[x] = (out[x] ?? 0) + 1;
  return out;
}
