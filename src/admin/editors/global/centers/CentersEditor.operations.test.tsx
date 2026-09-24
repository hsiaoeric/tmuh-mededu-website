// @vitest-environment jsdom
import { cleanup, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath,
  mapStructuredEditorIssues as mapGlobalEditorIssues,
} from '@/admin/editors/shared';
import { CentersPayloadSchema } from '@/content/contracts/centers';
import type { CmsPayloadByKind } from '@/content/contracts/registry';
import { CentersEditor } from './CentersEditor';

type Payload = CmsPayloadByKind['centers'];
type Center = Payload['zh']['centers'][number];
type Branch = Center['branches'][number];

function branch(id: string, name: string): Branch {
  return { id, name, description: `${name} description` };
}

function center(id: string, name: string, branches: readonly Branch[] = []): Center {
  return { id, name, intro: `${name} intro`, contact: `${name} contact`, ext: '1234', branches };
}

function paired(zh: readonly Center[], en: readonly Center[]): Payload {
  return { zh: { centers: zh }, en: { centers: en } };
}

function issuesFor(payload: Payload) {
  const result = CentersPayloadSchema.safeParse(payload);
  return result.success ? [] : mapGlobalEditorIssues(result.error.issues.map((issue) => ({ path: issue.path, message: issue.message })));
}

function Harness({ initial }: { readonly initial: Payload }) {
  const [payload, setPayload] = useState(initial);
  return (
    <>
      <CentersEditor payload={payload} issues={issuesFor(payload)} onChange={(next) => {
        setPayload(next);
        return { status: 'emitted' };
      }} />
      <output data-testid="payload">{JSON.stringify(payload)}</output>
    </>
  );
}

function currentPayload(view: ReturnType<typeof render>): Payload {
  return JSON.parse(view.getByTestId('payload').textContent ?? '{}');
}

function collection(view: ReturnType<typeof render>, id: string): HTMLElement {
  const element = view.container.querySelector<HTMLElement>(`[data-editor-collection="${id}"]`);
  if (element === null) throw new TypeError(`Missing ${id} collection`);
  return element;
}

afterEach(cleanup);

describe('centers editor paired collections', () => {
  it('adds a center to both locales from an actionable empty root and focuses its identity', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<Harness initial={paired([], [])} />);

    // When
    await user.click(view.getByRole('button', { name: '新增中心' }));

    // Then
    const payload = currentPayload(view);
    expect(payload.zh.centers).toHaveLength(1);
    expect(payload.en.centers).toHaveLength(1);
    expect(Object.keys(payload.zh.centers[0] ?? {})).toEqual(['id', 'name', 'intro', 'contact', 'ext', 'branches']);
    await waitFor(() => expect(document.activeElement).toBe(view.getByRole('textbox', { name: /Shared center ID, center 1/ })));
  });

  it('focuses the added center identity instead of a nested branch with the same index', async () => {
    // Given
    const user = userEvent.setup();
    const branches = [branch('first', '一'), branch('second', '二'), branch('third', '三')];
    const view = render(<Harness initial={paired(
      [center('a', '甲', branches)],
      [center('a', 'A', branches)],
    )} />);

    // When
    await user.click(view.getByRole('button', { name: '新增中心' }));

    // Then
    await waitFor(() => expect(document.activeElement).toBe(
      document.getElementById(fieldIdForIssuePath(['zh', 'centers', 1, 'id'])),
    ));
  });

  it('does not expose center reordering when public order is locally owned', () => {
    // Given
    const initial = paired(
      [center('a', '甲'), center('b', '乙')],
      [center('a', 'A'), center('b', 'B')],
    );

    // When
    const view = render(<Harness initial={initial} />);
    const centers = within(collection(view, 'centers'));

    // Then
    expect(centers.queryAllByRole('button', { name: /上移第 \d+ 個中心|下移第 \d+ 個中心/ })).toHaveLength(0);
  });

  it('deletes the same center from both locales after confirmation', async () => {
    // Given
    const user = userEvent.setup();
    const initial = paired(
      [center('a', '甲'), center('b', '乙')],
      [center('a', 'A'), center('b', 'B')],
    );
    const view = render(<Harness initial={initial} />);

    // When
    await user.click(within(collection(view, 'centers')).getByRole('button', { name: '刪除第 1 個中心' }));
    await user.click(view.getByRole('button', { name: '確認刪除中心' }));

    // Then
    expect(currentPayload(view)).toEqual(paired([center('b', '乙')], [center('b', 'B')]));
  });

  it('adds branches atomically while preserving sibling centers and local order', async () => {
    // Given
    const user = userEvent.setup();
    const untouchedZh = center('b', '乙', [branch('only', '保留')]);
    const untouchedEn = center('b', 'B', [branch('only', 'Keep')]);
    const initial = paired(
      [center('a', '甲', [branch('first', '一'), branch('second', '二')]), untouchedZh],
      [center('a', 'A', [branch('first', 'One'), branch('second', 'Two')]), untouchedEn],
    );
    const view = render(<Harness initial={initial} />);
    const branches = collection(view, 'center-0-branches');

    // When
    await user.click(within(branches).getByRole('button', { name: '新增分支' }));

    // Then
    const payload = currentPayload(view);
    expect(payload.zh.centers[0]?.branches.map((item) => item.id)).toEqual(['first', 'second', '']);
    expect(payload.en.centers[0]?.branches.map((item) => item.id)).toEqual(['first', 'second', '']);
    expect(within(branches).queryByRole('button', { name: '下移第 1 個分支' })).toBeNull();
    expect(payload.zh.centers[1]).toEqual(untouchedZh);
    expect(payload.en.centers[1]).toEqual(untouchedEn);
  });

  it('deletes paired branches and exposes a nested actionable empty state', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<Harness initial={paired(
      [center('a', '甲', [branch('only', '唯一')])],
      [center('a', 'A', [branch('only', 'Only')])],
    )} />);
    const branches = collection(view, 'center-0-branches');

    // When
    await user.click(within(branches).getByRole('button', { name: '刪除第 1 個分支' }));
    await user.click(view.getByRole('button', { name: '確認刪除分支' }));

    // Then
    expect(currentPayload(view).zh.centers[0]?.branches).toEqual([]);
    expect(currentPayload(view).en.centers[0]?.branches).toEqual([]);
    expect(within(branches).getByRole('button', { name: '新增分支' })).toBeTruthy();
  });
});
