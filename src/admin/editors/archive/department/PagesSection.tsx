import { useMemo } from 'react';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { useFieldDecorations } from '@/admin/fieldDecorations';
import { DEPARTMENT_PAGE_SECTIONS } from '@/content/contracts/archiveIds';
import { ArchiveRecordList } from '../ArchiveRecordList';
import type { ArchiveCommit, ArchiveCommitResult, ArchiveIssues, EditableDepartmentInfoPayload, EditableDepartmentPage } from '../archiveTypes';
import { BlockListEditor } from '../blocks/BlockListEditor';
import { removeAt } from '../blocks/blockModel';
import { NOUNS, ownerLabel, sectionLabel } from '../copy';
import { DateField, FieldGrid, IdField, OrderField, SelectField, useIsZh } from '../fields';
import type { IdLock } from '../lockedIds';
import { LocalizedTextField } from '../LocalizedTextField';
import { withOptional } from '../localizedValue';
import { ArchiveMediaField } from '../media/ArchiveMediaField';
import { audienceOwnerOptions, recordRow, untranslatedBadge } from '../recordRows';
import { createPage, programsReferencingPage, renamePage } from './departmentModel';

type PagesSectionProps = {
  readonly payload: EditableDepartmentInfoPayload;
  readonly issues: ArchiveIssues;
  readonly onChange: ArchiveCommit<EditableDepartmentInfoPayload>;
  readonly lock: IdLock;
  readonly showNewBadge: boolean;
  readonly expanded: number | null;
  readonly onExpandedChange: (index: number | null) => void;
};

const NO_OWNER = '';

function PageFields({ index, page, otherIds, idLocked, issues, onChange }: {
  readonly index: number;
  readonly page: EditableDepartmentPage;
  readonly otherIds: readonly string[];
  readonly idLocked: boolean;
  readonly issues: ArchiveIssues;
  readonly onChange: (page: EditableDepartmentPage) => ArchiveCommitResult;
}) {
  const isZh = useIsZh();
  const path = ['pages', index] as const;
  return (
    <div className="admin-stack" data-page-id={page.id}>
      <FieldGrid>
        <IdField path={[...path, 'id']} issues={issues} label={isZh ? '頁面識別碼' : 'Page id'} value={page.id} locked={idLocked} others={otherIds} onChange={(id) => onChange({ ...page, id })} />
        <SelectField
          path={[...path, 'section']}
          issues={issues}
          label={isZh ? '頁面類別' : 'Section'}
          value={page.section}
          options={DEPARTMENT_PAGE_SECTIONS.map((section) => ({ value: section, label: sectionLabel(section, isZh) }))}
          onChange={(section) => onChange({ ...page, section })}
        />
        <SelectField
          path={[...path, 'owner']}
          issues={issues}
          label={isZh ? '所屬單位' : 'Owner'}
          helper={page.section === 'program' ? (isZh ? '計畫頁面請選擇所屬訓練計畫。' : 'For a program page, choose its trainee program.') : undefined}
          value={page.owner ?? NO_OWNER}
          options={[{ value: NO_OWNER, label: isZh ? '（未指定）' : '(None)' }, ...audienceOwnerOptions(isZh)]}
          onChange={(owner) => onChange(withOptional(page, 'owner', owner === NO_OWNER ? undefined : owner))}
        />
        <OrderField path={[...path, 'order']} issues={issues} label={isZh ? '順序' : 'Order'} value={page.order} onChange={(order) => onChange({ ...page, order })} />
        <DateField path={[...path, 'updatedOn']} issues={issues} label={isZh ? '更新日期（選填）' : 'Updated on (optional)'} value={page.updatedOn} onChange={(updatedOn) => onChange(withOptional(page, 'updatedOn', updatedOn))} />
      </FieldGrid>
      <LocalizedTextField path={[...path, 'title']} label={{ zh: '標題', en: 'Title' }} required value={page.title} issues={issues} onChange={(title) => onChange({ ...page, title: title ?? { zh: '' } })} />
      <LocalizedTextField path={[...path, 'subtitle']} label={{ zh: '副標題（選填）', en: 'Subtitle (optional)' }} optional value={page.subtitle} issues={issues} onChange={(subtitle) => onChange(withOptional(page, 'subtitle', subtitle))} />
      <LocalizedTextField path={[...path, 'summary']} label={{ zh: '摘要（選填）', en: 'Summary (optional)' }} optional multiline value={page.summary} issues={issues} onChange={(summary) => onChange(withOptional(page, 'summary', summary))} />
      <ArchiveMediaField
        slot={{ slotKind: 'page-portrait', path: [...path, 'portrait'], reference: page.portrait ?? null, required: false }}
        label={isZh ? '人物照片（選填）' : 'Portrait (optional)'}
        altText={page.title.zh}
        issues={issues}
        onChange={(portrait) => onChange(withOptional(page, 'portrait', portrait ?? undefined))}
      />
      <BlockListEditor path={[...path, 'body']} label={{ zh: '內文', en: 'Body' }} value={page.body} issues={issues} imageSlotKind="page-block-image" onChange={(body) => onChange({ ...page, body })} />
    </div>
  );
}

