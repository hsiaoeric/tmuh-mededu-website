import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useSite } from './site';
import { useRouteScrollReset } from './navigation';
import { CENTER_SLUG, DIGITAL_MATERIALS_PATH, LEGACY_REDIRECTS, centerPath } from './routes';
import { HolisticDetail } from '@/pages/centers/holistic/Detail';
import type { CenterId } from '@/data/types';
import { useSmoothScroll } from '@/motion/smoothScroll';
import { Nav } from '@/ui/Nav';
import { Footer } from '@/ui/Footer';
import { Cursor, RouteCurtain, ScrollProgress } from '@/ui/Chrome';
import { Home } from '@/pages/Home';
import { DigitalMaterialsPage } from '@/pages/DigitalMaterialsPage';
import { NotFound } from '@/pages/NotFound';

// three.js is decorative, and the center pages are a second click away — both
// load after the home page is interactive.
const TissueField = lazy(() =>
  import('@/webgl/TissueField').then((m) => ({ default: m.TissueField })),
);
const CenterPage = lazy(() =>
  import('@/pages/CenterPage').then((m) => ({ default: m.CenterPage })),
);

/** `/center/:id` from the previous site maps onto the new slug routes. */
function LegacyCenterRedirect() {
  const { id } = useParams();
  const slug = CENTER_SLUG[id as Exclude<CenterId, 'admin'>];
  return <Navigate to={slug ? centerPath(id as Exclude<CenterId, 'admin'>) : '/'} replace />;
}

export function App() {
  const { isZh } = useSite();
  useSmoothScroll();
  useRouteScrollReset();

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {isZh ? '跳到主要內容' : 'Skip to content'}
      </a>

      <Suspense fallback={null}>
        <TissueField />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <ScrollProgress />
      <Cursor />
      <RouteCurtain />

      <Nav />

      <main id="main" className="page">
        <Suspense fallback={<div style={{ minHeight: '70vh' }} />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path={`${centerPath('holistic')}/:kind/:year`} element={<HolisticDetail />} />
            <Route path="/centers/:slug" element={<CenterPage />} />
            <Route path={DIGITAL_MATERIALS_PATH} element={<DigitalMaterialsPage />} />
            <Route path="/center/:id" element={<LegacyCenterRedirect />} />
            {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
