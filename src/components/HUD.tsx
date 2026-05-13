import { useEffect } from 'react';
import { Trash2, RotateCw, Save, MousePointer, Plus } from 'lucide-react';
import { useWorld } from '@/state/world';

export function HUD() {
  const blocks = useWorld((s) => s.blocks);
  const tool = useWorld((s) => s.tool);
  const setTool = useWorld((s) => s.setTool);
  const selectedBlockId = useWorld((s) => s.selectedBlockId);
  const removeBlock = useWorld((s) => s.removeBlock);
  const rotateBlock = useWorld((s) => s.rotateBlock);
  const clearWorld = useWorld((s) => s.clearWorld);
  const setSelected = useWorld((s) => s.setSelected);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 'b' || e.key === 'B') setTool('place');
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
        e.preventDefault();
        removeBlock(selectedBlockId);
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
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedBlockId, setSelected, removeBlock, rotateBlock, setTool]);

  return (
    <>
      {/* Top bar — wordmark + counts + save (stub) */}
      <header className="absolute top-0 inset-x-0 z-20 px-5 py-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Logomark />
          <div className="leading-tight">
            <div className="font-semibold tracking-tight text-fg">BlockBuilders</div>
            <div className="text-[11px] text-fg-mute font-mono">v0.1 · sui testnet</div>
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="glass rounded-lg px-3 py-1.5 text-xs font-mono text-fg-dim">
            {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
          </span>
          <button type="button" className="btn-ghost flex items-center gap-1.5 text-sm" disabled>
            <Save size={14} />
            Save World
          </button>
        </div>
      </header>

      {/* Left rail — tools */}
      <aside className="absolute left-5 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
        <div className="glass rounded-2xl p-1.5 flex flex-col gap-1 shadow-glass">
          <ToolBtn
            active={tool === 'place'}
            onClick={() => setTool('place')}
            label="Place"
            hotkey="B"
            icon={<Plus size={18} />}
          />
          <ToolBtn
            active={tool === 'select'}
            onClick={() => setTool('select')}
            label="Select"
            hotkey="V"
            icon={<MousePointer size={18} />}
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
            }}
            label="Rotate"
            hotkey="R"
            icon={<RotateCw size={18} />}
          />
          <ToolBtn
            active={false}
            disabled={!selectedBlockId}
            onClick={() => selectedBlockId && removeBlock(selectedBlockId)}
            label="Delete"
            hotkey="⌫"
            icon={<Trash2 size={18} />}
            danger
          />
        </div>
      </aside>

      {/* Bottom-right — clear */}
      <div className="absolute bottom-5 right-5 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (blocks.length === 0) return;
            if (confirm(`Clear all ${blocks.length} blocks?`)) clearWorld();
          }}
          className="text-xs font-mono text-fg-mute hover:text-accent-magenta transition-colors"
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
      className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
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
      <span className="absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap glass rounded-md px-2 py-1 text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        {label} <span className="kbd ml-1">{hotkey}</span>
      </span>
    </button>
  );
}

function Logomark() {
  return (
    <div className="w-8 h-8 rounded-lg bg-ink-soft border border-ink-line flex items-center justify-center">
      <div
        className="w-4 h-4 rounded"
        style={{
          background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
          boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
        }}
      />
    </div>
  );
}
