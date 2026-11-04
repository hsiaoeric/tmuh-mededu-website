import type { LegacyElement, LegacyNode } from 'jsdom';
import { BLOCK_LIMITS, YOUTUBE_ID_PATTERN } from '../../../src/content/contracts/blocks';
import { TEXT_LIMITS } from '../../../src/content/contracts/localized';
import { isBlank, normalizeInlineText, singleLine, trimAscii, truncate } from './text';

/** The block shapes the importer emits; a subset of the published block contract. */
export type ImportedRun = { text: string; strong?: true; href?: string };
export type ImportedMedia = { readonly kind: 'local'; readonly path: string };
export type ImportedBlock =
  | { readonly type: 'paragraph'; readonly runs: readonly ImportedRun[] }
  | { readonly type: 'heading'; readonly level: 2 | 3; readonly text: string }
  | { readonly type: 'list'; readonly ordered: boolean; readonly items: readonly (readonly ImportedRun[])[] }
  | { readonly type: 'image'; readonly media: ImportedMedia; readonly alt: string; readonly width?: number; readonly height?: number }
  | { readonly type: 'table'; readonly header?: readonly string[]; readonly rows: readonly (readonly string[])[] }
  | { readonly type: 'divider' }
  | { readonly type: 'video'; readonly youtubeId: string };

export type ResolvedImage = { readonly media: ImportedMedia; readonly width?: number; readonly height?: number };

export type BlockNote =
  | { readonly kind: 'generated-alt'; readonly alt: string }
  | { readonly kind: 'image-dropped'; readonly src: string }
  | { readonly kind: 'table-span'; readonly detail: string }
  | { readonly kind: 'table-truncated'; readonly detail: string }
  | { readonly kind: 'table-link-dropped'; readonly href: string }
  | { readonly kind: 'heading-demoted'; readonly text: string; readonly reason: string };

export type BlockContext = {
  /** Used to write alt text for images whose own alt says nothing. */
  readonly title: string;
  /** null drops the image; the caller records why. */
  resolveImage(src: string): ResolvedImage | null;
  /** null keeps the anchor text without a link; the caller records why. */
  resolveLink(href: string): string | null;
  note?(note: BlockNote): void;
};

type Style = { readonly strong: boolean; readonly href?: string };
type Token = { readonly kind: 'text'; readonly text: string; readonly style: Style } | { readonly kind: 'break' };

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const SKIPPED = new Set(['script', 'style', 'noscript', 'template', 'head', 'button', 'input', 'select', 'textarea', 'svg', 'object', 'embed']);
const BLOCK_CONTAINERS = new Set([
  'p', 'div', 'section', 'article', 'aside', 'blockquote', 'center', 'figure', 'figcaption', 'dl', 'dt', 'dd',
  'header', 'footer', 'main', 'nav', 'address', 'pre', 'form', 'fieldset', 'li', 'tr', 'td', 'th', 'caption',
  'thead', 'tbody', 'tfoot', 'colgroup', 'col',
]);
/** A line made only of rule characters is a divider (`------`, `─────`, `=====`). */
const RULE_LINE = /^[-‐‑‒–—―─━=＝－_~～.·•*]{3,}$/u;
/** Alt text the old CMS filled in automatically; it describes nothing. */
const MEANINGLESS_ALT = /^(?:post image|image|img|photo|圖片|圖|background|logo)?$/i;

function tagOf(element: LegacyElement): string {
  return element.tagName.toLowerCase();
}

function childNodes(node: LegacyNode): LegacyNode[] {
  return Array.from(node.childNodes);
}

function isElement(node: LegacyNode): node is LegacyElement {
  return node.nodeType === ELEMENT_NODE;
}

export function youtubeIdFromUrl(value: string): string | undefined {
  const match = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:.*&)?v=|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/.exec(value);
  const id = match?.[1];
  return id !== undefined && YOUTUBE_ID_PATTERN.test(id) ? id : undefined;
}

