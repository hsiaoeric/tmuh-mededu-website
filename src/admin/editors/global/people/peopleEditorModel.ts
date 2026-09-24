import type { CmsPayloadByKind } from '@/content/contracts/registry';
import {
  insertPaired,
  movePaired,
  removePaired,
  updatePaired,
  type PairedCollection,
  type PairedCollectionResult,
} from '../pairedCollections';

export type PeoplePayload = CmsPayloadByKind['people'];
export type Person = PeoplePayload['zh']['holisticInstructors'][number];
export type PersonField = Exclude<keyof Person, 'portrait'>;
export type PeopleListKey = 'holisticInstructors' | 'holisticSeedTeachers' | 'holisticAiTeam';
export type Locale = 'zh' | 'en';

type PersonChange = {
  readonly locale: Locale;
  readonly index: number;
  readonly field: PersonField;
  readonly value: string;
};

export const EMPTY_PERSON: Person = {
  id: 'new-person', name: '', alternateName: '', roleKey: '', role: '', department: '',
  slug: '', hubId: '', duty: '', ext: '', email: '',
};

type Group = PeoplePayload['zh']['centerPeople'][number];

function withGroups(
  payload: PeoplePayload,
  result: PairedCollectionResult<Group>,
): PeoplePayload | null {
  if (!result.ok) return null;
  return {
    ...payload,
    zh: { ...payload.zh, centerPeople: result.collection.zh },
    en: { ...payload.en, centerPeople: result.collection.en },
  };
}

export function addCenterGroup(payload: PeoplePayload): PeoplePayload | null {
  return withGroups(payload, insertPaired({ zh: payload.zh.centerPeople, en: payload.en.centerPeople }, {
    index: payload.zh.centerPeople.length,
    rows: { zh: { centerId: '', people: [] }, en: { centerId: '', people: [] } },
  }));
}

export function moveCenterGroup(payload: PeoplePayload, fromIndex: number, toIndex: number): PeoplePayload | null {
  return withGroups(payload, movePaired(
    { zh: payload.zh.centerPeople, en: payload.en.centerPeople },
    { fromIndex, toIndex },
  ));
}

export function removeCenterGroup(payload: PeoplePayload, index: number): PeoplePayload | null {
  return withGroups(payload, removePaired(
    { zh: payload.zh.centerPeople, en: payload.en.centerPeople },
    { index },
  ));
}

export function updateCenterId(payload: PeoplePayload, index: number, centerId: string): PeoplePayload | null {
  const zh = payload.zh.centerPeople[index];
  const en = payload.en.centerPeople[index];
  if (zh === undefined || en === undefined) return null;
  return withGroups(payload, updatePaired(
    { zh: payload.zh.centerPeople, en: payload.en.centerPeople },
    { index, rows: { zh: { ...zh, centerId }, en: { ...en, centerId } } },
  ));
}

function withPeople(
  payload: PeoplePayload,
  key: PeopleListKey,
  result: PairedCollectionResult<Person>,
): PeoplePayload | null {
  if (!result.ok) return null;
  return {
    ...payload,
    zh: { ...payload.zh, [key]: result.collection.zh },
    en: { ...payload.en, [key]: result.collection.en },
  };
}

export function changePeopleList(
  payload: PeoplePayload,
  key: PeopleListKey,
  change: (collection: PairedCollection<Person>) => PairedCollectionResult<Person>,
): PeoplePayload | null {
  return withPeople(payload, key, change({ zh: payload.zh[key], en: payload.en[key] }));
}

export function changeCenterPeople(
  payload: PeoplePayload,
  groupIndex: number,
  change: (collection: PairedCollection<Person>) => PairedCollectionResult<Person>,
): PeoplePayload | null {
  const zh = payload.zh.centerPeople[groupIndex];
  const en = payload.en.centerPeople[groupIndex];
  if (zh === undefined || en === undefined) return null;
  const result = change({ zh: zh.people, en: en.people });
  if (!result.ok) return null;
  return withGroups(payload, updatePaired(
    { zh: payload.zh.centerPeople, en: payload.en.centerPeople },
    { index: groupIndex, rows: {
      zh: { ...zh, people: result.collection.zh },
      en: { ...en, people: result.collection.en },
    } },
  ));
}

export function changeMemberGroupPeople(
  payload: PeoplePayload,
  groupIndex: number,
  change: (collection: PairedCollection<Person>) => PairedCollectionResult<Person>,
): PeoplePayload | null {
  const zh = payload.zh.memberGroups[groupIndex];
  const en = payload.en.memberGroups[groupIndex];
  if (zh === undefined || en === undefined) return null;
  const result = change({ zh: zh.people, en: en.people });
  if (!result.ok) return null;
  return {
    ...payload,
    zh: { ...payload.zh, memberGroups: payload.zh.memberGroups.map((group, index) => (
      index === groupIndex ? { ...group, people: result.collection.zh } : group
    )) },
    en: { ...payload.en, memberGroups: payload.en.memberGroups.map((group, index) => (
      index === groupIndex ? { ...group, people: result.collection.en } : group
    )) },
  };
}

export function updatePerson(
  collection: PairedCollection<Person>,
  change: PersonChange,
): PairedCollectionResult<Person> {
  const zh = collection.zh[change.index];
  const en = collection.en[change.index];
  if (zh === undefined || en === undefined) return { ok: false, reason: 'index-out-of-bounds' };
  return updatePaired(collection, {
    index: change.index,
    rows: change.locale === 'zh'
      ? { zh: { ...zh, [change.field]: change.value }, en }
      : { zh, en: { ...en, [change.field]: change.value } },
  });
}

export function peopleFeedback(payload: PeoplePayload): readonly string[] {
  const messages: string[] = [];
  const zhIds = payload.zh.centerPeople.map((group) => group.centerId);
  const enIds = payload.en.centerPeople.map((group) => group.centerId);
  const duplicate = zhIds.find((id, index) => zhIds.indexOf(id) !== index)
    ?? enIds.find((id, index) => enIds.indexOf(id) !== index);
  if (duplicate !== undefined) messages.push(`中心識別碼重複：${duplicate}`);
  if (zhIds.length !== enIds.length || zhIds.some((id, index) => id !== enIds[index])) {
    messages.push('中英文中心群組的識別碼與順序必須一致。');
  }
  payload.zh.centerPeople.forEach((group, index) => {
    if (group.people.length !== payload.en.centerPeople[index]?.people.length) {
      messages.push(`中心 ${group.centerId || index + 1} 的中英文人員數量不一致。`);
    }
  });
  const holisticLists = [
    ['holisticInstructors', '全人照護指導員'],
    ['holisticSeedTeachers', '全人照護種子教師'],
    ['holisticAiTeam', '全人照護 AI 團隊'],
  ] as const;
  for (const [key, label] of holisticLists) {
    if (payload.zh[key].length !== payload.en[key].length) {
      messages.push(`${label}的中英文人員數量不一致。`);
    }
  }
  payload.zh.memberGroups.forEach((group, index) => {
    const translated = payload.en.memberGroups[index];
    if (translated?.id !== group.id) {
      messages.push('教學部一覽群組的識別碼與順序必須一致。');
      return;
    }
    if (group.people.length !== translated.people.length) {
      messages.push(`教學部一覽群組 ${group.id} 的中英文人員數量不一致。`);
    }
  });
  return [...new Set(messages)];
}
