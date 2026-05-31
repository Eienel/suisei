import {
  ArrowUpRight,
  GithubLogo,
  Key,
  Lock,
  Package,
  Plus,
} from '@phosphor-icons/react/dist/ssr';
import { Reveal } from '@/components/Reveal';
import { Terminal } from '@/components/Terminal';
import { ToolDirectory } from '@/components/ToolDirectory';
import { Showcase } from '@/components/Showcase';
import { toolCount } from '@/lib/tools';

const GITHUB = 'https://github.com/eienel/suisei';
const NPM_MCP = 'https://www.npmjs.com/package/@suisei-mcp/mcp';
const NPM_SIGNER = 'https://www.npmjs.com/package/@suisei-mcp/agent-signer';
const SUBMIT =
  'https://github.com/eienel/suisei/issues/new?labels=showcase&title=%5BShowcase%5D+';

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Clients />
        <Security />
        <Tools />
        <Built />
      </main>
      <Footer />
    </>
  );
}

function Nav() {
  return (
    <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
      <a href="#top" className="flex items-center gap-2.5">
        <Mark />
        <span className="font-semibold tracking-tight">Suisei</span>
      </a>
      <div className="flex items-center gap-6 text-sm text-muted">
        <a href="#tools" className="hidden transition-colors hover:text-ink sm:inline">
          Tools
        </a>
        <a href="#security" className="hidden transition-colors hover:text-ink sm:inline">
          Security
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
    </nav>
  );
}

function Hero() {
  return (
    <header
      id="top"
      className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 pb-20 md:grid-cols-2 md:gap-10 md:pt-20"
    >
      <div>
        <span className="inline-block rounded-full border border-line-strong px-3 py-1 font-mono text-xs text-muted">
          Built for Sui Overflow 2026
        </span>
        <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
          The Sui Stack as one-line tools.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Suisei exposes Sui over the Model Context Protocol, so any AI agent
          can read, build, simulate, sign, and submit on chain.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={GITHUB}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover active:translate-y-px"
          >
            <GithubLogo size={18} weight="fill" />
            Get started on GitHub
          </a>
          <a
            href={NPM_MCP}
            className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-accent active:translate-y-px"
          >
            <Package size={18} />
            View on npm
          </a>
        </div>
      </div>
      <Reveal className="md:pl-4">
        <Terminal />
      </Reveal>
    </header>
  );
}

function Clients() {
  const clients = [
    'Claude Desktop',
    'Claude Code',
    'Cursor',
    'Any MCP client',
  ];
  return (
    <section className="border-y border-line bg-paper-raised/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-8 sm:flex-row sm:justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-faint">
          Works with
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {clients.map((c) => (
            <li key={c} className="text-sm font-medium text-muted">
              {c}
            </li>
          ))}
        </ul>
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
          <article className="h-full rounded-2xl border border-line bg-paper-raised p-7">
            <Lock size={26} weight="duotone" className="text-accent" />
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
        <Reveal delay={80}>
          <article className="h-full rounded-2xl border border-line bg-paper-raised p-7">
            <Key size={26} weight="duotone" className="text-accent" />
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

function Tools() {
  return (
    <section
      id="tools"
      className="border-t border-line bg-paper-raised/60 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {toolCount} tools, ready the moment you connect.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Reads work with no key and no setup. Builders return unsigned bytes
            you sign locally. One install, the whole Sui Stack.
          </p>
        </Reveal>
        <div className="mt-12">
          <ToolDirectory />
        </div>
      </div>
    </section>
  );
}

function Built() {
  return (
    <section id="showcase" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
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
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover active:translate-y-px"
          >
            <Plus size={17} weight="bold" />
            Submit your project
          </a>
        </div>
      </Reveal>
      <div className="mt-12">
        <Showcase />
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
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Sui&apos;s agent toolkit. MIT licensed. Built for Sui Overflow 2026.
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

/* The Suisei mark: a comet dot. One simple geometric glyph, brand accent. */
function Mark() {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block h-5 w-5 rounded-full border-2 border-accent"
    >
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
    </span>
  );
}
