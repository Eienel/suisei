'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Cube,
  PaperPlaneTilt,
  Robot,
  Signature,
} from '@phosphor-icons/react';

/*
 * The non-custodial loop, shown as four steps. The key never crosses from
 * the signing step into the agent. Steps reveal in sequence on scroll
 * (opacity/transform only, IntersectionObserver, reduced-motion safe via
 * the .reveal stylesheet).
 */
const STEPS = [
  {
    icon: Robot,
    title: 'Agent asks',
    body: 'The agent calls a tool. No key in sight.',
  },
  {
    icon: Cube,
    title: 'Toolkit builds',
    body: 'Returns unsigned tx_bytes_base64.',
  },
  {
    icon: Signature,
    title: 'You sign',
    body: 'Locally, in agent-signer. The key stays put.',
  },
  {
    icon: PaperPlaneTilt,
    title: 'Toolkit submits',
    body: 'The signed bytes land on chain.',
  },
];

export function FlowDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.title} className="relative">
            <div
              className="reveal h-full rounded-2xl border border-line bg-paper-raised p-6"
              data-shown={shown ? 'true' : 'false'}
              style={{ transitionDelay: `${i * 110}ms` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon size={22} weight="duotone" />
              </div>
              <p className="mt-4 font-mono text-xs text-faint">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight
                size={20}
                weight="bold"
                aria-hidden="true"
                className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-line-strong lg:block"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
