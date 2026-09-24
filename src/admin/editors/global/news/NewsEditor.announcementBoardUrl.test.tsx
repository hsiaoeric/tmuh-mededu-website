// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANN_URL } from '@/data/news';
import { NewsEditor } from './NewsEditor';
import { collectNewsIssues } from './newsValidation';
import type { NewsPayload } from './newsTypes';
import { newsFixture } from './testFixture';

function Harness() {
  const [payload, setPayload] = useState(newsFixture());
  return (
    <>
      <NewsEditor payload={payload} issues={collectNewsIssues(payload)} onChange={(next) => {
        setPayload(next);
        return { status: 'emitted' };
      }} />
      <output data-testid="payload">{JSON.stringify(payload)}</output>
    </>
  );
}

function serializedPayload(view: ReturnType<typeof render>): NewsPayload {
  return JSON.parse(view.getByTestId('payload').textContent ?? '{}');
}

afterEach(cleanup);

describe('NewsEditor announcement board URL', () => {
  it('shows one shared control with the extracted current value and emits only the root field', () => {
    // Given
    const view = render(<Harness />);
    const controls = view.getAllByRole('textbox', { name: /共用.*公告看板|announcement board URL/i });
    expect(controls[0]).toHaveProperty('value', ANN_URL);

    // When
    fireEvent.change(controls[0], { target: { value: 'https://example.test/shared-board' } });

    // Then
    expect(controls).toHaveLength(1);
    const payload = serializedPayload(view);
    expect(payload.announcementBoardUrl).toBe('https://example.test/shared-board');
    expect(payload.zh).not.toHaveProperty('announcementBoardUrl');
    expect(payload.en).not.toHaveProperty('announcementBoardUrl');
  });

  it('surfaces the root URL issue without corrupting bilingual news fields', () => {
    // Given
    const view = render(<Harness />);
    const control = view.getByRole('textbox', { name: /共用.*公告看板|announcement board URL/i });
    const previousTitle = serializedPayload(view).zh.department[0]?.title;

    // When
    fireEvent.change(control, { target: { value: 'http://example.test/board' } });

    // Then
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(view.getAllByText(/外部連結必須使用 HTTPS|External URL must use HTTPS/).length).toBeGreaterThan(0);
    expect(serializedPayload(view).zh.department[0]?.title).toBe(previousTitle);
  });

  it('consumes the controlled echo once and accepts a later external URL revision', () => {
    // Given
    const source = newsFixture();
    const onChange = vi.fn();
    const renderEditor = (payload: NewsPayload) => (
      <NewsEditor payload={payload} issues={collectNewsIssues(payload)} onChange={onChange} />
    );
    const view = render(renderEditor(source));
    const control = view.getByRole('textbox', { name: /共用.*公告看板|announcement board URL/i });
    fireEvent.change(control, { target: { value: 'https://example.test/emitted' } });
    const emitted = onChange.mock.calls[0]?.[0];
    if (emitted === undefined) throw new TypeError('Expected controlled news URL emission');
    view.rerender(renderEditor(emitted));

    // When
    view.rerender(renderEditor({ ...source, announcementBoardUrl: 'https://example.test/external' }));

    // Then
    expect(view.getByRole('textbox', { name: /共用.*公告看板|announcement board URL/i })).toHaveProperty('value', 'https://example.test/external');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
