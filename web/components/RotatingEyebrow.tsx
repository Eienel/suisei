'use client';

import { useEffect, useState } from 'react';

/*
 * The hero eyebrow badge, cycling through a few lines: the name and its
 * meaning, a localized "built for Sui", and the toolkit one-liner. Crossfades
 * (opacity only). Under reduced motion it holds the first line statically.
 */
interface Line {
  text: string;
  lang?: string;
}

const LINES: Line[] = [
  { text: '彗星 · suisei · comet', lang: 'zh' },
  { text: 'Sui Overflow 2026 のために', lang: 'ja' },
  { text: 'The Sui Stack, one install' },
  { text: 'Non-custodial by design' },
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export function RotatingEyebrow() {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduced) return;
    const hold = setTimeout(() => setVisible(false), 2800);
    const swap = setTimeout(() => {
      setI((n) => (n + 1) % LINES.length);
      setVisible(true);
    }, 3120);
    return () => {
      clearTimeout(hold);
      clearTimeout(swap);
    };
  }, [i, reduced]);

  const line = LINES[i];

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-3 py-1 font-mono text-xs text-muted">
      <span className="comet-dot" aria-hidden="true" />
      <span
        lang={line.lang}
        className="transition-opacity duration-300"
        style={{ opacity: reduced ? 1 : visible ? 1 : 0 }}
      >
        {line.text}
      </span>
    </span>
  );
}
