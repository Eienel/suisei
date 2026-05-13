import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, ArrowRight, Loader2 } from 'lucide-react';
import { useAgent } from '@/agent/useAgent';

const FEATURED: string[] = [
  'Build a zk learning city',
  'Make a DeFi temple with governance pillars',
  'Construct an AI research lab',
  'Lay an oracle observatory on a hill',
];

export function PromptBar() {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const phase = useAgent((s) => s.phase);
  const error = useAgent((s) => s.error);
  const totalActions = useAgent((s) => s.totalActions);
  const appliedActions = useAgent((s) => s.appliedActions);
  const submit = useAgent((s) => s.submit);
  const cancel = useAgent((s) => s.cancel);
  const busy = phase === 'thinking' || phase === 'building';

  // ⌘K / Ctrl-K focuses the prompt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) {
      cancel();
      return;
    }
    if (!value.trim()) return;
    submit(value.trim());
  };

  const placeholder = busy
    ? phase === 'thinking'
      ? 'Builder agent is thinking…'
      : `Building ${appliedActions} / ${totalActions}…`
    : 'Ask the Builder Agent to construct something… (⌘K)';

  return (
    <div className="pointer-events-auto w-[min(620px,92vw)] animate-rise-in">
      {error && (
        <div className="mb-2 glass rounded-xl px-3 py-2 text-sm text-accent-magenta border-accent-magenta/40 flex items-center justify-between">
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="glass rounded-2xl shadow-glass flex items-center gap-2 px-2 py-2"
      >
        <div className="ml-2 text-fg-mute">
          {busy ? (
            <Loader2 size={18} className="animate-spin text-accent-cyan" />
          ) : (
            <Sparkles size={18} className="text-accent-cyan" />
          )}
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
          className="flex-1 bg-transparent text-fg placeholder:text-fg-mute outline-none px-1 py-2 text-sm"
        />
        <button
          type="submit"
          aria-label={busy ? 'Cancel' : 'Build'}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            busy
              ? 'bg-accent-magenta/20 text-accent-magenta hover:bg-accent-magenta/30'
              : value.trim()
                ? 'bg-accent-cyan text-ink hover:bg-accent-cyan/90'
                : 'bg-ink-line text-fg-mute cursor-not-allowed'
          }`}
        >
          {busy ? <X size={16} /> : <ArrowRight size={16} />}
        </button>
      </form>

      {phase === 'idle' && !value && (
        <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
          {FEATURED.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setValue(p);
                inputRef.current?.focus();
              }}
              className="text-[11px] text-fg-mute hover:text-fg-dim bg-ink-soft/60 hover:bg-ink-line/80 border border-ink-line/60 rounded-full px-2.5 py-1 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {phase === 'building' && (
        <div className="mt-2 h-0.5 bg-ink-line rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-cyan transition-all duration-200"
            style={{
              width:
                totalActions > 0
                  ? `${Math.min(100, (appliedActions / totalActions) * 100)}%`
                  : '4%',
            }}
          />
        </div>
      )}
    </div>
  );
}