function sameStyle(left: ImportedRun, right: ImportedRun): boolean {
  return left.strong === right.strong && left.href === right.href;
}

function makeRun(text: string, style: Style): ImportedRun {
  return {
    text,
    ...(style.strong ? { strong: true as const } : {}),
    ...(style.href === undefined ? {} : { href: style.href }),
  };
}

/** Merges neighbouring runs that share a style and splits any run over the length limit. */
function compactRuns(runs: readonly ImportedRun[]): ImportedRun[] {
  const merged: ImportedRun[] = [];
  for (const run of runs) {
    const previous = merged.at(-1);
    // Whitespace already collapsed inside each text node; collapse it across node edges too.
    const text = previous !== undefined && /[ \n]$/.test(previous.text) ? run.text.replace(/^ +/, '') : run.text;
    if (text.length === 0) continue;
    if (previous !== undefined && sameStyle(previous, run)) previous.text = `${previous.text}${text}`.replace(/ {2,}/g, ' ');
    else merged.push({ ...run, text });
  }
  for (const run of merged) run.text = run.text.replace(/ +\n/g, '\n').replace(/\n +/g, '\n');
  const nonEmpty = merged.filter((run) => run.text.length > 0);
  merged.length = 0;
  merged.push(...nonEmpty);
  return merged.flatMap((run) => {
    if (run.text.length <= TEXT_LIMITS.run) return [run];
    const pieces: ImportedRun[] = [];
    for (let start = 0; start < run.text.length; start += TEXT_LIMITS.run) {
      pieces.push({ ...run, text: run.text.slice(start, start + TEXT_LIMITS.run) });
    }
    return pieces;
  });
}

/** Trims ASCII whitespace from the outer edges of a line of runs, dropping runs left empty. */
function trimLine(runs: readonly ImportedRun[]): ImportedRun[] {
  const copy = runs.map((run) => ({ ...run }));
  while (copy.length > 0) {
    const first = copy[0]!;
    first.text = first.text.replace(/^[\t\n\r\f\v ]+/, '');
    if (first.text.length > 0) break;
    copy.shift();
  }
  while (copy.length > 0) {
    const last = copy[copy.length - 1]!;
    last.text = last.text.replace(/[\t\n\r\f\v ]+$/, '');
    if (last.text.length > 0) break;
    copy.pop();
  }
  return copy;
}

function lineText(runs: readonly ImportedRun[]): string {
  return runs.map((run) => run.text).join('');
}

/**
 * Turns an inline token stream into paragraphs and dividers. A single `<br>` is a line break
 * inside a paragraph; two or more in a row (or a blank line between them) start a new
 * paragraph, which is how the old editor separated paragraphs.
 */
function tokensToBlocks(tokens: readonly Token[]): ImportedBlock[] {
  const lines: { runs: ImportedRun[]; breaksBefore: number }[] = [];
  let current: ImportedRun[] = [];
  let pendingBreaks = 0;
  const endLine = (): void => {
    const runs = trimLine(current);
    current = [];
    if (runs.length === 0 || isBlank(lineText(runs))) {
      pendingBreaks += 1;
      return;
    }
    lines.push({ runs, breaksBefore: pendingBreaks });
    pendingBreaks = 1;
  };
  for (const token of tokens) {
    if (token.kind === 'break') endLine();
    else current.push(makeRun(token.text, token.style));
  }
  endLine();

  const blocks: ImportedBlock[] = [];
  let paragraph: ImportedRun[] = [];
  const endParagraph = (): void => {
    const runs = compactRuns(paragraph);
    paragraph = [];
    if (runs.length > 0) blocks.push({ type: 'paragraph', runs });
  };
  lines.forEach((line, index) => {
    const text = lineText(line.runs).replace(/\s/g, '');
    if (RULE_LINE.test(text)) {
      endParagraph();
      blocks.push({ type: 'divider' });
      return;
    }
    if (index > 0 && line.breaksBefore >= 2) endParagraph();
    if (paragraph.length > 0) paragraph.push({ text: '\n' });
    paragraph.push(...line.runs);
  });
  endParagraph();
  return blocks;
}

