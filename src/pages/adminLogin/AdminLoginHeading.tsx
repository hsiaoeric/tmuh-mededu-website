import type { RefObject } from 'react';
import { ZhCopy, ZhPhrase } from '@/admin/AdminText';

type AdminLoginHeadingProps = {
  readonly headingRef: RefObject<HTMLHeadingElement>;
  readonly isZh: boolean;
};

export function AdminLoginHeading({ headingRef, isZh }: AdminLoginHeadingProps) {
  const title = isZh ? '管理員登入' : 'Administrator sign-in';
  const description = isZh ? (
    <ZhCopy>
      <ZhPhrase>此頁供已授權的</ZhPhrase>
      <ZhPhrase>管理員帳號登入</ZhPhrase>
      <ZhPhrase>管理後台。</ZhPhrase>
    </ZhCopy>
  ) : 'This page is for authorized administrators signing in to the management area.';

  return (
    <header className="admin-page-header admin-auth-heading">
      <div>
        <span className="admin-page-eyebrow mono">ADMIN / AUTHENTICATION</span>
        <h1 ref={headingRef} id="admin-login-title" tabIndex={-1}>
          <span className="admin-auth-focus-label">{title}</span>
        </h1>
        <p lang={isZh ? 'zh-Hant' : 'en'}>{description}</p>
      </div>
    </header>
  );
}
