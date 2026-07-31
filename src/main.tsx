import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SiteProvider } from '@/context/SiteContext';
import { App } from '@/App';
import '@/styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* `basename` keeps routing correct when the site is served from a
        sub-path, as it is on a GitHub Pages project site. It is '/' for a
        root deployment, which is what react-router assumes by default. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SiteProvider>
        <App />
      </SiteProvider>
    </BrowserRouter>
  </StrictMode>,
);
