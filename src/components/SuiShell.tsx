import { lazy, Suspense } from 'react';
import { SuiProviders } from '@/sui/providers';
import { useApp } from '@/state/app';
import { ErrorBoundary } from './ErrorBoundary';

const Play = lazy(() => import('./Play').then((m) => ({ default: m.Play })));
const Leaderboard = lazy(() => import('./Leaderboard').then((m) => ({ default: m.Leaderboard })));
const Profile = lazy(() => import('./Profile').then((m) => ({ default: m.Profile })));

/**
 * Single lazy boundary that pulls in SuiProviders + every Sui-using
 * screen. Imported via React.lazy from App.tsx so the Landing path
 * never touches @mysten/* code (older WebKit safety net).
 */
export default function SuiShell() {
  const screen = useApp((s) => s.screen);
  return (
    <SuiProviders>
      <ErrorBoundary fallback={(e) => <BootError message={e.message} />}>
        <Suspense fallback={<BootLoading />}>
          {screen === 'play' && <Play />}
          {screen === 'leaderboard' && <Leaderboard />}
          {screen === 'profile' && <Profile />}
        </Suspense>
      </ErrorBoundary>
    </SuiProviders>
  );
}

function BootLoading() {
  return (
    <div className="fixed inset-0 bg-night flex items-center justify-center">
      <span className="font-mono text-xs text-cream-mute">booting…</span>
    </div>
  );
}

function BootError({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-night flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="eyebrow text-terracotta mb-2">boot failed</p>
        <p className="text-sm text-cream-mute">{message}</p>
      </div>
    </div>
  );
}
