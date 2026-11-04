import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useSite } from './site';
import { useRouteScrollReset } from './navigation';
import { AdminProtectedLayout } from './AdminProtectedLayout';
import {
  ANNOUNCEMENTS_PATH,
  CENTER_SLUG,
  DEPARTMENT_PATH,
  DIGITAL_MATERIALS_PATH,
  GALLERY_PATH,
  HOLISTIC_DETAIL_KINDS,
  HONORS_PATH,
  LEGACY_REDIRECTS,
  RESOURCES_PATH,
  TRAINEES_PATH,
  VIDEOS_PATH,
  centerPath,
} from './routes';
import { AdminAuthProvider, type AdminAuthProviderProps } from '@/admin/auth';
import {
  AdminDocumentRepositoryProvider,
  type AdminDocumentRepositoryProviderProps,
} from '@/admin/repository';
import { HolisticDetail } from '@/pages/centers/holistic/Detail';
import type { CenterId } from '@/data/types';
import { useSmoothScroll } from '@/motion/smoothScroll';
import { Nav } from '@/ui/Nav';
import { Footer } from '@/ui/Footer';
import { Cursor, RouteCurtain, ScrollProgress } from '@/ui/Chrome';
import { Home } from '@/pages/Home';
import { NotFound } from '@/pages/NotFound';
import { AdminLoginPage } from '@/pages/AdminLoginPage';