class BlockBuilder {
  readonly blocks: ImportedBlock[] = [];
  private tokens: Token[] = [];

  constructor(private readonly context: BlockContext, private readonly counter: { images: number }) {}

  flush(): void {
    if (this.tokens.length === 0) return;
    this.blocks.push(...tokensToBlocks(this.tokens));
    this.tokens = [];
  }

  /** Inline runs gathered so far, as lines; used for list items and table cells. */
  takeInlineBlocks(): ImportedBlock[] {
    this.flush();
    return this.blocks.splice(0, this.blocks.length);
  }

  walkChildren(node: LegacyNode, style: Style): void {
    for (const child of childNodes(node)) this.walk(child, style);
  }

  walk(node: LegacyNode, style: Style): void {
    if (node.nodeType === TEXT_NODE) {
      const text = normalizeInlineText(node.textContent ?? '');
      if (text.length > 0) this.tokens.push({ kind: 'text', text, style });
      return;
    }
    if (!isElement(node)) return;
    const tag = tagOf(node);
    if (SKIPPED.has(tag)) return;
    switch (tag) {
      case 'br':
        this.tokens.push({ kind: 'break' });
        return;
      case 'img':
        this.flush();
        this.image(node);
        return;
      case 'iframe':
        this.flush();
        this.video(node);
        return;
      case 'hr':
        this.flush();
        this.blocks.push({ type: 'divider' });
        return;
      case 'strong':
      case 'b':
        this.walkChildren(node, { ...style, strong: true });
        return;
      case 'a':
        this.anchor(node, style);
        return;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        this.flush();
        this.heading(node, tag === 'h1' || tag === 'h2' ? 2 : 3);
        return;
      case 'ul':
      case 'ol':
        this.flush();
        this.list(node, tag === 'ol');
        return;
      case 'table':
        this.flush();
        this.table(node);
        return;
      default:
        if (BLOCK_CONTAINERS.has(tag)) {
          this.flush();
          this.walkChildren(node, style);
          this.flush();
        } else {
          // span, font, u, em, i, small, sup, sub, wbr, label, …: formatting is dropped.
          this.walkChildren(node, style);
        }
    }
  }

  private anchor(element: LegacyElement, style: Style): void {
    const raw = element.getAttribute('href');
    const href = raw === null ? null : this.context.resolveLink(raw);
    this.walkChildren(element, href === null ? style : { ...style, href });
  }

  private image(element: LegacyElement): void {
    const src = element.getAttribute('src')?.trim() ?? '';
    if (src.length === 0) return;
    const resolved = this.context.resolveImage(src);
    if (resolved === null) {
      this.context.note?.({ kind: 'image-dropped', src });
      return;
    }
    this.counter.images += 1;
    const ownAlt = singleLine(element.getAttribute('alt'));
    let alt: string;
    if (MEANINGLESS_ALT.test(ownAlt) || /\.(?:jpe?g|png|gif|webp)$/i.test(ownAlt)) {
      const suffix = ` — 圖 ${this.counter.images}`;
      alt = `${truncate(this.context.title, TEXT_LIMITS.alt - suffix.length)}${suffix}`;
      this.context.note?.({ kind: 'generated-alt', alt });
    } else {
      alt = truncate(ownAlt, TEXT_LIMITS.alt);
    }
    this.blocks.push({
      type: 'image',
      media: resolved.media,
      alt,
      ...(resolved.width === undefined ? {} : { width: resolved.width }),
      ...(resolved.height === undefined ? {} : { height: resolved.height }),
    });
  }

  private video(element: LegacyElement): void {
    const youtubeId = youtubeIdFromUrl(element.getAttribute('src') ?? '');
    if (youtubeId !== undefined) this.blocks.push({ type: 'video', youtubeId });
  }

