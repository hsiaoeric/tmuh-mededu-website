import { describe, expect, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY, type PublishedCmsPayloadByKind } from './registry';

type PeoplePayload = PublishedCmsPayloadByKind['people'];
type Person = PeoplePayload['zh']['holisticInstructors'][number];
type FacdevPayload = PublishedCmsPayloadByKind['facdev'];

function peoplePayload(): PeoplePayload {
  const document = snapshot.find((candidate) => candidate.kind === 'people');
  if (document === undefined) throw new TypeError('Missing people fixture');
  return CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse(structuredClone(document.payload));
}

function facdevPayload(): FacdevPayload {
  const document = snapshot.find((candidate) => candidate.kind === 'facdev');
  if (document === undefined) throw new TypeError('Missing facdev fixture');
  return CMS_PAYLOAD_REGISTRY.facdev.publishedSchema.parse(structuredClone(document.payload));
}

function changeFirstEnglishCenterPerson(
  payload: PeoplePayload,
  change: (person: Person) => Person,
): PeoplePayload {
  const group = payload.en.centerPeople[0];
  const person = group?.people[0];
  if (group === undefined || person === undefined) throw new TypeError('Missing English center person');
  return {
    ...payload,
    en: {
      ...payload.en,
      centerPeople: [
        { ...group, people: [change(person), ...group.people.slice(1)] },
        ...payload.en.centerPeople.slice(1),
      ],
    },
  };
}

const SHARED_PERSON_MUTATIONS = [
  ['id', (person: Person) => ({ ...person, id: `${person.id}-different` })],
  ['roleKey', (person: Person) => ({ ...person, roleKey: 'advisor' })],
  ['slug', (person: Person) => ({ ...person, slug: `${person.slug}-different` })],
  ['hubId', (person: Person) => ({ ...person, hubId: `${person.hubId}-different` })],
  ['ext', (person: Person) => ({ ...person, ext: `${person.ext}-different` })],
  ['email', (person: Person) => ({ ...person, email: `different-${person.email}` })],
] satisfies readonly (readonly [string, (person: Person) => Person])[];

describe('published bilingual person identity', () => {
  it.each(SHARED_PERSON_MUTATIONS)('rejects independently divergent %s', (_field, change) => {
    // Given
    const payload = peoplePayload();

    // When
    const result = CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse(
      changeFirstEnglishCenterPerson(payload, change),
    );

    // Then
    expect(result.success).toBe(false);
  });

  it('rejects both cross-locale alternate-name mismatches', () => {
    // Given
    const payload = peoplePayload();
    const zhGroup = payload.zh.centerPeople[0];
    const zhPerson = zhGroup?.people[0];
    if (zhGroup === undefined || zhPerson === undefined) throw new TypeError('Missing Chinese center person');
    const wrongEnglishAlternate = changeFirstEnglishCenterPerson(payload, (person) => ({
      ...person,
      alternateName: `${person.alternateName}-different`,
    }));
    const wrongChineseAlternate = {
      ...payload,
      zh: {
        ...payload.zh,
        centerPeople: [{
          ...zhGroup,
          people: [{ ...zhPerson, alternateName: `${zhPerson.alternateName}-different` }, ...zhGroup.people.slice(1)],
        }, ...payload.zh.centerPeople.slice(1)],
      },
    };

    // When
    const results = [wrongEnglishAlternate, wrongChineseAlternate].map((value) => (
      CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse(value)
    ));

    // Then
    expect(results.every((result) => !result.success)).toBe(true);
  });

  it('accepts intentionally different locale portraits', () => {
    // Given
    const payload = peoplePayload();
    const localized = changeFirstEnglishCenterPerson(payload, (person) => ({ ...person, portrait: null }));

    // When
    const result = CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse(localized);

    // Then
    expect(result.success).toBe(true);
  });

  it.each([
    ['center people', (payload: PeoplePayload) => {
      const zh = payload.zh.centerPeople[0];
      const en = payload.en.centerPeople[0];
      const zhPerson = zh?.people[0];
      const enPerson = en?.people[0];
      if (zh === undefined || en === undefined || zhPerson === undefined || enPerson === undefined) throw new TypeError('Missing center people');
      return { ...payload, zh: { ...payload.zh, centerPeople: [{ ...zh, people: [...zh.people, zhPerson] }, ...payload.zh.centerPeople.slice(1)] }, en: { ...payload.en, centerPeople: [{ ...en, people: [...en.people, enPerson] }, ...payload.en.centerPeople.slice(1)] } };
    }],
    ['holistic instructors', (payload: PeoplePayload) => ({ ...payload, zh: { ...payload.zh, holisticInstructors: [...payload.zh.holisticInstructors, payload.zh.holisticInstructors[0]] }, en: { ...payload.en, holisticInstructors: [...payload.en.holisticInstructors, payload.en.holisticInstructors[0]] } })],
    ['holistic seed teachers', (payload: PeoplePayload) => ({ ...payload, zh: { ...payload.zh, holisticSeedTeachers: [...payload.zh.holisticSeedTeachers, payload.zh.holisticSeedTeachers[0]] }, en: { ...payload.en, holisticSeedTeachers: [...payload.en.holisticSeedTeachers, payload.en.holisticSeedTeachers[0]] } })],
    ['holistic AI team', (payload: PeoplePayload) => ({ ...payload, zh: { ...payload.zh, holisticAiTeam: [...payload.zh.holisticAiTeam, payload.zh.holisticAiTeam[0]] }, en: { ...payload.en, holisticAiTeam: [...payload.en.holisticAiTeam, payload.en.holisticAiTeam[0]] } })],
    ['member group people', (payload: PeoplePayload) => {
      const zh = payload.zh.memberGroups[0];
      const en = payload.en.memberGroups[0];
      const zhPerson = zh?.people[0];
      const enPerson = en?.people[0];
      if (zh === undefined || en === undefined || zhPerson === undefined || enPerson === undefined) throw new TypeError('Missing member group people');
      return { ...payload, zh: { ...payload.zh, memberGroups: [{ ...zh, people: [...zh.people, zhPerson] }, ...payload.zh.memberGroups.slice(1)] }, en: { ...payload.en, memberGroups: [{ ...en, people: [...en.people, enPerson] }, ...payload.en.memberGroups.slice(1)] } };
    }],
  ] satisfies readonly (readonly [string, (payload: PeoplePayload) => PeoplePayload])[])('rejects duplicate IDs in %s', (_collection, duplicate) => {
    // Given / When
    const result = CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse(duplicate(peoplePayload()));

    // Then
    expect(result.success).toBe(false);
  });
});

