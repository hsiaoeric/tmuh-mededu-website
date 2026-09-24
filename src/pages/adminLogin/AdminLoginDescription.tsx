import type { ReactNode } from 'react';
import { ZhCopy, ZhPhrase } from '@/admin/AdminText';
import type { AdminAuthState } from '@/admin/auth';

type AdminLoginDescriptionProps = {
  readonly fallback: string;
  readonly isZh: boolean;
  readonly state: AdminAuthState;
};

function unexpected(value: never): never {
  throw new TypeError(`Unexpected administrator login copy state: ${JSON.stringify(value)}`);
}

export function AdminLoginDescription({
  fallback,
  isZh,
  state,
}: AdminLoginDescriptionProps): ReactNode {
  if (!isZh) return fallback;

  switch (state.status) {
    case 'anonymous':
      return (
        <ZhCopy>
          <ZhPhrase>請使用已授權的</ZhPhrase>
          <ZhPhrase>管理員帳號</ZhPhrase>
          <ZhPhrase>登入。</ZhPhrase>
        </ZhCopy>
      );
    case 'error': {
      const failure = state.failure;
      switch (failure) {
        case 'sign-in-failed':
          return (
            <ZhCopy>
              <ZhPhrase>無法完成登入，</ZhPhrase>
              <ZhPhrase>請檢查資料後</ZhPhrase>
              <ZhPhrase>再試一次。</ZhPhrase>
            </ZhCopy>
          );
        case 'client-unavailable':
        case 'identity-check-failed':
        case 'allowlist-check-failed':
        case 'sign-out-failed':
        case 'unsupported-auth-event':
          return fallback;
        default:
          return unexpected(failure);
      }
    }
    case 'booting':
    case 'authenticating':
    case 'verifying':
    case 'authorized':
    case 'reauthorizing':
    case 'expired':
      return fallback;
    case 'signing-out':
      return (
        <ZhCopy>
          <ZhPhrase>請稍候，</ZhPhrase>
          <ZhPhrase>系統正在安全結束</ZhPhrase>
          <ZhPhrase>目前的工作階段。</ZhPhrase>
        </ZhCopy>
      );
    case 'config-error':
      return (
        <ZhCopy>
          <ZhPhrase>目前無法使用管理員登入，</ZhPhrase>
          <ZhPhrase>請聯絡</ZhPhrase>
          <ZhPhrase>網站管理人員。</ZhPhrase>
        </ZhCopy>
      );
    case 'denied':
      return (
        <ZhCopy>
          <ZhPhrase>這個帳號目前</ZhPhrase>
          <ZhPhrase>沒有管理權限。</ZhPhrase>
          <ZhPhrase>你可以</ZhPhrase>
          <ZhPhrase>重新確認，</ZhPhrase>
          <ZhPhrase>或登出後</ZhPhrase>
          <ZhPhrase>改用其他帳號。</ZhPhrase>
        </ZhCopy>
      );
    default:
      return unexpected(state);
  }
}