  /** A nested builder for content that must be flattened (headings, list items, cells). */
  private nested(element: LegacyElement): { text: ImportedBlock[]; other: ImportedBlock[] } {
    const builder = new BlockBuilder(this.context, this.counter);
    builder.walkChildren(element, { strong: false });
    const blocks = builder.takeInlineBlocks();
    return {
      text: blocks.filter((block) => block.type === 'paragraph'),
      other: blocks.filter((block) => block.type !== 'paragraph'),
    };
  }

  private heading(element: LegacyElement, level: 2 | 3): void {
    const { text, other } = this.nested(element);
    const runs = text.flatMap((block) => block.type === 'paragraph' ? block.runs : []);
    const content = singleLine(runs.map((run) => run.text).join(' '));
    if (runs.some((run) => run.href !== undefined)) {
      // A heading block holds plain text, so a linked heading stays a bold paragraph to keep its link.
      this.context.note?.({ kind: 'heading-demoted', text: truncate(content, 60), reason: 'it contains a link' });
      this.blocks.push({ type: 'paragraph', runs: compactRuns(runs.map((run) => ({ ...run, text: run.text.replace(/\n/g, ' '), strong: true as const }))) });
    } else if (content.length > 0 && !isBlank(content)) {
      if (content.length <= TEXT_LIMITS.title) {
        this.blocks.push({ type: 'heading', level, text: content });
      } else {
        this.context.note?.({ kind: 'heading-demoted', text: truncate(content, 60), reason: `it is over ${TEXT_LIMITS.title} characters` });
        this.blocks.push({ type: 'paragraph', runs: [{ text: content, strong: true }] });
      }
    }
    this.blocks.push(...other);
  }

  private list(element: LegacyElement, ordered: boolean): void {
    const items: ImportedRun[][] = [];
    const hoisted: ImportedBlock[] = [];
    for (const child of Array.from(element.children)) {
      if (tagOf(child) !== 'li') {
        hoisted.push(...this.nested(child).other);
        continue;
      }
      const { text, other } = this.nested(child);
      const runs: ImportedRun[] = [];
      for (const block of text) {
        if (block.type !== 'paragraph') continue;
        if (runs.length > 0) runs.push({ text: '\n' });
        runs.push(...block.runs);
      }
      const compact = compactRuns(runs);
      if (compact.length > 0) items.push(compact);
      hoisted.push(...other);
    }
    if (items.length > 0) this.blocks.push({ type: 'list', ordered, items });
    this.blocks.push(...hoisted);
  }

  private cellText(cell: LegacyElement, hoisted: ImportedBlock[]): string {
    for (const anchor of Array.from(cell.querySelectorAll('a[href]'))) {
      this.context.note?.({ kind: 'table-link-dropped', href: anchor.getAttribute('href') ?? '' });
    }
    const { text, other } = this.nested(cell);
    hoisted.push(...other.filter((block) => block.type !== 'divider'));
    const value = singleLine(text.flatMap((block) => block.type === 'paragraph' ? [block.runs.map((run) => run.text).join('')] : []).join(' '));
    if (value.length > TEXT_LIMITS.cell) {
      this.context.note?.({ kind: 'table-truncated', detail: `cell over ${TEXT_LIMITS.cell} characters` });
      return truncate(value, TEXT_LIMITS.cell);
    }
    return isBlank(value) ? '' : value;
  }

