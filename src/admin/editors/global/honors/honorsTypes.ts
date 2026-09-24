import type { CmsPayloadByKind } from '@/content/contracts/registry';
import type { PairedCollectionResult } from '../pairedCollections';

export type HonorsPayload = CmsPayloadByKind['honors'];
export type HonorsLocale = HonorsPayload['zh'];
export type SnqProject = HonorsLocale['snqProjects'][number];
export type SnqMember = SnqProject['members'][number];
export type SnqYearCount = HonorsLocale['snqYearCounts'][number];
export type Nhqa = HonorsLocale['nhqa'];
export type LocaleKey = 'zh' | 'en';

export type LocalizedText = {
  readonly locale: LocaleKey;
  readonly value: string;
};

export function pairedCollection<Row>(result: PairedCollectionResult<Row>) {
  if (!result.ok) throw new TypeError(`Paired honors operation failed: ${result.reason}`);
  return result.collection;
}
