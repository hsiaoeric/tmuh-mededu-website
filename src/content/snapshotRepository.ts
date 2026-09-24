import type { ContentSnapshotRepository } from './domain';
import committedSnapshot from './generated/cms-snapshot.json';
import { comparePublishedContent } from './order';
import { parsePublishedContentRows } from './parsers';

export function createSnapshotRepository(input: unknown): ContentSnapshotRepository {
  const content = [...parsePublishedContentRows(input)].sort(comparePublishedContent);
  return { listPublished: () => content };
}

export const committedSnapshotRepository = createSnapshotRepository(
  committedSnapshot,
);
