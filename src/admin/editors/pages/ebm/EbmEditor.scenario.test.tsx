// @vitest-environment jsdom
import { cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { renderEbmEditor } from './EbmEditor.testHarness';

afterEach(cleanup);

describe('EBM structured editor scenario', () => {
  it('edits scalar copy and exposes every paired collection family', async () => {
    // Given
    const view = renderEbmEditor();

    // When
    const title = view.getByLabelText('頁面標題（繁體中文）');
    fireEvent.change(title, { target: { value: '修訂後的實證標題' } });

    // Then
    const payload = CMS_PAYLOAD_REGISTRY.ebm.editableSchema.parse(
      JSON.parse(view.getByTestId('ebm-editor-text').textContent ?? '{}'),
    );
    expect(payload.zh.heroTitle).toBe('修訂後的實證標題');
    for (const id of [
      'ebm-kpis',
      'ebm-missions',
      'ebm-awards-lit',
      'ebm-awards-clin',
      'ebm-awards-trans',
      'ebm-stages',
      'ebm-course-groups',
      'ebm-stage-0-items',
      'ebm-course-group-0-rows',
    ]) {
      const collection = view.container.querySelector(`[data-editor-collection="${id}"]`);
      expect(collection, `missing ${id}`).toBeInstanceOf(HTMLElement);
      expect(collection?.querySelector('button')).toBeInstanceOf(HTMLButtonElement);
    }
  });
});
