import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { AdminCheckbox } from '@/admin/AdminFields';
import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import { useFieldDecorations } from '@/admin/fieldDecorations';
import { BLOCK_LIMITS } from '@/content/contracts/blocks';
import type { ArchiveCommitResult, ArchiveIssues, JsonPath } from '../archiveTypes';
import { issueFor, useIsZh } from '../fields';
import {
  addTableColumn,
  addTableRow,
  removeTableColumn,
  removeTableRow,
  setTableCell,
  setTableHeader,
  tableColumnCount,
  type EditableTableBlock,
} from './blockModel';

type TableBlockFieldsProps = {
  readonly path: JsonPath;
  readonly label: string;
  readonly block: EditableTableBlock;
  readonly issues: ArchiveIssues;
  readonly lang: string;
  readonly onChange: (block: EditableTableBlock) => ArchiveCommitResult;
};

type CellProps = {
  readonly path: JsonPath;
  readonly label: string;
  readonly value: string;
  readonly issues: ArchiveIssues;
  readonly lang: string;
  readonly onChange: (value: string) => void;
};

/** One table cell. It carries the field frame's hooks (id, changed marker) without its label row. */
function Cell({ path, label, value, issues, lang, onChange }: CellProps) {
  const decorations = useFieldDecorations();
  const id = fieldIdForStructuredEditorIssuePath(path);
  const error = issueFor(path, issues);
  const changed = decorations?.isChanged?.(id) === true;
  return (
    <div className="admin-field admin-archive-cell" data-field-state={error === undefined ? undefined : 'error'} data-changed={changed || undefined}>
      <input
        id={id}
        className="admin-control"
        aria-label={label}
        aria-invalid={error === undefined ? undefined : true}
        title={error}
        value={value}
        lang={lang}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

/** A plain-text table: an optional header row and body rows, edited as a grid of cells. */
export function TableBlockFields({ path, label, block, issues, lang, onChange }: TableBlockFieldsProps) {
  const isZh = useIsZh();
  const columns = tableColumnCount(block);
  const cellLabel = (row: number | 'header', column: number) => (row === 'header'
    ? (isZh ? `${label}，表頭第 ${column + 1} 欄` : `${label}, header column ${column + 1}`)
    : (isZh ? `${label}，第 ${row + 1} 列第 ${column + 1} 欄` : `${label}, row ${row + 1} column ${column + 1}`));
  const columnIndexes = Array.from({ length: columns }, (_, column) => column);
  const tableIssue = issueFor([...path, 'rows'], issues);
  return (
    <div className="admin-archive-table-editor">
      <AdminCheckbox
        checked={block.header !== undefined}
        label={isZh ? '第一列是表頭' : 'First row is a header'}
        onChange={(event) => onChange(setTableHeader(block, event.currentTarget.checked))}
      />
      <div className="admin-archive-table-scroll" role="region" aria-label={isZh ? `${label}的儲存格，可左右捲動` : `${label} cells; scroll sideways`} tabIndex={0}>
        <table className="admin-archive-table">
          <thead>
            <tr className="admin-archive-table-tools">
              {columnIndexes.map((column) => (
                <th key={column} scope="col">
                  <AdminIconButton icon="trash" label={isZh ? `刪除第 ${column + 1} 欄` : `Delete column ${column + 1}`} disabled={columns === 1} onClick={() => onChange(removeTableColumn(block, column))} />
                </th>
              ))}
              <td />
            </tr>
            {block.header === undefined ? null : (
              <tr>
                {columnIndexes.map((column) => (
                  <th key={column} scope="col">
                    <Cell path={[...path, 'header', column]} label={cellLabel('header', column)} value={block.header?.[column] ?? ''} issues={issues} lang={lang} onChange={(value) => onChange(setTableCell(block, 'header', column, value))} />
                  </th>
                ))}
                <td />
              </tr>
            )}
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              // Rows are positional; there is no other identity.
              <tr key={rowIndex}>
                {columnIndexes.map((column) => (
                  <td key={column}>
                    <Cell path={[...path, 'rows', rowIndex, column]} label={cellLabel(rowIndex, column)} value={row[column] ?? ''} issues={issues} lang={lang} onChange={(value) => onChange(setTableCell(block, rowIndex, column, value))} />
                  </td>
                ))}
                <td>
                  <AdminIconButton icon="trash" label={isZh ? `刪除第 ${rowIndex + 1} 列` : `Delete row ${rowIndex + 1}`} disabled={block.rows.length === 1} onClick={() => onChange(removeTableRow(block, rowIndex))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tableIssue === undefined ? null : <p className="admin-field-message admin-field-error" role="alert">{tableIssue}</p>}
      <div className="admin-cluster">
        <AdminButton variant="quiet" icon="plus" onClick={() => onChange(addTableRow(block))}>{isZh ? '新增一列' : 'Add row'}</AdminButton>
        <AdminButton variant="quiet" icon="plus" disabled={columns >= BLOCK_LIMITS.tableColumns} onClick={() => onChange(addTableColumn(block))}>{isZh ? '新增一欄' : 'Add column'}</AdminButton>
      </div>
    </div>
  );
}
