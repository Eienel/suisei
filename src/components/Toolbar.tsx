import { BLOCK_DEFS } from '@/world/blockTypes';
import { useWorld } from '@/state/world';

export function Toolbar() {
  const activeBlockType = useWorld((s) => s.activeBlockType);
  const setActiveBlockType = useWorld((s) => s.setActiveBlockType);

  return (
    <div className="pointer-events-auto glass rounded-2xl px-2 py-2 shadow-glass animate-rise-in">
      <div className="flex items-center gap-1">
        {BLOCK_DEFS.map((def) => {
          const active = def.id === activeBlockType;
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => setActiveBlockType(def.id)}
              title={`${def.label} — ${def.blurb}`}
              className={`group relative w-12 h-12 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 ${
                active
                  ? 'bg-ink-line/90 shadow-glow-soft'
                  : 'hover:bg-ink-line/60'
              }`}
            >
              <span
                className="w-5 h-5 rounded-md"
                style={{
                  background: def.color,
                  boxShadow: active
                    ? `0 0 14px ${def.color}aa`
                    : `0 0 6px ${def.color}55`,
                }}
              />
              <span
                className={`font-mono text-[9px] tracking-wider ${
                  active ? 'text-fg' : 'text-fg-mute'
                }`}
              >
                {def.short}
              </span>
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-cyan" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
