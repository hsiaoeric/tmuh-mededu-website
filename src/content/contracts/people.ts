import { z } from 'zod';
import { CENTER_IDS } from '@/data/centerIdentities';
import { DEPARTMENT_MEMBER_GROUP_IDS, type DepartmentMemberGroupId } from '@/data/kpis';
import {
  addDuplicateIssues,
  addLocaleLengthParityIssue,
  addLocaleParityIssue,
  addPersonIdDuplicateIssues,
  addPersonParityIssue,
  bilingual,
  PersonSchema,
  PublishedPersonSchema,
} from './common';

const HOLISTIC_COLLECTIONS = [
  'holisticInstructors',
  'holisticSeedTeachers',
  'holisticAiTeam',
] as const;

function peopleStructure<S extends typeof PersonSchema | typeof PublishedPersonSchema>(personSchema: S) {
  const GroupSchema = z.strictObject({
    centerId: z.string(),
    people: z.array(personSchema).readonly(),
  }).readonly();
  const LocaleSchema = z.strictObject({
    centerPeople: z.array(GroupSchema).readonly(),
    holisticInstructors: z.array(personSchema).readonly(),
    holisticSeedTeachers: z.array(personSchema).readonly(),
    holisticAiTeam: z.array(personSchema).readonly(),
    memberGroups: z.array(memberGroup(personSchema)).readonly(),
  }).readonly();
  return bilingual(LocaleSchema).check((context) => {
    addLocaleParityIssue(
      context.value.zh.centerPeople.map((group) => group.centerId),
      context.value.en.centerPeople.map((group) => group.centerId),
      ['en', 'centerPeople'],
      context,
    );
    context.value.zh.centerPeople.forEach((group, index) => {
      const translated = context.value.en.centerPeople[index];
      if (translated?.centerId !== group.centerId) return;
      addLocaleLengthParityIssue(group.people, translated.people, ['en', 'centerPeople', index, 'people'], context);
      addLocaleParityIssue(group.people.map((person) => person.id), translated.people.map((person) => person.id), ['en', 'centerPeople', index, 'people'], context);
      group.people.forEach((person, personIndex) => {
        const other = translated.people[personIndex];
        if (other !== undefined) addPersonParityIssue(person, other, ['en', 'centerPeople', index, 'people', personIndex], context);
      });
    });
    HOLISTIC_COLLECTIONS.forEach((collection) => {
      addLocaleLengthParityIssue(context.value.zh[collection], context.value.en[collection], ['en', collection], context);
      addLocaleParityIssue(context.value.zh[collection].map((person) => person.id), context.value.en[collection].map((person) => person.id), ['en', collection], context);
      context.value.zh[collection].forEach((person, index) => {
        const other = context.value.en[collection][index];
        if (other !== undefined) addPersonParityIssue(person, other, ['en', collection, index], context);
      });
    });
    context.value.zh.memberGroups.forEach((group, index) => {
      const translated = context.value.en.memberGroups[index];
      if (translated?.id !== group.id) return;
      addLocaleLengthParityIssue(group.people, translated.people, ['en', 'memberGroups', index, 'people'], context);
      addLocaleParityIssue(group.people.map((person) => person.id), translated.people.map((person) => person.id), ['en', 'memberGroups', index, 'people'], context);
      group.people.forEach((person, personIndex) => {
        const other = translated.people[personIndex];
        if (other !== undefined) addPersonParityIssue(person, other, ['en', 'memberGroups', index, 'people', personIndex], context);
      });
    });
    addCanonicalGroupIssue(context.value.zh.memberGroups, ['zh', 'memberGroups'], context);
    addCanonicalGroupIssue(context.value.en.memberGroups, ['en', 'memberGroups'], context);
  });
}

function memberGroup<S extends typeof PersonSchema | typeof PublishedPersonSchema>(
  personSchema: S,
) {
  return z.strictObject({
    id: z.enum(DEPARTMENT_MEMBER_GROUP_IDS),
    people: z.array(personSchema).readonly(),
  }).readonly();
}

function addCanonicalGroupIssue(
  groups: readonly { readonly id: DepartmentMemberGroupId }[],
  path: readonly PropertyKey[],
  context: { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] },
): void {
  if (groups.length !== DEPARTMENT_MEMBER_GROUP_IDS.length
    || groups.some((group, index) => group.id !== DEPARTMENT_MEMBER_GROUP_IDS[index])) {
    context.issues.push({
      code: 'custom',
      message: 'Department member group identifiers must remain complete and in canonical order',
      path: [...path],
      input: context.value,
    });
  }
}

function peoplePayload<S extends typeof PersonSchema | typeof PublishedPersonSchema>(personSchema: S) {
  return peopleStructure(personSchema).check((context) => {
    for (const locale of ['zh', 'en'] as const) {
      addDuplicateIssues({
        values: context.value[locale].centerPeople.map((group) => group.centerId),
        path: [locale, 'centerPeople'],
        field: 'centerId',
      }, context);
      context.value[locale].centerPeople.forEach((group, index) => {
        addPersonIdDuplicateIssues(group.people, [locale, 'centerPeople', index, 'people'], context);
      });
      HOLISTIC_COLLECTIONS.forEach((collection) => {
        addPersonIdDuplicateIssues(context.value[locale][collection], [locale, collection], context);
      });
      context.value[locale].memberGroups.forEach((group, index) => {
        addPersonIdDuplicateIssues(group.people, [locale, 'memberGroups', index, 'people'], context);
      });
    }
  });
}

export const EditablePeoplePayloadSchema = peopleStructure(PersonSchema);
export const PeoplePayloadSchema = peoplePayload(PersonSchema);
export const PublishedPeoplePayloadSchema = peoplePayload(PublishedPersonSchema).check((context) => {
  for (const locale of ['zh', 'en'] as const) {
    const groups = context.value[locale].centerPeople;
    const exact = groups.length === CENTER_IDS.length
      && groups.every((group) => CENTER_IDS.some((centerId) => centerId === group.centerId));
    if (exact) continue;
    context.issues.push({
      code: 'custom',
      message: 'Published people must contain every canonical center group exactly once',
      path: [locale, 'centerPeople'],
      input: context.value,
    });
  }
});
