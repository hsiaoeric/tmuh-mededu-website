// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewsEditor } from './NewsEditor';
import { collectNewsIssues } from './newsValidation';
import type { NewsPayload } from './newsTypes';
import { newsFixture } from './testFixture';

function Harness({ initialPayload = newsFixture() }: { readonly initialPayload?: NewsPayload }) {
  const [payload, setPayload] = useState(initialPayload);
  return (
    <>
      <NewsEditor payload={payload} issues={collectNewsIssues(payload)} onChange={(next) => {
        setPayload(next);
        return { status: 'emitted' };
      }} />
      <output data-testid="serialized">{JSON.stringify(payload)}</output>
    </>
  );
}

function payload(view: ReturnType<typeof render>): NewsPayload {
  return JSON.parse(view.getByTestId('serialized').textContent ?? '{}');
}

afterEach(cleanup);

describe('NewsEditor', () => {
  it('mounts semantic source content without an implicit change', () => {
    // Given
    const source = newsFixture();
    const onChange = vi.fn();

    // When
    const view = render(<NewsEditor payload={source} issues={[]} onChange={onChange} />);

    // Then
    expect(view.getByRole('heading', { name: '公告與消息' })).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('synchronizes canonical dates without exposing immutable IDs', () => {
    // Given
    const view = render(<Harness />);
    const department = within(view.getByRole('region', { name: '教學部公告' }));
    const originalId = payload(view).zh.department[0]?.id;

    // When
    fireEvent.change(department.getByRole('textbox', { name: '公告日期，第 1 則公告' }), { target: { value: '2026-12-31' } });

    // Then
    expect(payload(view).zh.department[0]).toMatchObject({ id: originalId, publishedOn: '2026-12-31' });
    expect(payload(view).en.department[0]).toMatchObject({ id: originalId, publishedOn: '2026-12-31' });
    expect(view.queryByDisplayValue(originalId ?? '')).toBeNull();
  });

  it('synchronizes pinning across locales', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<Harness />);
    const department = within(view.getByRole('region', { name: '教學部公告' }));
    const initialPinned = payload(view).zh.department[0]?.pinned;

    // When
    await user.click(department.getByRole('switch', { name: /^第 1 則公告置頂/ }));

    // Then
    expect(payload(view).zh.department[0]?.pinned).toBe(!initialPinned);
    expect(payload(view).en.department[0]?.pinned).toBe(!initialPinned);
  });

  it('assigns deterministic shared IDs and canonical dates to added announcements', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<Harness />);
    const department = within(view.getByRole('region', { name: '教學部公告' }));
    const originalIds = payload(view).zh.department.map((row) => row.id);

    // When
    await user.click(department.getByRole('button', { name: '下移第 1 則公告' }));
    await user.click(department.getByRole('button', { name: '新增公告' }));

    // Then
    // Standalone payloads prove uniqueness and bilingual identity; hidden editor operations prove preservation, not cross-revision rename history.
    expect(payload(view).zh.department.slice(0, -1).map((row) => row.id)).toEqual([...originalIds].reverse());
    expect(payload(view).zh.department[payload(view).zh.department.length - 1]).toMatchObject({ id: 'new-announcement-1', publishedOn: '1970-01-01' });
    expect(payload(view).en.department[payload(view).en.department.length - 1]).toMatchObject({ id: 'new-announcement-1', publishedOn: '1970-01-01' });
  });

  it('keeps invalid canonical dates editable with publication feedback', () => {
    // Given
    const view = render(<Harness />);
    const department = within(view.getByRole('region', { name: '教學部公告' }));
    const date = department.getByRole('textbox', { name: '公告日期，第 1 則公告' });

    // When
    fireEvent.change(date, { target: { value: '2026-02-30' } });

    // Then
    expect(payload(view).zh.department[0]?.publishedOn).toBe('2026-02-30');
    expect(payload(view).en.department[0]?.publishedOn).toBe('2026-02-30');
    expect(date.getAttribute('aria-invalid')).toBe('true');
  });

  it('renders actionable empty states for both scopes', () => {
    // Given
    const source = newsFixture();
    const empty = { ...source, zh: { ...source.zh, department: [], holistic: [] }, en: { ...source.en, department: [], holistic: [] } };

    // When
    const view = render(<Harness initialPayload={empty} />);

    // Then
    expect(view.getAllByRole('heading', { name: '尚無公告' })).toHaveLength(2);
    expect(view.getAllByRole('button', { name: '新增公告' })).toHaveLength(2);
  });
});
