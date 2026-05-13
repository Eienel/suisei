import { useApp } from '@/state/app';
import { ErrorBoundary } from './ErrorBoundary';
import { BlueprintPreview } from './BlueprintPreview';
import { ArrowRight, Sparkles, BookOpen, Cuboid } from 'lucide-react';
import type { TargetBlock } from '@/data/lessons';

const SAMPLE_BUILD: TargetBlock[] = [
  { type: 'token_prism', position: [-1, 0, 0] },
  { type: 'defi_vault', position: [0, 0, 0] },
  { type: 'token_prism', position: [1, 0, 0] },
  { type: 'contract_obelisk', position: [0, 1, 0] },
];

export function Landing() {
  const setScreen = useApp((s) => s.setScreen);
  const completed = useApp((s) => s.completedLessons);
  const hasProgress = completed.length > 0;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-ink text-fg font-sans">
      {/* Backdrop gradient blobs */}
      <BgGlow />

      {/* Top nav */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logomark />
          <span className="font-semibold tracking-tight text-fg">BlockBuilders</span>
        </div>
        <a
          href="https://github.com/Eienel/BlockBuilders"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono text-fg-mute hover:text-fg transition-colors"
        >
          github ↗
        </a>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-12 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div className="animate-rise-in">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-cyan mb-5">
            Sui Overflow · AI Track
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[0.95] mb-6">
            Learn crypto by{' '}
            <span className="bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-magenta bg-clip-text text-transparent">
              building it.
            </span>
          </h1>
          <p className="text-fg-mute text-lg sm:text-xl max-w-xl leading-relaxed mb-8">
            Read a tiny lesson. Pass a quick check. Then prove you got it by
            snapping the right blocks together in a 3D world. Your progress
            lives on-chain as an evolving Sui World NFT.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setScreen('lessons')}
              className="group bg-fg text-ink px-6 py-3.5 rounded-xl font-semibold hover:bg-white transition-all flex items-center gap-2 shadow-glow-soft hover:shadow-glow"
            >
              {hasProgress ? 'Continue' : 'Play now'}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
            <button
              type="button"
              onClick={() => setScreen('lessons')}
              className="text-fg-dim hover:text-fg px-4 py-3.5 font-medium transition-colors"
            >
              See lessons
            </button>
          </div>
          {hasProgress && (
            <p className="mt-5 text-xs font-mono text-fg-mute">
              {completed.length} {completed.length === 1 ? 'lesson' : 'lessons'} completed
            </p>
          )}
        </div>

        {/* Right: spinning blueprint preview */}
        <div className="relative h-[320px] sm:h-[420px] rounded-2xl border border-ink-line/60 overflow-hidden glass">
          <ErrorBoundary fallback={() => <BlueprintFallback />}>
            <BlueprintPreview target={SAMPLE_BUILD} />
          </ErrorBoundary>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="font-mono text-[10px] uppercase tracking-widest text-fg-mute">
              Lesson preview · DeFi vault
            </span>
            <span className="font-mono text-[10px] text-fg-mute">4 blocks</span>
          </div>
        </div>
      </section>

      {/* Feature row */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Feature
            icon={<BookOpen size={18} />}
            tint="cyan"
            title="Read"
            body="Plain-language lessons on Wallets, Tokens, DeFi, Validators, ZK & more — kid-tone, no jargon dumps."
          />
          <Feature
            icon={<Cuboid size={18} />}
            tint="violet"
            title="Build"
            body="Each lesson opens a 3D canvas with a blueprint. Match it from scratch by snapping the right blocks together."
          />
          <Feature
            icon={<Sparkles size={18} />}
            tint="magenta"
            title="Own"
            body="Save your progress as a dynamic World NFT on Sui. Each lesson bumps the version, the chain holds the record."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pb-10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-fg-mute border-t border-ink-line/60 pt-6">
        <span>v0.2 · sui testnet</span>
        <span>built for Sui Overflow · AI track</span>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tint: 'cyan' | 'violet' | 'magenta';
}) {
  const tints = {
    cyan: 'bg-accent-cyan/15 text-accent-cyan',
    violet: 'bg-accent-violet/15 text-accent-violet',
    magenta: 'bg-accent-magenta/15 text-accent-magenta',
  };
  return (
    <div className="glass rounded-2xl p-5">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${tints[tint]}`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-fg text-base mb-1">{title}</h3>
      <p className="text-sm text-fg-mute leading-relaxed">{body}</p>
    </div>
  );
}

function BgGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(closest-side, #00E5FF, transparent)',
        }}
      />
      <div
        className="absolute top-40 right-0 w-[460px] h-[460px] rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(closest-side, #8B5CF6, transparent)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(closest-side, #FF2D92, transparent)',
        }}
      />
    </div>
  );
}

function Logomark() {
  return (
    <div className="w-7 h-7 rounded-lg bg-ink-soft border border-ink-line flex items-center justify-center">
      <div
        className="w-3.5 h-3.5 rounded"
        style={{
          background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
          boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
        }}
      />
    </div>
  );
}

function BlueprintFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink-soft/40">
      <span className="font-mono text-xs text-fg-mute">3D preview unavailable</span>
    </div>
  );
}
