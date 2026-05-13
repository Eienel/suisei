import { useState } from 'react';
import { Sparkles, Loader2, RotateCw } from 'lucide-react';
import type { ReadPage } from '@/data/lessons';

interface Props {
  topic: string;
  page: ReadPage;
}

/**
 * Inline AI tutor — asks Gemini to rephrase the current lesson page
 * with a fresh concrete metaphor. Lives below the page body, never
 * disrupts the read flow.
 */
export function AskTutor({ topic, page }: Props) {
  const [loading, setLoading] = useState(false);
  const [rephrased, setRephrased] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic, heading: page.heading, body: page.body }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? `Tutor ${res.status}`);
      }
      const data = (await res.json()) as { rephrased?: string };
      if (!data.rephrased) throw new Error('Empty tutor response');
      setRephrased(data.rephrased);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {!rephrased && !error && (
        <button
          type="button"
          onClick={ask}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-line text-fg-dim hover:text-fg hover:border-accent-cyan/40 transition-colors disabled:opacity-60 text-sm"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              asking the tutor…
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-accent-cyan" />
              explain it differently
            </>
          )}
        </button>
      )}

      {(rephrased || error) && (
        <div
          className={`mt-1 rounded-xl border p-4 animate-fade-in ${
            error
              ? 'border-accent-magenta/40 bg-accent-magenta/5'
              : 'border-accent-cyan/40 bg-accent-cyan/5'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-ink border border-ink-line flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={13} className="text-accent-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-fg-mute mb-1">
                {error ? 'tutor error' : 'AI tutor · plainer take'}
              </p>
              {rephrased && (
                <p className="text-fg-dim leading-relaxed text-base">{rephrased}</p>
              )}
              {error && (
                <p className="text-accent-magenta text-sm font-mono">{error}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setRephrased(null);
                setError(null);
                ask();
              }}
              disabled={loading}
              className="shrink-0 text-fg-mute hover:text-fg p-1 transition-colors"
              title="Ask again — different angle"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
