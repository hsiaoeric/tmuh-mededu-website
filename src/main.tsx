import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SiteProvider } from '@/app/site';
import { App } from '@/app/App';
import '@/design/tokens.css';
import '@/design/base.css';
import '@/design/components.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SiteProvider>
        <App />
      </SiteProvider>
    </BrowserRouter>
  </StrictMode>,
);
