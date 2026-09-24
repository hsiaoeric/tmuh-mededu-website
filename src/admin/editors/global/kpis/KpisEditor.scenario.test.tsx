// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { mapStructuredEditorIssues as mapGlobalEditorIssues } from '@/admin/editors/shared';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY, type EditableCmsPayloadByKind } from '@/content/contracts/registry';
import { KpisEditor } from './KpisEditor';

type KpisPayload = EditableCmsPayloadByKind['kpis'];

const fixtureDocument = snapshot.find((document) => document.kind === 'kpis');
if (fixtureDocument === undefined) throw new TypeError('Missing kpis fixture');
const fixture: KpisPayload = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(fixtureDocument.payload);

function ScenarioEditor({ initial = fixture }: { readonly initial?: KpisPayload }) {
  const [payload, setPayload] = useState(initial);
  return (
    <>
      <KpisEditor payload={payload} issues={mapGlobalEditorIssues([])} onChange={(next) => {
        setPayload(next);
        return { status: 'emitted' };
      }} />
      <output data-testid="scenario-payload">{JSON.stringify(payload)}</output>
    </>
  );
}

afterEach(cleanup);

describe('KPI editor real DOM scenario', () => {
  it('recovers numeric and color drafts without changing canonical pair order', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<ScenarioEditor />);
    const number = view.getAllByRole('textbox', { name: '繁體中文數值' })[0];
    const color = view.getAllByRole('textbox', { name: '繁體中文色碼' })[0];
    if (number === undefined || color === undefined) throw new TypeError('Missing KPI scenario controls');

    // When
    await user.clear(number);
    await user.type(number, '-');

    // Then
    expect(number.getAttribute('value')).toBe('-');
    expect(number.getAttribute('aria-invalid')).toBe('true');
    expect(JSON.parse(view.getByTestId('scenario-payload').textContent ?? '{}').zh.items[0].num).toBe('-');

    // When
    await user.type(number, '2.5');
    await user.clear(color);
    await user.type(color, '#112233');

    // Then
    const payload = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(
      JSON.parse(view.getByTestId('scenario-payload').textContent ?? '{}'),
    );
    expect(payload.zh.items[0]).toEqual({
      ...fixture.zh.items[0],
      num: -2.5,
      color: '#112233',
    });
    expect(payload.en.items[0]).toEqual(fixture.en.items[0]);
    expect(payload.zh.items[1]).toEqual(fixture.zh.items[1]);
    expect(payload.en.items[1]).toEqual(fixture.en.items[1]);
    expect(view.queryByRole('alert')).toBeNull();
  });

  it('preserves invalid authored drafts while editing another fixed row', async () => {
    // Given
    const user = userEvent.setup();
    const firstZh = fixture.zh.items[0];
    const firstEn = fixture.en.items[0];
    if (firstZh === undefined || firstEn === undefined) throw new TypeError('Missing KPI fixture pair');
    const initial: KpisPayload = {
      ...fixture,
      zh: { items: [{ ...firstZh, num: '1e' }, ...fixture.zh.items.slice(1)] },
      en: { items: [{ ...firstEn, color: '#bad' }, ...fixture.en.items.slice(1)] },
    };
    const view = render(<ScenarioEditor initial={initial} />);
    const panelTitle = view.getAllByRole('textbox', { name: 'English panel title' })[1];
    if (panelTitle === undefined) throw new TypeError('Missing second KPI panel title');

    // When
    await user.clear(panelTitle);
    await user.type(panelTitle, 'Updated attending panel');

    // Then
    const payload = CMS_PAYLOAD_REGISTRY.kpis.editableSchema.parse(
      JSON.parse(view.getByTestId('scenario-payload').textContent ?? '{}'),
    );
    expect(payload.zh.items[0]).toEqual({ ...firstZh, num: '1e' });
    expect(payload.en.items[0]).toEqual({ ...firstEn, color: '#bad' });
    expect(payload.en.items[1]?.panelTitle).toBe('Updated attending panel');
    expect(payload.zh.items.map((item) => item.id)).toEqual([
      'department_advisors',
      'teaching_attendings',
      'teaching_allied_health',
      'education_centers',
    ]);
    expect(view.queryByRole('button', { name: /上移第|下移第|刪除第|新增 KPI/u })).toBeNull();
    expect(CMS_PAYLOAD_REGISTRY.kpis.schema.safeParse(payload).success).toBe(false);
  });
});
