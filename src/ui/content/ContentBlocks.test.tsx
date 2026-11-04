// @vitest-environment jsdom
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublishedBlock } from '@/content/contracts/blocks';
import { PublishedLocalizedBlocksSchema } from '@/content/contracts/blocks';
import { ContentBlocks } from './ContentBlocks';
import { renderContent } from './testHarness';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const LOCAL_IMAGE = { kind: 'local', path: 'assets/legacy/article/abc123.webp' } as const;

function blocks(value: unknown): readonly PublishedBlock[] {
  return PublishedLocalizedBlocksSchema.parse({ zh: value }).zh;
}

describe('ContentBlocks renderer safety', () => {
  it('renders markup-looking text as text, never as HTML', () => {
    const { container } = renderContent(
      <ContentBlocks blocks={blocks([
        { type: 'paragraph', runs: [{ text: '<img src=x onerror="alert(1)"><script>alert(2)</script>' }] },
        { type: 'table', rows: [['<b>粗體</b>', '<a href="javascript:alert(3)">x</a>']] },
      ])} />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText('<img src=x onerror="alert(1)"><script>alert(2)</script>')).toBeTruthy();
    expect(screen.getByText('<b>粗體</b>')).toBeTruthy();
  });

  it('drops unsafe hrefs that bypass validation, keeping their text', () => {
    // Deliberately unvalidated: the renderer must not trust its input.
    const unsafe = [
      { type: 'paragraph', runs: [{ text: '惡意連結', href: 'javascript:alert(1)' }] },
      { type: 'paragraph', runs: [{ text: '資料連結', href: 'data:text/html,<script>alert(1)</script>' }] },
      { type: 'paragraph', runs: [{ text: '協定相對', href: '//evil.example/path' }] },
      { type: 'paragraph', runs: [{ text: '帳密', href: 'https://user:pass@evil.example/' }] },
    ] as unknown as readonly PublishedBlock[];

    const { container } = renderContent(<ContentBlocks blocks={unsafe} />);

    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(screen.getByText('惡意連結')).toBeTruthy();
    expect(screen.getByText('資料連結')).toBeTruthy();
    expect(screen.getByText('協定相對')).toBeTruthy();
    expect(screen.getByText('帳密')).toBeTruthy();
  });

  it('classifies links: router paths get the basename, mail and phone stay plain, the web opens a new tab', () => {
    renderContent(
      <ContentBlocks blocks={blocks([{
        type: 'paragraph',
        runs: [
          { text: '公告', href: '/announcements?category=recruitment#list' },
          { text: ' · ' },
          { text: '來信', href: 'mailto:edu@example.org' },
          { text: ' · ' },
          { text: '電話', href: 'tel:+886-2-2737-2181' },
          { text: ' · ' },
          { text: '北醫', href: 'https://www.tmu.edu.tw/' },
          { text: ' · ' },
          { text: '舊系統', href: 'http://legacy.example.org/' },
        ],
      }])} />,
      { basename: '/tmuh-mededu-website' },
    );

    const internal = screen.getByRole('link', { name: '公告' });
    expect(internal.getAttribute('href')).toBe('/tmuh-mededu-website/announcements?category=recruitment#list');
    expect(internal.hasAttribute('target')).toBe(false);

    const mail = screen.getByRole('link', { name: '來信' });
    expect(mail.getAttribute('href')).toBe('mailto:edu@example.org');
    expect(mail.hasAttribute('target')).toBe(false);
    expect(screen.getByRole('link', { name: '電話' }).getAttribute('href')).toBe('tel:+886-2-2737-2181');

    for (const [name, href] of [['北醫', 'https://www.tmu.edu.tw/'], ['舊系統', 'http://legacy.example.org/']]) {
      const external = screen.getByRole('link', { name: new RegExp(`^${name}`) });
      expect(external.getAttribute('href')).toBe(href);
      expect(external.getAttribute('target')).toBe('_blank');
      expect(external.getAttribute('rel')).toBe('noreferrer noopener');
      expect(external.textContent).toContain('另開新分頁');
    }
  });

  it('never uses dangerouslySetInnerHTML anywhere in src/ui/content', () => {
    const directory = join(process.cwd(), 'src/ui/content');
    const sources = readdirSync(directory).filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.'));
    expect(sources.length).toBeGreaterThan(5);
    for (const file of sources) {
      expect(readFileSync(join(directory, file), 'utf8')).not.toMatch(/dangerouslySetInnerHTML|innerHTML\s*=/);
    }
  });
});

