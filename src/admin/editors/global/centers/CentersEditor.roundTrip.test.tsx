// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath } from '@/admin/editors/shared';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CentersPayloadSchema } from '@/content/contracts/centers';
import type { CmsPayloadByKind } from '@/content/contracts/registry';
import { CentersEditor } from './CentersEditor';

type Payload = CmsPayloadByKind['centers'];

function fixture(): Payload {
  const document = snapshot.find((candidate) => candidate.kind === 'centers');
  if (document === undefined) throw new TypeError('Missing centers fixture');
  return CentersPayloadSchema.parse(document.payload);
}

afterEach(cleanup);

describe('centers editor lossless projection', () => {
  it('does not expose locally owned center and branch presentation controls', () => {
    // Given / When
    const view = render(<CentersEditor payload={fixture()} issues={[]} onChange={() => ({ status: 'unchanged' })} />);

    // Then
    expect(view.queryByLabelText(/中心代表色|圖示識別碼|專頁錨點|首頁面板區段/)).toBeNull();
    expect(view.queryByRole('button', { name: /上移第 1 個分支|下移第 1 個分支/ })).toBeNull();
  });

  it('round-trips the complete generated fixture without emitting or adding persisted keys', () => {
    // Given
    const payload = fixture();
    const before = JSON.stringify(payload);
    const onChange = vi.fn();

    // When
    render(<CentersEditor payload={payload} issues={[]} onChange={onChange} />);

    // Then
    expect(onChange).not.toHaveBeenCalled();
    expect(JSON.stringify(payload)).toBe(before);
    expect(before).not.toContain('_key');
  });

  it('keeps absent center and branch optionals absent while editing an unrelated sibling field', () => {
    // Given
    const payload = fixture();
    const onChange = vi.fn((_payload: Payload) => ({ status: 'emitted' } as const));
    render(<CentersEditor payload={payload} issues={[]} onChange={onChange} />);
    const input = document.getElementById(fieldIdForIssuePath(['zh', 'centers', 0, 'name']));
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Missing center name input');

    // When
    fireEvent.change(input, { target: { value: '更新名稱' } });

    // Then
    const next = onChange.mock.lastCall?.[0];
    expect(next).toBeDefined();
    if (next === undefined) return;
    expect('externalUrl' in (next.zh.centers[0] ?? {})).toBe(false);
    expect('deep' in (next.zh.centers[0] ?? {})).toBe(false);
    expect('pageSection' in (next.zh.centers[1]?.branches[0] ?? {})).toBe(false);
    expect(next.en).toEqual(payload.en);
  });

  it('adds optional values only when their own controls are edited and preserves dead-data anchors verbatim', () => {
    // Given
    const payload = fixture();
    const onChange = vi.fn((_payload: Payload) => ({ status: 'emitted' } as const));
    const view = render(<CentersEditor payload={payload} issues={[]} onChange={onChange} />);
    const url = document.getElementById(fieldIdForIssuePath(['zh', 'centers', 0, 'externalUrl']));
    const deep = document.getElementById(fieldIdForIssuePath(['zh', 'centers', 0, 'deep']));
    if (!(url instanceof HTMLInputElement) || !(deep instanceof HTMLInputElement)) throw new TypeError('Missing optional controls');

    // When
    fireEvent.change(url, { target: { value: 'https://example.test/center' } });
    view.rerender(<CentersEditor payload={onChange.mock.lastCall?.[0] ?? payload} issues={[]} onChange={onChange} />);
    fireEvent.click(deep);

    // Then
    const next = onChange.mock.lastCall?.[0];
    expect(next?.zh.centers[0]?.externalUrl).toBe('https://example.test/center');
    expect(next?.zh.centers[0]?.deep).toBe(true);
  });
});
