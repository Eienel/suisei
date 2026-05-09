import { lazy, Suspense } from 'react';
import { Landing } from './components/Landing';
import { useApp } from './state/store';

const GameShell = lazy(() =>
  import('./components/GameShell').then((m) => ({ default: m.GameShell }))
);

export default function App() {
  const screen = useApp((s) => s.screen);
  if (screen === 'landing') return <Landing />;
  return (
    <Suspense fallback={<SandboxLoading />}>
      <GameShell />
    </Suspense>
  );
}

function SandboxLoading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-brand-cream font-display">
      <div className="text-brand-ink-soft font-bold text-lg">
        Snapping bricks together…
      </div>
    </div>
  );
}
