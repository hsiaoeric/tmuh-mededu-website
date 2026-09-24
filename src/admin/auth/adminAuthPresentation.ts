import type { Lang } from '@/i18n';
import type { AdminStatus } from '../AdminFeedback';
import type {
  AdminAuthConfigurationFailure,
  AdminAuthOperationFailure,
  AdminAuthState,
} from './adminAuthState';

export type AdminAuthPresentationMode = 'loading' | 'form' | 'recovery' | 'redirect';
export type AdminAuthPresentationTone = AdminStatus;
export type AdminAuthPresentationAction = 'signIn' | 'retry' | 'signOut';

export type AdminAuthPresentationActionItem = {
  readonly action: AdminAuthPresentationAction;
  readonly label: string;
};

export type AdminAuthPresentation = {
  readonly mode: AdminAuthPresentationMode;
  readonly tone: AdminAuthPresentationTone;
  readonly title: string;
  readonly description: string;
  readonly actions: readonly AdminAuthPresentationActionItem[];
};

type LocalizedText = {
  readonly zh: string;
  readonly en: string;
};

function unexpected(value: never, context: string): never {
  throw new TypeError(`Unexpected ${context}: ${JSON.stringify(value)}`);
}

function localize(text: LocalizedText, lang: Lang): string {
  switch (lang) {
    case 'zh':
      return text.zh;
    case 'en':
      return text.en;
    default:
      return unexpected(lang, 'administrator presentation language');
  }
}

function actionItem(
  action: AdminAuthPresentationAction,
  lang: Lang,
): AdminAuthPresentationActionItem {
  switch (action) {
    case 'signIn':
      return { action, label: localize({ zh: '登入', en: 'Sign in' }, lang) };
    case 'retry':
      return { action, label: localize({ zh: '再試一次', en: 'Try again' }, lang) };
    case 'signOut':
      return { action, label: localize({ zh: '登出', en: 'Sign out' }, lang) };
    default:
      return unexpected(action, 'administrator presentation action');
  }
}

function configurationPresentation(
  failure: AdminAuthConfigurationFailure,
  lang: Lang,
): AdminAuthPresentation {
  const description = localize(
    {
      zh: '目前無法使用管理員登入，請聯絡網站管理人員。',
      en: 'Administrator sign-in is unavailable. Contact the site administrator.',
    },
    lang,
  );
  switch (failure.kind) {
    case 'disabled':
      return {
        mode: 'recovery',
        tone: 'disabled',
        title: localize({ zh: '管理員登入尚未啟用', en: 'Administrator sign-in is not enabled' }, lang),
        description,
        actions: [],
      };
    case 'invalid':
      switch (failure.reason) {
        case 'partial':
          return {
            mode: 'recovery',
            tone: 'error',
            title: localize({ zh: '管理員登入設定不完整', en: 'Administrator sign-in is not configured' }, lang),
            description,
            actions: [],
          };
        case 'invalid':
          return {
            mode: 'recovery',
            tone: 'error',
            title: localize({ zh: '管理員登入設定無效', en: 'Administrator sign-in is unavailable' }, lang),
            description,
            actions: [],
          };
        default:
          return unexpected(failure.reason, 'administrator configuration failure reason');
      }
    default:
      return unexpected(failure, 'administrator configuration failure');
  }
}

