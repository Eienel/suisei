import { StrictMode, useEffect, useState, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * VisitPage is lazy-loaded so the Sui chunk is only fetched when a
 * visitor lands on /town/... — keeps the Landing path bulletproof on
 * older WebKit (which has had module-init issues with @mysten/sui).
 */
const VisitPage = lazy(() =>
  import('./components/VisitPage').then((m) => ({ default: m.VisitPage }))
);

function Router() {
  const [path, setPath] = useState<string>(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const townMatch = path.match(/^\/town\/(0x[0-9a-fA-F]+)\/?$/);
  if (townMatch) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <VisitPage address={townMatch[1]} />
      </Suspense>
    );
  }
  return <App />;
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-ink flex items-center justify-center">
      <div className="text-fg-mute text-sm font-mono flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse-soft" />
        loading…
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  </StrictMode>
);
