import { describe, expect, it } from 'vitest';
import type { Lang } from '@/i18n';
import {
  getAdminAuthPresentation,
  type AdminAuthPresentationAction,
  type AdminAuthPresentationMode,
  type AdminAuthPresentationTone,
} from './adminAuthPresentation';
import type {
  AdminAuthConfigurationFailure,
  AdminAuthOperationFailure,
  AdminAuthState,
} from './adminAuthState';

type PresentationCase = {
  readonly name: string;
  readonly state: AdminAuthState;
  readonly mode: AdminAuthPresentationMode;
  readonly tone: AdminAuthPresentationTone;
  readonly actions: readonly AdminAuthPresentationAction[];
};

type InvalidConfigurationReason = Extract<
  AdminAuthConfigurationFailure,
  { readonly kind: 'invalid' }
>['reason'];

type ConfigurationCaseMap = {
  readonly [Kind in AdminAuthConfigurationFailure['kind']]: Kind extends 'invalid'
    ? Readonly<Record<InvalidConfigurationReason, PresentationCase>>
    : PresentationCase;
};

const CONFIGURATION_CASES = {
  disabled: {
    name: 'disabled configuration',
    state: { status: 'config-error', failure: { kind: 'disabled' } },
    mode: 'recovery',
    tone: 'disabled',
    actions: [],
  },
  invalid: {
    partial: {
      name: 'partial configuration',
      state: { status: 'config-error', failure: { kind: 'invalid', reason: 'partial' } },
      mode: 'recovery',
      tone: 'error',
      actions: [],
    },
    invalid: {
      name: 'invalid configuration',
      state: { status: 'config-error', failure: { kind: 'invalid', reason: 'invalid' } },
      mode: 'recovery',
      tone: 'error',
      actions: [],
    },
  },
} satisfies ConfigurationCaseMap;

const OPERATION_FAILURE_CASES = {
  'client-unavailable': {
    name: 'client unavailable',
    state: { status: 'error', failure: 'client-unavailable' },
    mode: 'recovery', tone: 'error', actions: ['retry'],
  },
  'sign-in-failed': {
    name: 'sign in failed',
    state: { status: 'error', failure: 'sign-in-failed' },
    mode: 'form', tone: 'error', actions: ['signIn'],
  },
  'identity-check-failed': {
    name: 'identity check failed',
    state: { status: 'error', failure: 'identity-check-failed' },
    mode: 'recovery', tone: 'error', actions: ['retry', 'signOut'],
  },
  'allowlist-check-failed': {
    name: 'allowlist check failed',
    state: { status: 'error', failure: 'allowlist-check-failed' },
    mode: 'recovery', tone: 'error', actions: ['retry', 'signOut'],
  },
  'sign-out-failed': {
    name: 'sign out failed',
    state: { status: 'error', failure: 'sign-out-failed' },
    mode: 'recovery', tone: 'error', actions: ['signOut'],
  },
  'unsupported-auth-event': {
    name: 'unsupported auth event',
    state: { status: 'error', failure: 'unsupported-auth-event' },
    mode: 'recovery', tone: 'error', actions: ['signOut'],
  },
} satisfies Readonly<Record<AdminAuthOperationFailure, PresentationCase>>;

const TOP_LEVEL_CASES = {
  booting: { name: 'booting', state: { status: 'booting' }, mode: 'loading', tone: 'info', actions: [] },
  'config-error': CONFIGURATION_CASES.disabled,
  anonymous: { name: 'anonymous', state: { status: 'anonymous' }, mode: 'form', tone: 'info', actions: ['signIn'] },
  authenticating: { name: 'authenticating', state: { status: 'authenticating' }, mode: 'loading', tone: 'info', actions: [] },
  'signing-out': { name: 'signing out', state: { status: 'signing-out' }, mode: 'loading', tone: 'info', actions: [] },
  verifying: { name: 'verifying', state: { status: 'verifying' }, mode: 'loading', tone: 'info', actions: [] },
  authorized: {
    name: 'authorized',
    state: { status: 'authorized', user: { id: 'admin-id', email: 'admin@example.test' } },
    mode: 'redirect', tone: 'success', actions: [],
  },
  reauthorizing: {
    name: 'reauthorizing',
    state: { status: 'reauthorizing', user: { id: 'admin-id', email: 'admin@example.test' } },
    mode: 'redirect', tone: 'success', actions: [],
  },
  denied: { name: 'denied', state: { status: 'denied' }, mode: 'recovery', tone: 'warning', actions: ['retry', 'signOut'] },
  expired: { name: 'expired', state: { status: 'expired' }, mode: 'recovery', tone: 'warning', actions: ['retry', 'signOut'] },
  error: OPERATION_FAILURE_CASES['client-unavailable'],
} satisfies Readonly<Record<AdminAuthState['status'], PresentationCase>>;

