import {
  ArrowUpRight,
  CheckCircle,
  Circle,
  GithubLogo,
  Key,
  Lock,
  Package,
  Plus,
} from '@phosphor-icons/react/dist/ssr';
import { Reveal } from '@/components/Reveal';
import { RotatingEyebrow } from '@/components/RotatingEyebrow';
import { AnimatedTerminal } from '@/components/AnimatedTerminal';
import { Clients } from '@/components/Clients';
import { FlowDiagram } from '@/components/FlowDiagram';
import { SlotImage } from '@/components/SlotImage';
import { ToolDirectory } from '@/components/ToolDirectory';
import { Showcase } from '@/components/Showcase';
import { toolCount } from '@/lib/tools';

const GITHUB = 'https://github.com/eienel/suisei';
const NPM_MCP = 'https://www.npmjs.com/package/@suisei-mcp/mcp';
const NPM_SIGNER = 'https://www.npmjs.com/package/@suisei-mcp/agent-signer';
const SUBMIT =
  'https://github.com/eienel/suisei/issues/new?labels=showcase&title=%5BShowcase%5D+';
const BADGE_PKG =
  '0x8dcb044c983362378234c6c12c5b0fb7ae83f81b63b2e2b0a8b38d63b3e5269f';
const BADGE_EXPLORER = `https://suiscan.xyz/testnet/object/${BADGE_PKG}`;

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Clients />
        <Stats />
        <Moat />
        <Security />
        <Flow />
        <Tools />
        <Built />
        <Roadmap />
      </main>
      <Footer />
    </>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2.5">
          <Mark />
          <span className="font-semibold tracking-tight">Suisei</span>
          <span
            lang="ja"
            className="text-sm text-faint"
            title="suisei, comet"
          >
            彗星
          </span>
        </a>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="#security" className="hidden transition-colors hover:text-ink sm:inline">
            Security
          </a>
          <a href="#tools" className="hidden transition-colors hover:text-ink sm:inline">
            Tools
          </a>
          <a href="#showcase" className="hidden transition-colors hover:text-ink sm:inline">
            Showcase
          </a>
          <a
            href={GITHUB}
            className="flex items-center gap-1.5 transition-colors hover:text-ink"
            aria-label="Suisei on GitHub"
          >
            <GithubLogo size={18} weight="fill" />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header
      id="top"
      className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 pt-12 pb-14 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:pt-20 md:pb-20"
    >
      <div className="min-w-0">
        <RotatingEyebrow />
        <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.75rem] lg:leading-[1.04]">
          The Sui Stack as{' '}
          <span className="ink-underline text-accent">one-line tools</span>.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Suisei puts Sui behind the Model Context Protocol, so any AI agent
          can read, build, simulate, sign, and submit on chain. Full portfolio
          visibility, persistent memory, transaction safety, and boundless agent
          autonomy. All non-custodial.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <a
            href={GITHUB}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent-hover active:translate-y-0"
          >
            <GithubLogo size={18} weight="fill" />
            Get started on GitHub
          </a>
          <a
            href={NPM_MCP}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-paper-raised px-5 py-3 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-accent active:translate-y-0"
          >
            <Package size={18} />
            View on npm
          </a>
        </div>
      </div>

      {/* Right column: the comet sits above and to the right as a clear
          visual, the terminal below it. They overlap only slightly so the
          comet stays legible. Contained so nothing overflows on mobile. */}
      <Reveal className="relative min-w-0 md:self-start">
        <div
          aria-hidden="true"
          className="float pointer-events-none mx-auto mb-[-1rem] w-full max-w-sm select-none md:mb-[-1.5rem] md:max-w-md"
        >
          <SlotImage
            src="/images/hero-comet-trim.png"
            alt=""
            aspect="653 / 339"
            fit="contain"
            label="comet"
            className="border-0 bg-transparent shadow-none"
          />
        </div>
        <AnimatedTerminal />
      </Reveal>
    </header>
  );
}

