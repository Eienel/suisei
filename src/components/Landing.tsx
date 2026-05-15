import { useApp } from '@/state/app';
import { LESSONS, totalQuestions } from '@/data/lessons';
import { BLOCK_BY_ID } from '@/world/blockTypes';

/**
 * Editorial-style landing. Deliberately strips the usual AI-app tells
 * (gradient-blob backdrops, "verb-your-noun" headlines, three icon
 * feature cards, glassmorphism). Plain typography, asymmetric grid,
 * a hand-positioned isometric block diorama as the centrepiece.
 */
export function Landing() {
  const setScreen = useApp((s) => s.setScreen);
  const completed = useApp((s) => s.completedLessons);
  const hasProgress = completed.length > 0;
  const total = totalQuestions();

  return (
    <div className="fixed inset-0 overflow-y-auto bg-ink text-fg">
      {/* Top bar */}
      <header className="max-w-6xl mx-auto px-6 sm:px-10 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rotate-45"
            style={{ background: '#FFB020' }}
          />
          <span className="font-mono text-sm tracking-tight text-fg">blockbuilders</span>
        </div>
        <nav className="flex items-center gap-4 text-xs text-fg-mute">
          <a href="https://github.com/Eienel/BlockBuilders" target="_blank" rel="noreferrer" className="hover:text-fg">
            source
          </a>
          <span className="text-fg-mute">·</span>
          <span>built for sui overflow</span>
        </nav>
      </header>

      {/* Hero block */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-20">
        <div className="grid grid-cols-12 gap-y-8 sm:gap-x-8 items-start">
          {/* Left column — copy */}
          <div className="col-span-12 lg:col-span-6">
            <p className="font-mono text-[11px] text-fg-mute uppercase tracking-[0.18em] mb-6">
              An interactive crypto primer
            </p>
            <h1 className="text-[42px] sm:text-[58px] lg:text-[68px] leading-[0.95] font-semibold tracking-tight text-fg mb-7">
              Read a lesson.
              <br />
              Answer the questions.
              <br />
              Watch a town{' '}
              <span className="text-accent-amber">appear</span>.
            </h1>
            <p className="text-fg-mute text-lg leading-relaxed max-w-md mb-8">
              Six short lessons — wallets, tokens, smart contracts, validators,
              zero knowledge, DeFi. Every correct answer drops one block into your
              world. Finish all of them and you've built a {total}-block crypto town.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setScreen('lessons')}
                className="bg-fg text-ink px-6 py-3 rounded-md font-semibold hover:bg-white transition-colors text-base"
              >
                {hasProgress ? 'Keep going' : 'Begin lesson 1'}
              </button>
              <button
                type="button"
                onClick={() => setScreen('gallery')}
                className="text-fg-dim hover:text-fg px-3 py-3 font-medium transition-colors text-base"
              >
                Visit other towns →
              </button>
              <button
                type="button"
                onClick={() => setScreen('leaderboard')}
                className="text-fg-dim hover:text-fg px-3 py-3 font-medium transition-colors text-base"
              >
                🏆 Leaderboard
              </button>
              {hasProgress && (
                <span className="font-mono text-xs text-fg-mute">
                  {completed.length} of {LESSONS.length} lessons done
                </span>
              )}
            </div>
          </div>

          {/* Right column — isometric block diorama (SVG) */}
          <div className="col-span-12 lg:col-span-6 flex justify-center lg:justify-end">
            <IsoDiorama />
          </div>
        </div>

        {/* Lessons strip — editorial table style */}
        <div className="mt-24 border-t border-ink-line/60 pt-8">
          <p className="font-mono text-[11px] text-fg-mute uppercase tracking-[0.18em] mb-5">
            The curriculum
          </p>
          <ul className="divide-y divide-ink-line/60">
            {LESSONS.map((l, idx) => {
              const types = Array.from(new Set(l.quiz.map((q) => q.reward.type)));
              return (
                <li key={l.id} className="py-3 flex items-baseline gap-5">
                  <span className="font-mono text-sm text-fg-mute w-8 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-semibold text-fg w-40 shrink-0">{l.title}</span>
                  <span className="text-sm text-fg-mute flex-1 hidden sm:block">{l.blurb}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {types.map((t) => {
                      const def = BLOCK_BY_ID[t];
                      return (
                        <span
                          key={t}
                          title={def.label}
                          className="w-3 h-3"
                          style={{ background: def.color }}
                        />
                      );
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 sm:px-10 pb-10 flex items-center justify-between text-xs font-mono text-fg-mute border-t border-ink-line/60 pt-6">
        <span>blockbuilders v0.3</span>
        <span>onchain on sui testnet</span>
      </footer>
    </div>
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
