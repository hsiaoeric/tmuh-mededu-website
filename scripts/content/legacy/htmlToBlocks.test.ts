import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { PublishedBlockSchema } from '../../../src/content/contracts/blocks';
import { blocksText, htmlToBlocks, youtubeIdFromUrl, type BlockContext, type BlockNote, type ImportedBlock } from './htmlToBlocks';
import { parseHtml } from './parsePage';

const PublishedBlocks = z.array(PublishedBlockSchema);

function convert(html: string, overrides: Partial<BlockContext> = {}): { blocks: ImportedBlock[]; notes: BlockNote[] } {
  const container = parseHtml(`<!doctype html><html><body><div id="fixture">${html}</div></body></html>`).body.querySelector('#fixture');
  if (container === null) throw new Error('fixture did not parse');
  const notes: BlockNote[] = [];
  const blocks = htmlToBlocks(container, {
    title: '測試文章',
    resolveImage: () => ({ media: { kind: 'local', path: 'assets/legacy/article/0123456789abcdef0123.webp' }, width: 800, height: 600 }),
    resolveLink: (href) => href,
    note: (note) => notes.push(note),
    ...overrides,
  });
  // Every fixture's output must satisfy the published block contract.
  expect(PublishedBlocks.safeParse(blocks).success).toBe(true);
  return { blocks, notes };
}