const PRESENTATION_CASES = [
  ...Object.values(TOP_LEVEL_CASES),
  CONFIGURATION_CASES.disabled,
  ...Object.values(CONFIGURATION_CASES.invalid),
  ...Object.values(OPERATION_FAILURE_CASES),
] satisfies readonly PresentationCase[];

const LANGUAGES = ['zh', 'en'] as const satisfies readonly Lang[];
const HAN_SCRIPT = /\p{Script=Han}/u;

const ACTION_LABEL_CASES = {
  signIn: { state: TOP_LEVEL_CASES.anonymous.state, labels: { zh: '登入', en: 'Sign in' } },
  retry: { state: OPERATION_FAILURE_CASES['client-unavailable'].state, labels: { zh: '再試一次', en: 'Try again' } },
  signOut: { state: OPERATION_FAILURE_CASES['sign-out-failed'].state, labels: { zh: '登出', en: 'Sign out' } },
} satisfies Readonly<Record<AdminAuthPresentationAction, {
  readonly state: AdminAuthState;
  readonly labels: Readonly<Record<Lang, string>>;
}>>;

const RAW_DISCRIMINANTS = {
  'client-unavailable': 'client-unavailable',
  'sign-in-failed': 'sign-in-failed',
  'identity-check-failed': 'identity-check-failed',
  'allowlist-check-failed': 'allowlist-check-failed',
  'sign-out-failed': 'sign-out-failed',
  'unsupported-auth-event': 'unsupported-auth-event',
} satisfies Readonly<Record<AdminAuthOperationFailure, string>>;

function visibleFields(state: AdminAuthState, lang: Lang): readonly string[] {
  const presentation = getAdminAuthPresentation(state, lang);
  return [
    presentation.title,
    presentation.description,
    ...presentation.actions.map(({ label }) => label),
  ];
}

describe('getAdminAuthPresentation', () => {
  for (const lang of LANGUAGES) {
    it.each(PRESENTATION_CASES)(`maps $name in ${lang}`, ({ state, mode, tone, actions }) => {
      // Given: an exhaustively registered auth state and interface language.
      // When: the pure presentation model is derived.
      const presentation = getAdminAuthPresentation(state, lang);

      // Then: rendering mode, semantic tone, and controller actions match the state contract.
      expect({
        mode: presentation.mode,
        tone: presentation.tone,
        actions: presentation.actions.map(({ action }) => action),
      }).toEqual({ mode, tone, actions });
    });
  }

  it('routes every visible field to the requested script', () => {
    for (const testCase of PRESENTATION_CASES) {
      const zhFields = visibleFields(testCase.state, 'zh');
      const enFields = visibleFields(testCase.state, 'en');

      expect(zhFields.every((field) => HAN_SCRIPT.test(field))).toBe(true);
      expect(enFields.every((field) => field.length > 0 && !HAN_SCRIPT.test(field))).toBe(true);
    }
  });

  it.each([
    { lang: 'zh', title: '正在安全登出' },
    { lang: 'en', title: 'Signing out' },
  ] as const)('uses the approved $lang sign-out progress title', ({ lang, title }) => {
    const presentation = getAdminAuthPresentation({ status: 'signing-out' }, lang);

    expect(presentation.title).toBe(title);
    expect(presentation.actions).toEqual([]);
  });

  it('uses the six canonical localized action labels', () => {
    for (const action of ['signIn', 'retry', 'signOut'] as const) {
      const testCase = ACTION_LABEL_CASES[action];
      for (const lang of LANGUAGES) {
        const presentation = getAdminAuthPresentation(testCase.state, lang);
        expect(presentation.actions).toEqual([{ action, label: testCase.labels[lang] }]);
      }
    }
  });

  it('keeps every visible field free of internal, secret, and unsupported-operation copy', () => {
    const allCopy = PRESENTATION_CASES.flatMap(({ state }) =>
      LANGUAGES.flatMap((lang) => visibleFields(state, lang)),
    ).join('\n');

    for (const discriminant of Object.values(RAW_DISCRIMINANTS)) {
      expect(allCopy).not.toContain(discriminant);
    }
    expect(allCopy).not.toMatch(/supabase|gotrue|auth0|firebase|provider/i);
    expect(allCopy).not.toMatch(/sb_(?:publishable|secret)_|eyj[a-z0-9_-]{8,}|anon[_ -]?key|service[_ -]?role/i);
    expect(allCopy).not.toMatch(/(?:https?|wss?):\/\/|www\./i);
    expect(allCopy).not.toMatch(/(?:typeerror|referenceerror|error):|\bat\s+\S+\s*\(|stack(?:trace)?|traceback/i);
    expect(allCopy).not.toMatch(/sign[ -]?up|register|registration|\breset\b|forgot password|password reset|reset password/i);
    expect(allCopy).not.toMatch(/註冊|建立帳號|忘記密碼|重設密碼|密碼重設/);
  });
});
