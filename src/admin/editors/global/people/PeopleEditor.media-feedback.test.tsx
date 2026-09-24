// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapStructuredEditorIssues as mapGlobalEditorIssues } from '@/admin/editors/shared';
import { SiteProvider } from '@/app/site';
import { buildDraftMediaReference } from '@/content/media';
import { PeopleEditor } from './PeopleEditor';
import {
  compactFixture,
  FULL_FIXTURE,
  type PeoplePayload,
} from './PeopleEditor.testHarness';

afterEach(cleanup);

describe('people editor portrait and feedback behavior', () => {
  it('shows local, public, draft, and absent portrait states with initials fallback and no media controls', () => {
    // Given / When
    const view = render(<SiteProvider><PeopleEditor payload={compactFixture()} issues={[]} onChange={vi.fn()} /></SiteProvider>);

    // Then
    expect(view.getAllByText('本機照片').length).toBeGreaterThan(0);
    expect(view.getAllByText('公開照片').length).toBeGreaterThan(0);
    expect(view.getAllByText('草稿照片').length).toBeGreaterThan(0);
    expect(view.getAllByText('尚未連結照片').length).toBeGreaterThan(0);
    expect(view.getAllByText('MC').length).toBeGreaterThan(0);
    expect(view.queryByRole('button', { name: /照片|portrait|upload|unlink/u })).toBeNull();
    expect(view.container.querySelector('input[type="file"]')).toBeNull();
  });

  it('rerenders an external media payload and retains it through the next structured edit', () => {
    // Given
    const onChange = vi.fn((_payload: PeoplePayload) => ({ status: 'emitted' } as const));
    const initial = compactFixture();
    const view = render(<SiteProvider><PeopleEditor payload={initial} issues={[]} onChange={onChange} /></SiteProvider>);
    const portrait = buildDraftMediaReference({ ownerId: '22222222-2222-4222-8222-222222222222', sha256: 'c'.repeat(64), mediaType: 'image/jpeg' });
    const person = initial.en.holisticAiTeam[0];
    if (person === undefined) throw new TypeError('Missing AI team fixture');
    const mediaPayload = { ...initial, en: { ...initial.en, holisticAiTeam: [{ ...person, portrait }] } };

    // When
    view.rerender(<SiteProvider><PeopleEditor payload={mediaPayload} issues={[]} onChange={onChange} /></SiteProvider>);
    const list = view.container.querySelector('[data-editor-collection="holistic-ai-team"]');
    const item = list?.querySelector('[data-editor-item-index="0"]');
    if (!(item instanceof HTMLElement)) throw new TypeError('Missing AI team row');
    fireEvent.change(within(item).getByRole('textbox', { name: 'English duty' }), { target: { value: 'Updated after media' } });

    // Then
    const emitted = onChange.mock.lastCall?.[0];
    expect(emitted?.en.holisticAiTeam[0]?.portrait).toEqual(portrait);
    expect(emitted?.en.holisticAiTeam[0]?.duty).toBe('Updated after media');
  });

  it('reports duplicate center IDs, locale parity, and people-row parity', () => {
    // Given
    const fixture = compactFixture();
    const duplicate = fixture.zh.centerPeople[0];
    const extraPerson = fixture.zh.centerPeople[0]?.people[0];
    if (duplicate === undefined || extraPerson === undefined) throw new TypeError('Missing group fixture');
    const invalidShape: PeoplePayload = {
      ...fixture,
      zh: { ...fixture.zh, centerPeople: [duplicate, duplicate] },
      en: { ...fixture.en, centerPeople: [{ ...duplicate, centerId: 'different', people: [extraPerson, extraPerson] }] },
    };

    // When
    const view = render(<SiteProvider><PeopleEditor payload={invalidShape} issues={mapGlobalEditorIssues([])} onChange={vi.fn()} /></SiteProvider>);

    // Then
    expect(view.getByText('中心識別碼重複：faculty_dev')).toBeTruthy();
    expect(view.getByText('中英文中心群組的識別碼與順序必須一致。')).toBeTruthy();
    expect(view.getByText('中心 faculty_dev 的中英文人員數量不一致。')).toBeTruthy();
  });

  it('renders actionable empty states and does not emit during a lossless full-fixture render', () => {
    // Given
    const empty: PeoplePayload = {
      zh: { centerPeople: [], holisticInstructors: [], holisticSeedTeachers: [], holisticAiTeam: [], memberGroups: [] },
      en: { centerPeople: [], holisticInstructors: [], holisticSeedTeachers: [], holisticAiTeam: [], memberGroups: [] },
    };
    const onChange = vi.fn((_payload: PeoplePayload) => ({ status: 'emitted' } as const));

    // When
    const emptyView = render(<SiteProvider><PeopleEditor payload={empty} issues={[]} onChange={onChange} /></SiteProvider>);

    // Then
    expect(emptyView.getByRole('heading', { name: '尚無中心群組' })).toBeTruthy();
    expect(emptyView.getAllByRole('heading', { name: '尚無人員' })).toHaveLength(3);
    emptyView.unmount();
    render(<SiteProvider><PeopleEditor payload={FULL_FIXTURE} issues={[]} onChange={onChange} /></SiteProvider>);
    expect(onChange).not.toHaveBeenCalled();
  });
});
