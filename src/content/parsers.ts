import { z } from 'zod';
import {
  CMS_DOCUMENT_STABLE_KEYS,
  CmsDocumentIdSchema,
  CmsDocumentKindSchema,
  CmsRevisionIdSchema,
  type ContentIdentity,
  type PublishedContent,
  type PublishedContentBatch,
  type PublishedContentRowFailureReason,
} from './domain';
import { ContentBoundaryError } from './errors';
import {
  publishedContentFromRow,
  safeParsePublishedContentRow,
  safeParsePublishedContentRows,
} from './contracts/published';

export function parsePublishedContentRows(input: unknown): readonly PublishedContent[] {
  const result = safeParsePublishedContentRows(input);
  if (!result.success) throw new ContentBoundaryError(result.error);
  return result.data;
}

const UnknownRowsSchema = z.array(z.unknown());
const IdentityFieldsSchema = z.object({
  kind: CmsDocumentKindSchema,
  stable_key: z.string(),
});
const DocumentIdFieldSchema = z.object({ document_id: CmsDocumentIdSchema });
const RevisionIdFieldSchema = z.object({ revision_id: CmsRevisionIdSchema });

type RowCandidate = {
  readonly index: number;
  readonly input: unknown;
  readonly identity: ContentIdentity | null;
  readonly documentId: string | null;
  readonly revisionId: string | null;
  readonly parsed: ReturnType<typeof safeParsePublishedContentRow>;
};

function assertNever(value: never): never {
  throw new TypeError(`Unexpected CMS document kind: ${String(value)}`);
}

function identityFrom(input: unknown): ContentIdentity | null {
  const result = IdentityFieldsSchema.safeParse(input);
  if (!result.success) return null;
  const stableKey = CMS_DOCUMENT_STABLE_KEYS[result.data.kind];
  if (result.data.stable_key !== stableKey) return null;
  switch (result.data.kind) {
    case 'site_copy': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.site_copy };
    case 'centers': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.centers };
    case 'people': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.people };
    case 'news': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.news };
    case 'activities': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.activities };
    case 'kpis': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.kpis };
    case 'honors': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.honors };
    case 'digital_materials': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.digital_materials };
    case 'facdev': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.facdev };
    case 'ebm': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.ebm };
    case 'holistic': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.holistic };
    case 'holistic_research': return { kind: result.data.kind, stableKey: CMS_DOCUMENT_STABLE_KEYS.holistic_research };
    default: return assertNever(result.data.kind);
  }
}

function candidate(input: unknown, index: number): RowCandidate {
  const documentId = DocumentIdFieldSchema.safeParse(input);
  const revisionId = RevisionIdFieldSchema.safeParse(input);
  return {
    index,
    input,
    identity: identityFrom(input),
    documentId: documentId.success ? documentId.data.document_id : null,
    revisionId: revisionId.success ? revisionId.data.revision_id : null,
    parsed: safeParsePublishedContentRow(input),
  };
}

function duplicateIndexes(
  rows: readonly RowCandidate[],
  value: (row: RowCandidate) => string | null,
): ReadonlySet<number> {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const key = value(row);
    if (key === null) continue;
    const indexes = groups.get(key) ?? [];
    indexes.push(row.index);
    groups.set(key, indexes);
  }
  return new Set([...groups.values()].filter((indexes) => indexes.length > 1).flat());
}

function duplicateReasons(
  row: RowCandidate,
  duplicates: Readonly<Record<PublishedContentRowFailureReason, ReadonlySet<number>>>,
): readonly PublishedContentRowFailureReason[] {
  const entries = [
    ['duplicate-identity', duplicates['duplicate-identity']],
    ['duplicate-document-id', duplicates['duplicate-document-id']],
    ['duplicate-revision-id', duplicates['duplicate-revision-id']],
  ] as const;
  return entries
    .filter(([, indexes]) => indexes.has(row.index))
    .map(([reason]) => reason);
}

export function parsePublishedContentBatch(input: unknown): PublishedContentBatch {
  const rowsResult = UnknownRowsSchema.safeParse(input);
  if (!rowsResult.success) throw new ContentBoundaryError(rowsResult.error);
  const rows = rowsResult.data.map(candidate);
  const duplicates = {
    'duplicate-identity': duplicateIndexes(rows, (row) => row.identity === null ? null : `${row.identity.kind}:${row.identity.stableKey}`),
    'duplicate-document-id': duplicateIndexes(rows, (row) => row.documentId),
    'duplicate-revision-id': duplicateIndexes(rows, (row) => row.revisionId),
    'invalid-row': new Set<number>(),
  } satisfies Readonly<Record<PublishedContentRowFailureReason, ReadonlySet<number>>>;
  const content: PublishedContent[] = [];
  const failures = rows.flatMap((row) => {
    const reasons: PublishedContentRowFailureReason[] = [
      ...(row.parsed.success ? [] : ['invalid-row'] as const),
      ...duplicateReasons(row, duplicates),
    ];
    if (reasons.length === 0 && row.parsed.success) {
      content.push(publishedContentFromRow(row.parsed.data));
      return [];
    }
    const validationError = row.parsed.success
      ? new z.ZodError([{ code: 'custom', path: [row.index], message: reasons.join(', '), input: row.input }])
      : row.parsed.error;
    return [{
      index: row.index,
      identity: row.identity,
      reasons,
      error: new ContentBoundaryError(validationError),
    }];
  });
  return { content, failures };
}
