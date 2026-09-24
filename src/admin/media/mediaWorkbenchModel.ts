import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { parseDraftPayload } from '@/admin/documents';
import type {
  MediaWorkbenchLocale,
  MediaWorkbenchResult,
  PeopleListPortraitSlot,
  PortraitSlot,
} from './mediaWorkbenchTypes';

const PEOPLE_LISTS = [
  'holisticInstructors',
  'holisticSeedTeachers',
  'holisticAiTeam',
] as const;

const PEOPLE_LIST_LABELS = {
  holisticInstructors: { zh: '全人照護指導員', en: 'Holistic care instructors' },
  holisticSeedTeachers: { zh: '全人照護種子教師', en: 'Holistic care seed teachers' },
  holisticAiTeam: { zh: '全人照護 AI 團隊', en: 'Holistic care AI team' },
} as const;

function peopleListSlots(
  locale: MediaWorkbenchLocale,
  payload: ReturnType<typeof CMS_PAYLOAD_REGISTRY.people.schema.parse>,
): readonly PeopleListPortraitSlot[] {
  return PEOPLE_LISTS.flatMap((list) => payload[locale][list].map((person, personIndex) => ({
    slotKind: 'people-list' as const,
    key: `${locale}.${list}[${personIndex}].portrait`,
    locale,
    list,
    personIndex,
    personName: person.name,
    contextLabel: PEOPLE_LIST_LABELS[list][locale],
    reference: person.portrait ?? null,
  })));
}

function peopleSlots(
  payload: ReturnType<typeof CMS_PAYLOAD_REGISTRY.people.schema.parse>,
): readonly PortraitSlot[] {
  return (['zh', 'en'] as const).flatMap((locale) => [
    ...payload[locale].centerPeople.flatMap((group, groupIndex) => (
      group.people.map((person, personIndex) => ({
        slotKind: 'people-center' as const,
        key: `${locale}.centerPeople[${groupIndex}].people[${personIndex}].portrait`,
        locale,
        groupIndex,
        personIndex,
        personName: person.name,
        contextLabel: group.centerId,
        reference: person.portrait ?? null,
      }))
    )),
    ...peopleListSlots(locale, payload),
  ]);
}

function facdevSlots(
  payload: ReturnType<typeof CMS_PAYLOAD_REGISTRY.facdev.editableSchema.parse>,
): readonly PortraitSlot[] {
  return (['zh', 'en'] as const).flatMap((locale) => (
    payload[locale].groups.map((group, groupIndex) => ({
      slotKind: 'facdev-lead' as const,
      key: `${locale}.groups[${groupIndex}].lead.portrait`,
      locale,
      groupIndex,
      personName: group.lead.name,
      contextLabel: group.name,
      reference: group.lead.portrait ?? null,
    }))
  ));
}

export function deriveMediaWorkbench(
  kind: CmsDocumentKind,
  editorText: string,
): MediaWorkbenchResult {
  if (kind !== 'people' && kind !== 'facdev') return { status: 'unsupported' };
  const draft = parseDraftPayload(editorText);
  if (!draft.ok) return { status: 'invalid', reason: 'invalid-json', editorText };

  switch (kind) {
    case 'people': {
      const parsed = CMS_PAYLOAD_REGISTRY.people.editableSchema.safeParse(draft.payload);
      return parsed.success
        ? { status: 'ready', kind, slots: peopleSlots(parsed.data) }
        : { status: 'invalid', reason: 'invalid-payload', editorText };
    }
    case 'facdev': {
      const parsed = CMS_PAYLOAD_REGISTRY.facdev.editableSchema.safeParse(draft.payload);
      return parsed.success
        ? { status: 'ready', kind, slots: facdevSlots(parsed.data) }
        : { status: 'invalid', reason: 'invalid-payload', editorText };
    }
  }
}
