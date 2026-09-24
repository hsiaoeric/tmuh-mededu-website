import type {
  PublishedContent,
  PublishedContentBatch,
  PublishedContentRepository,
} from '../../src/content/domain';
import committedSnapshot from '../../src/content/generated/cms-snapshot.json';
import { parsePublishedContentRows } from '../../src/content/parsers';

export function checkpointContent(): readonly PublishedContent[] {
  return parsePublishedContentRows(structuredClone(committedSnapshot));
}

export function checkpointBatch(
  content: readonly PublishedContent[] = checkpointContent(),
): PublishedContentBatch {
  return { content, failures: [] };
}

export function checkpointRepository(
  batch: PublishedContentBatch = checkpointBatch(),
): PublishedContentRepository {
  return { listPublished: () => Promise.resolve(batch) };
}

export function requireContent(
  content: readonly PublishedContent[],
  index: number,
): PublishedContent {
  const value = content[index];
  if (value === undefined) throw new TypeError(`Missing checkpoint fixture at index ${index}`);
  return value;
}
