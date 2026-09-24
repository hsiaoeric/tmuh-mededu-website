// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import { FacdevEditor } from './FacdevEditor';
import {
  emittedPayload,
  facdevPayload,
  renderControlledFacdev,
} from './FacdevEditor.testHarness';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('FacdevEditor paired collections', () => {
  it('assigns a shared unique identity to each new bilingual group lead', () => {
    // Given
    const { view, onEmission } = renderControlledFacdev(facdevPayload());
    const groups = view.container.querySelector('[data-editor-collection="groups"]');
    if (!(groups instanceof HTMLElement)) throw new TypeError('Expected groups collection');
    const groupView = within(groups);

    // When
    fireEvent.click(groupView.getByRole('button', { name: '新增培育小組' }));
    fireEvent.click(groupView.getByRole('button', { name: '新增培育小組' }));

    // Then
    const next = emittedPayload(onEmission);
    const zhIds = next.zh.groups.map((group) => group.lead.id);
    const enIds = next.en.groups.map((group) => group.lead.id);
    expect(zhIds).toEqual(enIds);
    expect(new Set(zhIds).size).toBe(zhIds.length);
  });

  it('adds rows atomically across locales', () => {
    // Given
    const original = facdevPayload();
    const { view, onEmission } = renderControlledFacdev(original);
    const kpis = view.container.querySelector('[data-editor-collection="kpis"]');
    if (!(kpis instanceof HTMLElement)) throw new TypeError('Expected KPI collection');

    // When
    fireEvent.click(within(kpis).getByRole('button', { name: '新增 KPI' }));

    // Then
    const afterAdd = emittedPayload(onEmission);
    expect(afterAdd.zh.kpis).toHaveLength(original.zh.kpis.length + 1);
    expect(afterAdd.en.kpis).toHaveLength(original.en.kpis.length + 1);
  });

  it('moves rows atomically across locales', () => {
    // Given
    const original = facdevPayload();
    const { view, onEmission } = renderControlledFacdev(original);
    const kpis = view.container.querySelector('[data-editor-collection="kpis"]');
    if (!(kpis instanceof HTMLElement)) throw new TypeError('Expected KPI collection');

    // When
    fireEvent.click(within(kpis).getByRole('button', { name: '上移第 2 個 KPI' }));

    // Then
    const afterMove = emittedPayload(onEmission);
    expect(afterMove.zh.kpis[0]).toEqual(original.zh.kpis[1]);
    expect(afterMove.en.kpis[0]).toEqual(original.en.kpis[1]);
    expect(view.getByText(/已將第 2 個 KPI 移至第 1 個/)).toBeTruthy();
  });

  it('removes rows atomically across locales', () => {
    // Given
    const original = facdevPayload();
    const { view, onEmission } = renderControlledFacdev(original);
    const services = view.container.querySelector('[data-editor-collection="services"]');
    if (!(services instanceof HTMLElement)) throw new TypeError('Expected services collection');

    // When
    fireEvent.click(within(services).getByRole('button', { name: '刪除第 1 個核心服務' }));
    fireEvent.click(within(view.getByRole('dialog')).getByRole('button', { name: '確認刪除' }));

    // Then
    const afterRemove = emittedPayload(onEmission);
    expect(afterRemove.zh.services).toHaveLength(original.zh.services.length - 1);
    expect(afterRemove.en.services).toHaveLength(original.en.services.length - 1);
  });

  it('refuses a removal confirmation after collection revision changes', () => {
    // Given
    const payload = facdevPayload();
    const onChange = vi.fn<() => StructuredEditorCommitResult>(() => ({ status: 'emitted' }));
    const view = render(
      <SiteProvider>
        <FacdevEditor payload={payload} issues={[]} onChange={onChange} />
      </SiteProvider>,
    );
    const groups = view.container.querySelector('[data-editor-collection="groups"]');
    if (!(groups instanceof HTMLElement)) throw new TypeError('Expected groups collection');
    fireEvent.click(within(groups).getByRole('button', { name: '刪除第 1 個培育小組' }));
    const revised = {
      ...payload,
      zh: { ...payload.zh, groups: [...payload.zh.groups] },
      en: { ...payload.en, groups: [...payload.en.groups] },
    };
    view.rerender(
      <SiteProvider>
        <FacdevEditor payload={revised} issues={[]} onChange={onChange} />
      </SiteProvider>,
    );

    // When
    fireEvent.click(within(view.getByRole('dialog')).getByRole('button', { name: '確認刪除' }));

    // Then
    expect(onChange).not.toHaveBeenCalled();
    expect(view.queryByRole('dialog')).toBeNull();
  });

  it.each(['unchanged', 'stale'] as const)(
    'does not announce or move focus for a %s collection commit',
    async (status) => {
      // Given
      const user = userEvent.setup();
      const payload = facdevPayload();
      const onChange = vi.fn<() => StructuredEditorCommitResult>(() => ({ status }));
      const view = render(
        <SiteProvider>
          <FacdevEditor payload={payload} issues={[]} onChange={onChange} />
        </SiteProvider>,
      );
      const collection = view.container.querySelector('[data-editor-collection="services"]');
      if (!(collection instanceof HTMLElement)) throw new TypeError('Expected services collection');
      const move = within(collection).getByRole('button', { name: '下移第 1 個核心服務' });

      // When
      await user.click(move);

      // Then
      expect(document.activeElement).toBe(move);
      expect(collection.querySelector('[aria-live]')?.textContent).toBe('');
    },
  );
});
