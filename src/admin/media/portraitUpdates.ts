import { parseDraftPayload } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import type { MediaReference } from '@/content/media';
import type {
  FacdevLeadPortraitSlot,
  MediaWorkbenchLocale,
  MediaWorkbenchKind,
  PeopleCenterPortraitSlot,
  PeopleListPortraitSlot,
  PortraitChangeResult,
  PortraitSlot,
} from './mediaWorkbenchTypes';

type Person = ReturnType<typeof CMS_PAYLOAD_REGISTRY.people.schema.parse>['zh']['holisticInstructors'][number];
type PeoplePayload = ReturnType<typeof CMS_PAYLOAD_REGISTRY.people.schema.parse>;
type PeopleLocale = PeoplePayload['zh'];
type FacdevPayload = ReturnType<typeof CMS_PAYLOAD_REGISTRY.facdev.schema.parse>;
type FacdevLocale = FacdevPayload['zh'];

type PortraitChange = {
  readonly kind: MediaWorkbenchKind;
  readonly editorText: string;
  readonly slot: PortraitSlot;
  readonly reference: MediaReference | null;
};

function withPortrait(person: Person, reference: MediaReference | null): Person {
  if (reference !== null) return { ...person, portrait: reference };
  const next = { ...person };
  delete next.portrait;
  return next;
}

function withPeopleLocale(
  payload: PeoplePayload,
  locale: MediaWorkbenchLocale,
  nextLocale: PeopleLocale,
): PeoplePayload {
  return locale === 'zh'
    ? { ...payload, zh: nextLocale }
    : { ...payload, en: nextLocale };
}

function updatePeopleCenter(
  payload: PeoplePayload,
  slot: PeopleCenterPortraitSlot,
  reference: MediaReference | null,
): PeoplePayload | null {
  const localePayload = payload[slot.locale];
  const group = localePayload.centerPeople[slot.groupIndex];
  const person = group?.people[slot.personIndex];
  if (group === undefined || person === undefined || person.name !== slot.personName) return null;
  const centerPeople = localePayload.centerPeople.map((candidate, groupIndex) => (
    groupIndex === slot.groupIndex
      ? {
          ...candidate,
          people: candidate.people.map((candidatePerson, personIndex) => (
            personIndex === slot.personIndex
              ? withPortrait(candidatePerson, reference)
              : candidatePerson
          )),
        }
      : candidate
  ));
  return withPeopleLocale(payload, slot.locale, { ...localePayload, centerPeople });
}

function updatePeopleList(
  payload: PeoplePayload,
  slot: PeopleListPortraitSlot,
  reference: MediaReference | null,
): PeoplePayload | null {
  const localePayload = payload[slot.locale];
  const person = localePayload[slot.list][slot.personIndex];
  if (person === undefined || person.name !== slot.personName) return null;
  const people = localePayload[slot.list].map((candidate, personIndex) => (
    personIndex === slot.personIndex ? withPortrait(candidate, reference) : candidate
  ));
  return withPeopleLocale(payload, slot.locale, { ...localePayload, [slot.list]: people });
}

function updatePeople(
  payload: PeoplePayload,
  slot: PortraitSlot,
  reference: MediaReference | null,
): PeoplePayload | null {
  switch (slot.slotKind) {
    case 'people-center':
      return updatePeopleCenter(payload, slot, reference);
    case 'people-list':
      return updatePeopleList(payload, slot, reference);
    case 'facdev-lead':
      return null;
    default:
      return assertNever(slot, 'people portrait slot');
  }
}

function withFacdevLocale(
  payload: FacdevPayload,
  locale: MediaWorkbenchLocale,
  nextLocale: FacdevLocale,
): FacdevPayload {
  return locale === 'zh'
    ? { ...payload, zh: nextLocale }
    : { ...payload, en: nextLocale };
}

function updateFacdev(
  payload: FacdevPayload,
  slot: FacdevLeadPortraitSlot,
  reference: MediaReference | null,
): FacdevPayload | null {
  const localePayload = payload[slot.locale];
  const group = localePayload.groups[slot.groupIndex];
  if (group === undefined || group.lead.name !== slot.personName) return null;
  const groups = localePayload.groups.map((candidate, groupIndex) => (
    groupIndex === slot.groupIndex
      ? { ...candidate, lead: withPortrait(candidate.lead, reference) }
      : candidate
  ));
  return withFacdevLocale(payload, slot.locale, { ...localePayload, groups });
}

function successfulChange(payload: unknown): PortraitChangeResult {
  return { ok: true, editorText: `${JSON.stringify(payload, null, 2)}\n` };
}

export function changePortraitReference(change: PortraitChange): PortraitChangeResult {
  const draft = parseDraftPayload(change.editorText);
  if (!draft.ok) {
    return { ok: false, reason: 'invalid-json', editorText: change.editorText };
  }

  switch (change.kind) {
    case 'people': {
      const parsed = CMS_PAYLOAD_REGISTRY.people.schema.safeParse(draft.payload);
      if (!parsed.success) {
        return { ok: false, reason: 'invalid-payload', editorText: change.editorText };
      }
      const updated = updatePeople(parsed.data, change.slot, change.reference);
      return updated === null
        ? { ok: false, reason: 'stale-slot', editorText: change.editorText }
        : successfulChange(updated);
    }
    case 'facdev': {
      const parsed = CMS_PAYLOAD_REGISTRY.facdev.schema.safeParse(draft.payload);
      if (!parsed.success) {
        return { ok: false, reason: 'invalid-payload', editorText: change.editorText };
      }
      if (change.slot.slotKind !== 'facdev-lead') {
        return { ok: false, reason: 'stale-slot', editorText: change.editorText };
      }
      const updated = updateFacdev(parsed.data, change.slot, change.reference);
      return updated === null
        ? { ok: false, reason: 'stale-slot', editorText: change.editorText }
        : successfulChange(updated);
    }
    default:
      return assertNever(change.kind, 'media workbench kind');
  }
}