describe('htmlToBlocks', () => {
  it('turns paragraphs into paragraph blocks and drops styling wrappers', () => {
    const { blocks } = convert('<p style="color:red"><span><font size="4">第一段</font></span></p><p class="x">第二段</p><p>&nbsp;</p>');
    expect(blocks).toEqual([
      { type: 'paragraph', runs: [{ text: '第一段' }] },
      { type: 'paragraph', runs: [{ text: '第二段' }] },
    ]);
  });

  it('keeps a single <br> as a line break and splits paragraphs on <br><br>', () => {
    const { blocks } = convert('甲行<br>乙行<br /><br>丙段');
    expect(blocks).toEqual([
      { type: 'paragraph', runs: [{ text: '甲行\n乙行' }] },
      { type: 'paragraph', runs: [{ text: '丙段' }] },
    ]);
  });

  it('marks strong and b runs and collapses ASCII whitespace across them', () => {
    const { blocks } = convert('<p>報名  <strong>截止日期</strong>  <b>為 5 月</b>\n 底</p>');
    expect(blocks).toEqual([
      { type: 'paragraph', runs: [{ text: '報名 ' }, { text: '截止日期', strong: true }, { text: ' ' }, { text: '為 5 月', strong: true }, { text: ' 底' }] },
    ]);
  });

  it('preserves ideographic spaces (U+3000) used for indentation', () => {
    const { blocks } = convert('<p>　(11031)臺北市信義區　吳興街252號</p>');
    expect(blocks).toEqual([{ type: 'paragraph', runs: [{ text: '　(11031)臺北市信義區　吳興街252號' }] }]);
  });

  it('converts tables, using a header row of th cells and expanding colspans', () => {
    const { blocks, notes } = convert(`
      <table><thead><tr><th>學年</th><th>對象</th><th>人數</th></tr></thead>
      <tbody><tr><td>111</td><td colspan="2">107 級 <a href="https://example.org/">名單</a></td></tr>
      <tr><td>112</td><td>108 級</td><td>46</td></tr></tbody></table>`);
    expect(blocks).toEqual([{
      type: 'table',
      header: ['學年', '對象', '人數'],
      rows: [['111', '107 級 名單', ''], ['112', '108 級', '46']],
    }]);
    expect(notes).toContainEqual({ kind: 'table-span', detail: 'colspan=2 rowspan=1' });
    expect(notes).toContainEqual({ kind: 'table-link-dropped', href: 'https://example.org/' });
  });

  it('converts ul/ol lists and flattens item paragraphs into lines', () => {
    const { blocks } = convert('<ul><li>第一項</li><li><p>第二項</p><p>續行</p></li><li> </li></ul><ol><li><strong>步驟</strong></li></ol>');
    expect(blocks).toEqual([
      { type: 'list', ordered: false, items: [[{ text: '第一項' }], [{ text: '第二項\n續行' }]] },
      { type: 'list', ordered: true, items: [[{ text: '步驟', strong: true }]] },
    ]);
  });

  it('turns hr and lines made only of dashes into dividers', () => {
    const { blocks } = convert('上段<br><br><span>------------------------------------------------</span><br><br>下段<hr>尾段<br>─────<br>');
    expect(blocks.map((block) => block.type)).toEqual(['paragraph', 'divider', 'paragraph', 'divider', 'paragraph']);
  });

  it('maps h1/h2 to level 2 and h3–h5 to level 3, keeping linked headings as bold paragraphs', () => {
    const { blocks } = convert('<h1>大標</h1><h4>小標</h4><h2><a href="https://example.org/x">連結標題</a></h2>');
    expect(blocks).toEqual([
      { type: 'heading', level: 2, text: '大標' },
      { type: 'heading', level: 3, text: '小標' },
      { type: 'paragraph', runs: [{ text: '連結標題', strong: true, href: 'https://example.org/x' }] },
    ]);
  });

  it('uses the link resolver and keeps anchor text when a link is dropped', () => {
    const { blocks } = convert('<p>見<a href="../../center/events/develop/evt03.html">讀書會</a>與<a href="javascript:void(0)">此處</a></p>', {
      resolveLink: (href) => (href.startsWith('../') ? '/centers/faculty-development#articles' : null),
    });
    expect(blocks).toEqual([{ type: 'paragraph', runs: [{ text: '見' }, { text: '讀書會', href: '/centers/faculty-development#articles' }, { text: '與此處' }] }]);
  });

  it('emits image blocks with generated alt text, and drops unresolved images', () => {
    const seen: string[] = [];
    const { blocks, notes } = convert('<img alt="" src="data:image/png;base64,iVBORw0KGgo="><img alt="post image" src="https://elsewhere.example/a.png"><img alt="頒獎典禮" src="../a.jpg">', {
      resolveImage: (src) => {
        seen.push(src.slice(0, 15));
        return src.startsWith('https:') ? null : { media: { kind: 'local', path: 'assets/legacy/article/0123456789abcdef0123.webp' }, width: 10, height: 20 };
      },
    });
    expect(seen).toEqual(['data:image/png;', 'https://elsewhe', '../a.jpg']);
    expect(blocks).toEqual([
      { type: 'image', media: { kind: 'local', path: 'assets/legacy/article/0123456789abcdef0123.webp' }, alt: '測試文章 — 圖 1', width: 10, height: 20 },
      { type: 'image', media: { kind: 'local', path: 'assets/legacy/article/0123456789abcdef0123.webp' }, alt: '頒獎典禮', width: 10, height: 20 },
    ]);
    expect(notes).toContainEqual({ kind: 'generated-alt', alt: '測試文章 — 圖 1' });
    expect(notes).toContainEqual({ kind: 'image-dropped', src: 'https://elsewhere.example/a.png' });
  });

  it('turns YouTube embeds into video blocks', () => {
    const { blocks } = convert('<iframe src="https://www.youtube.com/embed/5bhJIl_KYuo"></iframe><iframe src="https://example.org/embed"></iframe>');
    expect(blocks).toEqual([{ type: 'video', youtubeId: '5bhJIl_KYuo' }]);
  });

  it('drops zero-width characters and empty wrappers, and trims edge dividers', () => {
    const { blocks } = convert('<hr><div><span>​</span></div><p>內容​</p><hr><hr>');
    expect(blocks).toEqual([{ type: 'paragraph', runs: [{ text: '內容' }] }]);
    expect(blocksText(blocks)).toBe('內容');
  });
});

describe('youtubeIdFromUrl', () => {
  it('reads embed, watch and short links', () => {
    expect(youtubeIdFromUrl('https://www.youtube.com/embed/DV3CLc3Rbhg')).toBe('DV3CLc3Rbhg');
    expect(youtubeIdFromUrl('https://www.youtube.com/watch?v=OXnimrULYOo&feature=youtu.be')).toBe('OXnimrULYOo');
    expect(youtubeIdFromUrl('https://youtu.be/y_K1VGKHPDw')).toBe('y_K1VGKHPDw');
    expect(youtubeIdFromUrl('https://www.youtube.com/@tmu994057/videos')).toBeUndefined();
  });
});
