// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapStructuredEditorIssues as mapGlobalEditorIssues } from '@/admin/editors/shared';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_PAYLOAD_REGISTRY,
  type CmsPayloadByKind,
} from '@/content/contracts/registry';
import { SiteCopyEditor } from './SiteCopyEditor';

type SiteCopyPayload = CmsPayloadByKind['site_copy'];

const fixtureDocument = snapshot.find((document) => document.kind === 'site_copy');
if (fixtureDocument === undefined) {
  throw new TypeError('Missing site_copy fixture');
}
const fixture: SiteCopyPayload = CMS_PAYLOAD_REGISTRY.site_copy.schema.parse(
  fixtureDocument.payload,
);

function ControlledDriver({ onChange }: {
  readonly onChange: (payload: SiteCopyPayload) => void;
}) {
  const [payload, setPayload] = useState(fixture);
  const updatePayload = (nextPayload: SiteCopyPayload) => {
    setPayload(nextPayload);
    onChange(nextPayload);
  };
  return (
    <SiteCopyEditor
      payload={payload}
      issues={mapGlobalEditorIssues([])}
      onChange={updatePayload}
    />
  );
}

afterEach(cleanup);

describe('site copy editor manual DOM driver', () => {
  it('drives every fixed bilingual control through the controlled surface', () => {
    // Given
    const onChange = vi.fn<(payload: SiteCopyPayload) => void>();
    const view = render(<ControlledDriver onChange={onChange} />);
    const fields = view.getAllByRole('textbox');

    // When
    fields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: `manual-qa-${index}` } });
    });

    // Then
    expect(view.getByRole('region', { name: '全站共用文字' })).toBeTruthy();
    expect(view.getByRole('region', { name: '頁面內嵌文字' })).toBeTruthy();
    expect(view.queryAllByRole('button')).toEqual([]);
    expect(view.getAllByRole('textbox').map((field) => (
      field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
        ? field.value
        : ''
    ))).toEqual(fields.map((_, index) => `manual-qa-${index}`));
    const finalPayload = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(CMS_PAYLOAD_REGISTRY.site_copy.schema.safeParse(finalPayload).success).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(fields.length);
  });
});
