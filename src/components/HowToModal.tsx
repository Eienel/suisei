import { useState } from 'react';

export function HowToModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  if (!open) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 150);
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${
        closing ? 'opacity-0' : 'opacity-100'
      } transition-opacity bg-brand-ink/45 backdrop-blur-sm`}
      onClick={handleClose}
    >
      <div
        className="bg-brand-cream max-w-md w-full rounded-2xl shadow-brick-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-brand-blue font-bold uppercase tracking-widest text-xs mb-1">
          How to play
        </p>
        <h3 className="font-extrabold text-2xl text-brand-ink mb-4">
          Snap bricks. Unlock lessons.
        </h3>

        <ol className="space-y-3 mb-6">
          <Step n={1} title="Tap a brick on the right">
            Each brick is a real crypto thing — wallet, block, transaction, validator…
            Tap one and it lands on the board.
          </Step>
          <Step n={2} title="Drag to position">
            Bricks snap to the grid. Drop two next to each other and they
            fuse with a sparkle.
          </Step>
          <Step n={3} title="Right combo = lesson unlocks">
            Some pairs (and bigger combos) trigger a quick lesson modal.
            Open the <span className="font-bold text-brand-blue">Lessons</span> button
            in the top bar to see hints — the chips on each row tell you
            which bricks to combine.
          </Step>
          <Step n={4} title="Made a mistake?">
            Right-click (or long-press on touch) a brick to remove it.
            <span className="font-bold"> Reset</span> clears the whole board.
          </Step>
        </ol>

        <div className="bg-brand-blue/10 rounded-brick p-3 mb-5 text-sm text-brand-ink-soft leading-relaxed">
          <span className="font-extrabold text-brand-ink">Goal:</span>{' '}
          unlock all 10 lessons. The last one is the whole blockchain loop in four bricks.
          Connect a wallet to mint a $BLOCK Builder Badge once you finish.
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="w-full bg-brand-blue text-white font-extrabold px-5 py-3 rounded-brick shadow-brick"
        >
          Let's build
        </button>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-7 h-7 rounded-full bg-brand-yellow text-brand-ink font-extrabold text-sm flex items-center justify-center shadow-brick">
        {n}
      </span>
      <div>
        <div className="font-extrabold text-brand-ink leading-tight">{title}</div>
        <div className="text-sm text-brand-ink-soft leading-relaxed mt-0.5">
          {children}
        </div>
      </div>
    </li>
  );
}
