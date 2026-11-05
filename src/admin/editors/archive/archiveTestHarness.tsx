import { render } from '@testing-library/react';
import { useState, type ComponentType } from 'react';
import { mapStructuredEditorIssues } from '@/admin/editors/shared';
import { EditorDensityProvider } from '@/admin/editors/global/ui/EditorDensity';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import snapshot from '@/content/generated/cms-snapshot.json';
import type { ArchiveEditorKind, ArchiveEditorProps } from './archiveTypes';
import type { ArchivePayloadByKind } from './media/archiveMediaSlots';

/** The committed snapshot's payload for an archive kind, parsed as the editor receives it. */
export function snapshotPayload<K extends ArchiveEditorKind>(kind: K): ArchivePayloadByKind[K] {
  const document = snapshot.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} snapshot`);
  return CMS_PAYLOAD_REGISTRY[kind].editableSchema.parse(document.payload) as unknown as ArchivePayloadByKind[K];
}

/** Issues the published-grade schema reports, mapped the way the structured frame maps them. */
export function issuesFor(kind: ArchiveEditorKind, payload: unknown, isZh = true) {
  const result = CMS_PAYLOAD_REGISTRY[kind].schema.safeParse(payload);
  return mapStructuredEditorIssues(result.success ? [] : result.error.issues.map((issue) => ({ path: issue.path, message: issue.message, code: issue.code })), isZh);
}

/**
 * Renders an archive editor as the workspace does: controlled by its payload, re-validated after
 * every accepted change. `latest()` returns the most recent payload.
 */
export function renderArchiveEditor<K extends ArchiveEditorKind>(
  kind: K,
  Editor: ComponentType<ArchiveEditorProps<ArchivePayloadByKind[K]>>,
  initial: ArchivePayloadByKind[K],
  options: Omit<ArchiveEditorProps<ArchivePayloadByKind[K]>, 'payload' | 'issues' | 'onChange'> & { readonly isZh?: boolean } = {},
) {
  const history: ArchivePayloadByKind[K][] = [];
  const { isZh = true, ...editorProps } = options;
  function Harness() {
    const [payload, setPayload] = useState(initial);
    return (
      <EditorDensityProvider collapseItemsByDefault isZh={isZh}>
        <Editor
          {...editorProps}
          payload={payload}
          issues={issuesFor(kind, payload, isZh)}
          onChange={(next) => {
            if (JSON.stringify(next) === JSON.stringify(payload)) return { status: 'unchanged' };
            history.push(next);
            setPayload(next);
            return { status: 'emitted' };
          }}
        />
      </EditorDensityProvider>
    );
  }
  const view = render(<Harness />);
  return { ...view, history, latest: () => history.slice(-1)[0] ?? initial };
}
