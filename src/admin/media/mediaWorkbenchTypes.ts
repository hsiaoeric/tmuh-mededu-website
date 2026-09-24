import type { CmsDocumentKind } from '@/content/contracts/kinds';
import type { MediaReference } from '@/content/media';

export type MediaWorkbenchKind = Extract<CmsDocumentKind, 'people' | 'facdev'>;
export type MediaWorkbenchLocale = 'zh' | 'en';

type PortraitSlotBase = {
  readonly key: string;
  readonly locale: MediaWorkbenchLocale;
  readonly personName: string;
  readonly contextLabel: string;
  readonly reference: MediaReference | null;
};

export type PeopleCenterPortraitSlot = PortraitSlotBase & {
  readonly slotKind: 'people-center';
  readonly groupIndex: number;
  readonly personIndex: number;
};

export type PeopleListPortraitSlot = PortraitSlotBase & {
  readonly slotKind: 'people-list';
  readonly list: 'holisticInstructors' | 'holisticSeedTeachers' | 'holisticAiTeam';
  readonly personIndex: number;
};

export type FacdevLeadPortraitSlot = PortraitSlotBase & {
  readonly slotKind: 'facdev-lead';
  readonly groupIndex: number;
};

export type PortraitSlot =
  | PeopleCenterPortraitSlot
  | PeopleListPortraitSlot
  | FacdevLeadPortraitSlot;

export type MediaWorkbenchResult =
  | { readonly status: 'unsupported' }
  | {
      readonly status: 'invalid';
      readonly reason: 'invalid-json' | 'invalid-payload';
      readonly editorText: string;
    }
  | {
      readonly status: 'ready';
      readonly kind: MediaWorkbenchKind;
      readonly slots: readonly PortraitSlot[];
    };

export type PortraitChangeResult =
  | { readonly ok: true; readonly editorText: string }
  | {
      readonly ok: false;
      readonly reason: 'invalid-json' | 'invalid-payload' | 'stale-slot';
      readonly editorText: string;
    };
