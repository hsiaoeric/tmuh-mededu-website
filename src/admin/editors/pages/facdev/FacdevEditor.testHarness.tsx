import { render } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { vi, type Mock } from 'vitest';
import { SiteProvider } from '@/app/site';
import { createDocumentWorkspace, type DocumentWorkspace } from '@/admin/documents';
import { document, revision } from '@/admin/workflows/testHarness';
import { CMS_PAYLOAD_REGISTRY, type EditableCmsPayloadByKind } from '@/content/contracts/registry';
import snapshot from '@/content/generated/cms-snapshot.json';
import { FacdevDocumentEditor } from './FacdevDocumentEditor';

export type FacdevPayload = EditableCmsPayloadByKind['facdev'];

export function facdevPayload(): FacdevPayload {
  const source = snapshot.find((candidate) => candidate.kind === 'facdev');
  if (source === undefined) throw new TypeError('Missing facdev fixture');
  return CMS_PAYLOAD_REGISTRY.facdev.editableSchema.parse(source.payload);
}

export function facdevEditorText(payload = facdevPayload()): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function facdevWorkspace(editorText: string): DocumentWorkspace {
  return {
    ...createDocumentWorkspace({
      document: document('facdev'),
      revisions: [revision({ payload: JSON.parse(editorText) })],
    }),
    editorText,
  };
}

function ControlledEditor({ initialText, onEmission }: {
  readonly initialText: string;
  readonly onEmission: Mock<(editorText: string) => void>;
}): ReactElement {
  const [editorText, setEditorText] = useState(initialText);
  const onChange = (next: string): void => {
    onEmission(next);
    setEditorText(next);
  };
  return <FacdevDocumentEditor workspace={facdevWorkspace(editorText)} onChange={onChange} />;
}

export function renderControlledFacdev(payload = facdevPayload()) {
  const onEmission = vi.fn<(editorText: string) => void>();
  return {
    onEmission,
    view: render(
      <SiteProvider>
        <ControlledEditor initialText={facdevEditorText(payload)} onEmission={onEmission} />
      </SiteProvider>,
    ),
  };
}

export function emittedPayload(onEmission: Mock<(editorText: string) => void>): FacdevPayload {
  const call = onEmission.mock.calls[onEmission.mock.calls.length - 1];
  const editorText = call?.[0];
  if (editorText === undefined) throw new TypeError('Expected facdev editor emission');
  return CMS_PAYLOAD_REGISTRY.facdev.editableSchema.parse(JSON.parse(editorText));
}
