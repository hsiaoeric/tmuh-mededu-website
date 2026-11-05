import { useMemo } from 'react';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { useFieldDecorations } from '@/admin/fieldDecorations';
import { ArchiveRecordList } from '../ArchiveRecordList';
import type { ArchiveCommit, ArchiveCommitResult, ArchiveIssues, EditableDepartmentInfoPayload, EditableProgram } from '../archiveTypes';
import { replaceAt } from '../blocks/blockModel';
import { NOUNS } from '../copy';
import { FieldGrid, OrderField, SelectField, useIsZh } from '../fields';
import { LocalizedTextField } from '../LocalizedTextField';
import { withOptional } from '../localizedValue';
import { ArchiveMediaField } from '../media/ArchiveMediaField';
import { byOrder, recordRow, untranslatedBadge } from '../recordRows';
import { PROGRAM_PAGE_FIELDS, programPageOptions, type ProgramPageField } from './departmentModel';

type ProgramsSectionProps = {
  readonly payload: EditableDepartmentInfoPayload;
  readonly issues: ArchiveIssues;
  readonly onChange: ArchiveCommit<EditableDepartmentInfoPayload>;
  readonly expanded: number | null;
  readonly onExpandedChange: (index: number | null) => void;
};

const NO_PAGE = '';

const PAGE_FIELD_LABELS: Readonly<Record<ProgramPageField, { readonly zh: string; readonly en: string }>> = {
  introPageId: { zh: '計畫介紹頁', en: 'Introduction page' },
  outcomesPageId: { zh: '訓練成果頁', en: 'Outcomes page' },
  schedulePageId: { zh: '訓練計畫與排程頁', en: 'Plan and schedule page' },
};

function ProgramFields({ index, program, payload, issues, onChange }: {
  readonly index: number;
  readonly program: EditableProgram;
  readonly payload: EditableDepartmentInfoPayload;
  readonly issues: ArchiveIssues;
  readonly onChange: (program: EditableProgram) => ArchiveCommitResult;
}) {
  const isZh = useIsZh();
  const path = ['programs', index] as const;
  const pages = programPageOptions(payload.pages, program);
  return (
    <div className="admin-stack" data-program-id={program.id}>
      <p className="admin-field-message"><span className="mono">{program.id}</span>{isZh ? ' · 識別碼固定，對應學員專區網址。' : ' · Fixed id, used in the trainee page URL.'}</p>
      <LocalizedTextField path={[...path, 'title']} label={{ zh: '計畫名稱', en: 'Program name' }} required value={program.title} issues={issues} onChange={(title) => onChange({ ...program, title: title ?? { zh: '' } })} />
      <LocalizedTextField path={[...path, 'summary']} label={{ zh: '簡介', en: 'Summary' }} required multiline value={program.summary} issues={issues} onChange={(summary) => onChange({ ...program, summary: summary ?? { zh: '' } })} />
      <FieldGrid>
        <OrderField path={[...path, 'order']} issues={issues} label={isZh ? '順序' : 'Order'} value={program.order} onChange={(order) => onChange({ ...program, order })} />
        {PROGRAM_PAGE_FIELDS.map((field) => (
          <SelectField
            key={field}
            path={[...path, field]}
            issues={issues}
            label={isZh ? PAGE_FIELD_LABELS[field].zh : PAGE_FIELD_LABELS[field].en}
            helper={pages.length === 0 ? (isZh ? '尚無這個計畫的頁面。請先新增類別為「學員專區計畫」、所屬單位為此計畫的頁面。' : 'No pages for this program yet. Add a page in the trainee program section owned by this program first.') : undefined}
            value={program[field] ?? NO_PAGE}
            options={[
              { value: NO_PAGE, label: isZh ? '（不顯示）' : '(None)' },
              ...pages.map((page) => ({ value: page.id, label: `${page.title.zh || page.id} · ${page.id}` })),
            ]}
            onChange={(pageId) => onChange(withOptional(program, field, pageId === NO_PAGE ? undefined : pageId))}
          />
        ))}
      </FieldGrid>
      <ArchiveMediaField
        slot={{ slotKind: 'program-cover', path: [...path, 'cover'], reference: program.cover ?? null, required: false }}
        label={isZh ? '封面圖片（選填）' : 'Cover image (optional)'}
        altText=""
        issues={issues}
        onChange={(cover) => onChange(withOptional(program, 'cover', cover ?? undefined))}
      />
    </div>
  );
}

/** The five trainee programs. The set is fixed by the site, so programs cannot be added or removed. */
export function ProgramsSection({ payload, issues, onChange, expanded, onExpandedChange }: ProgramsSectionProps) {
  const isZh = useIsZh();
  const decorations = useFieldDecorations();
  const rows = useMemo(() => byOrder(payload.programs).map((index) => {
    const program = payload.programs[index]!;
    return recordRow({
      collection: 'programs',
      index,
      title: program.title,
      meta: [program.id],
      badges: untranslatedBadge(program.title, isZh),
    }, { isZh, issues, decorations });
  }), [decorations, isZh, issues, payload.programs]);
  return (
    <EditorSection
      id="department-programs"
      title={isZh ? '學員專區計畫' : 'Trainee programs'}
      description={isZh ? '固定為五個計畫，無法新增或刪除。各計畫的頁面只能選擇屬於該計畫的頁面。' : 'There are always exactly five programs; they cannot be added or removed. Each can only link pages that belong to it.'}
    >
      <ArchiveRecordList
        id="department-programs-list"
        title={isZh ? '計畫' : 'Programs'}
        rows={rows}
        totalCount={payload.programs.length}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        itemNoun={isZh ? NOUNS.program.zh : NOUNS.program.en}
        emptyTitle={isZh ? '缺少計畫資料' : 'Programs missing'}
        emptyDescription={isZh ? '這份文件必須包含五個計畫，請在進階 JSON 中修復。' : 'This document must hold five programs; repair it in the advanced JSON editor.'}
        renderItem={(index) => {
          const program = payload.programs[index];
          if (program === undefined) return null;
          return <ProgramFields index={index} program={program} payload={payload} issues={issues} onChange={(next) => onChange({ ...payload, programs: replaceAt(payload.programs, index, next) })} />;
        }}
      />
    </EditorSection>
  );
}
