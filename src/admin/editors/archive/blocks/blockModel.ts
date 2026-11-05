import type { BlockType } from '@/content/contracts/blocks';
import type { MediaReference } from '@/content/media';
import type { EditableBlock } from '../archiveTypes';
import { parseYoutubeId } from '../youtube';

export type EditableRun = Extract<EditableBlock, { readonly type: 'paragraph' }>['runs'][number];
export type EditableTableBlock = Extract<EditableBlock, { readonly type: 'table' }>;

/** Block types that can be created without picking anything first (an image needs its media). */
export const TEXT_BLOCK_TYPES = ['paragraph', 'heading', 'list', 'table', 'divider', 'video'] as const satisfies readonly BlockType[];
export type CreatableBlockType = (typeof TEXT_BLOCK_TYPES)[number];

export function moveItem<T>(items: readonly T[], from: number, to: number): readonly T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

export function insertAt<T>(items: readonly T[], index: number, item: T): readonly T[] {
  const position = Math.max(0, Math.min(index, items.length));
  return [...items.slice(0, position), item, ...items.slice(position)];
}

export function removeAt<T>(items: readonly T[], index: number): readonly T[] {
  return items.filter((_, position) => position !== index);
}

export function replaceAt<T>(items: readonly T[], index: number, item: T): readonly T[] {
  return items.map((candidate, position) => (position === index ? item : candidate));
}

export function emptyRun(): EditableRun {
  return { text: '' };
}

export function createBlock(type: CreatableBlockType): EditableBlock {
  switch (type) {
    case 'paragraph':
      return { type, runs: [emptyRun()] };
    case 'heading':
      return { type, level: 2, text: '' };
    case 'list':
      return { type, ordered: false, items: [[emptyRun()]] };
    case 'table':
      return { type, rows: [['', ''], ['', '']] };
    case 'divider':
      return { type };
    case 'video':
      return { type, youtubeId: '' };
  }
}

export function createImageBlock(media: MediaReference, size?: { readonly width?: number; readonly height?: number }): EditableBlock {
  return {
    type: 'image',
    media,
    alt: '',
    ...(size?.width === undefined ? {} : { width: size.width }),
    ...(size?.height === undefined ? {} : { height: size.height }),
  };
}

function runsText(runs: readonly EditableRun[]): string {
  return runs.map((run) => run.text).join('');
}

/** The block's visible text, flattened, for summaries and type conversion. */
export function blockText(block: EditableBlock): string {
  switch (block.type) {
    case 'paragraph':
      return runsText(block.runs);
    case 'heading':
      return block.text;
    case 'list':
      return block.items.map(runsText).join('\n');
    case 'image':
      return block.caption ?? block.alt;
    case 'table':
      return [block.header ?? [], ...block.rows].map((row) => row.join(' ')).join('\n');
    case 'divider':
      return '';
    case 'video':
      return block.youtubeId;
  }
}

/**
 * Converts a block to another creatable type, carrying its text across where the target can hold
 * it: paragraph runs (with their bold and links) become list items and back, a heading takes the
 * flattened text on one line. Images are never converted, since only they hold media.
 */
export function convertBlock(block: EditableBlock, type: CreatableBlockType): EditableBlock {
  if (block.type === type) return block;
  const text = blockText(block);
  switch (type) {
    case 'paragraph':
      if (block.type === 'list') return { type, runs: block.items.flatMap((item, index) => (index === 0 ? item : [{ text: '\n' }, ...item])) };
      return { type, runs: [{ text }] };
    case 'heading':
      return { type, level: 2, text: text.replace(/\s*\n\s*/gu, ' ').trim() };
    case 'list':
      if (block.type === 'paragraph') return { type, ordered: false, items: [block.runs] };
      return { type, ordered: false, items: text === '' ? [[emptyRun()]] : text.split('\n').map((line) => [{ text: line }]) };
    case 'table':
      return { type, rows: text === '' ? [['', '']] : text.split('\n').map((line) => [line]) };
    case 'divider':
      return { type };
    case 'video':
      return { type, youtubeId: parseYoutubeId(text) ?? '' };
  }
}

export function tableColumnCount(block: EditableTableBlock): number {
  return Math.max(1, block.header?.length ?? 0, ...block.rows.map((row) => row.length));
}

function padRow(row: readonly string[], width: number): readonly string[] {
  return row.length >= width ? row : [...row, ...Array.from({ length: width - row.length }, () => '')];
}

export function addTableRow(block: EditableTableBlock): EditableTableBlock {
  return { ...block, rows: [...block.rows, padRow([], tableColumnCount(block))] };
}

export function addTableColumn(block: EditableTableBlock): EditableTableBlock {
  const width = tableColumnCount(block) + 1;
  return {
    ...block,
    ...(block.header === undefined ? {} : { header: padRow(block.header, width) }),
    rows: block.rows.map((row) => padRow(row, width)),
  };
}

export function removeTableColumn(block: EditableTableBlock, column: number): EditableTableBlock {
  const drop = (row: readonly string[]) => row.filter((_, index) => index !== column);
  return {
    ...block,
    ...(block.header === undefined ? {} : { header: drop(block.header) }),
    rows: block.rows.map(drop),
  };
}

export function removeTableRow(block: EditableTableBlock, row: number): EditableTableBlock {
  return { ...block, rows: removeAt(block.rows, row) };
}

export function setTableHeader(block: EditableTableBlock, enabled: boolean): EditableTableBlock {
  if (!enabled) {
    const { header: _removed, ...rest } = block;
    return rest;
  }
  return { ...block, header: padRow(block.header ?? [], tableColumnCount(block)) };
}

export function setTableCell(block: EditableTableBlock, row: number | 'header', column: number, value: string): EditableTableBlock {
  const update = (cells: readonly string[]) => replaceAt(padRow(cells, column + 1), column, value);
  if (row === 'header') return { ...block, header: update(block.header ?? []) };
  return { ...block, rows: block.rows.map((cells, index) => (index === row ? update(cells) : cells)) };
}
