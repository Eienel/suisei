import { useApp } from '@/state/app';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { LESSONS, totalQuestions } from '@/data/lessons';
import { BLOCK_BY_ID } from '@/world/blockTypes';

/**
 * Premium-minimalist editorial landing. Dark ink background, generous type,
 * asymmetric 2-column hero with mascot, feature strip, and curriculum table.
 * Positions BlockBuilders as sophisticated but playful—appeals to both
 * 8–14 builders and Sui judges.
 */
export function Landing() {
  const setScreen = useApp((s) => s.setScreen);
  const completed = useApp((s) => s.completedLessons);
  const account = useCurrentAccount();
  const hasProgress = completed.length > 0;
  const total = totalQuestions();

  return (
    <div className="fixed inset-0 overflow-y-auto bg-ink text-fg">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pt-20 pb-32">
        <div className="grid grid-cols-12 gap-y-12 lg:gap-x-12 items-start lg:items-center">
          {/* Left: Headline + Copy + CTAs */}
          <div className="col-span-12 lg:col-span-6">
            <p className="font-mono text-[11px] text-fg-mute uppercase tracking-[0.2em] mb-8">
              Onchain learning + DeFi
            </p>
            <h1 className="text-[56px] sm:text-[72px] lg:text-[80px] leading-[0.95] font-bold tracking-tight mb-8">
              <span className="text-accent-blue">Build a town.</span>
              <br />
              <span className="text-accent-blue">Stake real Sui.</span>
              <br />
              Watch it earn.
            </h1>
            <p className="text-lg text-fg-mute leading-relaxed mb-10 max-w-lg">
              BlockBuilders teaches crypto through play. Solve lessons → blocks drop into your town → complete buildings in the DeFi District → stake real SUI → watch your town earn. Your portfolio, visualized.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
              <button
                type="button"
                onClick={() => setScreen('sandbox')}
                className="bg-accent-blue text-ink px-7 py-4 rounded-lg font-semibold hover:bg-accent-blue/90 transition-colors text-base whitespace-nowrap"
              >
                Enter Sandbox
              </button>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setScreen('lessons')}
                  className="text-fg-dim hover:text-fg transition-colors font-medium"
                >
                  Read Lessons →
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('defi')}
                  className="text-fg-dim hover:text-fg transition-colors font-medium"
                >
                  DeFi District →
                </button>
              </div>
            </div>

            {/* Progress indicator (if logged in) */}
            {hasProgress && (
              <div className="inline-block bg-ink-soft border border-ink-line/40 rounded-lg px-4 py-2">
                <p className="font-mono text-xs text-fg-mute">
                  {completed.length} of {LESSONS.length} lessons done{' '}
                  {account?.address && '· town value querying…'}
                </p>
              </div>
            )}
          </div>

          {/* Right: Mascot Hero */}
          <div className="col-span-12 lg:col-span-6 flex justify-center lg:justify-end">
            <MascotHero />
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FeatureCard
            emoji="🧠"
            title="Learn real crypto"
            body="No jargon dumps. Each lesson teaches one concept; your town grows as you progress."
          />
          <FeatureCard
            emoji="🏗️"
            title="Build instantly"
            body="Drag blocks onto a grid. No animations between actions, no loading screens, no menu shuffling."
          />
          <FeatureCard
            emoji="💰"
            title="Stake & earn"
            body="Complete buildings in the DeFi District. Deposit 1 testnet SUI. Your stakes compound every epoch."
          />
        </div>
      </section>

      {/* Curriculum Table */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-32 border-t border-ink-line/40 pt-12">
        <p className="font-mono text-[11px] text-fg-mute uppercase tracking-[0.2em] mb-8">
          The curriculum
        </p>
        <div className="space-y-1">
          {LESSONS.map((l, idx) => {
            const types = Array.from(new Set(l.quiz.map((q) => q.reward.type)));
            return (
              <button
                key={l.id}
                onClick={() => setScreen('lessons')}
                className="w-full text-left py-4 px-4 hover:bg-ink-soft/40 transition-colors rounded-md flex items-baseline gap-6 group"
              >
                <span className="font-mono text-sm text-fg-mute w-8 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-semibold text-fg group-hover:underline shrink-0 min-w-40">
                  {l.title}
                </span>
                <span className="text-sm text-fg-mute flex-1 hidden sm:block">{l.blurb}</span>
                <span className="flex items-center gap-1 shrink-0">
                  {types.map((t) => {
                    const def = BLOCK_BY_ID[t];
                    return (
                      <span
                        key={t}
                        title={def.label}
                        className="w-3 h-3 rounded-sm"
                        style={{ background: def.color }}
                      />
                    );
                  })}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-ink-line/20 bg-ink/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="font-mono text-base font-bold tracking-tight text-fg">
          BlockBuilders
        </div>
        <nav className="flex items-center gap-6 text-sm text-fg-mute">
          <a href="https://github.com/Eienel/BlockBuilders" target="_blank" rel="noreferrer" className="hover:text-fg transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-fg transition-colors">
            Docs
          </a>
          <span className="text-fg-mute">·</span>
          <span className="text-xs">Sui Overflow 2026</span>
        </nav>
      </div>
    </header>
  );
}

function MascotHero() {
  // Placeholder: will be replaced with actual mascot image/SVG
  // For now, show a placeholder that indicates where the mascot goes
  return (
    <div className="w-full h-96 sm:h-[480px] flex items-center justify-center rounded-2xl border border-ink-line/40 bg-ink-soft/30">
      <div className="text-center">
        <p className="font-mono text-xs text-fg-mute mb-2">Mascot</p>
        <p className="text-sm text-fg-mute">(Suil / Raldo / RG-77)</p>
      </div>
    </div>
  );
}

function FeatureCard({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="border border-ink-line/40 rounded-xl p-8 hover:border-ink-line/60 transition-colors bg-ink-soft/20">
      <p className="text-3xl mb-4">{emoji}</p>
      <h3 className="font-semibold text-fg text-lg mb-3">{title}</h3>
      <p className="text-sm text-fg-mute leading-relaxed">{body}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-line/40 py-8">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-fg-mute gap-4">
        <span>BlockBuilders v0.4</span>
        <div className="flex items-center gap-4">
          <a href="https://github.com" className="hover:text-fg transition-colors">
            GitHub
          </a>
          <span>·</span>
          <span>Sui testnet</span>
        </div>
      </div>
    </footer>
  );
}

/**
 * Hand-positioned isometric stack of cubes drawn in SVG.
 * Each cube is three parallelograms (top / left / right) so we can
 * shade them differently and get a real "Lego on a table" feel.
 */
function IsoDiorama() {
  // Iso projection: x→(1, 0.5), z→(-1, 0.5)
  // We place cubes on integer (gx, gy, gz) and let the SVG do the rest.
  const cubes: Array<{ gx: number; gy: number; gz: number; color: string }> = [
    // Town centre + paths
    { gx: 0, gy: 0, gz: 0, color: '#FACC15' }, // wallet keystone
    { gx: 1, gy: 0, gz: 0, color: '#FACC15' },
    { gx: 0, gy: 0, gz: 1, color: '#06B6D4' }, // contract obelisk
    { gx: 0, gy: 1, gz: 1, color: '#06B6D4' },
    { gx: 1, gy: 0, gz: 1, color: '#F472B6' }, // token prism
    { gx: 2, gy: 0, gz: 0, color: '#3B82F6' }, // security
    { gx: 2, gy: 0, gz: 1, color: '#F5F7FF' }, // governance
    { gx: -1, gy: 0, gz: 0, color: '#FFB020' }, // defi vault
    { gx: -1, gy: 0, gz: 1, color: '#FFB020' },
    { gx: -1, gy: 0, gz: -1, color: '#00E5FF' }, // zk crystal
    { gx: 0, gy: 0, gz: -1, color: '#00E5FF' },
    { gx: 1, gy: 0, gz: -1, color: '#8B5CF6' }, // data core
  ];

  // Sort painter's algorithm — far cubes first
  const sorted = [...cubes].sort((a, b) => a.gx + a.gz - (b.gx + b.gz));

  const TILE = 40; // grid cell on screen
  const HALF = TILE / 2;
  const RISE = TILE * 0.5; // vertical foreshorten per gy
  const project = (gx: number, gy: number, gz: number): [number, number] => [
    (gx - gz) * TILE,
    (gx + gz) * HALF - gy * RISE,
  ];

  const W = 460;
  const H = 360;
  const cx = W / 2;
  const cy = H * 0.62;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxWidth: 460 }}
      aria-hidden
    >
      {/* Ground shadow + grid hint */}
      <g transform={`translate(${cx} ${cy})`}>
        <ellipse cx={0} cy={20} rx={180} ry={28} fill="rgba(0,0,0,0.55)" />
        {sorted.map((c, i) => {
          const [px, py] = project(c.gx, c.gy, c.gz);
          return <Cube key={i} x={px} y={py} size={TILE} color={c.color} />;
        })}
      </g>
    </svg>
  );
}

