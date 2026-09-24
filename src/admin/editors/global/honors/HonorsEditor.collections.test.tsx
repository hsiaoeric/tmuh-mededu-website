// @vitest-environment jsdom
import { cleanup, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  HonorsEditorHarness,
  honorsFixture,
  readHarnessPayload,
  type HonorsPayload,
} from './HonorsEditor.testHarness';

afterEach(cleanup);

function compactFixture(): HonorsPayload {
  const fixture = honorsFixture();
  return {
    ...fixture,
    zh: {
      ...fixture.zh,
      snqProjects: [{ ...fixture.zh.snqProjects[0], members: fixture.zh.snqProjects[0]?.members.slice(0, 2) ?? [] }],
      snqYearCounts: fixture.zh.snqYearCounts.slice(0, 2),
      nhqa: { ...fixture.zh.nhqa, leads: fixture.zh.nhqa.leads.slice(0, 2), keywords: fixture.zh.nhqa.keywords.slice(0, 2) },
    },
    en: {
      ...fixture.en,
      snqProjects: [{ ...fixture.en.snqProjects[0], members: fixture.en.snqProjects[0]?.members.slice(0, 2) ?? [] }],
      snqYearCounts: fixture.en.snqYearCounts.slice(0, 2),
      nhqa: { ...fixture.en.nhqa, leads: fixture.en.nhqa.leads.slice(0, 2), keywords: fixture.en.nhqa.keywords.slice(0, 2) },
    },
  };
}

async function confirmRemoval(user: ReturnType<typeof userEvent.setup>, button: HTMLElement) {
  await user.click(button);
  await user.click(within(document.body).getByRole('button', { name: '確認刪除' }));
}

