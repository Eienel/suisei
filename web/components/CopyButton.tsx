'use client';

import { useState } from 'react';
import { Check, Copy } from '@phosphor-icons/react';

/* Copy-to-clipboard with transient confirmation. Inline error if it fails. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
      setTimeout(() => setState('idle'), 1600);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2400);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-term-muted/30 px-2.5 py-1.5 text-xs text-term-muted transition-colors hover:text-term-ink active:translate-y-px"
    >
      {state === 'copied' ? (
        <>
          <Check size={14} weight="bold" /> Copied
        </>
      ) : state === 'error' ? (
        <>Press Ctrl+C</>
      ) : (
        <>
          <Copy size={14} weight="regular" /> Copy
        </>
      )}
    </button>
  );
}