describe('ContentBlocks structure', () => {
  it('maps heading levels onto the surrounding heading context', () => {
    renderContent(
      <ContentBlocks
        headingLevel={3}
        blocks={blocks([
          { type: 'heading', level: 2, text: '課程內容' },
          { type: 'heading', level: 3, text: '報名方式' },
        ])}
      />,
    );

    expect(screen.getByRole('heading', { name: '課程內容' }).tagName).toBe('H3');
    expect(screen.getByRole('heading', { name: '報名方式' }).tagName).toBe('H4');
  });

  it('keeps line breaks inside paragraphs and renders strong runs and lists', () => {
    const { container } = renderContent(
      <ContentBlocks blocks={blocks([
        { type: 'paragraph', runs: [{ text: '時間：上午\n地點：' }, { text: '第一會議室', strong: true }] },
        { type: 'list', ordered: true, items: [[{ text: '第一項' }], [{ text: '第二項' }]] },
        { type: 'list', ordered: false, items: [[{ text: '要點' }]] },
        { type: 'divider' },
      ])} />,
    );

    const paragraph = container.querySelector('p.content-p');
    expect(paragraph?.textContent).toBe('時間：上午\n地點：第一會議室');
    expect(within(paragraph as HTMLElement).getByText('第一會議室').tagName).toBe('STRONG');
    expect(container.querySelectorAll('ol > li')).toHaveLength(2);
    expect(container.querySelectorAll('ul > li')).toHaveLength(1);
    expect(container.querySelector('hr.content-divider')).not.toBeNull();
  });

  it('renders images lazily at their size through the media resolver, with a fallback on error', () => {
    const { container } = renderContent(
      <ContentBlocks blocks={blocks([
        { type: 'image', media: LOCAL_IMAGE, alt: '課程海報', caption: '2024 年課程', width: 800, height: 1131 },
      ])} />,
    );

    const image = screen.getByRole('img', { name: '課程海報' });
    expect(image.getAttribute('src')).toBe(`${import.meta.env.BASE_URL}assets/legacy/article/abc123.webp`);
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('decoding')).toBe('async');
    expect(image.getAttribute('width')).toBe('800');
    expect(image.getAttribute('height')).toBe('1131');
    expect(container.querySelector('figcaption')?.textContent).toBe('2024 年課程');

    fireEvent.error(image);

    expect(container.querySelector('img')).toBeNull();
    const placeholder = screen.getByRole('img', { name: '課程海報' });
    expect(placeholder.textContent).toContain('圖片無法顯示');
  });

  it('shows the fallback for promoted media when no Supabase project is configured', () => {
    const { container } = renderContent(
      <ContentBlocks blocks={blocks([{
        type: 'image',
        media: { kind: 'public', bucket: 'public-media', path: `${'a'.repeat(64)}/${'a'.repeat(64)}.webp` },
        alt: '活動照片',
      }])} />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: '活動照片' })).toBeTruthy();
  });

  it('puts tables in a labelled, focusable scroller with column headers', () => {
    renderContent(
      <ContentBlocks blocks={blocks([
        { type: 'table', header: ['日期', '講題'], rows: [['3/1', '臨床教學']] },
        { type: 'table', rows: [['只有內容']] },
      ])} />,
      { lang: 'en' },
    );

    const first = screen.getByRole('region', { name: 'Table 1' });
    expect(first.getAttribute('tabindex')).toBe('0');
    const header = within(first).getByRole('columnheader', { name: '日期' });
    expect(header.getAttribute('scope')).toBe('col');
    expect(screen.getByRole('region', { name: 'Table 2' })).toBeTruthy();
  });

  it('renders a video block as a click-to-load facade, not an iframe', () => {
    const { container } = renderContent(
      <ContentBlocks videoTitle="教學影片" blocks={blocks([{ type: 'video', youtubeId: 'dQw4w9WgXcQ' }])} />,
    );

    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('button', { name: '播放影片：教學影片' })).toBeTruthy();
  });

  it('marks a Chinese fallback body with lang="zh-Hant" and leaves translated bodies alone', () => {
    const body = blocks([{ type: 'paragraph', runs: [{ text: '內文' }] }]);
    const { container, unmount } = renderContent(<ContentBlocks blocks={body} fallback />, { lang: 'en' });
    expect(container.querySelector('.content-blocks')?.getAttribute('lang')).toBe('zh-Hant');
    unmount();

    const translated = renderContent(<ContentBlocks blocks={body} />, { lang: 'en' });
    expect(translated.container.querySelector('.content-blocks')?.hasAttribute('lang')).toBe(false);
  });
});
