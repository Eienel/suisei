import { useEffect, useState } from 'react';
import { useApp } from '@/state/app';
import { ArrowRight, BookOpen, Box, Terminal, Sparkles } from 'lucide-react';

/**
 * Landing — cream surface, editorial layout. Final mascot integration
 * lands once the brand pass returns.
 */
export function Landing() {
  const setScreen = useApp((s) => s.setScreen);

  return (
    <div className="surface-paper min-h-screen">
      <Nav onPlay={() => setScreen('play')} />

      <main className="max-w-5xl mx-auto px-6 pt-20 pb-24">
        <section className="relative overflow-hidden mb-20">
          <AgentForeshadow />

          <div className="relative z-10 max-w-xl xl:max-w-2xl">
            <p className="eyebrow mb-5">Suisei · public alpha</p>

            <h1 className="font-display text-[52px] sm:text-[80px] xl:text-[88px] leading-[0.95] tracking-[-0.02em] font-semibold text-ink mb-7">
              Learn Sui by{' '}
              <span className="relative inline-block">
                <span className="relative z-10">doing</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 h-3 bg-butter/70 rounded-sm -z-0"
                />
              </span>{' '}
              Sui.
            </h1>

            <p className="text-ink-dim text-lg sm:text-xl leading-[1.55] max-w-xl mb-9">
              An agent that lives on Sui and walks you through the stack the way
              a patient senior would. Eight short quests, each ending in real
              on-chain code with your name on it.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setScreen('play')}
                className="btn-primary text-base px-6 py-3"
              >
                Begin the curriculum
                <ArrowRight size={16} />
              </button>
              <a
                href="https://github.com/eienel/blockbuilders"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost text-base px-5 py-3"
              >
                <Terminal size={15} />
                Sui Skills (MCP)
              </a>
            </div>
          </div>
        </section>

        <PillarRow />
      </main>

      <Outro />
      <Footer />
    </div>
  );
}

/**
 * AgentForeshadow — the agent quietly working, clipped into the left-pointing
 * wedge on the right of the hero. Not a panel or a second column: a faint
 * triangle that's part of the one page, with Move typing itself out inside it
 * (read a quest → draft real Move → sign with zkLogin → a soulbound badge
 * lands in your wallet). Decorative (aria-hidden); the heading carries the
 * meaning. Respects prefers-reduced-motion by showing the transcript settled.
 */
type AgentLineKind = 'cmd' | 'think' | 'code' | 'ok';
type AgentLine = { kind: AgentLineKind; text: string };

const AGENT_SCRIPT: AgentLine[] = [
  { kind: 'cmd', text: 'start quest · zklogin' },
  { kind: 'think', text: 'drafting a soulbound badge' },
  { kind: 'code', text: 'public struct Badge has key {' },
  { kind: 'code', text: '    id: UID,' },
  { kind: 'code', text: '    quest: u8,' },
  { kind: 'code', text: '}' },
  { kind: 'think', text: 'signing with zkLogin — no seed phrase' },
  { kind: 'ok', text: 'deployed · 0x8887…56daf' },
  { kind: 'ok', text: 'badge minted → you' },
];

const AGENT_GUTTER: Record<AgentLineKind, { glyph: string; cls: string }> = {
  cmd: { glyph: '❯', cls: 'text-terracotta' },
  think: { glyph: '↳', cls: 'text-sage' },
  code: { glyph: '│', cls: 'text-ink-mute/40' },
  ok: { glyph: '✓', cls: 'text-sage' },
};

const AGENT_TEXT: Record<AgentLineKind, string> = {
  cmd: 'text-ink-dim',
  think: 'text-ink-mute italic',
  code: 'text-ink-dim',
  ok: 'text-sage',
};

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduce;
}

