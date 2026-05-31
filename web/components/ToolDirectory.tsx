'use client';

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { toolGroups } from '@/lib/tools';

const INITIAL = 4;

export function ToolDirectory() {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? toolGroups : toolGroups.slice(0, INITIAL);
  const hiddenCount = toolGroups.length - INITIAL;

  return (
    <div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
        {shown.map((group) => (
          <div key={group.label} className="bg-paper-raised p-6">
            <h3 className="text-base font-semibold tracking-tight text-ink">
              {group.label}
            </h3>
            <p className="mt-1 text-sm text-muted">{group.blurb}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.tools.map((t) => (
                <li
                  key={t}
                  className="rounded-md bg-paper px-2 py-1 font-mono text-xs text-ink"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent active:translate-y-px"
          >
            {expanded
              ? 'Show fewer categories'
              : `Show all ${toolGroups.length} categories`}
            <CaretDown
              size={15}
              weight="bold"
              className="transition-transform"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        </div>
      )}
    </div>
  );
}
