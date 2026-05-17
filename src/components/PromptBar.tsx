import { useEffect, useRef, useState } from 'react';
import {
  Sparkles, X, ArrowRight, Loader2, Paperclip, RotateCcw, HelpCircle, Image as ImageIcon,
} from 'lucide-react';
import { useAgent } from '@/agent/useAgent';

const FEATURED: string[] = [
  'Build a zk learning city',
  'Make a DeFi temple with governance pillars',
  'Construct an AI research lab',
  'Lay an oracle observatory on a hill',
];

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function PromptBar() {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const phase = useAgent((s) => s.phase);
  const error = useAgent((s) => s.error);
  const totalActions = useAgent((s) => s.totalActions);
  const appliedActions = useAgent((s) => s.appliedActions);
  const history = useAgent((s) => s.history);
  const clarify = useAgent((s) => s.clarify);
  const attachedImage = useAgent((s) => s.attachedImage);
  const submit = useAgent((s) => s.submit);
  const cancel = useAgent((s) => s.cancel);
  const attachImage = useAgent((s) => s.attachImage);
  const detachImage = useAgent((s) => s.detachImage);
  const resetConversation = useAgent((s) => s.resetConversation);
  const clearError = useAgent((s) => s.clearError);
  const busy = phase === 'thinking' || phase === 'building';
  const hasConversation = history.length > 0 || !!clarify;

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
    if (!value.trim() && !attachedImage) return;
    const text = value.trim();
    setValue('');
    submit(text);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      clearError();
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      // Tell the user via the agent error channel — keeps one surface
      useAgent.setState({ error: 'Image too large (max 4 MB)' });
      return;
    }
    const base64 = await readBase64(file);
    const previewUrl = URL.createObjectURL(file);
    attachImage({
      previewUrl,
      base64,
      mimeType: file.type,
      name: file.name,
    });
    inputRef.current?.focus();
  };

  const onSuggestion = (s: string) => {
    setValue('');
    submit(s);
  };

  const placeholder = busy
    ? phase === 'thinking'
      ? 'Builder agent is thinking…'
      : `Building ${appliedActions} / ${totalActions}…`
    : phase === 'clarify'
      ? 'Answer above, or just type your refinement…'
      : history.length > 0
        ? 'Refine — "taller", "add water", "shift north 5"…'
        : 'Ask the Builder Agent to construct something… (⌘K)';

  return (
    <div className="pointer-events-auto w-full sm:w-[min(620px,92vw)] animate-rise-in">
      {error && (
        <div className="mb-2 glass rounded-xl px-3 py-2 text-sm text-accent-magenta border-accent-magenta/40 flex items-center justify-between gap-2">
          <span className="font-mono text-xs truncate">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-fg-mute hover:text-fg shrink-0"
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {phase === 'clarify' && clarify && (
        <div className="mb-2 glass rounded-xl px-3 py-2.5 text-sm border-accent-cyan/30">
          <div className="flex items-start gap-2 text-fg">
            <HelpCircle size={16} className="text-accent-cyan mt-0.5 shrink-0" />
            <span className="leading-snug">{clarify.question}</span>
          </div>
          {clarify.suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {clarify.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSuggestion(s)}
                  className="text-[11px] text-accent-cyan bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 rounded-full px-2.5 py-1 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {attachedImage && (
        <div className="mb-2 glass rounded-xl px-2.5 py-2 flex items-center gap-2 border-accent-cyan/30">
          <img
            src={attachedImage.previewUrl}
            alt=""
            className="w-9 h-9 rounded-md object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-fg-mute flex items-center gap-1">
              <ImageIcon size={11} /> reference image
            </div>
            <div className="text-xs text-fg truncate">{attachedImage.name}</div>
          </div>
          <button
            type="button"
            onClick={detachImage}
            aria-label="Remove image"
            className="text-fg-mute hover:text-fg shrink-0 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="glass rounded-2xl shadow-glass flex items-center gap-1 px-2 py-2"
      >
        <div className="ml-1 text-fg-mute">
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

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="Attach reference image"
          title="Attach reference image"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            attachedImage
              ? 'text-accent-cyan bg-accent-cyan/15 hover:bg-accent-cyan/25'
              : 'text-fg-mute hover:text-fg hover:bg-ink-line/60'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Paperclip size={16} />
        </button>

        {hasConversation && !busy && (
          <button
            type="button"
            onClick={resetConversation}
            aria-label="New conversation"
            title="New conversation"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-fg-mute hover:text-fg hover:bg-ink-line/60 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
        )}

        <button
          type="submit"
          aria-label={busy ? 'Cancel' : 'Build'}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            busy
              ? 'bg-accent-magenta/20 text-accent-magenta hover:bg-accent-magenta/30'
              : value.trim() || attachedImage
                ? 'bg-accent-cyan text-ink hover:bg-accent-cyan/90'
                : 'bg-ink-line text-fg-mute cursor-not-allowed'
          }`}
        >
          {busy ? <X size={16} /> : <ArrowRight size={16} />}
        </button>
      </form>

      {phase === 'idle' && !value && !attachedImage && history.length === 0 && (
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

async function readBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
