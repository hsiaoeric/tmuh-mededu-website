import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { AdminLiveRegion, InlineNotice, StatePanel } from '@/admin/AdminFeedback';
import { AdminField } from '@/admin/AdminFields';
import {
  getAdminAuthPresentation,
  resolveAdminReturnPath,
  useAdminAuth,
} from '@/admin/auth';
import { usePageTitle, useSite } from '@/app/site';
import { Icon } from '@/ui/Icon';
import { AuthActions } from './adminLogin/AuthActions';
import { AdminLoginDescription } from './adminLogin/AdminLoginDescription';
import { AdminLoginAnnouncement } from './adminLogin/AdminLoginAnnouncement';
import { AdminLoginHeading } from './adminLogin/AdminLoginHeading';
import '@/design/admin.css';

function unexpected(value: never, context: string): never {
  throw new TypeError(`Unexpected ${context}: ${JSON.stringify(value)}`);
}

function readReturnTo(state: unknown): unknown {
  if (typeof state !== 'object' || state === null || !('returnTo' in state)) {
    return undefined;
  }
  return state.returnTo;
}

export function AdminLoginPage() {
  const { lang, isZh, theme, toggleLang, toggleTheme } = useSite();
  const { state, signIn, signOut, retry } = useAdminAuth();
  const location = useLocation();
  const presentation = getAdminAuthPresentation(state, lang);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const focusedHeadingRef = useRef(false);
  const submitLockRef = useRef(false);
  const authenticating = state.status === 'authenticating';
  const busy = submitting || authenticating;
  const signInFailure = state.status === 'error' && state.failure === 'sign-in-failed';
  const alertId = signInFailure ? 'admin-login-error' : undefined;
  const firstReturnPath = resolveAdminReturnPath(readReturnTo(location.state));
  const returnPath = resolveAdminReturnPath(firstReturnPath);
  const description = (
    <AdminLoginDescription
      fallback={presentation.description}
      isZh={isZh}
      state={state}
    />
  );
  const headingTitle = isZh ? '管理員登入' : 'Administrator sign-in';
  const descriptionLang = isZh ? 'zh-Hant' : 'en';

  usePageTitle(isZh ? '管理員登入' : 'Administrator sign-in');

  useEffect(() => {
    if (focusedHeadingRef.current) return;
    focusedHeadingRef.current = true;
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (signInFailure) alertRef.current?.focus();
  }, [signInFailure]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (submitLockRef.current || authenticating) return;
    submitLockRef.current = true;
    setSubmitting(true);
    await signIn(email, password);
    setPassword('');
    submitLockRef.current = false;
    setSubmitting(false);
  };

  const form = (
    <form
      className="admin-form-layout"
      aria-labelledby="admin-login-title"
      onSubmit={(event) => void handleSubmit(event)}
    >
      {!signInFailure ? (
        <div className="admin-auth-form-intro" lang={descriptionLang}>
          {presentation.title === headingTitle ? null : <h2>{presentation.title}</h2>}
          <p>{description}</p>
        </div>
      ) : null}
      {signInFailure ? (
        <div
          ref={alertRef}
          id="admin-login-error"
          className="admin-auth-alert"
          role="alert"
          tabIndex={-1}
        >
          <StatePanel
            kind="error"
            title={presentation.title}
            description={description}
          />
        </div>
      ) : null}
      <AdminField
        label={isZh ? '電子郵件' : 'Email'}
        type="email"
        autoComplete="username"
        required
        requiredText={isZh ? '必填' : 'Required'}
        disabled={busy}
        aria-describedby={alertId}
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
      />
      <AdminField
        label={isZh ? '密碼' : 'Password'}
        type="password"
        autoComplete="current-password"
        required
        requiredText={isZh ? '必填' : 'Required'}
        disabled={busy}
        aria-describedby={alertId}
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
      />
      <div className="admin-auth-actions">
        {authenticating ? (
          <AdminButton type="submit" variant="primary" loading aria-label={presentation.title}>
            {isZh ? '登入' : 'Sign in'}
          </AdminButton>
        ) : (
          <AuthActions
            actions={presentation.actions}
            busy={busy}
            busyLabel={presentation.title}
            onRetry={retry}
            onSignOut={signOut}
          />
        )}
      </div>
    </form>
  );

  let modeContent: ReactNode;
  switch (presentation.mode) {
    case 'loading':
      modeContent = authenticating ? form : (
        <StatePanel
          kind="loading"
          title={presentation.title}
          description={description}
          announceLoading={false}
        />
      );
      break;
    case 'form':
      modeContent = form;
      break;
    case 'recovery':
      modeContent = (
        <InlineNotice
          status={presentation.tone}
          title={presentation.title}
          action={presentation.actions.length === 0 ? undefined : (
            <div className="admin-auth-actions">
              <AuthActions
                actions={presentation.actions}
                busy={false}
                busyLabel={presentation.title}
                onRetry={retry}
                onSignOut={signOut}
              />
            </div>
          )}
        >
          {description}
        </InlineNotice>
      );
      break;
    case 'redirect':
      modeContent = (
        <>
          <StatePanel
            kind="success"
            title={presentation.title}
            description={description}
          />
          <Navigate to={returnPath} replace />
        </>
      );
      break;
    default:
      modeContent = unexpected(
        presentation.mode satisfies never,
        'administrator login presentation mode',
      );
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-skip-slot">
        <a
          className="skip-link"
          href="#admin-login-main"
          onClick={() => mainRef.current?.focus()}
        >
          {isZh ? '跳到登入內容' : 'Skip to sign-in content'}
        </a>
      </div>
      <header className="admin-auth-header">
        <div className="admin-auth-brand">
          <span className="admin-brand-mark" aria-hidden="true"><Icon name="admin" /></span>
          <span>
            <strong>{isZh ? '教學部內容管理' : 'Medical Education CMS'}</strong>
            <small className="mono">LIVING TISSUE / ADMIN</small>
          </span>
        </div>
        <div className="admin-auth-tools">
          <AdminButton variant="quiet" onClick={toggleLang}>{isZh ? 'EN' : '中'}</AdminButton>
          <AdminIconButton
            icon={theme === 'dark' ? 'sun' : 'moon'}
            label={isZh ? '切換明暗主題' : 'Toggle theme'}
            onClick={toggleTheme}
          />
        </div>
      </header>
      <main
        ref={mainRef}
        id="admin-login-main"
        className="admin-auth-main"
        tabIndex={-1}
      >
        <section className="admin-surface admin-auth-surface" aria-labelledby="admin-login-title">
          <AdminLoginHeading headingRef={headingRef} isZh={isZh} />
          <AdminLiveRegion className="admin-auth-live-region">
            <AdminLoginAnnouncement
              description={description}
              state={state}
              title={presentation.title}
            />
          </AdminLiveRegion>
          <div className="admin-auth-mode" data-auth-mode={presentation.mode}>
            {modeContent}
          </div>
        </section>
      </main>
    </div>
  );
}
