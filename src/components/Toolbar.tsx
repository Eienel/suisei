import { useState } from 'react';
import { BLOCK_BY_ID, BLOCK_GROUPS, isBlockUnlocked } from '@/world/blockTypes';
import { SHAPE_LIST } from '@/world/shapes';
import { useWorld } from '@/state/world';
import { useApp } from '@/state/app';
import type { BlockShape } from '@/types';
import { Box, Layers, ArrowUpFromLine, RectangleHorizontal, Triangle, TreePine, Droplet, Lock } from 'lucide-react';

const COLOR_SWATCHES: readonly string[] = [
  'default',  // sentinel — use type's default
  '#FFFFFF',
  '#FACC15',
  '#FFB020',
  '#FF6A00',
  '#FF2D92',
  '#8B5CF6',
  '#3B82F6',
  '#00E5FF',
  '#22C55E',
  '#A0673A',
  '#1A1F2E',
];

const SHAPE_ICONS: Record<BlockShape, React.ReactNode> = {
  cube: <Box size={14} />,
  slab: <Layers size={14} />,
  pole: <ArrowUpFromLine size={14} />,
  panel: <RectangleHorizontal size={14} />,
  ramp: <Triangle size={14} />,
  tree: <TreePine size={14} />,
};

/**
 * Bottom-centre block & shape picker.
 *  - Tabs for City vs Crypto block-type groups
 *  - Shape row (cube / slab / pole / panel / ramp)
 *  - Colour tint swatches (default = the type's natural colour)
 */
export function Toolbar() {
  const [tab, setTab] = useState<string>(BLOCK_GROUPS[0].label);

  const activeBlockType = useWorld((s) => s.activeBlockType);
  const setActiveBlockType = useWorld((s) => s.setActiveBlockType);
  const activeShape = useWorld((s) => s.activeShape);
  const setActiveShape = useWorld((s) => s.setActiveShape);
  const activeColor = useWorld((s) => s.activeColor);
  const setActiveColor = useWorld((s) => s.setActiveColor);
  const completedCount = useApp((s) => s.completedLessons.length);

  const group = BLOCK_GROUPS.find((g) => g.label === tab) ?? BLOCK_GROUPS[0];

  return (
    <div className="pointer-events-auto glass rounded-2xl shadow-glass animate-rise-in flex flex-col max-w-full">
      {/* Tabs — clear segmented control */}
      <div className="px-2 pt-2">
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-ink/60 border border-ink-line/80">
          {BLOCK_GROUPS.map((g) => {
            const active = g.label === tab;
            return (
              <button
                key={g.label}
                type="button"
                onClick={() => setTab(g.label)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                  active
                    ? 'bg-accent-cyan text-ink'
                    : 'text-fg-mute hover:text-fg-dim'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type row */}
      <div className="px-2 py-2 flex items-center gap-1 max-w-[min(640px,92vw)] overflow-x-auto">
        {group.types.map((id) => {
          const def = BLOCK_BY_ID[id];
          if (!def) return null;
          const unlocked = isBlockUnlocked(def, completedCount);
          const active = def.id === activeBlockType;
          return (
            <button
              key={def.id}
              type="button"
              disabled={!unlocked}
              onClick={() => {
                if (!unlocked) return;
                setActiveBlockType(def.id);
                if (def.defaultShape) setActiveShape(def.defaultShape);
              }}
              title={
                unlocked
                  ? `${def.label} — ${def.blurb}`
                  : `${def.label} — finish lesson ${(def.unlockAfterLessons ?? 0)} to unlock`
              }
              className={`group relative w-11 h-11 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 shrink-0 ${
                !unlocked
                  ? 'opacity-40 cursor-not-allowed'
                  : active
                    ? 'bg-ink-line/90 shadow-glow-soft'
                    : 'hover:bg-ink-line/60'
              }`}
            >
              <span
                className="w-4 h-4 rounded-md"
                style={{
                  background: activeColor && def.id === activeBlockType ? activeColor : def.color,
                  boxShadow: active && unlocked ? `0 0 12px ${def.color}aa` : `0 0 6px ${def.color}55`,
                }}
              />
              <span className={`font-mono text-[8.5px] tracking-wider ${active ? 'text-fg' : 'text-fg-mute'}`}>
                {def.short}
              </span>
              {!unlocked && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-ink flex items-center justify-center">
                  <Lock size={7} className="text-fg-mute" />
                </span>
              )}
              {active && unlocked && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-cyan" />
              )}
            </button>
          );
        })}
      </div>

      {/* Shape + colour row */}
      <div className="px-2 pb-2 pt-1 flex items-center gap-2 sm:gap-3 border-t border-ink-line/60 overflow-x-auto max-w-[min(640px,92vw)]">
        {/* Shape pills */}
        <div className="flex items-center gap-0.5 shrink-0">
          {SHAPE_LIST.map((s) => {
            const active = s.id === activeShape;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveShape(s.id)}
                title={s.label}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                  active ? 'bg-accent-cyan text-ink' : 'text-fg-mute hover:text-fg hover:bg-ink-line/60'
                }`}
              >
                {SHAPE_ICONS[s.id]}
              </button>
            );
          })}
        </div>

        <div className="h-5 w-px bg-ink-line shrink-0" />

        {/* Colour tint */}
        <div className="flex items-center gap-1 shrink-0">
          <Droplet size={11} className="text-fg-mute" />
          {COLOR_SWATCHES.map((c) => {
            const isDefault = c === 'default';
            const isActive = isDefault ? activeColor === null : activeColor === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setActiveColor(isDefault ? null : c)}
                title={isDefault ? 'Default colour' : c}
                className={`w-5 h-5 rounded-full transition-all ${
                  isActive ? 'ring-2 ring-accent-cyan ring-offset-2 ring-offset-ink-soft' : ''
                }`}
                style={{
                  background: isDefault
                    ? 'conic-gradient(from 0deg,#00E5FF,#8B5CF6,#FF2D92,#FFB020,#22C55E,#00E5FF)'
                    : c,
                  border: isDefault ? '1px solid rgba(255,255,255,0.2)' : `1px solid rgba(0,0,0,0.4)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
