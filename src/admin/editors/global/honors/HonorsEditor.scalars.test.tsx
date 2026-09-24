// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HonorsEditor } from './HonorsEditor';
import {
  HonorsEditorHarness,
  honorsFixture,
  readHarnessPayload,
} from './HonorsEditor.testHarness';

afterEach(cleanup);

function replaceField(_user: ReturnType<typeof userEvent.setup>, field: HTMLElement, value: string) {
  fireEvent.change(field, { target: { value } });
}

function scalarFixture() {
  const fixture = honorsFixture();
  return {
    ...fixture,
    zh: {
      ...fixture.zh,
      snqProjects: [{ ...fixture.zh.snqProjects[0], members: fixture.zh.snqProjects[0]?.members.slice(0, 1) ?? [] }],
      snqYearCounts: fixture.zh.snqYearCounts.slice(0, 1),
      nhqa: { ...fixture.zh.nhqa, leads: [], keywords: [] },
    },
    en: {
      ...fixture.en,
      snqProjects: [{ ...fixture.en.snqProjects[0], members: fixture.en.snqProjects[0]?.members.slice(0, 1) ?? [] }],
      snqYearCounts: fixture.en.snqYearCounts.slice(0, 1),
      nhqa: { ...fixture.en.nhqa, leads: [], keywords: [] },
    },
  };
}

describe('honors editor scalar and preservation behavior', () => {
  it('renders the committed fixture losslessly without an eager controlled emission', () => {
    // Given
    const fixture = honorsFixture();
    const editorText = JSON.stringify(fixture, null, 2);
    const onEditorTextChange = vi.fn();

    // When
    const view = render(<HonorsEditor editorText={editorText} onEditorTextChange={onEditorTextChange} />);

    // Then
    expect(view.getByRole('heading', { name: '品質榮譽內容' })).toBeTruthy();
    expect(onEditorTextChange).not.toHaveBeenCalled();
    expect(JSON.parse(editorText)).toEqual(fixture);
  });

  it('edits every scalar field family in both languages while preserving empty strings', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<HonorsEditorHarness initial={scalarFixture()} />);
    const textFields = [
      ['頁面眉標', 'eyebrow'], ['頁面標題', 'title'], ['頁面說明', 'desc'],
      ['SNQ 區塊標題', 'snqTitle'], ['NHQA 區塊標題', 'nhqaTitle'],
      ['單位欄標題', 'colUnit'], ['職稱欄標題', 'colRole'], ['負責人欄標題', 'colPerson'],
      ['續審標籤', 'renewalLabel'], ['NHQA 實證連結文案', 'nhqaEbmLink'], ['資料來源', 'dataSource'],
    ] as const;
    const nhqaFields = [
      ['年度', 'year'], ['活動資訊', 'event'], ['獎項註記', 'awardNote'],
      ['組別', 'group'], ['領域', 'domain'], ['專案名稱', 'project'],
    ] as const;

    // When
    for (const [label] of textFields) {
      await replaceField(user, view.getByRole('textbox', { name: `${label}（繁體中文）` }), `中-${label}`);
      await replaceField(user, view.getByRole('textbox', { name: `${label}（英文）` }), `EN-${label}`);
    }
    for (const [label] of nhqaFields) {
      await replaceField(user, view.getByRole('textbox', { name: `NHQA ${label}（繁體中文）` }), `中-${label}`);
      await replaceField(user, view.getByRole('textbox', { name: `NHQA ${label}（英文）` }), `EN-${label}`);
    }
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 認證年份（繁體中文）' }), '中-認證年');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 認證年份（英文）' }), 'EN-cert-year');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 標章文字（繁體中文）' }), '中-標章');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 標章文字（英文）' }), 'EN-badge');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 專案名稱（繁體中文）' }), '中-專案');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 專案名稱（英文）' }), 'EN-project');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 續審文字（繁體中文）' }), '');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 續審文字（英文）' }), '');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 成員 1 單位（繁體中文）' }), '中-單位');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 成員 1 單位（英文）' }), 'EN-unit');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 成員 1 職稱（繁體中文）' }), '中-職稱');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 成員 1 職稱（英文）' }), 'EN-role');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 成員 1 姓名（繁體中文）' }), '中-姓名');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 成員 1 姓名（英文）' }), 'EN-person');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 年度統計 1 年度（繁體中文）' }), '民國年');
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 年度統計 1 年度（英文）' }), 'AY-year');
    await replaceField(user, view.getByRole('spinbutton', { name: 'SNQ 年度統計 1 件數（繁體中文）' }), '37');
    await replaceField(user, view.getByRole('spinbutton', { name: 'SNQ 年度統計 1 件數（英文）' }), '41');

    // Then
    const payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    for (const [label, key] of textFields) {
      expect(payload.zh[key]).toBe(`中-${label}`);
      expect(payload.en[key]).toBe(`EN-${label}`);
    }
    for (const [label, key] of nhqaFields) {
      expect(payload.zh.nhqa[key]).toBe(`中-${label}`);
      expect(payload.en.nhqa[key]).toBe(`EN-${label}`);
    }
    expect(payload.zh.snqProjects[0]).toMatchObject({ certYear: '中-認證年', badgeLabel: '中-標章', title: '中-專案', renewal: '', members: [{ unit: '中-單位', role: '中-職稱', person: '中-姓名' }] });
    expect(payload.en.snqProjects[0]).toMatchObject({ certYear: 'EN-cert-year', badgeLabel: 'EN-badge', title: 'EN-project', renewal: '', members: [{ unit: 'EN-unit', role: 'EN-role', person: 'EN-person' }] });
    expect(payload.zh.snqYearCounts[0]).toEqual({ year: '民國年', count: 37 });
    expect(payload.en.snqYearCounts[0]).toEqual({ year: 'AY-year', count: 41 });
  }, 30_000);

  it('preserves sibling projects, NHQA, and authored counts after a deep member edit', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = honorsFixture();
    const view = render(<HonorsEditorHarness initial={fixture} />);

    // When
    await replaceField(user, view.getByRole('textbox', { name: 'SNQ 專案 1 成員 1 姓名（繁體中文）' }), '深層修改');

    // Then
    const payload = readHarnessPayload(view.getByTestId('honors-editor-text'));
    expect(payload.zh.snqProjects[0]?.members[0]?.person).toBe('深層修改');
    expect(payload.zh.snqProjects.slice(1)).toEqual(fixture.zh.snqProjects.slice(1));
    expect(payload.en.snqProjects).toEqual(fixture.en.snqProjects);
    expect(payload.zh.nhqa).toEqual(fixture.zh.nhqa);
    expect(payload.en.nhqa).toEqual(fixture.en.nhqa);
    expect(payload.zh.snqYearCounts).toEqual(fixture.zh.snqYearCounts);
    expect(payload.en.snqYearCounts).toEqual(fixture.en.snqYearCounts);
  });
});