function Cube({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const half = size / 2;
  // Vertices of a flat-projected cube
  const top = `${x},${y - size * 0.5} ${x + size},${y} ${x},${y + size * 0.5} ${x - size},${y}`;
  const right = `${x + size},${y} ${x + size},${y + size} ${x},${y + size + size * 0.5} ${x},${y + size * 0.5}`;
  const left = `${x - size},${y} ${x - size},${y + size} ${x},${y + size + size * 0.5} ${x},${y + size * 0.5}`;

  // Three shades: top brightest, right medium, left darkest.
  return (
    <g>
      <polygon points={left} fill={shade(color, -0.35)} />
      <polygon points={right} fill={shade(color, -0.18)} />
      <polygon points={top} fill={color} />
      {/* studs on top */}
      <circle cx={x - half / 1.6} cy={y - size * 0.18} r={2.4} fill={shade(color, 0.18)} />
      <circle cx={x + half / 1.6} cy={y - size * 0.18} r={2.4} fill={shade(color, 0.18)} />
      <circle cx={x - half / 1.6} cy={y + size * 0.18} r={2.4} fill={shade(color, 0.18)} />
      <circle cx={x + half / 1.6} cy={y + size * 0.18} r={2.4} fill={shade(color, 0.18)} />
    </g>
  );
}

/** Brighten (>0) or darken (<0) a hex color. */
function shade(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + 255 * amt))).toString(16).padStart(2, '0');
  return `#${adj(r)}${adj(g)}${adj(b)}`;
}
