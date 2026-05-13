import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { useAgent } from '@/agent/useAgent';

/**
 * Top-center toast showing the AI's narration. Auto-dismisses ~5s after
 * the build completes. Cleaner than chaining the prompt bar with a
 * thought bubble.
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
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-rise-in">
      <div className="glass rounded-full px-4 py-2 flex items-center gap-2 shadow-glass max-w-[min(560px,92vw)]">
        <Bot size={16} className="text-accent-cyan shrink-0" />
        <span className="text-sm text-fg-dim leading-snug">{narration}</span>
      </div>
    </div>
  );
}
