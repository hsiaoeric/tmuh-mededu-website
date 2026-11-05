import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import type { FieldDecorations } from '@/admin/fieldDecorations';
import { AUDIENCE_OWNER_IDS } from '@/content/contracts/archiveIds';
import type { ArchiveRecordBadge, ArchiveRecordRow } from './ArchiveRecordList';
import type { ArchiveIssues, EditableLocalizedText } from './archiveTypes';
import { audienceOwnerLabel } from './copy';
import { issuesWithin } from './fields';

type RowInput = {
  readonly collection: string;
  readonly index: number;
  readonly title: EditableLocalizedText;
  readonly meta: readonly string[];
  readonly badges?: readonly ArchiveRecordBadge[];
};

/**
 * A collapsed row for an item at `[collection, index]`: its title in the admin's language (the
 * Chinese when English is missing), whether it changed, and how many issues it holds.
 */
export function recordRow(input: RowInput, context: { readonly isZh: boolean; readonly issues: ArchiveIssues; readonly decorations: FieldDecorations | null }): ArchiveRecordRow {
  const english = input.title.en;
  const useChinese = context.isZh || english === undefined;
  const path = [input.collection, input.index];
  return {
    index: input.index,
    title: useChinese ? input.title.zh : english,
    titleLang: useChinese ? 'zh-Hant' : 'en',
    meta: input.meta,
    badges: input.badges,
    changed: context.decorations?.isChanged?.(fieldIdForStructuredEditorIssuePath(path)) === true,
    issueCount: issuesWithin(path, context.issues).length,
  };
}

export function untranslatedBadge(title: EditableLocalizedText, isZh: boolean): readonly ArchiveRecordBadge[] {
  return title.en === undefined && title.zh !== '' ? [{ label: isZh ? '僅中文' : 'Chinese only', status: 'disabled' }] : [];
}

export function audienceOwnerOptions(isZh: boolean) {
  return AUDIENCE_OWNER_IDS.map((owner) => ({ value: owner, label: audienceOwnerLabel(owner, isZh) }));
}

/** Rows sorted by a numeric `order`, then id. */
export function byOrder<T extends { readonly order: number; readonly id: string }>(items: readonly T[]): readonly number[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => left.item.order - right.item.order || left.item.id.localeCompare(right.item.id))
    .map(({ index }) => index);
}

export function nextOrder(items: readonly { readonly order: number }[]): number {
  return items.reduce((highest, item) => Math.max(highest, item.order + 1), 0);
}
