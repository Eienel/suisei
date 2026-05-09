import { LESSONS } from '@/data/lessons';
import { useApp } from '@/state/store';
import { BRICK_BY_ID } from '@/game/bricks/brickTypes';
import { comboCounts } from '@/lessons/comboCounts';

export function LessonsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const unlocked = useApp((s) => s.unlockedLessons);
  if (!open) return null;
  const unlockedSet = new Set(unlocked);

  return (
    <div
      className="fixed inset-0 z-40 bg-brand-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-brand-cream shadow-brick-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-brand-ink/10 flex items-center justify-between">
          <div>
            <p className="text-brand-blue font-bold uppercase tracking-widest text-xs">
              Lessons
            </p>
            <h2 className="font-extrabold text-xl text-brand-ink">
              {unlocked.length} / {LESSONS.length} unlocked
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-white text-brand-ink font-bold text-sm px-3 py-2 rounded-brick shadow-brick"
          >
            Close
          </button>
        </div>
        <ul className="p-4 space-y-3">
          {LESSONS.map((l) => {
            const isUnlocked = unlockedSet.has(l.id);
            return (
              <li
                key={l.id}
                className={`rounded-brick p-4 ${
                  isUnlocked ? 'bg-white shadow-brick' : 'bg-brand-ink/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`font-extrabold ${
                      isUnlocked ? 'text-brand-ink' : 'text-brand-ink-soft'
                    }`}
                  >
                    {isUnlocked ? l.title : 'Locked'}
                  </h3>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {comboCounts(l.triggerCombo).map(({ type, count }) => {
                      const def = BRICK_BY_ID[type];
                      const label =
                        def.shortLabel + (count > 1 ? ` ×${count}` : '');
                      return (
                        <span
                          key={type}
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isUnlocked ? 'text-white' : 'text-brand-ink-soft'
                          }`}
                          style={{
                            backgroundColor: isUnlocked ? def.color : 'transparent',
                            border: isUnlocked ? 'none' : '1px dashed currentColor',
                          }}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {isUnlocked ? (
                  <p className="text-sm text-brand-ink-soft leading-relaxed">{l.body}</p>
                ) : (
                  <p className="text-sm text-brand-ink-soft/70 italic">
                    Snap the bricks above onto the board to unlock.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
