import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import './index.css';
import App from './App';
import { SuiProviders } from './sui/providers';
import { VisitPage } from './components/VisitPage';

/**
 * Tiny path router — supports `/town/<address>` for public read-only
 * town viewers, everything else falls through to <App />.
 *
 * The visit route uses its own SuiClient and doesn't need a wallet,
 * but we still wrap in SuiProviders so dapp-kit hooks don't crash if
 * any child needs them.
 */
function Router() {
  const [path, setPath] = useState<string>(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const townMatch = path.match(/^\/town\/(0x[0-9a-fA-F]+)\/?$/);
  if (townMatch) {
    return <VisitPage address={townMatch[1]} />;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SuiProviders>
      <Router />
    </SuiProviders>
  </StrictMode>
);
