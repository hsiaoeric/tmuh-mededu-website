import { useState } from 'react';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY, type CmsPayloadByKind } from '@/content/contracts/registry';
import { HonorsEditor } from './HonorsEditor';

export type HonorsPayload = CmsPayloadByKind['honors'];

export function honorsFixture(): HonorsPayload {
  const document = snapshot.find((candidate) => candidate.kind === 'honors');
  if (document === undefined) throw new TypeError('Missing honors fixture');
  return CMS_PAYLOAD_REGISTRY.honors.schema.parse(document.payload);
}

export function HonorsEditorHarness({ initial = honorsFixture() }: { readonly initial?: HonorsPayload }) {
  const [editorText, setEditorText] = useState(() => JSON.stringify(initial, null, 2));
  return (
    <>
      <HonorsEditor editorText={editorText} onEditorTextChange={setEditorText} />
      <output data-testid="honors-editor-text">{editorText}</output>
    </>
  );
}

export function readHarnessPayload(element: HTMLElement): HonorsPayload {
  return CMS_PAYLOAD_REGISTRY.honors.schema.parse(JSON.parse(element.textContent ?? '{}'));
}
