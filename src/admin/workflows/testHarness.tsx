import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AdminProtectedAccessProvider } from '@/admin/auth';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { CMS_DOCUMENT_STABLE_KEYS } from '@/content/contracts/kinds';
import { CmsDocumentIdSchema, CmsRevisionIdSchema } from '@/content/contracts/primitives';
import { ANN_URL } from '@/data/news';
import type {
  AdminDocumentRepository,
  CmsAdminDocument,
  CmsAdminDocumentDetail,
  CmsAdminRevision,
  CloneRevisionInput,
  RepositoryResult,
  RevisionMutationInput,
  SaveDraftInput,
} from '@/admin/repository';
import type { DocumentWorkspaceController } from './useDocumentWorkspace';
import { useDocumentWorkspace } from './useDocumentWorkspace';

export type Deferred<Value> = {
  readonly promise: Promise<Value>;
  readonly resolve: (value: Value) => void;
};

export function deferred<Value>(): Deferred<Value> {
  let resolvePromise: (value: Value) => void = () => undefined;
  const promise = new Promise<Value>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

export const DOCUMENT_ID = CmsDocumentIdSchema.parse('11111111-1111-4111-8111-111111111111');
export const REVISION_ID = CmsRevisionIdSchema.parse('22222222-2222-4222-8222-222222222222');

export function document(kind: CmsDocumentKind = 'news'): CmsAdminDocument {
  return {
    id: DOCUMENT_ID,
    kind,
    stableKey: CMS_DOCUMENT_STABLE_KEYS[kind],
    createdAt: '2026-08-22T01:00:00Z',
    createdBy: null,
    updatedAt: '2026-08-22T02:00:00Z',
    updatedBy: null,
  };
}

export function revision(
  overrides: Partial<CmsAdminRevision> = {},
): CmsAdminRevision {
  return {
    id: REVISION_ID,
    documentId: DOCUMENT_ID,
    version: 3,
    editVersion: 2,
    status: 'draft',
    payload: {
      announcementBoardUrl: ANN_URL,
      zh: {
        department: [{ id: 'notice', publishedOn: '2026-08-22', category: 'department', pinned: false, tag: '公告', title: '公告', lines: [] }],
        holistic: [],
      },
      en: {
        department: [{ id: 'notice', publishedOn: '2026-08-22', category: 'department', pinned: false, tag: 'News', title: 'News', lines: [] }],
        holistic: [],
      },
    },
    createdAt: '2026-08-22T01:00:00Z',
    createdBy: null,
    updatedAt: '2026-08-22T02:00:00Z',
    updatedBy: null,
    publishedAt: null,
    publishedBy: null,
    archivedAt: null,
    archivedBy: null,
    publicationExpectedEditVersion: null,
    publicationReplacements: null,
    publicationActorId: null,
    ...overrides,
  };
}

export function detail(kind: CmsDocumentKind = 'news'): CmsAdminDocumentDetail {
  return { document: document(kind), revisions: [revision()] };
}

class MissingFakeResultError extends Error {
  readonly name = 'MissingFakeResultError';
  constructor(operation: string) {
    super(`Missing fake repository result for ${operation}`);
  }
}

function next<Value>(queue: Promise<RepositoryResult<Value>>[], operation: string) {
  const result = queue.shift();
  if (result === undefined) throw new MissingFakeResultError(operation);
  return result;
}

export class FakeDocumentRepository implements AdminDocumentRepository {
  readonly listResults: Promise<RepositoryResult<readonly CmsAdminDocument[]>>[] = [];
  readonly readResults: Promise<RepositoryResult<CmsAdminDocumentDetail>>[] = [];
  readonly cloneResults: Promise<RepositoryResult<CmsAdminRevision>>[] = [];
  readonly saveResults: Promise<RepositoryResult<CmsAdminRevision>>[] = [];
  readonly publishResults: Promise<RepositoryResult<CmsAdminRevision>>[] = [];
  readonly archiveResults: Promise<RepositoryResult<CmsAdminRevision>>[] = [];
  readonly listSignals: (AbortSignal | undefined)[] = [];
  readonly readSignals: (AbortSignal | undefined)[] = [];
  readonly mutationSignals: (AbortSignal | undefined)[] = [];
  readonly cloneCalls: CloneRevisionInput[] = [];
  readonly saveCalls: SaveDraftInput[] = [];
  readonly publishCalls: RevisionMutationInput[] = [];
  readonly archiveCalls: RevisionMutationInput[] = [];

  listDocuments(signal?: AbortSignal) {
    this.listSignals.push(signal);
    return next(this.listResults, 'listDocuments');
  }

  readDocument(_documentId: typeof DOCUMENT_ID, signal?: AbortSignal) {
    this.readSignals.push(signal);
    return next(this.readResults, 'readDocument');
  }

  clone(input: CloneRevisionInput, signal?: AbortSignal) {
    this.cloneCalls.push(input);
    this.mutationSignals.push(signal);
    return next(this.cloneResults, 'clone');
  }

  save(input: SaveDraftInput, signal?: AbortSignal) {
    this.saveCalls.push(input);
    this.mutationSignals.push(signal);
    return next(this.saveResults, 'save');
  }

  publish(input: RevisionMutationInput, signal?: AbortSignal) {
    this.publishCalls.push(input);
    this.mutationSignals.push(signal);
    return next(this.publishResults, 'publish');
  }

  archive(input: RevisionMutationInput, signal?: AbortSignal) {
    this.archiveCalls.push(input);
    this.mutationSignals.push(signal);
    return next(this.archiveResults, 'archive');
  }
}

function Probe({
  repository,
  kind,
  values,
}: {
  readonly repository: AdminDocumentRepository;
  readonly kind: CmsDocumentKind;
  readonly values: DocumentWorkspaceController[];
}) {
  values.push(useDocumentWorkspace({ repository, kind }));
  return null;
}

export function renderWorkspace(
  repository: AdminDocumentRepository,
  kind: CmsDocumentKind = 'news',
  mutationsAllowed = true,
): {
  readonly view: RenderResult;
  readonly current: () => DocumentWorkspaceController;
  readonly rerender: (nextKind: CmsDocumentKind, nextMutationsAllowed?: boolean) => void;
} {
  const values: DocumentWorkspaceController[] = [];
  const content = (nextKind: CmsDocumentKind, nextMutationsAllowed: boolean): ReactNode => (
    <AdminProtectedAccessProvider mutationsAllowed={nextMutationsAllowed}>
      <Probe repository={repository} kind={nextKind} values={values} />
    </AdminProtectedAccessProvider>
  );
  const view = render(content(kind, mutationsAllowed));
  return {
    view,
    rerender: (nextKind, nextMutationsAllowed = mutationsAllowed) => {
      view.rerender(content(nextKind, nextMutationsAllowed));
    },
    current: () => {
      const value = values[values.length - 1];
      if (value === undefined) throw new TypeError('Workspace probe has not rendered');
      return value;
    },
  };
}