function AgentForeshadow() {
  const reduce = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState(0);
  const [chars, setChars] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) {
      setRevealed(AGENT_SCRIPT.length);
      return;
    }
    let line = 0;
    let char = 0;
    let timer: number;
    setRevealed(0);
    setChars(0);

    const step = () => {
      const cur = AGENT_SCRIPT[line];
      if (!cur) {
        timer = window.setTimeout(() => setCycle((c) => c + 1), 3400);
        return;
      }
      if (char <= cur.text.length) {
        setRevealed(line);
        setChars(char);
        char += 1;
        const speed = cur.kind === 'think' ? 28 : 15;
        timer = window.setTimeout(step, speed + Math.random() * 34);
      } else {
        line += 1;
        char = 0;
        setRevealed(line);
        setChars(0);
        const gap = cur.kind === 'code' ? 80 : cur.kind === 'think' ? 380 : 240;
        timer = window.setTimeout(step, gap);
      }
    };
    timer = window.setTimeout(step, 450);
    return () => window.clearTimeout(timer);
  }, [reduce, cycle]);

  return (
    <div
      aria-hidden
      className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[30rem] h-[24rem] pointer-events-none select-none"
    >
      {/* The wedge itself — faint deep-cream with grain, clipped to the
          left-pointing triangle. Part of the page, not a card. */}
      <div className="absolute inset-0 bg-paper-deep bg-grain-paper bg-[length:200px_200px] [clip-path:polygon(100%_0,0%_50%,100%_100%)]" />

      {/* The agent, working — kept in the wide right of the wedge so nothing
          gets clipped by the diagonal. */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-[15rem] font-mono text-[12.5px] leading-6">
        <div className="flex items-center gap-1.5 mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
          <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
          suisei agent
        </div>
        {AGENT_SCRIPT.map((l, i) => {
          if (i > revealed) return null;
          const isActive = !reduce && i === revealed;
          const shown = isActive ? l.text.slice(0, chars) : l.text;
          const gutter = AGENT_GUTTER[l.kind];
          return (
            <div key={i} className="flex gap-2 whitespace-pre">
              <span className={`${gutter.cls} shrink-0`}>{gutter.glyph}</span>
              <span className={AGENT_TEXT[l.kind]}>
                {isActive ? (
                  <>
                    {shown.slice(0, -1)}
                    {shown.length > 0 && (
                      <span key={chars} className="animate-grain-in">
                        {shown.slice(-1)}
                      </span>
                    )}
                    <span className="inline-block w-[7px] h-[15px] -mb-[2px] ml-0.5 align-middle bg-terracotta animate-caret shadow-[-3px_0_0_rgba(215,85,46,0.32),-6px_0_0_rgba(215,85,46,0.16),-10px_0_0_rgba(215,85,46,0.07)]" />
                  </>
                ) : (
                  shown
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Nav({ onPlay }: { onPlay: () => void }) {
  return (
    <nav className="px-6 py-5 flex items-center justify-between border-b border-paper-line/60">
      <div className="flex items-center gap-2">
        <BadgeMark />
        <span className="font-display font-semibold text-ink text-[17px]">
          Suisei
        </span>
      </div>
      <div className="flex items-center gap-1">
        <a href="#stack" className="btn-ghost text-sm">
          Stack
        </a>
        <a href="#mcp" className="btn-ghost text-sm">
          MCP
        </a>
        <button type="button" onClick={onPlay} className="btn-primary text-sm">
          Start
        </button>
      </div>
    </nav>
  );
}

function BadgeMark() {
  return (
    <span
      aria-hidden
      className="relative inline-flex w-7 h-7 items-center justify-center rounded-[10px] bg-ink"
    >
      <span className="w-3.5 h-3.5 rounded-[6px] bg-butter" />
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-terracotta border-2 border-paper" />
    </span>
  );
}

function PillarRow() {
  const pillars = [
    {
      title: 'Real Move, every quest',
      body: 'You finish each quest by deploying a real Move package on testnet. The compiler is the teacher.',
      color: 'bg-butter/30',
      accent: 'text-ink',
      icon: <Box size={18} />,
    },
    {
      title: 'No seed phrase, no extension',
      body: 'zkLogin gets you a wallet from your Google account in five seconds. The first transaction is free, sponsored.',
      color: 'bg-sage/25',
      accent: 'text-ink',
      icon: <Sparkles size={18} />,
    },
    {
      title: 'A toolkit, not a tutorial',
      body: 'Everything Suisei can do is exposed as an MCP server. Plug your own agent in and it gets the same Sui superpowers.',
      color: 'bg-terracotta/20',
      accent: 'text-ink',
      icon: <Terminal size={18} />,
    },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {pillars.map((p) => (
        <article key={p.title} className="card-paper p-5">
          <span
            className={`inline-flex w-10 h-10 items-center justify-center rounded-[12px] ${p.color} ${p.accent} mb-4`}
          >
            {p.icon}
          </span>
          <h3 className="font-display font-semibold text-ink text-lg mb-1.5">
            {p.title}
          </h3>
          <p className="text-ink-dim leading-relaxed text-[15px]">{p.body}</p>
        </article>
      ))}
    </div>
  );
}

function Outro() {
  return (
    <section id="mcp" className="border-t border-paper-line/60 bg-paper-soft">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <p className="eyebrow mb-4">For agent builders</p>
        <h2 className="font-display text-4xl sm:text-5xl tracking-[-0.01em] font-semibold text-ink mb-4 max-w-2xl">
          Suisei is the showcase. Sui Skills is the kit.
        </h2>
        <p className="text-ink-dim text-lg leading-[1.55] max-w-2xl mb-8">
          The same toolkit Suisei uses to teach is published as an MCP server.
          Add it to Claude Desktop, Cursor, or your own agent and you get Move
          deploys, PTBs, Walrus storage, Seal encryption, DeepBook orders and
          more as one-line tools.
        </p>
        <div className="card-paper p-5 max-w-2xl">
          <p className="eyebrow mb-3">Quickstart</p>
          <pre className="font-mono text-[13px] text-ink leading-relaxed overflow-x-auto">
{`npm i @suisei/sui-skills-mcp
# then in claude_desktop_config.json
{ "mcpServers": { "sui": { "command": "npx",
    "args": ["@suisei/sui-skills-mcp"] } } }`}
          </pre>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-paper-line/60 px-6 py-8">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm text-ink-mute">
        <p className="flex items-center gap-2">
          <BookOpen size={13} />
          Built for Sui Overflow 2026
        </p>
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase">
          v0.1 · alpha
        </p>
      </div>
    </footer>
  );
}
