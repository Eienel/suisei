import { useState } from 'react';
import { Sparkles, MousePointer, Save, Cuboid, Keyboard } from 'lucide-react';
import { useApp } from '@/state/app';

export function HowToModal() {
  const seen = useApp((s) => s.seenHowTo);
  const markSeen = useApp((s) => s.markHowToSeen);
  const [closing, setClosing] = useState(false);

  if (seen && !closing) return null;

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      markSeen();
      setClosing(false);
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-ink/85 backdrop-blur-sm flex items-center justify-center p-4 ${
        closing ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-200`}
    >
      <div className="glass rounded-2xl p-7 max-w-lg w-full shadow-glass animate-rise-in">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan mb-2">
          BlockBuilders · V1
        </p>
        <h2 className="text-2xl font-semibold text-fg mb-1 tracking-tight">
          AI co-creative 3D world builder
        </h2>
        <p className="text-sm text-fg-mute mb-6 leading-relaxed">
          Prompt an AI Builder Agent to construct evolving knowledge worlds.
          Then edit them yourself. Save your favorite as an NFT on Sui.
        </p>

        <ul className="space-y-4 mb-6">
          <Step
            icon={<Sparkles size={16} className="text-accent-cyan" />}
            title="Prompt the Builder Agent"
          >
            Type an intent in the bar at the bottom — e.g.{' '}
            <span className="text-fg-dim">“build a zk learning city.”</span>{' '}
            The AI returns structured actions and the world builds itself in
            front of you. Try the chip suggestions if you’re stuck.
          </Step>
          <Step
            icon={<Cuboid size={16} className="text-accent-violet" />}
            title="Edit the world manually"
          >
            Pick a block from the floating tray, click anywhere on the grid to
            place it. Right-click pans, scroll wheel zooms.
          </Step>
          <Step
            icon={<MousePointer size={16} className="text-accent-amber" />}
            title="Select to tweak"
          >
            <span className="kbd">V</span> for select tool, click any block.
            Then <span className="kbd">R</span> to rotate or{' '}
            <span className="kbd">⌫</span> to delete.
          </Step>
          <Step
            icon={<Save size={16} className="text-accent-magenta" />}
            title="Save onchain"
          >
            Sign in (Google or Sui wallet), then{' '}
            <span className="font-semibold text-fg">Save World</span>. The
            metadata uploads to Walrus and a World NFT is minted (or updated)
            on Sui testnet.
          </Step>
        </ul>

        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xs text-fg-mute flex items-center gap-1.5">
            <Keyboard size={12} />
            <span className="kbd">⌘K</span> focuses the prompt anywhere
          </span>
          <button type="button" onClick={close} className="btn-primary">
            Let's build
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-8 h-8 rounded-lg bg-ink-soft border border-ink-line flex items-center justify-center">
        {icon}
      </span>
      <div>
        <div className="font-semibold text-fg leading-tight">{title}</div>
        <div className="text-sm text-fg-mute leading-relaxed mt-0.5">{children}</div>
      </div>
    </li>
  );
}
