// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY, type CmsPayloadByKind } from '@/content/contracts/registry';
import { ControlledPeopleEditor, compactFixture } from './PeopleEditor.testHarness';

type PeoplePayload = CmsPayloadByKind['people'];

afterEach(cleanup);

function payload(view: ReturnType<typeof render>): PeoplePayload {
  return CMS_PAYLOAD_REGISTRY.people.schema.parse(
    JSON.parse(view.getByTestId('people-payload').textContent ?? '{}'),
  );
}

function collection(view: ReturnType<typeof render>, id: string): HTMLElement {
  const element = view.container.querySelector(`[data-editor-collection="${id}"]`);
  if (!(element instanceof HTMLElement)) throw new TypeError(`Missing ${id} collection`);
  return element;
}

describe('people editor paired collections', () => {
  it('adds, reorders, and deletes center groups atomically', async () => {
    // Given
    const user = userEvent.setup();
    const initial = compactFixture();
    const second = { ...initial, zh: { ...initial.zh, centerPeople: [...initial.zh.centerPeople, { centerId: 'second', people: [] }] }, en: { ...initial.en, centerPeople: [...initial.en.centerPeople, { centerId: 'second', people: [] }] } };
    const view = render(<ControlledPeopleEditor initial={second} />);
    const groups = collection(view, 'people-center-groups');

    // When
    await user.click(within(groups).getByRole('button', { name: '下移第 1 個中心群組' }));
    await user.click(within(groups).getByRole('button', { name: '刪除第 1 個中心群組' }));
    await user.click(view.getByRole('button', { name: '確認刪除中心群組' }));
    fireEvent.click(within(groups).getByRole('button', { name: '新增中心群組' }));

    // Then
    expect(payload(view).zh.centerPeople.map((group) => group.centerId)).toEqual(['faculty_dev', '']);
    expect(payload(view).en.centerPeople.map((group) => group.centerId)).toEqual(['faculty_dev', '']);
  });

  it('adds, reorders, and deletes paired center people rows without storage actions', async () => {
    // Given
    const user = userEvent.setup();
    const initial = compactFixture();
    const zhPerson = initial.zh.centerPeople[0]?.people[0];
    const enPerson = initial.en.centerPeople[0]?.people[0];
    if (zhPerson === undefined || enPerson === undefined) throw new TypeError('Missing center fixture person');
    const withTwo = {
      ...initial,
      zh: { ...initial.zh, centerPeople: [{ centerId: 'faculty_dev', people: [zhPerson, { ...zhPerson, name: '第二人' }] }] },
      en: { ...initial.en, centerPeople: [{ centerId: 'faculty_dev', people: [enPerson, { ...enPerson, name: 'Second Person' }] }] },
    };
    const view = render(<ControlledPeopleEditor initial={withTwo} />);
    const people = collection(view, 'center-0-people');

    // When
    await user.click(within(people).getByRole('button', { name: '下移第 1 位人員' }));
    await user.click(within(people).getByRole('button', { name: '刪除第 1 位人員' }));
    await user.click(view.getByRole('button', { name: '確認刪除人員' }));
    fireEvent.click(within(people).getByRole('button', { name: '新增人員' }));

    // Then
    const next = payload(view);
    expect(next.zh.centerPeople[0]?.people.map((person) => person.name)).toEqual([zhPerson.name, '']);
    expect(next.en.centerPeople[0]?.people.map((person) => person.name)).toEqual([enPerson.name, '']);
    expect(view.queryByRole('button', { name: /上傳|選擇照片|更換照片|取消連結/u })).toBeNull();
  });

  it('assigns a shared unique identity to each new bilingual person row', () => {
    // Given
    const view = render(<ControlledPeopleEditor initial={compactFixture()} />);
    const people = collection(view, 'center-0-people');

    // When
    fireEvent.click(within(people).getByRole('button', { name: '新增人員' }));
    fireEvent.click(within(people).getByRole('button', { name: '新增人員' }));

    // Then
    const next = payload(view);
    const zhIds = next.zh.centerPeople[0]?.people.map((person) => person.id);
    const enIds = next.en.centerPeople[0]?.people.map((person) => person.id);
    expect(zhIds).toEqual(enIds);
    expect(new Set(zhIds).size).toBe(zhIds?.length);
  });

  it.each([
    ['holistic-instructors', 'holisticInstructors'],
    ['holistic-seed-teachers', 'holisticSeedTeachers'],
    ['holistic-ai-team', 'holisticAiTeam'],
  ] as const)('supports add, reorder, and delete for %s', async (collectionId, key) => {
    // Given
    const user = userEvent.setup();
    const initial = compactFixture();
    const firstZh = initial.zh[key][0];
    const firstEn = initial.en[key][0];
    if (firstZh === undefined || firstEn === undefined) throw new TypeError('Missing holistic fixture person');
    const withTwo = { ...initial, zh: { ...initial.zh, [key]: [firstZh, { ...firstZh, name: '第二人' }] }, en: { ...initial.en, [key]: [firstEn, { ...firstEn, name: 'Second Person' }] } };
    const view = render(<ControlledPeopleEditor initial={withTwo} />);
    const list = collection(view, collectionId);

    // When
    await user.click(within(list).getByRole('button', { name: '下移第 1 位人員' }));
    await user.click(within(list).getByRole('button', { name: '刪除第 1 位人員' }));
    await user.click(view.getByRole('button', { name: '確認刪除人員' }));
    fireEvent.click(within(list).getByRole('button', { name: '新增人員' }));

    // Then
    expect(payload(view).zh[key].map((person) => person.name)).toEqual([firstZh.name, '']);
    expect(payload(view).en[key].map((person) => person.name)).toEqual([firstEn.name, '']);
  });
});