function Stats() {
  const stats = [
    { value: toolCount.toString(), label: 'tools, one install' },
    { value: '2', label: 'packages on npm' },
    { value: '0', label: 'keys held by the toolkit' },
    { value: '100%', label: 'on real testnet' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:py-16">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-paper-raised px-5 py-8 text-center">
            <p className="font-mono text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {s.value}
            </p>
            <p className="mt-2 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Moat() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
          Why Suisei, not another SDK.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Every other Sui SDK is built for apps. Suisei is built for agents.
        </p>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Reveal>
          <div className="rounded-lg border border-line bg-paper-raised p-5">
            <p className="font-semibold text-ink">Agent-first SDK</p>
            <p className="mt-2 text-sm text-muted">Not app code. One-line tools. Agents reason over structured JSON, not write React.</p>
          </div>
        </Reveal>
        <Reveal delay={45}>
          <div className="rounded-lg border border-line bg-paper-raised p-5">
            <p className="font-semibold text-ink">Portfolio in one call</p>
            <p className="mt-2 text-sm text-muted">sui_get_portfolio snapshots: coins, stakes, rewards, SUI exposure. Manual fan-out doesn't exist.</p>
          </div>
        </Reveal>
        <Reveal delay={90}>
          <div className="rounded-lg border border-line bg-paper-raised p-5">
            <p className="font-semibold text-ink">Transaction safety built-in</p>
            <p className="mt-2 text-sm text-muted">sui_explain_tx decodes, simulates, judges before you sign. No other SDK does this.</p>
          </div>
        </Reveal>
        <Reveal delay={135}>
          <div className="rounded-lg border border-line bg-paper-raised p-5">
            <p className="font-semibold text-ink">Persistent agent memory</p>
            <p className="mt-2 text-sm text-muted">Agents remember across sessions. Memories indexed on-chain, stored on Walrus, portable.</p>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="rounded-lg border border-line bg-paper-raised p-5">
            <p className="font-semibold text-ink">Bounded autonomy</p>
            <p className="mt-2 text-sm text-muted">Policy Vault: on-chain spending limits, recipient allowlists, expiry. Trust agents with real control.</p>
          </div>
        </Reveal>
        <Reveal delay={225}>
          <div className="rounded-lg border border-line bg-paper-raised p-5">
            <p className="font-semibold text-ink">Universal via MCP</p>
            <p className="mt-2 text-sm text-muted">Works with Claude Desktop, Cursor, Claude web/mobile, custom bots. Not Sui-only.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Security() {
  return (
    <section id="security" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
          A toolkit you would trust an agent with.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Two rules hold the whole design together. They are why an agent can
          act on chain without ever holding the keys that move money.
        </p>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Reveal>
          <article className="group h-full rounded-2xl border border-line bg-paper-raised p-7 transition-colors hover:border-accent">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Lock size={24} weight="duotone" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">
              The toolkit never holds keys
            </h3>
            <p className="mt-3 leading-relaxed text-muted">
              Every transaction-building tool returns unsigned{' '}
              <code className="font-mono text-sm text-ink">tx_bytes_base64</code>
              . The host signs, the toolkit submits. A tool that holds a key is
              a tool that can spend money.
            </p>
          </article>
        </Reveal>
        <Reveal delay={90}>
          <article className="group h-full rounded-2xl border border-line bg-paper-raised p-7 transition-colors hover:border-accent">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Key size={24} weight="duotone" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">
              Keys never enter an agent
            </h3>
            <p className="mt-3 leading-relaxed text-muted">
              Key generation is not a tool, because that would land the secret
              in the model prompt and logs. Signing lives in{' '}
              <code className="font-mono text-sm text-ink">agent-signer</code>,
              a separate local process.
            </p>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

function Flow() {
  return (
    <section className="border-y border-line bg-paper-raised/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            One loop, four steps, zero exposed keys.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            From a plain-language ask to an on-chain result. The signing step
            is the only one that touches a key, and it stays on your machine.
          </p>
        </Reveal>
        <div className="mt-12">
          <FlowDiagram />
        </div>
      </div>
    </section>
  );
}

function Tools() {
  return (
    <section id="tools" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {toolCount} tools, ready the moment you connect.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Portfolio snapshots. Transaction safety. Persistent agent memory.
          Validator comparisons. Everything agents need to act autonomously. All
          read-only until explicitly signed.
        </p>
      </Reveal>
      <div className="mt-12">
        <ToolDirectory />
      </div>
    </section>
  );
}

function Built() {
  return (
    <section
      id="showcase"
      className="border-t border-line bg-paper-raised/60 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Built with Suisei
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
                Projects that run on the toolkit. Shipped something with it? Add
                yours, it takes a minute.
              </p>
            </div>
            <a
              href={SUBMIT}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent-hover active:translate-y-0"
            >
              <Plus size={17} weight="bold" />
              Submit your project
            </a>
          </div>
        </Reveal>
        <div className="mt-12">
          <Showcase />
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const live = [
    'MCP server and non-custodial signer on npm',
    'Remote endpoint, add it to Claude on web and mobile',
    'Soulbound badge module published on Sui testnet',
  ];
  const next = [
    'Mainnet deployment of the badge module',
    'TxLens browser extension, the verdict inline at sign time',
    'TxRiskRegistry, a community signal for risky packages on-chain',
  ];
  return (
    <section id="roadmap" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Where it is, where it goes.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          The toolkit ships today. The path to mainnet and a safer agentic
          web is already mapped.
        </p>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-line bg-paper-raised p-7">
            <p className="font-mono text-xs uppercase tracking-wider text-faint">
              Live now
            </p>
            <ul className="mt-5 space-y-4">
              {live.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle
                    size={20}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-accent"
                  />
                  <span className="leading-relaxed text-ink">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href={BADGE_EXPLORER}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1 font-mono text-xs text-accent transition-colors hover:text-accent-hover"
            >
              View the badge package on Suiscan
              <ArrowUpRight size={13} />
            </a>
          </div>
        </Reveal>
        <Reveal delay={90}>
          <div className="h-full rounded-2xl border border-line bg-paper-raised p-7">
            <p className="font-mono text-xs uppercase tracking-wider text-faint">
              Next
            </p>
            <ul className="mt-5 space-y-4">
              {next.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Circle
                    size={20}
                    weight="regular"
                    className="mt-0.5 shrink-0 text-faint"
                  />
                  <span className="leading-relaxed text-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="font-semibold tracking-tight">Suisei</span>
            <span lang="ja" className="text-sm text-faint" title="suisei, comet">
              彗星
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Sui&apos;s agent toolkit. 彗星 means comet. MIT licensed, built for
            Sui Overflow 2026.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <FooterLink href={GITHUB} icon>
            GitHub
          </FooterLink>
          <FooterLink href={`${GITHUB}#readme`}>How to use</FooterLink>
          <FooterLink href={NPM_MCP}>mcp on npm</FooterLink>
          <FooterLink href={NPM_SIGNER}>agent-signer on npm</FooterLink>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  icon = false,
}: {
  href: string;
  children: React.ReactNode;
  icon?: boolean;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-muted transition-colors hover:text-ink"
    >
      {icon && <GithubLogo size={15} weight="fill" />}
      {children}
      <ArrowUpRight size={13} className="text-faint" />
    </a>
  );
}

/* The Suisei mark: the real comet, cropped from the hero render. */
function Mark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/comet-logo.png"
      alt=""
      width={26}
      height={26}
      aria-hidden="true"
      className="h-6 w-6 shrink-0 select-none"
    />
  );
}