describe('honors editor paired collections', { timeout: 30_000 }, () => {
  it('adds, reorders, and removes paired SNQ projects without recalculating authored year counts', async () => {
    // Given
    const user = userEvent.setup();
    const initial = compactFixture();
    const view = render(<HonorsEditorHarness initial={initial} />);

    // When
    await user.click(view.getByRole('button', { name: '新增 SNQ 專案' }));
    await user.type(view.getByRole('textbox', { name: 'SNQ 專案 2 專案名稱（繁體中文）' }), '新增專案');
    await user.type(view.getByRole('textbox', { name: 'SNQ 專案 2 專案名稱（英文）' }), 'New project');
    await user.click(view.getByRole('button', { name: '上移第 2 個 SNQ 專案' }));

    // Then
    let payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.snqProjects.map((project) => project.title)).toEqual(['新增專案', initial.zh.snqProjects[0]?.title]);
    expect(payload.en.snqProjects.map((project) => project.title)).toEqual(['New project', initial.en.snqProjects[0]?.title]);
    expect(payload.zh.snqYearCounts).toEqual(initial.zh.snqYearCounts);
    expect(payload.en.snqYearCounts).toEqual(initial.en.snqYearCounts);
    expect(payload.zh.snqProjects.flatMap(Object.keys)).not.toContain('id');
    await confirmRemoval(user, view.getByRole('button', { name: '刪除第 1 個 SNQ 專案' }));
    payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.snqProjects).toEqual(initial.zh.snqProjects);
    expect(payload.en.snqProjects).toEqual(initial.en.snqProjects);
    await confirmRemoval(user, view.getByRole('button', { name: '刪除第 1 個 SNQ 專案' }));
    payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.snqProjects).toEqual([]);
    expect(payload.en.snqProjects).toEqual([]);
    expect(view.getByRole('heading', { name: '尚無 SNQ 專案' })).toBeTruthy();
  });

  it('adds, reorders, removes, and empties nested paired project members accessibly', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<HonorsEditorHarness initial={compactFixture()} />);

    // When
    await user.click(view.getByRole('button', { name: '新增專案 1 成員' }));
    await user.type(view.getByRole('textbox', { name: 'SNQ 專案 1 成員 3 姓名（繁體中文）' }), '新增成員');
    await user.type(view.getByRole('textbox', { name: 'SNQ 專案 1 成員 3 姓名（英文）' }), 'New member');
    await user.click(view.getByRole('button', { name: '上移專案 1 的第 3 位成員' }));

    // Then
    let payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.snqProjects[0]?.members[1]?.person).toBe('新增成員');
    expect(payload.en.snqProjects[0]?.members[1]?.person).toBe('New member');
    expect(payload.zh.snqProjects[0]?.members.flatMap(Object.keys)).not.toContain('id');
    await confirmRemoval(user, view.getByRole('button', { name: '刪除專案 1 的第 1 位成員' }));
    await confirmRemoval(user, view.getByRole('button', { name: '刪除專案 1 的第 1 位成員' }));
    await confirmRemoval(user, view.getByRole('button', { name: '刪除專案 1 的第 1 位成員' }));
    payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.snqProjects[0]?.members).toEqual([]);
    expect(payload.en.snqProjects[0]?.members).toEqual([]);
    expect(view.getByRole('heading', { name: '專案 1 尚無成員' })).toBeTruthy();
    expect(view.getByRole('button', { name: '新增專案 1 成員' })).toBeTruthy();
  });

  it('operates on paired year counts atomically and exposes the final empty state', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<HonorsEditorHarness initial={compactFixture()} />);

    // When
    await user.click(view.getByRole('button', { name: '新增年度統計' }));
    await user.type(view.getByRole('textbox', { name: 'SNQ 年度統計 3 年度（繁體中文）' }), '特殊年');
    await user.type(view.getByRole('textbox', { name: 'SNQ 年度統計 3 年度（英文）' }), 'Special year');
    await user.click(view.getByRole('button', { name: '上移第 3 筆年度統計' }));

    // Then
    let payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.snqYearCounts[1]).toEqual({ year: '特殊年', count: 0 });
    expect(payload.en.snqYearCounts[1]).toEqual({ year: 'Special year', count: 0 });
    await confirmRemoval(user, view.getByRole('button', { name: '刪除第 1 筆年度統計' }));
    await confirmRemoval(user, view.getByRole('button', { name: '刪除第 1 筆年度統計' }));
    await confirmRemoval(user, view.getByRole('button', { name: '刪除第 1 筆年度統計' }));
    payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.snqYearCounts).toEqual([]);
    expect(payload.en.snqYearCounts).toEqual([]);
    expect(view.getByRole('heading', { name: '尚無 SNQ 年度統計' })).toBeTruthy();
  });

  it.each([
    ['負責人', 'lead', 'leads'],
    ['關鍵字', 'keyword', 'keywords'],
  ] as const)('adds, reorders, removes, and empties paired NHQA %s rows', async (label, id, key) => {
    // Given
    const user = userEvent.setup();
    const view = render(<HonorsEditorHarness initial={compactFixture()} />);

    // When
    await user.click(view.getByRole('button', { name: `新增 NHQA ${label}` }));
    await user.type(view.getByRole('textbox', { name: `NHQA ${label} 3（繁體中文）` }), `新${label}`);
    await user.type(view.getByRole('textbox', { name: `NHQA ${label} 3（英文）` }), `New ${id}`);
    await user.click(view.getByRole('button', { name: `上移第 3 筆 NHQA ${label}` }));

    // Then
    let payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.nhqa[key][1]).toBe(`新${label}`);
    expect(payload.en.nhqa[key][1]).toBe(`New ${id}`);
    await confirmRemoval(user, view.getByRole('button', { name: `刪除第 1 筆 NHQA ${label}` }));
    await confirmRemoval(user, view.getByRole('button', { name: `刪除第 1 筆 NHQA ${label}` }));
    await confirmRemoval(user, view.getByRole('button', { name: `刪除第 1 筆 NHQA ${label}` }));
    payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.nhqa[key]).toEqual([]);
    expect(payload.en.nhqa[key]).toEqual([]);
    expect(view.getByRole('heading', { name: `尚無 NHQA ${label}` })).toBeTruthy();
  });
});
