import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';

export const NEWS_SCOPES = ['department', 'holistic'] as const;
export const NEWS_LOCALES = ['zh', 'en'] as const;

export type NewsScope = (typeof NEWS_SCOPES)[number];
export type NewsLocale = (typeof NEWS_LOCALES)[number];
export type NewsPayload = EditableCmsPayloadByKind['news'];
export type NewsAnnouncement = NewsPayload['zh']['department'][number];

export type NewsRowLocation = {
  readonly scope: NewsScope;
  readonly index: number;
  readonly locale: NewsLocale;
};

export type NewsMutationResult =
  | { readonly ok: true; readonly payload: NewsPayload }
  | { readonly ok: false; readonly reason: 'length-mismatch' | 'index-out-of-bounds' };
