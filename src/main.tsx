import { StrictMode } from 'react';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SuiProviders>
      <App />
    </SuiProviders>
  </StrictMode>
);
