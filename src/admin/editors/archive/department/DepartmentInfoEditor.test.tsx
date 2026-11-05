// @vitest-environment jsdom

import { cleanup, fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PROGRAM_IDS } from '@/content/contracts/archiveIds';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { renderArchiveEditor, snapshotPayload } from '../archiveTestHarness';
import { publishedArchiveIds } from '../lockedIds';
import { DepartmentInfoEditor } from './DepartmentInfoEditor';

afterEach(cleanup);

const payload = snapshotPayload('department_info');
const lockedIds = publishedArchiveIds('department_info', payload as never);

function row(container: HTMLElement, list: string, index: number): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[data-archive-list="${list}"][data-archive-row-index="${index}"]`);
  if (element === null) throw new TypeError(`Missing ${list} row ${index}`);
  return element;
}

describe('DepartmentInfoEditor', () => {
  it('keeps exactly the five programs: no add or delete controls', () => {
    const view = renderArchiveEditor('department_info', DepartmentInfoEditor, payload, { lockedIds });
    const programs = view.container.querySelector<HTMLElement>('#department-programs')!;
    expect(programs.querySelectorAll('[data-archive-list="department-programs-list"]')).toHaveLength(PROGRAM_IDS.length);
    expect(within(programs).queryByRole('button', { name: /新增/ })).toBeNull();
    expect(within(programs).queryByRole('button', { name: /^刪除/ })).toBeNull();
    expect(programs.textContent).toContain('固定為五個計畫');
  });

  it('offers only pages that belong to the program as its page references', () => {
    const withProgramPages = {
      ...payload,
      pages: [
        ...payload.pages,
        { id: 'pgy-outcomes', section: 'program', owner: 'pgy', order: 0, title: { zh: 'PGY 訓練成果' }, body: { zh: [] } },
        { id: 'residents-outcomes', section: 'program', owner: 'residents', order: 0, title: { zh: '住院醫師訓練成果' }, body: { zh: [] } },
      ],
    };
    const view = renderArchiveEditor('department_info', DepartmentInfoEditor, withProgramPages, { lockedIds });
    const pgyIndex = withProgramPages.programs.findIndex((program) => program.id === 'pgy');
    const pgy = row(view.container, 'department-programs-list', pgyIndex);
    fireEvent.click(within(pgy).getByRole('button', { expanded: false }));
    const outcomes = within(row(view.container, 'department-programs-list', pgyIndex)).getByRole('combobox', { name: '訓練成果頁' }) as HTMLSelectElement;
    const values = [...outcomes.options].map((option) => option.value);
    expect(values).toEqual(['', 'pgy-outcomes']);
    fireEvent.change(outcomes, { target: { value: 'pgy-outcomes' } });
    const latest = view.latest();
    expect(latest.programs[pgyIndex]?.outcomesPageId).toBe('pgy-outcomes');
    expect(CMS_PAYLOAD_REGISTRY.department_info.schema.safeParse(latest).success).toBe(true);
    fireEvent.change(outcomes, { target: { value: '' } });
    expect('outcomesPageId' in (view.latest().programs[pgyIndex] ?? {})).toBe(false);
  });

  it('adds a page with an editable id and keeps published page ids read-only', () => {
    const view = renderArchiveEditor('department_info', DepartmentInfoEditor, payload, { lockedIds });
    fireEvent.click(within(row(view.container, 'department-pages-list', 0)).getByRole('button', { expanded: false }));
    expect((view.getByRole('textbox', { name: /^頁面識別碼/ }) as HTMLInputElement).readOnly).toBe(true);
    fireEvent.click(view.getByRole('button', { name: '新增頁面' }));
    const added = view.latest().pages.slice(-1)[0];
    expect(added?.id).toBe('page-1');
    expect((view.getByRole('textbox', { name: /^頁面識別碼/ }) as HTMLInputElement).readOnly).toBe(false);
  });

  it('adds links to a group with validated URLs', () => {
    const view = renderArchiveEditor('department_info', DepartmentInfoEditor, payload, { lockedIds });
    const group = payload.linkGroups[0]!;
    fireEvent.click(within(row(view.container, 'department-links-list', 0)).getByRole('button', { expanded: false }));
    fireEvent.click(view.getByRole('button', { name: '新增連結' }));
    const links = view.latest().linkGroups[0]!.links;
    const added = links.slice(-1)[0]!;
    expect(added.id).toBe(`${group.id}-${group.links.length + 1}`);
    const href = view.getByRole('textbox', { name: new RegExp(`^連結 ${links.length} 網址`) });
    fireEvent.change(href, { target: { value: 'files/legacy/x.pdf' } });
    expect(href.getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(href, { target: { value: 'https://www.tmuh.org.tw/' } });
    expect(view.latest().linkGroups[0]!.links.slice(-1)[0]?.href).toBe('https://www.tmuh.org.tw/');
  });
});