function operationFailurePresentation(
  failure: AdminAuthOperationFailure,
  lang: Lang,
): AdminAuthPresentation {
  switch (failure) {
    case 'client-unavailable':
      return {
        mode: 'recovery',
        tone: 'error',
        title: localize({ zh: '管理員登入暫時無法使用', en: 'Administrator sign-in is temporarily unavailable' }, lang),
        description: localize({ zh: '目前無法連線至登入服務，請稍後再試。', en: 'The sign-in service cannot be reached. Try again shortly.' }, lang),
        actions: [actionItem('retry', lang)],
      };
    case 'sign-in-failed':
      return {
        mode: 'form',
        tone: 'error',
        title: localize({ zh: '登入失敗', en: 'Sign-in failed' }, lang),
        description: localize({ zh: '無法完成登入，請檢查資料後再試一次。', en: 'Sign-in could not be completed. Check your details and try again.' }, lang),
        actions: [actionItem('signIn', lang)],
      };
    case 'identity-check-failed':
      return {
        mode: 'recovery',
        tone: 'error',
        title: localize({ zh: '無法確認登入身分', en: 'Identity could not be verified' }, lang),
        description: localize({ zh: '請重新確認；若仍無法完成，請登出後再次登入。', en: 'Try verification again. If it still fails, sign out and sign in again.' }, lang),
        actions: [actionItem('retry', lang), actionItem('signOut', lang)],
      };
    case 'allowlist-check-failed':
      return {
        mode: 'recovery',
        tone: 'error',
        title: localize({ zh: '無法確認管理權限', en: 'Administrator access could not be verified' }, lang),
        description: localize({ zh: '請重新確認；若仍無法完成，請登出後再次登入。', en: 'Try verification again. If it still fails, sign out and sign in again.' }, lang),
        actions: [actionItem('retry', lang), actionItem('signOut', lang)],
      };
    case 'sign-out-failed':
      return {
        mode: 'recovery',
        tone: 'error',
        title: localize({ zh: '登出尚未完成', en: 'Sign-out is not complete' }, lang),
        description: localize({ zh: '請再試一次，以安全結束目前的工作階段。', en: 'Try signing out again to end the current session safely.' }, lang),
        actions: [actionItem('signOut', lang)],
      };
    case 'unsupported-auth-event':
      return {
        mode: 'recovery',
        tone: 'error',
        title: localize({ zh: '無法繼續這次登入', en: 'This sign-in cannot continue' }, lang),
        description: localize({ zh: '目前的登入狀態不受管理後台支援，請登出後再次登入。', en: 'This sign-in state is not supported. Sign out and sign in again.' }, lang),
        actions: [actionItem('signOut', lang)],
      };
    default:
      return unexpected(failure, 'administrator operation failure');
  }
}

export function getAdminAuthPresentation(
  state: AdminAuthState,
  lang: Lang,
): AdminAuthPresentation {
  switch (state.status) {
    case 'booting':
      return {
        mode: 'loading',
        tone: 'info',
        title: localize({ zh: '正在準備管理後台', en: 'Preparing the administrator area' }, lang),
        description: localize({ zh: '請稍候，系統正在確認登入狀態。', en: 'Please wait while the current sign-in state is checked.' }, lang),
        actions: [],
      };
    case 'config-error':
      return configurationPresentation(state.failure, lang);
    case 'anonymous':
      return {
        mode: 'form',
        tone: 'info',
        title: localize({ zh: '管理員登入', en: 'Administrator sign-in' }, lang),
        description: localize({ zh: '請使用已授權的管理員帳號登入。', en: 'Sign in with an authorized administrator account.' }, lang),
        actions: [actionItem('signIn', lang)],
      };
    case 'authenticating':
      return {
        mode: 'loading',
        tone: 'info',
        title: localize({ zh: '正在登入', en: 'Signing in' }, lang),
        description: localize({ zh: '請稍候，系統正在確認帳號資料。', en: 'Please wait while the account details are checked.' }, lang),
        actions: [],
      };
    case 'signing-out':
      return {
        mode: 'loading',
        tone: 'info',
        title: localize({ zh: '正在安全登出', en: 'Signing out' }, lang),
        description: localize({ zh: '請稍候，系統正在安全結束目前的工作階段。', en: 'Please wait while the current session is ended securely.' }, lang),
        actions: [],
      };
    case 'verifying':
      return {
        mode: 'loading',
        tone: 'info',
        title: localize({ zh: '正在確認管理權限', en: 'Verifying administrator access' }, lang),
        description: localize({ zh: '請稍候，系統正在確認你的管理權限。', en: 'Please wait while administrator access is checked.' }, lang),
        actions: [],
      };
    case 'authorized':
    case 'reauthorizing':
      return {
        mode: 'redirect',
        tone: 'success',
        title: localize({ zh: '登入成功', en: 'Sign-in complete' }, lang),
        description: localize({ zh: '正在前往管理後台。', en: 'Opening the administrator area.' }, lang),
        actions: [],
      };
    case 'denied':
      return {
        mode: 'recovery',
        tone: 'warning',
        title: localize({ zh: '無法進入管理後台', en: 'Administrator access is unavailable' }, lang),
        description: localize({ zh: '這個帳號目前沒有管理權限。你可以重新確認，或登出後改用其他帳號。', en: 'This account does not have administrator access. Try again or sign out and use another account.' }, lang),
        actions: [actionItem('retry', lang), actionItem('signOut', lang)],
      };
    case 'expired':
      return {
        mode: 'recovery',
        tone: 'warning',
        title: localize({ zh: '登入已逾時', en: 'The sign-in session has expired' }, lang),
        description: localize({ zh: '請重新確認工作階段，或登出後再次登入。', en: 'Try the session again, or sign out and sign in again.' }, lang),
        actions: [actionItem('retry', lang), actionItem('signOut', lang)],
      };
    case 'error':
      return operationFailurePresentation(state.failure, lang);
    default:
      return unexpected(state, 'administrator auth state');
  }
}
