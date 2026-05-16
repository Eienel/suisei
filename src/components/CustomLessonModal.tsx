import { useState } from 'react';
import { X, Loader2, Wand2 } from 'lucide-react';
import { useCustomLessons, customLessonId } from '@/state/customLessons';
import { CustomLessonSchema } from '@/agent/runCustomLesson';
import { useApp } from '@/state/app';
import type { Lesson } from '@/data/lessons';

const SUGGESTIONS = ['MEV', 'Rollups', 'Stablecoins', 'NFTs', 'Bridges', 'Gas'];

export function CustomLessonModal({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addLesson = useCustomLessons((s) => s.add);
  const openLesson = useApp((s) => s.openLesson);

  const submit = async (raw: string) => {
    const t = raw.trim();
    if (!t || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: t }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? `Server ${res.status}`);
      }
      const parsed = CustomLessonSchema.safeParse(await res.json());
      if (!parsed.success) {
        throw new Error('Generated lesson failed validation');
      }
      const lesson: Lesson = { ...parsed.data, id: customLessonId(t) };
      addLesson(lesson);
      openLesson(lesson.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="bg-ink-soft border border-ink-line rounded-2xl p-6 max-w-md w-full animate-rise-in">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-violet/15 text-accent-violet flex items-center justify-center">
              <Wand2 size={16} />
            </div>
            <h2 className="text-lg font-semibold text-fg">Create your own lesson</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-fg-mute hover:text-fg disabled:opacity-40 p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-fg-mute mb-4 leading-relaxed">
          Pick a crypto topic. The AI writes a 2-page lesson and a 4-question quiz,
          and each right answer still earns you a piece to drop on the map.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(topic);
          }}
        >
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. MEV, restaking, rollups…"
            disabled={busy}
            className="w-full bg-ink border border-ink-line rounded-xl px-3 py-2.5 text-sm text-fg placeholder:text-fg-mute outline-none focus:border-accent-violet/50 disabled:opacity-60"
            autoFocus
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTopic(s)}
                disabled={busy}
                className="text-[11px] text-fg-mute hover:text-fg-dim bg-ink-soft/60 hover:bg-ink-line/80 border border-ink-line/60 rounded-full px-2.5 py-1 transition-colors disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 text-xs text-accent-magenta font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || !topic.trim()}
            className="mt-4 w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Writing your lesson…
              </>
            ) : (
              <>
                <Wand2 size={14} />
                Generate lesson
              </>
            )}
          </button>
          <p className="mt-2 text-[11px] text-fg-mute font-mono text-center">
            Custom lessons are extras — they don't count toward Crypto 101.
          </p>
        </form>
      </div>
    </div>
  );
}
