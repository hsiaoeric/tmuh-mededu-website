import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { createAppBrowserRouter } from '@/app/router';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/noto-sans-tc/300.css';
import '@fontsource/noto-sans-tc/400.css';
import '@fontsource/noto-sans-tc/500.css';
import '@fontsource/noto-sans-tc/700.css';
import '@fontsource/noto-sans-tc/900.css';
import '@fontsource/noto-serif-tc/600.css';
import '@fontsource/noto-serif-tc/700.css';
import '@fontsource/noto-serif-tc/900.css';
import '@/design/tokens.css';
import '@/design/base.css';
import '@/design/components.css';

const enableReactDevTools = import.meta.env.DEV && import.meta.env.VITE_DISABLE_REACT_DEVTOOLS !== '1';
if (enableReactDevTools) {
  void import('react-grab');
}

const router = createAppBrowserRouter();

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new TypeError('Application root element is missing');
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
