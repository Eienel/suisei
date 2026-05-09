import { BRICK_DEFS, type BrickDef } from '@/game/bricks/brickTypes';
import { bus } from '@/game/events';
import { sfx } from '@/audio/sfx';

export function BrickPalette() {
  return (
    <aside className="w-full lg:w-64 lg:h-full bg-white/80 backdrop-blur border-t lg:border-t-0 lg:border-r border-brand-ink/10 p-3 lg:p-4 overflow-x-auto lg:overflow-y-auto">
      <h2 className="hidden lg:block font-extrabold text-brand-ink mb-3 tracking-tight">
        Bricks
      </h2>
      <div className="flex lg:flex-col gap-2 lg:gap-3">
        {BRICK_DEFS.map((def) => (
          <PaletteItem key={def.id} def={def} />
        ))}
      </div>
      <p className="hidden lg:block mt-4 text-xs text-brand-ink-soft leading-relaxed">
        Tap a brick to drop it on the board. Drag to position. Snaps to grid.
      </p>
    </aside>
  );
}

function PaletteItem({ def }: { def: BrickDef }) {
  const onClick = () => {
    if (!def.enabled) return;
    sfx.click();
    bus.emit('SPAWN_BRICK', { type: def.id });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!def.enabled}
      title={def.enabled ? def.blurb : 'Coming soon'}
      className={`group relative shrink-0 w-28 lg:w-full rounded-brick px-3 py-3 text-left transition-all ${
        def.enabled
          ? 'shadow-brick hover:translate-y-[-2px] active:translate-y-[1px]'
          : 'opacity-40 cursor-not-allowed'
      }`}
      style={{ backgroundColor: def.color }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-white font-extrabold text-sm tracking-tight">
          {def.label}
        </span>
        <span
          className="rounded-full text-[10px] font-extrabold px-1.5 py-0.5 text-brand-ink"
          style={{ backgroundColor: def.studColor }}
        >
          {def.shortLabel}
        </span>
      </div>
      <p className="hidden lg:block text-[11px] text-white/90 leading-snug">
        {def.enabled ? def.blurb : 'Coming soon'}
      </p>
    </button>
  );
}
