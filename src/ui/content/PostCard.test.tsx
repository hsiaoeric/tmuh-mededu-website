// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adaptPostsArchive } from '@/content/adapters/archive';
import { PublishedPostsPayloadSchema } from '@/content/contracts/posts';
import { POST_CATEGORY_TAXONOMY } from '@/data/legacy/taxonomy';
import { StillMotion } from '@/motion/MotionPreference';
import { ChineseOnlyTag, LocalizedText } from './Localized';
import { ownerTone } from './ownerTone';
import { formatArchiveDate, PostCard, PostIndexRow } from './PostCard';
import { renderContent } from './testHarness';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: query === '(prefers-reduced-motion: reduce)',
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

const MEDIA = { baseUrl: '/', supabaseUrl: '' };

function archive(lang: 'zh' | 'en') {
  const payload = PublishedPostsPayloadSchema.parse({
    contentModel: 'localized-fields-v1',
    categories: POST_CATEGORY_TAXONOMY.map(({ id, channel, label, order }) => ({ id, channel, label, order })),
    posts: [
      {
        id: '185',
        channel: 'news',
        categoryId: 'recruitment',
        owner: 'department',
        publishedOn: '2024-03-05',
        pinned: true,
        title: { zh: '招募臨床教師' },
        summary: { zh: '即日起受理報名。' },
        cover: { kind: 'local', path: 'assets/legacy/article/cover.webp' },
        body: { zh: [] },
        attachments: [],
      },
      {
        id: 'ebm-workshop',
        channel: 'center',
        categoryId: 'center-events',
        owner: 'ebm',
        publishedOn: '2023-11-20',
        pinned: false,
        title: { zh: '實證醫學工作坊', en: 'EBM workshop' },
        body: { zh: [] },
        attachments: [],
      },
    ],
  });
  return adaptPostsArchive(payload, lang, MEDIA);
}

describe('LocalizedText and ChineseOnlyTag', () => {
  it('marks fallback text as Chinese and tags it only in the English UI', () => {
    renderContent(
      <>
        <LocalizedText as="h2" value={{ text: '中文標題', lang: 'zh', fallback: true }} />
        <LocalizedText as="h3" value={{ text: 'English title', lang: 'en', fallback: false }} />
        <ChineseOnlyTag fallback />
        <ChineseOnlyTag fallback={false} />
      </>,
      { lang: 'en' },
    );

    expect(screen.getByRole('heading', { name: '中文標題' }).getAttribute('lang')).toBe('zh-Hant');
    expect(screen.getByRole('heading', { name: 'English title' }).hasAttribute('lang')).toBe(false);
    expect(screen.getAllByText('Chinese only')).toHaveLength(1);
  });

  it('never shows the tag in the Chinese UI', () => {
    renderContent(<ChineseOnlyTag fallback />, { lang: 'zh' });
    expect(screen.queryByText('僅中文')).toBeNull();
    expect(screen.queryByText('Chinese only')).toBeNull();
  });
});

describe('PostCard and PostIndexRow', () => {
  it('renders adapted posts with date, category, pin, cover, and a single link', () => {
    const { posts, categories } = archive('zh');
    const post = posts[0];
    const category = categories.find((candidate) => candidate.id === post.categoryId)?.label;
    const { container } = renderContent(<PostCard post={post} to="/announcements/185" category={category} />);

    const link = screen.getByRole('link', { name: '招募臨床教師' });
    expect(link.getAttribute('href')).toBe('/announcements/185');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(container.querySelector('time')?.getAttribute('dateTime')).toBe('2024-03-05');
    expect(container.querySelector('time')?.textContent).toBe('2024.03.05');
    expect(screen.getByText('招募相關')).toBeTruthy();
    expect(screen.getByText('置頂')).toBeTruthy();
    expect(screen.getByText('即日起受理報名。')).toBeTruthy();
    expect(container.querySelector('.post-card-cover img')?.getAttribute('src')).toBe('/assets/legacy/article/cover.webp');
  });

  it('marks untranslated titles and summaries in English and tags them', () => {
    const { posts } = archive('en');
    renderContent(
      <>
        <PostIndexRow post={posts[0]} to="/announcements/185" />
        <PostIndexRow post={posts[1]} to="/centers/evidence-based-medicine/articles/ebm-workshop" tone={ownerTone('ebm')} />
      </>,
      { lang: 'en' },
    );

    expect(screen.getByRole('heading', { name: '招募臨床教師' }).getAttribute('lang')).toBe('zh-Hant');
    expect(screen.getByText('即日起受理報名。').getAttribute('lang')).toBe('zh-Hant');
    expect(screen.getByRole('heading', { name: 'EBM workshop' }).hasAttribute('lang')).toBe(false);
    expect(screen.getAllByText('Chinese only')).toHaveLength(1);
    expect(screen.getByText('Pinned')).toBeTruthy();
  });

  it('carries the owner tone and leaves department posts on the accent', () => {
    const { posts } = archive('zh');
    const { container } = renderContent(
      <>
        <PostIndexRow post={posts[1]} to="/x" tone={ownerTone(posts[1].owner)} />
        <PostIndexRow post={posts[0]} to="/y" tone={ownerTone(posts[0].owner)} />
      </>,
    );

    const rows = container.querySelectorAll<HTMLElement>('.post-row');
    expect(rows[0].style.getPropertyValue('--tone')).toBe(ownerTone('ebm'));
    expect(ownerTone('ebm')).toMatch(/^#[0-9a-f]{6}$/i);
    expect(rows[1].style.getPropertyValue('--tone')).toBe('');
    expect(ownerTone('digital_materials')).toBeUndefined();
    expect(ownerTone('residents')).toBeUndefined();
  });

  it('shows everything immediately under reduced motion and inside StillMotion', () => {
    const { posts } = archive('zh');
    const { container } = renderContent(
      <StillMotion>
        {posts.map((post) => <PostIndexRow key={post.id} post={post} to={`/p/${post.id}`} />)}
      </StillMotion>,
    );

    const hidden = Array.from(container.querySelectorAll<HTMLElement>('*'))
      .filter((element) => element.style.opacity === '0' || element.style.visibility === 'hidden');
    expect(hidden).toHaveLength(0);
    expect(screen.getAllByRole('heading')).toHaveLength(2);
  });

  it('formats calendar dates and passes anything else through', () => {
    expect(formatArchiveDate('2019-01-02')).toBe('2019.01.02');
    expect(formatArchiveDate('soon')).toBe('soon');
  });
});