describe('published facdev lead identity', () => {
  it('rejects reordered and blank lead identities', () => {
    // Given
    const payload = facdevPayload();
    const firstZh = payload.zh.groups[0];
    const secondZh = payload.zh.groups[1];
    const firstEn = payload.en.groups[0];
    const secondEn = payload.en.groups[1];
    if (firstZh === undefined || secondZh === undefined || firstEn === undefined || secondEn === undefined) throw new TypeError('Missing facdev groups');
    const reordered = { ...payload, en: { ...payload.en, groups: [secondEn, firstEn, ...payload.en.groups.slice(2)] } };
    const blank = { ...payload, zh: { ...payload.zh, groups: [{ ...firstZh, lead: { ...firstZh.lead, id: '' } }, ...payload.zh.groups.slice(1)] }, en: { ...payload.en, groups: [{ ...firstEn, lead: { ...firstEn.lead, id: '' } }, ...payload.en.groups.slice(1)] } };

    // When
    const results = [reordered, blank].map((value) => CMS_PAYLOAD_REGISTRY.facdev.publishedSchema.safeParse(value));

    // Then
    expect(results.every((result) => !result.success)).toBe(true);
  });

  it('allows temporary duplicate lead IDs in drafts but rejects them at publication', () => {
    // Given
    const payload = facdevPayload();
    const firstZh = payload.zh.groups[0];
    const secondZh = payload.zh.groups[1];
    const firstEn = payload.en.groups[0];
    const secondEn = payload.en.groups[1];
    if (firstZh === undefined || secondZh === undefined || firstEn === undefined || secondEn === undefined) throw new TypeError('Missing facdev groups');
    const duplicate = { ...payload, zh: { ...payload.zh, groups: [firstZh, { ...secondZh, lead: firstZh.lead }, ...payload.zh.groups.slice(2)] }, en: { ...payload.en, groups: [firstEn, { ...secondEn, lead: firstEn.lead }, ...payload.en.groups.slice(2)] } };

    // When
    const editable = CMS_PAYLOAD_REGISTRY.facdev.editableSchema.safeParse(duplicate);
    const general = CMS_PAYLOAD_REGISTRY.facdev.schema.safeParse(duplicate);
    const published = CMS_PAYLOAD_REGISTRY.facdev.publishedSchema.safeParse(duplicate);

    // Then
    expect(editable.success).toBe(true);
    expect(general.success).toBe(true);
    expect(published.success).toBe(false);
  });
});
