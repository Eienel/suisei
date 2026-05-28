import { lazy, Suspense } from 'react';
import { useApp } from '@/state/app';
import { Landing } from './components/Landing';

/**
 * Routing-by-screen with hard isolation between Landing and Sui-using
 * screens.
 *
 * Landing renders WITHOUT any Sui imports loaded (no @mysten/* in the
 * eager bundle) — so older WebKit / Safari Private Mode can always
 * paint the front page even if the Sui chunk has a module-init bug.
 *
 * SuiProviders + the lesson/sandbox screens are lazy-loaded — fetched
 * only when the user navigates past Landing.
 */
const SuiShell = lazy(() => import('./components/SuiShell'));

export default function App() {
  const screen = useApp((s) => s.screen);

  if (screen === 'landing') {
    return <Landing />;
  }

  return (
    <Suspense fallback={<LoadingShell />}>
      <SuiShell />
    </Suspense>
  );
}

function LoadingShell() {
  return (
    <div className="fixed inset-0 bg-night flex items-center justify-center">
      <div className="flex items-center gap-2 text-cream-mute text-sm font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse-soft" />
        loading…
      </div>
    </div>
  );
}
