// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const BASE_BRANCH: Branch = { id: 'about', name: 'About', description: '' };
const BASE_CENTER: Center = {
  id: 'center', name: 'Center', intro: '', contact: '', ext: '', branches: [BASE_BRANCH],
};

function summaries(payload: Payload) {
  const result = CentersPayloadSchema.safeParse(payload);
  if (result.success) return [];
  return mapGlobalEditorIssues(result.error.issues.map((issue) => ({ path: issue.path, message: issue.message })));
}

function renderPayload(payload: Payload) {
  return render(<CentersEditor payload={payload} issues={summaries(payload)} onChange={() => ({ status: 'unchanged' })} />);
}

afterEach(cleanup);

describe('centers editor validation feedback', () => {
  it('wires duplicate center and branch identifiers to the exact duplicate fields', () => {
    // Given
    const duplicateCenter = { ...BASE_CENTER, branches: [BASE_BRANCH, BASE_BRANCH] };
    const locale = { centers: [duplicateCenter, duplicateCenter] };

    // When
    renderPayload({ zh: locale, en: locale });

    // Then
    expect(document.getElementById(fieldIdForIssuePath(['zh', 'centers', 1, 'id']))?.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(fieldIdForIssuePath(['zh', 'centers', 0, 'branches', 1, 'id']))?.getAttribute('aria-invalid')).toBe('true');
  });

  it('links center and branch order parity feedback to focusable collection boundaries', async () => {
    // Given
    const user = userEvent.setup();
    const zh = { centers: [
      { ...BASE_CENTER, branches: [BASE_BRANCH, { ...BASE_BRANCH, id: 'contact' }] },
      { ...BASE_CENTER, id: 'second' },
    ] };
    const en = { centers: [
      { ...BASE_CENTER, branches: [{ ...BASE_BRANCH, id: 'contact' }, BASE_BRANCH] },
      { ...BASE_CENTER, id: 'other' },
    ] };
    const view = renderPayload({ zh, en });

    // When
    await user.click(view.getByRole('button', { name: '移至第一個錯誤' }));

    // Then
    await waitFor(() => expect(document.activeElement).toBe(document.getElementById(fieldIdForIssuePath(['en', 'centers']))));
    expect(view.container.querySelector(`a[href="#${fieldIdForIssuePath(['en', 'centers', 0, 'branches'])}"]`)).toBeTruthy();
  });

  it('exposes unmatched center and branch rows instead of hiding localized content', () => {
    // Given
    const zh = { centers: [
      { ...BASE_CENTER, branches: [BASE_BRANCH, { ...BASE_BRANCH, id: 'contact' }] },
      { ...BASE_CENTER, id: 'second' },
    ] };
    const en = { centers: [BASE_CENTER] };

    // When
    const view = renderPayload({ zh, en });

    // Then
    expect(view.getByRole('heading', { name: '中英文分支資料未配對' })).toBeTruthy();
    expect(view.getByRole('heading', { name: '中英文中心資料未配對' })).toBeTruthy();
  });

  it.each([
    'http://unsafe.example/path',
    'https://user:secret@example.test/path',
    'not a url',
  ])('shows invalid HTTP, credentialed, or malformed URL feedback at the localized URL field: %s', (externalUrl) => {
    // Given
    const payload: Payload = {
      zh: { centers: [{ ...BASE_CENTER, externalUrl }] },
      en: { centers: [BASE_CENTER] },
    };

    // When
    renderPayload(payload);

    // Then
    expect(document.getElementById(fieldIdForIssuePath(['zh', 'centers', 0, 'externalUrl']))?.getAttribute('aria-invalid')).toBe('true');
  });

});
