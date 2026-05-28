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
        <p className="eyebrow mb-5">Suisei · public alpha</p>

        <h1 className="font-display text-[56px] sm:text-[88px] leading-[0.95] tracking-[-0.02em] font-semibold text-ink mb-8 max-w-4xl">
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

        <p className="text-ink-dim text-xl leading-[1.55] max-w-2xl mb-10">
          An agent that lives on Sui and walks you through the stack the way a
          patient senior would. Eight short quests, each ending in real on-chain
          code with your name on it.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-14">
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

        <PillarRow />
      </main>

      <Outro />
      <Footer />
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
