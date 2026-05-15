import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { useAgent } from '@/agent/useAgent';

/**
 * Tiny narration chip pinned to the very top of the canvas — out of
 * the way of the building that's happening in the middle of the view.
 * Auto-dismisses ~5s after the build completes.
 */
export function NarrationOverlay() {
  const phase = useAgent((s) => s.phase);
  const narration = useAgent((s) => s.narration);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!narration) {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (phase === 'idle') {
      const t = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [narration, phase]);

  if (!visible || !narration) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-rise-in max-w-[min(420px,calc(100vw-32px))]">
      <div className="rounded-full px-3 py-1.5 flex items-center gap-2 bg-ink-soft/85 backdrop-blur border border-ink-line/80 shadow-glass">
        <Bot size={12} className="text-accent-cyan shrink-0" />
        <span className="text-xs text-fg-dim leading-tight truncate">{narration}</span>
      </div>
    </div>
  );
}
