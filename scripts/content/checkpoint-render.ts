import {
  CMS_DOCUMENT_KINDS,
  CMS_DOCUMENT_STABLE_KEYS,
  type PublishedContent,
  type PublishedContentBatch,
} from '../../src/content/domain';
import { comparePublishedContent } from '../../src/content/order';
import { parsePublishedContentRows } from '../../src/content/parsers';
import { stableStringify } from './json';

type CheckpointValidationReason =
  | 'row-failure'
  | 'wrong-count'
  | 'duplicate-identity'
  | 'unexpected-identity'
  | 'missing-identity';

export class CheckpointValidationError extends Error {
  readonly name = 'CheckpointValidationError';

  constructor(readonly reasons: readonly CheckpointValidationReason[], message: string) {
    super(message);
  }
}

const EXPECTED_IDENTITIES = new Set(
  CMS_DOCUMENT_KINDS.map((kind) => `${kind}:${CMS_DOCUMENT_STABLE_KEYS[kind]}`),
);

function validateCompleteBatch(batch: PublishedContentBatch): void {
  const reasons: CheckpointValidationReason[] = [];
  const details: string[] = [];
  if (batch.failures.length > 0) {
    reasons.push('row-failure');
    details.push(`contained ${batch.failures.length} row failure(s)`);
  }
  if (batch.content.length !== CMS_DOCUMENT_KINDS.length) {
    reasons.push('wrong-count');
    details.push(`must contain exactly ${CMS_DOCUMENT_KINDS.length} rows`);
  }

  const seen = new Set<string>();
  for (const content of batch.content) {
    const identity = `${content.kind}:${content.stableKey}`;
    if (!EXPECTED_IDENTITIES.has(identity)) {
      reasons.push('unexpected-identity');
      details.push(`contained unexpected identity ${identity}`);
    }
    if (seen.has(identity)) {
      reasons.push('duplicate-identity');
      details.push(`contained duplicate identity ${identity}`);
    }
    seen.add(identity);
  }

  for (const identity of EXPECTED_IDENTITIES) {
    if (!seen.has(identity)) {
      reasons.push('missing-identity');
      details.push(`omitted required identity ${identity}`);
    }
  }
  if (reasons.length > 0) {
    throw new CheckpointValidationError(
      [...new Set(reasons)],
      `Published CMS response ${details.join('; ')}`,
    );
  }
}

function snapshotRow(content: PublishedContent) {
  return {
    document_id: content.documentId,
    kind: content.kind,
    stable_key: content.stableKey,
    revision_id: content.revisionId,
    version: content.version,
    payload: content.payload,
    published_at: content.publishedAt,
  };
}

export function renderCheckpointSnapshot(batch: PublishedContentBatch): string {
  validateCompleteBatch(batch);
  const ordered = [...batch.content].sort(comparePublishedContent);
  const validated = parsePublishedContentRows(ordered.map(snapshotRow));
  return stableStringify(validated.map(snapshotRow));
}
