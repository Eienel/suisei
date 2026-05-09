import { useApp } from '@/state/store';

export function Landing() {
  const setScreen = useApp((s) => s.setScreen);

  return (
    <main className="min-h-screen w-full bg-brand-cream text-brand-ink font-display flex flex-col">
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="font-extrabold tracking-tight text-xl">BlockBuilders</span>
        </div>
        <span className="rounded-full bg-brand-yellow text-brand-ink font-bold text-sm px-3 py-1 shadow-brick">
          $BLOCK
        </span>
      </header>

      <section className="flex-1 px-6 sm:px-10 pb-16 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 max-w-7xl mx-auto w-full">
        <div className="flex-1">
          <p className="text-brand-blue font-bold uppercase tracking-widest text-sm mb-4">
            Bags hackathon · MVP
          </p>
          <h1 className="font-extrabold leading-[0.95] tracking-tight text-4xl sm:text-6xl lg:text-7xl mb-6">
            think Lego
            <br />
            <span className="text-brand-blue">but for crypto.</span>
          </h1>
          <p className="text-lg sm:text-xl text-brand-ink-soft max-w-xl mb-8 leading-relaxed">
            Snap bricks together, learn how blockchains actually work. No jargon
            firehose. No homework. Just bricks that click into place and a tiny
            lesson when they do.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setScreen('sandbox')}
              className="bg-brand-blue text-white font-extrabold text-lg px-7 py-4 rounded-brick shadow-brick-lg hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-brick transition-all"
            >
              Enter Sandbox →
            </button>
            <a
              href="https://twitter.com/intent/tweet?text=building%20BlockBuilders%20%E2%80%94%20think%20Lego%20but%20for%20crypto%20%E2%80%94%20%24BLOCK"
              target="_blank"
              rel="noreferrer"
              className="bg-white text-brand-ink font-bold text-lg px-7 py-4 rounded-brick shadow-brick hover:translate-y-[-1px] transition-all"
            >
              Share
            </a>
          </div>
          <p className="mt-8 text-sm text-brand-ink-soft">
            Single-player · works in your browser · no install
          </p>
        </div>

        <div className="flex-1 flex justify-center lg:justify-end">
          <BigBrick />
        </div>
      </section>

      <footer className="px-6 sm:px-10 py-6 text-sm text-brand-ink-soft border-t border-brand-ink/5">
        Built for the Bags hackathon. <span className="opacity-60">v0.0.0 · scaffold</span>
      </footer>
    </main>
  );
}

function LogoMark() {
  return (
    <div className="relative w-9 h-9">
      <div className="absolute inset-x-0 bottom-0 h-7 rounded-md bg-brand-blue shadow-brick" />
      <div className="absolute left-1 top-0 w-3 h-3 rounded-full bg-brand-yellow border-2 border-brand-blue" />
      <div className="absolute right-1 top-0 w-3 h-3 rounded-full bg-brand-yellow border-2 border-brand-blue" />
    </div>
  );
}

function BigBrick() {
  return (
    <div className="relative w-72 h-44 sm:w-96 sm:h-56">
      <div className="absolute inset-x-0 bottom-0 h-32 sm:h-44 rounded-2xl bg-brand-blue shadow-brick-lg" />
      <div className="absolute inset-x-0 bottom-0 h-32 sm:h-44 rounded-2xl bg-gradient-to-b from-brand-blue-light/50 to-transparent" />
      <div className="absolute left-8 top-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-yellow border-[6px] border-brand-blue" />
      <div className="absolute right-8 top-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-yellow border-[6px] border-brand-blue" />
      <div className="absolute inset-x-0 bottom-4 sm:bottom-6 text-center">
        <span className="text-white font-extrabold tracking-[0.3em] text-lg sm:text-xl">
          BLOCK
        </span>
      </div>
    </div>
  );
}
