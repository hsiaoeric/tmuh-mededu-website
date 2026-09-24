// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';
import { ActivitiesEditor } from './ActivitiesEditor';

type ActivitiesPayload = EditableCmsPayloadByKind['activities'];
type Activity = ActivitiesPayload['zh']['department'][number];

const ActivityDraftSchema = z.strictObject({
  id: z.string(), sortDate: z.string(),
  cat: z.string(), date: z.string(), enrolled: z.string(), link: z.string(),
  place: z.string(), speaker: z.string(), status: z.string(), title: z.string(), topic: z.string(),
});
const ActivityScopeDraftSchema = z.strictObject({
  department: z.array(ActivityDraftSchema),
  holistic: z.array(ActivityDraftSchema),
});
const ActivitiesDraftPayloadSchema = z.strictObject({
  zh: ActivityScopeDraftSchema,
  en: ActivityScopeDraftSchema,
});

function activity(id: string, title: string, date: string, link = ''): Activity {
  return {
    id, sortDate: '2026-07-22',
    cat: '課程', date, enrolled: '0 人', link, place: '會議室', speaker: '講者',
    status: '報名中', title, topic: '主題',
  };
}

function fixture(): ActivitiesPayload {
  return {
    zh: {
      department: [
        activity('department-a', '教學部甲', '2026/07/22（三）12:30–13:30'),
        activity('department-b', '教學部乙', '2026/07/23（四）14:00–15:00'),
      ],
      holistic: [activity('holistic-a', '全人甲', '2026/07/24（五）10:00–11:00')],
    },
    en: {
      department: [
        activity('department-a', 'Department A', 'Wed 2026/07/22 12:30–13:30'),
        activity('department-b', 'Department B', 'Thu 2026/07/23 14:00–15:00'),
      ],
      holistic: [activity('holistic-a', 'Holistic A', 'Fri 2026/07/24 10:00–11:00')],
    },
  };
}

function Harness({ initial = fixture(), onChange = vi.fn() }: {
  readonly initial?: ActivitiesPayload;
  readonly onChange?: (payload: ActivitiesPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <>
      <ActivitiesEditor payload={payload} onPayloadChange={(next) => {
        setPayload(next);
        onChange(next);
        return { status: 'emitted' };
      }} />
      <output data-testid="payload">{JSON.stringify(payload)}</output>
    </>
  );
}

afterEach(cleanup);

describe('activities editor', () => {
  it('renders both scopes and every scalar field in Chinese-first pairs without emitting on mount', () => {
    // Given
    const onChange = vi.fn();

    // When
    const view = render(<Harness onChange={onChange} />);

    // Then
    expect(view.getByRole('heading', { name: '教學部活動' })).toBeTruthy();
    expect(view.getByRole('heading', { name: '全人照護活動' })).toBeTruthy();
    expect(view.getAllByRole('textbox')).toHaveLength(54);
    expect(view.getAllByRole('textbox').slice(2, 4).map((field) => field.closest('[lang]')?.getAttribute('lang'))).toEqual(['zh-Hant', 'en']);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('adds, reorders, and deletes rows as inseparable positional pairs', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<Harness />);

    // When
    await user.click(view.getByRole('button', { name: '下移教學部活動第 1 項' }));
    await user.click(view.getByRole('button', { name: '新增教學部活動' }));
    await user.click(view.getByRole('button', { name: '刪除教學部活動第 2 項' }));
    await user.click(view.getByRole('button', { name: '確認刪除' }));

    // Then
    const payload = ActivitiesDraftPayloadSchema.parse(JSON.parse(view.getByTestId('payload').textContent ?? '{}'));
    expect(payload.zh.department.map((row) => row.title)).toEqual(['教學部乙', '']);
    expect(payload.zh.department.map((row) => row.id)).toEqual(['department-b', 'new-activity-1']);
    expect(payload.en.department.map((row) => row.title)).toEqual(['Department B', '']);
    expect(payload.zh.holistic[0]?.title).toBe('全人甲');
    expect(payload.en.holistic[0]?.title).toBe('Holistic A');
    expect(payload.zh.department[1]?.id).toBe('new-activity-1');
    expect(payload.en.department[1]?.id).toBe('new-activity-1');
    expect(Object.keys(payload.zh.department[1] ?? {})).not.toContain('scope');
    expect(payload.zh.department[1]?.sortDate).toBe('1970-01-01');
  });

  it('preserves authored invalid text and shows localized date and link feedback', () => {
    // Given
    const view = render(<Harness />);
    const zhDate = view.getAllByRole('textbox', { name: '日期與時間（繁體中文）' })[0];
    const sharedLink = view.getAllByRole('textbox', { name: /共用報名連結/ })[0];
    if (zhDate === undefined || sharedLink === undefined) throw new TypeError('Expected activity fields');

    // When
    fireEvent.change(zhDate, { target: { value: '2026/02/30（一）13:30–12:30' } });
    fireEvent.change(sharedLink, { target: { value: 'http://example.test/course' } });

    // Then
    expect(zhDate.getAttribute('value')).toBe('2026/02/30（一）13:30–12:30');
    expect(view.getAllByText(/日期與時間格式/)).toHaveLength(2);
    expect(view.getAllByText(/HTTPS.*credentials.*whitespace/i)).toHaveLength(1);
    const payload = ActivitiesDraftPayloadSchema.parse(JSON.parse(view.getByTestId('payload').textContent ?? '{}'));
    expect(payload.zh.department[0]?.date).toBe('2026/02/30（一）13:30–12:30');
    expect(payload.zh.department[0]?.link).toBe('http://example.test/course');
    expect(payload.en.department[0]?.link).toBe('http://example.test/course');
  });

  it('renders independent actionable empty states for both scopes', async () => {
    // Given
    const user = userEvent.setup();
    const empty: ActivitiesPayload = { zh: { department: [], holistic: [] }, en: { department: [], holistic: [] } };
    const view = render(<Harness initial={empty} />);

    // When
    await user.click(view.getByRole('button', { name: '新增全人照護活動' }));

    // Then
    expect(view.getByRole('heading', { name: '尚無教學部活動' })).toBeTruthy();
    await waitFor(() => expect(view.getAllByRole('textbox')).toHaveLength(18));
    const payload = ActivitiesDraftPayloadSchema.parse(JSON.parse(view.getByTestId('payload').textContent ?? '{}'));
    expect(payload.zh.department).toEqual([]);
    expect(payload.en.department).toEqual([]);
    expect(payload.zh.holistic).toHaveLength(1);
    expect(payload.en.holistic).toHaveLength(1);
  });

  it('updates one scalar without changing untouched rows, locales, or sibling scope', () => {
    // Given
    const initial = fixture();
    const view = render(<Harness initial={initial} />);
    const title = view.getAllByRole('textbox', { name: '活動名稱（繁體中文）' })[0];
    if (title === undefined) throw new TypeError('Expected title field');

    // When
    fireEvent.change(title, { target: { value: '  保留前後空白  ' } });

    // Then
    const payload = ActivitiesDraftPayloadSchema.parse(JSON.parse(view.getByTestId('payload').textContent ?? '{}'));
    expect(payload.zh.department[0]?.title).toBe('  保留前後空白  ');
    expect(payload.zh.department.map((row) => row.id)).toEqual(initial.zh.department.map((row) => row.id));
    expect(payload.en.department.map((row) => row.id)).toEqual(initial.en.department.map((row) => row.id));
    expect(payload.zh.department[1]).toEqual(initial.zh.department[1]);
    expect(payload.en).toEqual(initial.en);
    expect(payload.zh.holistic).toEqual(initial.zh.holistic);
  });
});
