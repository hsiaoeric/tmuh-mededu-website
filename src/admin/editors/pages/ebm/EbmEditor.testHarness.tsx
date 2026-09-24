import { render } from '@testing-library/react';
import { useState } from 'react';
import { createDocumentWorkspace } from '@/admin/documents';
import { document, revision } from '@/admin/workflows/testHarness';
import { SiteProvider } from '@/app/site';
import snapshot from '@/content/generated/cms-snapshot.json';
import { EbmEditor } from './EbmEditor';
import { compactEbmFixture, type EbmPayload } from './EbmEditor.testFixture';

type ControlledEbmEditorProps = {
  readonly initial?: EbmPayload;
  readonly editorText?: string;
};

const SOURCE_PAYLOAD = (() => {
  const source = snapshot.find((candidate) => candidate.kind === 'ebm');
  if (source === undefined) throw new TypeError('Missing EBM snapshot source');
  return source.payload;
})();

export function ControlledEbmEditor({
  initial = compactEbmFixture(),
  editorText = JSON.stringify(initial, null, 2),
}: ControlledEbmEditorProps) {
  const [text, setText] = useState(editorText);
  const base = createDocumentWorkspace({
    document: document('ebm'),
    revisions: [revision({ payload: SOURCE_PAYLOAD })],
  });
  return (
    <SiteProvider>
      <EbmEditor workspace={{ ...base, editorText: text }} onChange={setText} />
      <output data-testid="ebm-editor-text">{text}</output>
    </SiteProvider>
  );
}

export function renderEbmEditor(props: ControlledEbmEditorProps = {}) {
  return render(<ControlledEbmEditor {...props} />);
}