// three.js is decorative, and the center pages are a second click away — both
// load after the home page is interactive.
const TissueField = lazy(() =>
  import('@/webgl/TissueField').then((m) => ({ default: m.TissueField })),
);
const CenterPage = lazy(() =>
  import('@/pages/CenterPage').then((m) => ({ default: m.CenterPage })),
);
const AnnouncementsPage = lazy(() =>
  import('@/pages/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })),
);
const HonorsPage = lazy(() =>
  import('@/pages/HonorsPage').then((m) => ({ default: m.HonorsPage })),
);
const DigitalMaterialsPage = lazy(() =>
  import('@/pages/DigitalMaterialsPage').then((m) => ({ default: m.DigitalMaterialsPage })),
);
const PostDetailPage = lazy(() =>
  import('@/pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })),
);
const DepartmentPage = lazy(() =>
  import('@/pages/DepartmentPage').then((m) => ({ default: m.DepartmentPage })),
);
const DepartmentPageDetail = lazy(() =>
  import('@/pages/DepartmentPageDetail').then((m) => ({ default: m.DepartmentPageDetail })),
);
const TraineesPage = lazy(() =>
  import('@/pages/TraineesPage').then((m) => ({ default: m.TraineesPage })),
);
const ProgramPage = lazy(() =>
  import('@/pages/ProgramPage').then((m) => ({ default: m.ProgramPage })),
);
const GalleryPage = lazy(() =>
  import('@/pages/GalleryPage').then((m) => ({ default: m.GalleryPage })),
);
const AlbumPage = lazy(() =>
  import('@/pages/AlbumPage').then((m) => ({ default: m.AlbumPage })),
);
const VideosPage = lazy(() =>
  import('@/pages/VideosPage').then((m) => ({ default: m.VideosPage })),
);
const ResourcesPage = lazy(() =>
  import('@/pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })),
);
const AdminDesignSystemPage = lazy(() =>
  import('@/pages/AdminDesignSystemPage').then((m) => ({ default: m.AdminDesignSystemPage })),
);
const AdminDashboardPage = lazy(() =>
  import('@/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminDocumentPage = lazy(() =>
  import('@/pages/AdminDocumentPage').then((m) => ({ default: m.AdminDocumentPage })),
);
/** `/center/:id` from the previous site maps onto the new slug routes. */
function LegacyCenterRedirect() {
  const { id } = useParams();
  const slug = CENTER_SLUG[id as Exclude<CenterId, 'admin'>];
  return <Navigate to={slug ? centerPath(id as Exclude<CenterId, 'admin'>) : '/'} replace />;
}

/**
 * The public route table. Exported so tests can enumerate it: apart from the
 * deliberate legacy redirects below, no path may start with one of the old
 * site's prefixes (LEGACY_PATH_PREFIXES), so every old URL reaches `*`.
 */
export const PUBLIC_ROUTES = (
  <>
    <Route path="/" element={<Home />} />
    <Route path={DEPARTMENT_PATH} element={<DepartmentPage />} />
    <Route path={`${DEPARTMENT_PATH}/:pageId`} element={<DepartmentPageDetail />} />
    <Route path={ANNOUNCEMENTS_PATH} element={<AnnouncementsPage />} />
    <Route path={`${ANNOUNCEMENTS_PATH}/:postId`} element={<PostDetailPage />} />
    <Route path={HONORS_PATH} element={<HonorsPage />} />
    <Route path={`${HONORS_PATH}/:postId`} element={<PostDetailPage />} />
    <Route path={TRAINEES_PATH} element={<TraineesPage />} />
    <Route path={`${TRAINEES_PATH}/:programId`} element={<ProgramPage />} />
    <Route path={GALLERY_PATH} element={<GalleryPage />} />
    <Route path={`${GALLERY_PATH}/:albumId`} element={<AlbumPage />} />
    <Route path={VIDEOS_PATH} element={<VideosPage />} />
    <Route path={RESOURCES_PATH} element={<ResourcesPage />} />
    {HOLISTIC_DETAIL_KINDS.map((kind) => (
      <Route
        key={kind}
        path={`${centerPath('holistic')}/${kind}/:year`}
        element={<HolisticDetail kind={kind} />}
      />
    ))}
    <Route path="/centers/:slug" element={<CenterPage />} />
    <Route path="/centers/:slug/articles/:postId" element={<PostDetailPage />} />
    <Route path={DIGITAL_MATERIALS_PATH} element={<DigitalMaterialsPage />} />
    <Route path={`${DIGITAL_MATERIALS_PATH}/articles/:postId`} element={<PostDetailPage />} />
    <Route path="/center/:id" element={<LegacyCenterRedirect />} />
    {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
      <Route key={from} path={from} element={<Navigate to={to} replace />} />
    ))}
    <Route path="*" element={<NotFound />} />
  </>
);

function PublicApp() {
  const { inline } = useSite();
  useSmoothScroll();
  useRouteScrollReset();

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {inline.skipToContent}
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
          <Routes>{PUBLIC_ROUTES}</Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

type AdminAuthDependencies = Omit<AdminAuthProviderProps, 'children'>;
type AdminRepositoryDependencies = Omit<AdminDocumentRepositoryProviderProps, 'children'>;
type AppProps = {
  readonly adminAuth?: AdminAuthDependencies;
  readonly adminRepository?: AdminRepositoryDependencies;
};

function AdminRepositoryLayout({ dependencies }: { readonly dependencies: AdminRepositoryDependencies }) {
  return <AdminDocumentRepositoryProvider {...dependencies}><Outlet /></AdminDocumentRepositoryProvider>;
}

function AdminRoutes({ adminAuth, adminRepository }: { readonly adminAuth: AdminAuthDependencies; readonly adminRepository: AdminRepositoryDependencies }) {
  const { pathname } = useLocation();
  const loginRoute = pathname === '/admin/login';

  return (
    <AdminAuthProvider {...adminAuth}>
      <Suspense fallback={<AdminRouteFallback />}>
        <Routes>
          {loginRoute ? <Route path="/admin/login" element={<AdminLoginPage />} /> : null}
          <Route element={<AdminProtectedLayout />}>
            <Route element={<AdminRepositoryLayout dependencies={adminRepository} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/content/:kind" element={<AdminDocumentPage />} />
            </Route>
            <Route path="/admin/design-system" element={<AdminDesignSystemPage />} />
            <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  );
}

function AdminRouteFallback() {
  const { isZh } = useSite();
  return (
    <div className="admin-shell admin-shell-fallback" aria-busy="true">
      <aside className="admin-desktop-nav"><div className="admin-sidenav"><div className="admin-brand"><span className="admin-brand-mark mono" aria-hidden="true">TM</span><span><strong>{isZh ? '教學部內容管理' : 'Medical Education CMS'}</strong><small className="mono">LIVING TISSUE / ADMIN</small></span></div></div></aside>
      <div className="admin-shell-column"><header className="admin-header"><div className="admin-header-location"><span><small className="mono">ADMIN / DESIGN SYSTEM</small><strong>{isZh ? '正在準備管理工作區' : 'Preparing admin workspace'}</strong></span></div></header><main className="admin-route-loading" role="status"><div className="admin-route-loading-content"><span className="admin-loading-mark" aria-hidden="true" /><strong>{isZh ? '載入管理元件展示中' : 'Loading admin primitive showcase'}</strong><p>{isZh ? '保留管理導覽與工作脈絡，完成後即可操作。' : 'Admin navigation and work context remain in place while loading.'}</p></div></main></div>
    </div>
  );
}

export function App({ adminAuth = {}, adminRepository = {} }: AppProps) {
  const { pathname } = useLocation();
  const adminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  useEffect(() => {
    document.documentElement.classList.toggle('admin-route', adminRoute);
    document.body.classList.toggle('admin-route', adminRoute);
    return () => {
      document.documentElement.classList.remove('admin-route');
      document.body.classList.remove('admin-route');
    };
  }, [adminRoute]);
  return adminRoute ? <AdminRoutes adminAuth={adminAuth} adminRepository={adminRepository} /> : <PublicApp />;
}