  private table(element: LegacyElement): void {
    const hoisted: ImportedBlock[] = [];
    const rows: { cells: string[]; header: boolean }[] = [];
    // Cells still covered by a rowspan from an earlier row, by column.
    const carried = new Map<number, number>();
    const tableRows = Array.from(element.querySelectorAll('tr')).filter((row) => row.closest('table') === element);
    for (const row of tableRows) {
      const cells: string[] = [];
      let column = 0;
      const skipCarried = (): void => {
        while ((carried.get(column) ?? 0) > 0) {
          carried.set(column, (carried.get(column) ?? 1) - 1);
          cells.push('');
          column += 1;
        }
      };
      const sourceCells = Array.from(row.children).filter((cell) => tagOf(cell) === 'td' || tagOf(cell) === 'th');
      for (const cell of sourceCells) {
        skipCarried();
        cells.push(this.cellText(cell, hoisted));
        const colspan = Math.max(1, Math.min(BLOCK_LIMITS.tableColumns, Number(cell.getAttribute('colspan') ?? '1') || 1));
        const rowspan = Math.max(1, Number(cell.getAttribute('rowspan') ?? '1') || 1);
        if (colspan > 1 || rowspan > 1) {
          this.context.note?.({ kind: 'table-span', detail: `colspan=${colspan} rowspan=${rowspan}` });
        }
        for (let offset = 0; offset < colspan; offset += 1) {
          if (offset > 0) cells.push('');
          if (rowspan > 1) carried.set(column + offset, rowspan - 1);
        }
        column += colspan;
      }
      skipCarried();
      const header = row.closest('thead') !== null || (sourceCells.length > 0 && sourceCells.every((cell) => tagOf(cell) === 'th'));
      if (cells.length > BLOCK_LIMITS.tableColumns) {
        this.context.note?.({ kind: 'table-truncated', detail: `${cells.length} columns` });
        cells.length = BLOCK_LIMITS.tableColumns;
      }
      if (cells.some((cell) => cell.length > 0)) rows.push({ cells, header });
    }
    if (rows.length > 0) {
      const [first, ...rest] = rows;
      if (first !== undefined && first.header && rest.length > 0) {
        this.blocks.push({ type: 'table', header: first.cells, rows: rest.map((row) => row.cells) });
      } else {
        this.blocks.push({ type: 'table', rows: rows.map((row) => row.cells) });
      }
    }
    this.blocks.push(...hoisted);
  }
}

/** Removes repeated and edge dividers, which are layout noise rather than structure. */
function tidy(blocks: readonly ImportedBlock[]): ImportedBlock[] {
  const result: ImportedBlock[] = [];
  for (const block of blocks) {
    if (block.type === 'divider' && (result.length === 0 || result.at(-1)?.type === 'divider')) continue;
    result.push(block);
  }
  while (result.at(-1)?.type === 'divider') result.pop();
  return result;
}

export class BlockLimitError extends Error {
  readonly name = 'BlockLimitError';
}

/**
 * Converts a legacy rich-text container into content blocks. Only structure survives: inline
 * styles, classes, fonts and spans are dropped; bold, links, headings, lists, tables, rules,
 * images and YouTube embeds are kept. Ideographic spaces (U+3000) are preserved.
 */
export function htmlToBlocks(container: LegacyElement, context: BlockContext): ImportedBlock[] {
  const builder = new BlockBuilder(context, { images: 0 });
  builder.walkChildren(container, { strong: false });
  builder.flush();
  const blocks = tidy(builder.blocks);
  if (blocks.length > BLOCK_LIMITS.blocksPerLocale) {
    throw new BlockLimitError(`${context.title}: ${blocks.length} blocks exceed the ${BLOCK_LIMITS.blocksPerLocale}-block limit`);
  }
  return blocks;
}

/** Plain text of converted blocks, for reports and text-alternative checks. */
export function blocksText(blocks: readonly ImportedBlock[]): string {
  return blocks.map((block) => {
    switch (block.type) {
      case 'paragraph':
        return lineText(block.runs);
      case 'heading':
        return block.text;
      case 'list':
        return block.items.map(lineText).join('\n');
      case 'table':
        return [block.header ?? [], ...block.rows].map((row) => row.join(' ')).join('\n');
      default:
        return '';
    }
  }).filter((text) => trimAscii(text).length > 0).join('\n');
}
