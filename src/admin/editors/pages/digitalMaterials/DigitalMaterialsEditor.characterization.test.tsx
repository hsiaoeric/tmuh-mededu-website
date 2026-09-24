// @vitest-environment jsdom

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  emitStructuredEditorText,
  useStructuredEditorModel,
} from '@/admin/editors/shared';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_PAYLOAD_REGISTRY,
  type EditableCmsPayloadByKind,
} from '@/content/contracts/registry';

type DigitalMaterialsPayload = EditableCmsPayloadByKind['digital_materials'];

const fixtureDocument = snapshot.find((document) => document.kind === 'digital_materials');
if (fixtureDocument === undefined) throw new TypeError('Missing digital_materials fixture');

const fixture: DigitalMaterialsPayload = CMS_PAYLOAD_REGISTRY.digital_materials.schema.parse(
  fixtureDocument.payload,
);

afterEach(cleanup);

describe('digital materials editor baseline', () => {
  it('characterizes the exact canonical bilingual payload', () => {
    // Given / When
    const canonical = CMS_PAYLOAD_REGISTRY.digital_materials.schema.parse(fixtureDocument.payload);

    // Then
    expect(canonical).toEqual({
      zh: {
        eyebrow: 'Digital Learning Materials',
        title: '數位教材室',
        status: '網頁建置中',
        body: '本頁內容仍在彙整中，完成後將於此發布。',
        backLabel: '返回教學部',
      },
      en: {
        eyebrow: 'Digital Learning Materials',
        title: 'Digital Learning Materials Studio',
        status: 'Page under construction',
        body: 'The content of this page is still being gathered and will be published here once ready.',
        backLabel: 'Back to the department',
      },
    });
    expect(emitStructuredEditorText('digital_materials', canonical)).toBe(
      JSON.stringify(canonical, null, 2),
    );
  });

  it('emits no editor text while the shared model renders the canonical payload', () => {
    // Given
    const onEditorTextChange = vi.fn<(editorText: string) => void>();
    const editorText = emitStructuredEditorText('digital_materials', fixture);

    // When
    const model = renderHook(() => useStructuredEditorModel({
      kind: 'digital_materials',
      editorText,
      onEditorTextChange,
    }));

    // Then
    expect(model.result.current.status).toBe('valid');
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });
});
