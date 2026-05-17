import { useEffect, useState } from 'react';
import { Trash2, RotateCw, MousePointer, Plus, HelpCircle, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useWorld } from '@/state/world';
import { useApp } from '@/state/app';
import { sfx } from '@/audio/sfx';
import { music } from '@/audio/music';
import { AuthButton } from './AuthButton';
import { SaveWorldButton } from './SaveWorldButton';

export function HUD() {
  const blocks = useWorld((s) => s.blocks);
  const tool = useWorld((s) => s.tool);
  const setTool = useWorld((s) => s.setTool);
  const selectedBlockId = useWorld((s) => s.selectedBlockId);
  const removeBlock = useWorld((s) => s.removeBlock);
  const rotateBlock = useWorld((s) => s.rotateBlock);
  const clearWorld = useWorld((s) => s.clearWorld);
  const setSelected = useWorld((s) => s.setSelected);
  const resetHowTo = useApp((s) => s.resetHowTo);
  const setScreen = useApp((s) => s.setScreen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'v' || e.key === 'V') { setTool('select'); sfx.tick(); }
      if (e.key === 'b' || e.key === 'B') { setTool('place'); sfx.tick(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
        e.preventDefault();
        removeBlock(selectedBlockId);
        sfx.pop();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (!selectedBlockId) return;
        const block = useWorld.getState().blocks.find((b) => b.id === selectedBlockId);
        if (!block) return;
        const next: [number, number, number] = [
          block.rotation[0],
          block.rotation[1] + Math.PI / 2,
          block.rotation[2],
        ];
        rotateBlock(selectedBlockId, next);
        sfx.whoosh();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedBlockId, setSelected, removeBlock, rotateBlock, setTool]);

  return (
    <>
      {/* Top bar — back + brand on the left, actions on the right. Tighter on mobile. */}
      <header className="absolute top-0 inset-x-0 z-20 px-3 sm:px-5 py-2.5 sm:py-4 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto min-w-0">
          <button
            type="button"
            onClick={() => setScreen('lessons')}
            aria-label="Back to lessons"
            title="Back to lessons"
            className="w-8 h-8 rounded-lg bg-ink-soft/85 backdrop-blur border border-ink-line/80 flex items-center justify-center text-fg-mute hover:text-fg transition-colors shrink-0"
          >
            <ArrowLeft size={14} />
          </button>
          <Logomark />
          {/* Wordmark + version hidden on narrow phones; back arrow + logomark carry the brand. */}
          <div className="hidden sm:block leading-tight min-w-0">
            <div className="font-semibold tracking-tight text-fg truncate">BlockBuilders</div>
            <div className="text-[11px] text-fg-mute font-mono">v0.2 · sui testnet</div>
          </div>
          <button
            type="button"
            onClick={() => resetHowTo()}
            aria-label="How to play"
            title="How to play"
            className="hidden sm:inline-flex w-7 h-7 rounded-md items-center justify-center text-fg-mute hover:text-fg hover:bg-ink-line/60 transition-colors"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <span className="hidden md:inline-flex glass rounded-lg px-2.5 py-1.5 text-xs font-mono text-fg-dim">
            {blocks.length} blocks
          </span>
          <MuteToggle />
          <SaveWorldButton />
          <AuthButton />
        </div>
      </header>

      {/* Left rail — tools. Tighter widths on mobile so they don't crowd the canvas. */}
      <aside className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
        <div className="glass rounded-2xl p-1 sm:p-1.5 flex flex-col gap-1 shadow-glass">
          <ToolBtn
            active={tool === 'place'}
            onClick={() => { setTool('place'); sfx.tick(); }}
            label="Place"
            hotkey="B"
            icon={<Plus size={16} />}
          />
          <ToolBtn
            active={tool === 'select'}
            onClick={() => { setTool('select'); sfx.tick(); }}
            label="Select"
            hotkey="V"
            icon={<MousePointer size={16} />}
          />
          <div className="h-px bg-ink-line/80 my-1 mx-1" />
          <ToolBtn
            active={false}
            disabled={!selectedBlockId}
            onClick={() => {
              if (!selectedBlockId) return;
              const block = useWorld.getState().blocks.find((b) => b.id === selectedBlockId);
              if (!block) return;
              rotateBlock(selectedBlockId, [
                block.rotation[0],
                block.rotation[1] + Math.PI / 2,
                block.rotation[2],
              ]);
              sfx.whoosh();
            }}
            label="Rotate"
            hotkey="R"
            icon={<RotateCw size={16} />}
          />
          <ToolBtn
            active={false}
            disabled={!selectedBlockId}
            onClick={() => {
              if (!selectedBlockId) return;
              removeBlock(selectedBlockId);
              sfx.pop();
            }}
            label="Delete"
            hotkey="⌫"
            icon={<Trash2 size={16} />}
            danger
          />
        </div>
      </aside>

      {/* Bottom-right — clear */}
      <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (blocks.length === 0) return;
            if (confirm(`Clear all ${blocks.length} blocks?`)) clearWorld();
          }}
          className="text-[11px] font-mono text-fg-mute hover:text-accent-magenta transition-colors"
        >
          clear world
        </button>
      </div>
    </>
  );
}

function ToolBtn({
  active,
  disabled,
  onClick,
  label,
  hotkey,
  icon,
  danger,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  hotkey: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${
        active
          ? 'bg-accent-cyan text-ink shadow-glow-soft'
          : disabled
            ? 'text-fg-mute/40 cursor-not-allowed'
            : danger
              ? 'text-fg-dim hover:bg-accent-magenta/15 hover:text-accent-magenta'
              : 'text-fg-dim hover:bg-ink-line/70 hover:text-fg'
      }`}
      title={`${label} (${hotkey})`}
    >
      {icon}
      <span className="hidden sm:flex absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap glass rounded-md px-2 py-1 text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        {label} <span className="kbd ml-1">{hotkey}</span>
      </span>
    </button>
  );
}

function Logomark() {
  return (
    <div className="w-7 h-7 rounded-lg bg-ink-soft border border-ink-line flex items-center justify-center shrink-0">
      <div
        className="w-3.5 h-3.5 rounded"
        style={{
          background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
          boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
        }}
      />
    </div>
  );
}

/**
 * Single master mute — silences SFX and the ambient music together,
 * persisted to localStorage as bb-muted so the preference sticks
 * across sessions.
 */
function MuteToggle() {
  const [muted, setMutedState] = useState(() => sfx.isMuted());
  const toggle = () => {
    const next = !muted;
    sfx.setMuted(next);
    music.setMuted(next);
    if (!next) music.start(); // unmute → resume the loop
    setMutedState(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      title={muted ? 'Sound off' : 'Sound on'}
      className="glass rounded-lg px-2.5 py-1.5 text-fg-mute hover:text-fg flex items-center transition-colors"
    >
      {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
    </button>
  );
}
