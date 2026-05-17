import { useState } from 'react';
import { ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';
import type { Lesson } from '@/data/lessons';
import { useApp } from '@/state/app';
import { sfx } from '@/audio/sfx';
import { AskTutor } from './AskTutor';

export function LessonRead({
  lesson,
  onAdvance,
}: {
  lesson: Lesson;
  onAdvance: () => void;
}) {
  const [page, setPage] = useState(0);
  const total = lesson.pages.length;
  const p = lesson.pages[page];
  const isLast = page === total - 1;
  const closeLesson = useApp((s) => s.closeLesson);

  return (
    <div className="fixed inset-0 bg-ink flex flex-col">
      <header className="px-6 sm:px-10 py-5 flex items-center gap-3 border-b border-ink-line/60">
        <button
          type="button"
          onClick={closeLesson}
          aria-label="Back to lessons"
          title="Back to lessons"
          className="btn-ghost flex items-center gap-1.5 text-sm shrink-0"
        >
          <ArrowLeft size={14} />
          Lessons
        </button>
        <BookOpen size={18} className="text-accent-cyan shrink-0" />
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-fg-mute">
            Lesson · {lesson.title}
          </div>
          <div className="text-xs text-fg-dim">
            Read {page + 1} / {total}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-12">
        <div className="max-w-2xl mx-auto animate-rise-in">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-5">
            {p.heading}
          </h2>
          <p className="text-fg-dim text-lg leading-relaxed whitespace-pre-line">{p.body}</p>
          <AskTutor topic={lesson.title} page={p} />
        </div>
      </main>

      <footer className="px-6 sm:px-10 py-5 border-t border-ink-line/60 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { if (page > 0) { setPage((x) => x - 1); sfx.page(); } }}
          disabled={page === 0}
          className="btn-ghost flex items-center gap-1.5 disabled:opacity-40"
        >
          <ArrowLeft size={14} />
          Previous
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === page ? 'bg-accent-cyan' : 'bg-ink-line'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            sfx.page();
            if (isLast) onAdvance();
            else setPage((x) => x + 1);
          }}
          className="btn-primary flex items-center gap-1.5"
        >
          {isLast ? 'Quick check' : 'Next'}
          <ArrowRight size={14} />
        </button>
      </footer>
    </div>
  );
}
