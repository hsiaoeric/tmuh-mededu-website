import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSite } from '@/app/site';
import {
  AdminProtectedAccessProvider,
  resolveAdminReturnPath,
  useAdminAuth,
} from '@/admin/auth';
import {
  AdminMediaOwnershipProvider,
  AdminMediaRuntimeProvider,
} from '@/admin/media';

function unexpected(value: never): never {
  throw new TypeError(`Unexpected administrator auth state: ${JSON.stringify(value)}`);
}

const PROTECTED_OUTLET = (
  <AdminMediaRuntimeProvider>
    <AdminMediaOwnershipProvider>
      <Outlet />
    </AdminMediaOwnershipProvider>
  </AdminMediaRuntimeProvider>
);

/** Shown while a stored session is still being checked, so a reload does not flash the login page. */
function SessionCheck() {
  const { isZh } = useSite();
  return (
    <main className="admin-route-loading" role="status" aria-busy="true">
      <div className="admin-route-loading-content">
        <span className="admin-loading-mark" aria-hidden="true" />
        <strong>{isZh ? '正在確認登入狀態' : 'Checking your session'}</strong>
      </div>
    </main>
  );
}

export function AdminProtectedLayout() {
  const { state } = useAdminAuth();
  const location = useLocation();
  const firstReturnPath = resolveAdminReturnPath(
    `${location.pathname}${location.search}${location.hash}`,
  );
  const returnTo = resolveAdminReturnPath(firstReturnPath);
  const protectedOutlet = (mutationsAllowed: boolean) => (
    <AdminProtectedAccessProvider mutationsAllowed={mutationsAllowed}>
      {PROTECTED_OUTLET}
    </AdminProtectedAccessProvider>
  );
  switch (state.status) {
    case 'authorized':
    case 'signing-out':
      return protectedOutlet(true);
    case 'reauthorizing':
      return protectedOutlet(false);
    case 'error': {
      const failure = state.failure;
      switch (failure) {
        case 'sign-out-failed':
          return protectedOutlet(true);
        case 'client-unavailable':
        case 'sign-in-failed':
        case 'identity-check-failed':
        case 'allowlist-check-failed':
        case 'unsupported-auth-event':
          return <Navigate to="/admin/login" replace state={{ returnTo }} />;
        default:
          return unexpected(failure);
      }
    }
    case 'booting':
    case 'verifying':
      return <SessionCheck />;
    case 'config-error':
    case 'anonymous':
    case 'authenticating':
    case 'denied':
    case 'expired':
      return <Navigate to="/admin/login" replace state={{ returnTo }} />;
    default:
      return unexpected(state);
  }
}
