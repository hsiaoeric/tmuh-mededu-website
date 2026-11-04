import { describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { POST_CATEGORY_TAXONOMY, PROGRAM_TAXONOMY } from '@/data/legacy/taxonomy';
import {
  adaptDepartmentInfo,
  adaptGalleryLibrary,
  adaptPostsArchive,
  pickLocalized,
  pickLocalizedBlocks,
  resolveFileHref,
} from './archive';

const MEDIA = { baseUrl: '/tmuh-mededu-website/', supabaseUrl: 'https://example.supabase.co' };
const PARAGRAPH = { type: 'paragraph', runs: [{ text: '內文' }] } as const;
const EN_PARAGRAPH = { type: 'paragraph', runs: [{ text: 'Body' }] } as const;

describe('localized picks', () => {
  it('reads Chinese in the Chinese UI without a fallback', () => {
    expect(pickLocalized({ zh: '公告', en: 'Notice' }, 'zh')).toEqual({ text: '公告', lang: 'zh', fallback: false });
  });

  it('reads English when it exists', () => {
    expect(pickLocalized({ zh: '公告', en: 'Notice' }, 'en')).toEqual({ text: 'Notice', lang: 'en', fallback: false });
  });

  it('falls back to Chinese, marked, when English is absent', () => {
    expect(pickLocalized({ zh: '公告' }, 'en')).toEqual({ text: '公告', lang: 'zh', fallback: true });
    expect(pickLocalizedBlocks({ zh: [PARAGRAPH] }, 'en')).toEqual({ blocks: [PARAGRAPH], lang: 'zh', fallback: true });
    expect(pickLocalizedBlocks({ zh: [PARAGRAPH], en: [EN_PARAGRAPH] }, 'en')).toEqual({ blocks: [EN_PARAGRAPH], lang: 'en', fallback: false });
  });

  it('resolves committed files against the deployed base and leaves links alone', () => {
    expect(resolveFileHref('files/legacy/a.pdf', MEDIA)).toEqual({ href: '/tmuh-mededu-website/files/legacy/a.pdf', kind: 'file' });
    expect(resolveFileHref('https://tmuh.org.tw/a.pdf', MEDIA)).toEqual({ href: 'https://tmuh.org.tw/a.pdf', kind: 'https' });
    expect(resolveFileHref('/resources#links', MEDIA)).toEqual({ href: '/resources#links', kind: 'internal' });
  });
});

describe('archive adapters', () => {
  it('orders posts newest first and categories by their order', () => {
    const payload = CMS_PAYLOAD_REGISTRY.posts.publishedSchema.parse({
      contentModel: 'localized-fields-v1',
      categories: [...POST_CATEGORY_TAXONOMY].reverse().map(({ id, channel, label, order }) => ({ id, channel, label, order })),
      posts: [
        { id: '1', channel: 'news', categoryId: 'recruitment', owner: 'department', publishedOn: '2020-01-01', pinned: false, title: { zh: '舊' }, body: { zh: [] }, attachments: [] },
        {
          id: '2', channel: 'news', categoryId: 'recruitment', owner: 'department', publishedOn: '2024-05-01', pinned: true,
          title: { zh: '新', en: 'New' }, cover: { kind: 'local', path: 'assets/legacy/article/x.webp' }, body: { zh: [PARAGRAPH] },
          attachments: [{ id: 'f', label: { zh: '附件' }, href: 'files/legacy/f.pdf' }],
        },
      ],
    });

    const adapted = adaptPostsArchive(payload, 'en', MEDIA);

    expect(adapted.categories.map((category) => category.id)).toEqual(POST_CATEGORY_TAXONOMY.map((category) => category.id));
    expect(adapted.categories[0]?.label).toEqual({ text: 'Hospital-wide courses', lang: 'en', fallback: false });
    expect(adapted.posts.map((post) => post.id)).toEqual(['2', '1']);
    expect(adapted.posts[0]).toMatchObject({
      title: { text: 'New', lang: 'en', fallback: false },
      coverUrl: '/tmuh-mededu-website/assets/legacy/article/x.webp',
      audiences: [],
      summary: null,
      attachments: [{ id: 'f', href: '/tmuh-mededu-website/files/legacy/f.pdf', kind: 'file' }],
    });
    expect(adapted.posts[1]?.title).toEqual({ text: '舊', lang: 'zh', fallback: true });
  });

  it('projects programs from the taxonomy and gallery covers from the first photo', () => {
    const department = CMS_PAYLOAD_REGISTRY.department_info.publishedSchema.parse({
      contentModel: 'localized-fields-v1',
      pages: [],
      programs: PROGRAM_TAXONOMY.map(({ id, order, title, summary }) => ({ id, order, title, summary })),
      linkGroups: [],
      downloads: [],
    });
    const gallery = CMS_PAYLOAD_REGISTRY.gallery.publishedSchema.parse({
      contentModel: 'localized-fields-v1',
      albums: [{ id: 'a', owner: 'pgy', title: { zh: '相簿' }, photos: [{ id: 'p', media: { kind: 'local', path: 'assets/legacy/album/p.webp' } }] }],
      videos: [{ id: 'v', owner: 'ebm', title: { zh: '影片' }, youtubeId: 'dQw4w9WgXcQ' }],
    });

    const programs = adaptDepartmentInfo(department, 'zh', MEDIA).programs;
    const library = adaptGalleryLibrary(gallery, 'en', MEDIA);

    expect(programs.map((program) => program.id)).toEqual(['residents', 'pgy', 'medical-students', 'allied-health-trainees', 'joint-training']);
    expect(programs[0]).toMatchObject({ title: { text: '住院醫師', lang: 'zh', fallback: false }, introPageId: null, coverUrl: null });
    expect(library.albums[0]).toMatchObject({
      coverUrl: '/tmuh-mededu-website/assets/legacy/album/p.webp',
      title: { text: '相簿', lang: 'zh', fallback: true },
      photos: [{ id: 'p', url: '/tmuh-mededu-website/assets/legacy/album/p.webp', alt: null }],
    });
    expect(library.videos[0]).toMatchObject({ youtubeId: 'dQw4w9WgXcQ', publishedOn: null });
  });
});
