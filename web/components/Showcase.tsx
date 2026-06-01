'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Warning } from '@phosphor-icons/react';
import { SlotImage } from './SlotImage';

interface Project {
  name: string;
  tagline: string;
  url: string;
  author?: string;
  tags?: string[];
  image?: string;
}

// Per-project header art, by name. Seeded projects map to generated slots;
// submitted ones fall back to the branded placeholder.
const IMAGE_BY_NAME: Record<string, string> = {
  TxLens: '/images/showcase-txlens.png',
  MnemoSui: '/images/showcase-mnemosui.png',
  'Suisei Tutor': '/images/showcase-tutor.png',
};

type Load =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'ready'; projects: Project[] };

export function Showcase() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  useEffect(() => {
    let active = true;
    fetch('/showcase.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error('bad status');
        return r.json();
      })
      .then((data: { projects?: Project[] }) => {
        if (!active) return;
        setLoad({ state: 'ready', projects: data.projects ?? [] });
      })
      .catch(() => {
        if (active) setLoad({ state: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  if (load.state === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-line bg-paper-raised p-6"
          >
            <div className="skeleton mb-4 h-5 w-28" />
            <div className="skeleton mb-2 h-3.5 w-full" />
            <div className="skeleton mb-2 h-3.5 w-11/12" />
            <div className="skeleton h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (load.state === 'error') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-raised px-6 py-8 text-muted">
        <Warning size={20} />
        <p className="text-sm">
          The showcase could not load right now. The list lives in{' '}
          <code className="font-mono text-ink">public/showcase.json</code>.
        </p>
      </div>
    );
  }

  if (load.projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-paper-raised px-6 py-12 text-center">
        <p className="text-ink">No projects here yet.</p>
        <p className="mt-1 text-sm text-muted">
          Build something on the toolkit and be the first to add it.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {load.projects.map((p) => (
        <a
          key={p.name}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper-raised transition-all hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-black/5"
        >
          <SlotImage
            src={p.image ?? IMAGE_BY_NAME[p.name] ?? '/images/_none.png'}
            alt={`${p.name} preview`}
            aspect="16 / 9"
            label={p.name}
            className="rounded-none border-0 border-b border-line"
          />
          <div className="flex flex-1 flex-col p-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-ink">
              {p.name}
            </h3>
            <ArrowUpRight
              size={18}
              className="text-faint transition-colors group-hover:text-accent"
            />
          </div>
          <p className="flex-1 text-sm leading-relaxed text-muted">
            {p.tagline}
          </p>
          {p.tags && p.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line-strong px-2.5 py-0.5 font-mono text-xs text-faint"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {p.author && (
            <p className="mt-3 text-xs text-faint">by {p.author}</p>
          )}
          </div>
        </a>
      ))}
    </div>
  );
}
