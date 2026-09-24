import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY, type EditableCmsPayloadByKind } from '@/content/contracts/registry';

export function newsFixture(): EditableCmsPayloadByKind['news'] {
  const row = snapshot.find((candidate) => candidate.kind === 'news');
  if (row === undefined) throw new TypeError('Missing news fixture');
  return CMS_PAYLOAD_REGISTRY.news.editableSchema.parse(structuredClone(row.payload));
}