/** Undated pages: leadership messages, faculty, committees, program pages. */
export function PagesSection({ payload, issues, onChange, lock, showNewBadge, expanded, onExpandedChange }: PagesSectionProps) {
  const isZh = useIsZh();
  const decorations = useFieldDecorations();
  const rows = useMemo(() => [...payload.pages.keys()]
    .sort((left, right) => {
      const a = payload.pages[left]!;
      const b = payload.pages[right]!;
      return DEPARTMENT_PAGE_SECTIONS.indexOf(a.section as never) - DEPARTMENT_PAGE_SECTIONS.indexOf(b.section as never) || a.order - b.order || a.id.localeCompare(b.id);
    })
    .map((index) => {
      const page = payload.pages[index]!;
      return recordRow({
        collection: 'pages',
        index,
        title: page.title,
        meta: [sectionLabel(page.section, isZh), ...(page.owner === undefined || page.owner === 'department' ? [] : [ownerLabel(page.owner, isZh)])],
        badges: [
          ...untranslatedBadge(page.title, isZh),
          ...(showNewBadge && !lock.isLocked(page.id) ? [{ label: isZh ? '新頁面' : 'New', status: 'success' as const }] : []),
        ],
      }, { isZh, issues, decorations });
    }), [decorations, isZh, issues, lock, payload.pages, showNewBadge]);

  return (
    <EditorSection
      id="department-pages"
      title={isZh ? '教學部頁面' : 'Department pages'}
      description={isZh ? '主管的話、師資、委員會與學員專區計畫頁面。' : 'Leadership messages, faculty, committees, and trainee program pages.'}
    >
      <ArchiveRecordList
        id="department-pages-list"
        title={isZh ? '頁面清單' : 'All pages'}
        rows={rows}
        totalCount={payload.pages.length}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        itemNoun={isZh ? NOUNS.page.zh : NOUNS.page.en}
        emptyTitle={isZh ? '尚無頁面' : 'No pages yet'}
        emptyDescription={isZh ? '新增第一個頁面。' : 'Add the first page.'}
        addLabel={isZh ? '新增頁面' : 'Add page'}
        onAdd={() => {
          const page = createPage(payload);
          const result = onChange({ ...payload, pages: [...payload.pages, page] });
          if (result.status !== 'emitted') return null;
          lock.markCreated(page.id);
          return payload.pages.length;
        }}
        removal={{
          title: (row) => (isZh ? `刪除頁面「${row.title || '未命名'}」？` : `Delete page “${row.title || 'Untitled'}”?`),
          description: (row) => {
            const page = payload.pages[row.index];
            const referencing = page === undefined ? [] : programsReferencingPage(payload.programs, page.id);
            if (referencing.length > 0) {
              return isZh
                ? `學員專區計畫 ${referencing.map((program) => program.id).join('、')} 引用這個頁面，刪除後請在計畫中改選其他頁面。`
                : `Trainee program ${referencing.map((program) => program.id).join(', ')} uses this page; choose another page there after deleting.`;
            }
            return page !== undefined && lock.isLocked(page.id)
              ? (isZh ? '這個頁面已發布或有舊網站連結轉址到它；刪除並發布後，這些連結會顯示找不到頁面。' : 'This page is published or a legacy link redirects to it; once deleted and published, those links show “not found”.')
              : (isZh ? '這個頁面尚未發布。' : 'This page is not published yet.');
          },
          onRemove: (index) => onChange({ ...payload, pages: removeAt(payload.pages, index) }),
        }}
        renderItem={(index) => {
          const page = payload.pages[index];
          if (page === undefined) return null;
          return (
            <PageFields
              index={index}
              page={page}
              otherIds={payload.pages.flatMap((candidate, position) => (position === index ? [] : [candidate.id]))}
              idLocked={lock.isLocked(page.id)}
              issues={issues}
              onChange={(next) => {
                if (next.id !== page.id) lock.markCreated(next.id);
                return onChange(renamePage(payload, index, next));
              }}
            />
          );
        }}
      />
    </EditorSection>
  );
}
