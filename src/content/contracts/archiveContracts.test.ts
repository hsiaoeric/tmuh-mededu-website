import { describe, expect, it } from 'vitest';
import { POST_CATEGORY_TAXONOMY, PROGRAM_TAXONOMY } from '@/data/legacy/taxonomy';
import { POST_CATEGORY_IDS, PROGRAM_IDS } from './archiveIds';
import {
  BlockSchema,
  EditableLocalizedBlocksSchema,
  FileHrefSchema,
  LinkHrefSchema,
  LocalizedBlocksSchema,
  PublishedBlockSchema,
  PublishedLocalizedBlocksSchema,
} from './blocks';
import {
  EditableLocalizedTextSchema,
  LocalizedTitleSchema,
  RunTextSchema,
  setOptionalEnglish,
  setOptionalEnglishBlocks,
} from './localized';
import { CMS_PAYLOAD_REGISTRY } from './registry';

const LOCAL_IMAGE = { kind: 'local', path: 'assets/legacy/article/abc123.webp' } as const;
const DRAFT_IMAGE = {
  kind: 'draft',
  bucket: 'draft-media',
  path: `00000000-0000-4000-8000-000000000000/${'b'.repeat(64)}.webp`,
} as const;
const PARAGRAPH = { type: 'paragraph', runs: [{ text: '內文' }] } as const;

function categories() {
  return POST_CATEGORY_TAXONOMY.map(({ id, channel, label, order }) => ({ id, channel, label, order }));
}

function post(overrides: Record<string, unknown> = {}) {
  return {
    id: '185',
    channel: 'news',
    categoryId: 'hospital-courses',
    owner: 'department',
    publishedOn: '2024-03-01',
    pinned: false,
    title: { zh: '全院性課程公告' },
    body: { zh: [PARAGRAPH] },
    attachments: [],
    ...overrides,
  };
}

function postsPayload(posts: readonly unknown[] = [post()], overrides: Record<string, unknown> = {}) {
  return { contentModel: 'localized-fields-v1', categories: categories(), posts, ...overrides };
}

function programs() {
  return PROGRAM_TAXONOMY.map(({ id, order, title, summary }) => ({ id, order, title, summary }));
}

function departmentPayload(overrides: Record<string, unknown> = {}) {
  return {
    contentModel: 'localized-fields-v1',
    pages: [{
      id: 'director-message',
      section: 'about',
      owner: 'department',
      order: 0,
      title: { zh: '教學部主任', en: 'Director' },
      body: { zh: [PARAGRAPH] },
    }],
    programs: programs(),
    linkGroups: [],
    downloads: [],
    ...overrides,
  };
}

function album(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pgy-2024-retreat',
    owner: 'pgy',
    title: { zh: 'PGY 共識營' },
    photos: [{ id: 'p1', media: LOCAL_IMAGE }],
    ...overrides,
  };
}

function galleryPayload(overrides: Record<string, unknown> = {}) {
  return { contentModel: 'localized-fields-v1', albums: [album()], videos: [], ...overrides };
}

const posts = CMS_PAYLOAD_REGISTRY.posts;
const department = CMS_PAYLOAD_REGISTRY.department_info;
const gallery = CMS_PAYLOAD_REGISTRY.gallery;

function tiers(contract: { editableSchema: { safeParse(value: unknown): { success: boolean } }; schema: { safeParse(value: unknown): { success: boolean } }; publishedSchema: { safeParse(value: unknown): { success: boolean } } }, value: unknown) {
  return {
    editable: contract.editableSchema.safeParse(value).success,
    general: contract.schema.safeParse(value).success,
    published: contract.publishedSchema.safeParse(value).success,
  };
}

describe('localized text', () => {
  it.each([
    ['Chinese only', { zh: '公告' }, true],
    ['both languages', { zh: '公告', en: 'Notice' }, true],
    ['empty English', { zh: '公告', en: '' }, false],
    ['blank English', { zh: '公告', en: '   ' }, false],
    ['empty Chinese', { zh: '', en: 'Notice' }, false],
    ['missing Chinese', { en: 'Notice' }, false],
    ['unknown locale', { zh: '公告', ja: 'お知らせ' }, false],
    ['trailing space', { zh: '公告 ' }, false],
    ['leading tab', { zh: '\t公告' }, false],
    ['leading ideographic space indent', { zh: '　公告' }, true],
    ['only ideographic space', { zh: '　' }, false],
    ['line feed in a title', { zh: '第一行\n第二行' }, false],
    ['carriage return', { zh: '公告\r說明' }, false],
    ['bell control character', { zh: '公告\u0007' }, false],
    ['delete control character', { zh: '公告\u007f' }, false],
    ['200 characters', { zh: '字'.repeat(200) }, true],
    ['201 characters', { zh: '字'.repeat(201) }, false],
  ])('treats %s as published-valid=%s', (_case, value, valid) => {
    expect(LocalizedTitleSchema.safeParse(value).success).toBe(valid);
  });

  it('lets the authoring tier hold empty sides while typing', () => {
    expect(EditableLocalizedTextSchema.safeParse({ zh: '', en: '' }).success).toBe(true);
    expect(EditableLocalizedTextSchema.safeParse({ zh: '' }).success).toBe(true);
    expect(EditableLocalizedTextSchema.safeParse({ zh: 1 }).success).toBe(false);
  });

  it('keeps run edges so words can sit beside a link, but rejects control characters', () => {
    expect(RunTextSchema.safeParse('See ').success).toBe(true);
    expect(RunTextSchema.safeParse('第一行\n第二行').success).toBe(true);
    expect(RunTextSchema.safeParse('').success).toBe(false);
    expect(RunTextSchema.safeParse('a\rb').success).toBe(false);
    expect(RunTextSchema.safeParse('x'.repeat(10_001)).success).toBe(false);
  });

  it('clears English by deleting the key, never by storing an empty string', () => {
    const withEnglish = setOptionalEnglish({ zh: '公告' }, 'Notice');
    const cleared = setOptionalEnglish(withEnglish, '');
    const blocks = setOptionalEnglishBlocks({ zh: [PARAGRAPH], en: [PARAGRAPH] }, []);

    expect(withEnglish).toEqual({ zh: '公告', en: 'Notice' });
    expect(cleared).toEqual({ zh: '公告' });
    expect('en' in cleared).toBe(false);
    expect('en' in blocks).toBe(false);
  });
});

describe('content blocks', () => {
  it.each([
    ['paragraph', { type: 'paragraph', runs: [{ text: '請參閱' }, { text: '說明', strong: true, href: '/announcements' }] }],
    ['heading', { type: 'heading', level: 2, text: '訓練目標' }],
    ['list', { type: 'list', ordered: true, items: [[{ text: '一' }], [{ text: '二' }]] }],
    ['image', { type: 'image', media: LOCAL_IMAGE, alt: '課程海報', caption: '2024 年', width: 1600, height: 900 }],
    ['table', { type: 'table', header: ['日期', '主題'], rows: [['3/1', ''], ['3/8', '實證醫學']] }],
    ['divider', { type: 'divider' }],
    ['video', { type: 'video', youtubeId: 'dQw4w9WgXcQ' }],
  ])('accepts a %s block in both tiers', (_case, block) => {
    expect(BlockSchema.safeParse(block).success).toBe(true);
    expect(PublishedBlockSchema.safeParse(block).success).toBe(true);
  });

  it.each([
    ['unknown type', { type: 'html', html: '<b>x</b>' }],
    ['extra key', { type: 'divider', style: 'bold' }],
    ['empty paragraph', { type: 'paragraph', runs: [] }],
    ['strong false', { type: 'paragraph', runs: [{ text: 'x', strong: false }] }],
    ['heading level 4', { type: 'heading', level: 4, text: '標題' }],
    ['empty list item', { type: 'list', ordered: false, items: [[]] }],
    ['empty list', { type: 'list', ordered: false, items: [] }],
    ['image without alt', { type: 'image', media: LOCAL_IMAGE, alt: '' }],
    ['image zero width', { type: 'image', media: LOCAL_IMAGE, alt: '圖', width: 0 }],
    ['image remote url', { type: 'image', media: 'https://example.com/a.jpg', alt: '圖' }],
    ['table without rows', { type: 'table', rows: [] }],
    ['table with 51 columns', { type: 'table', rows: [Array.from({ length: 51 }, () => 'x')] }],
    ['table cell with line feed', { type: 'table', rows: [['a\nb']] }],
    ['short YouTube id', { type: 'video', youtubeId: 'abc' }],
    ['YouTube URL instead of id', { type: 'video', youtubeId: 'https://youtu.be/dQw4w9WgXcQ' }],
  ])('rejects %s', (_case, block) => {
    expect(BlockSchema.safeParse(block).success).toBe(false);
  });

  it('separates draft image media from the published tier', () => {
    const block = { type: 'image', media: DRAFT_IMAGE, alt: '草稿圖片' };

    expect(BlockSchema.safeParse(block).success).toBe(true);
    expect(PublishedBlockSchema.safeParse(block).success).toBe(false);
  });

  it('allows an empty Chinese body but requires English blocks when English is present', () => {
    expect(LocalizedBlocksSchema.safeParse({ zh: [] }).success).toBe(true);
    expect(LocalizedBlocksSchema.safeParse({ zh: [PARAGRAPH], en: [] }).success).toBe(false);
    expect(LocalizedBlocksSchema.safeParse({ zh: [PARAGRAPH], en: [PARAGRAPH] }).success).toBe(true);
    expect(EditableLocalizedBlocksSchema.safeParse({ zh: [], en: [] }).success).toBe(true);
  });

  it('caps each language at 500 blocks', () => {
    const blocks = (count: number) => Array.from({ length: count }, () => PARAGRAPH);

    expect(PublishedLocalizedBlocksSchema.safeParse({ zh: blocks(500) }).success).toBe(true);
    expect(PublishedLocalizedBlocksSchema.safeParse({ zh: blocks(501) }).success).toBe(false);
  });
});

describe('link targets', () => {
  it.each([
    'https://tmuh.org.tw/education?lang=zh#top',
    'http://eportfolio.tmuh.org.tw/login',
    '/announcements?category=recruitment#board',
    '/centers/evidence-based-medicine',
    'mailto:education@tmuh.org.tw',
    'tel:+886-2-2737-2181',
  ])('accepts %s', (href) => {
    expect(LinkHrefSchema.safeParse(href).success).toBe(true);
  });

  it.each([
    ['javascript URL', 'javascript:alert(1)'],
    ['upper-case javascript URL', 'JavaScript:alert(1)'],
    ['protocol-relative host', '//evil.example/path'],
    ['https credentials', 'https://user:secret@tmuh.org.tw/'],
    ['http credentials', 'http://user@tmuh.org.tw/'],
    ['data URL', 'data:text/html;base64,PHNjcmlwdD4='],
    ['vbscript URL', 'vbscript:msgbox(1)'],
    ['ftp URL', 'ftp://files.tmuh.org.tw/a.pdf'],
    ['relative path', 'announcements'],
    ['backslash host', '/\\evil.example'],
    ['leading space', ' https://tmuh.org.tw'],
    ['whitespace in path', 'https://tmuh.org.tw/a b'],
    ['malformed double scheme', 'http://https://library.tmu.edu.tw'],
    ['mailto without host', 'mailto:someone'],
    ['tel with letters', 'tel:call-me'],
    ['empty string', ''],
  ])('rejects %s', (_case, href) => {
    expect(LinkHrefSchema.safeParse(href).success).toBe(false);
  });

  it('accepts committed legacy files only as attachment targets', () => {
    expect(FileHrefSchema.safeParse('files/legacy/2023/schedule.pdf').success).toBe(true);
    expect(FileHrefSchema.safeParse('https://tmuh.org.tw/a.pdf').success).toBe(true);
    expect(LinkHrefSchema.safeParse('files/legacy/2023/schedule.pdf').success).toBe(false);
    expect(FileHrefSchema.safeParse('files/legacy/../secret.pdf').success).toBe(false);
    expect(FileHrefSchema.safeParse('files/legacy/Schedule.PDF').success).toBe(false);
    expect(FileHrefSchema.safeParse('files/legacy/run.exe').success).toBe(false);
    expect(FileHrefSchema.safeParse('/files/legacy/a.pdf').success).toBe(true);
  });
});

describe('posts contract', () => {
  it('accepts a Chinese-only post in every tier', () => {
    expect(tiers(posts, postsPayload())).toEqual({ editable: true, general: true, published: true });
  });

  it('requires the content model marker', () => {
    const { contentModel: _marker, ...unmarked } = postsPayload();

    expect(tiers(posts, unmarked)).toEqual({ editable: false, general: false, published: false });
    expect(tiers(posts, { ...postsPayload(), contentModel: 'bilingual' }).general).toBe(false);
  });

  it('rejects an empty English title at publish but lets the editor hold it', () => {
    const value = postsPayload([post({ title: { zh: '公告', en: '' } })]);

    expect(tiers(posts, value)).toEqual({ editable: true, general: false, published: false });
  });

  it.each([
    ['a missing category', () => postsPayload([], { categories: categories().slice(1) })],
    ['a duplicated category', () => postsPayload([], { categories: [...categories(), categories()[0]] })],
    ['an unknown category', () => postsPayload([], { categories: [...categories().slice(1), { ...categories()[0], id: 'misc' }] })],
    ['a category moved to another channel', () => postsPayload([], {
      categories: categories().map((category) => category.id === 'recruitment' ? { ...category, channel: 'honors' } : category),
    })],
  ])('rejects %s', (_case, build) => {
    expect(posts.schema.safeParse(build()).success).toBe(false);
    expect(posts.publishedSchema.safeParse(build()).success).toBe(false);
  });

  it('fixes the canonical category set and channel of every id', () => {
    expect(categories().map((category) => category.id)).toEqual(POST_CATEGORY_IDS);
    expect(Object.fromEntries(categories().map((category) => [category.id, category.channel]))).toMatchObject({
      'trainee-notices': 'news',
      'faculty-certification': 'honors',
      'center-events': 'center',
    });
  });

  it.each([
    ['a channel that differs from its category', { channel: 'honors' }],
    ['a center post owned by the department', { channel: 'center', categoryId: 'center-about', owner: 'department' }],
    ['duplicate audiences', { audiences: ['pgy', 'pgy'] }],
    ['an unknown audience', { audiences: ['nurses'] }],
    ['an unknown owner', { owner: 'library' }],
    ['an invalid calendar date', { publishedOn: '2024-02-30' }],
    ['an upper-case id', { id: 'Post-1' }],
    ['an id with an underscore', { id: 'post_1' }],
    ['an 81-character id', { id: 'a'.repeat(81) }],
    ['a javascript attachment', { attachments: [{ id: 'a1', label: { zh: '附件' }, href: 'javascript:alert(1)' }] }],
    ['duplicate attachment ids', { attachments: [
      { id: 'a1', label: { zh: '附件一' }, href: 'files/legacy/a.pdf' },
      { id: 'a1', label: { zh: '附件二' }, href: 'files/legacy/b.pdf' },
    ] }],
  ])('rejects %s', (_case, overrides) => {
    expect(posts.schema.safeParse(postsPayload([post(overrides)])).success).toBe(false);
  });

  it('accepts center posts, program audiences, and legacy numeric ids', () => {
    const value = postsPayload([
      post({ id: '185', audiences: ['pgy', 'residents'] }),
      post({ id: '43', channel: 'center', categoryId: 'center-about', owner: 'ebm' }),
      post({ id: 'board-1', channel: 'honors', categoryId: 'teaching-recognition', owner: 'department' }),
    ]);

    expect(posts.publishedSchema.safeParse(value).success).toBe(true);
  });

  it('rejects duplicate post ids', () => {
    expect(posts.schema.safeParse(postsPayload([post(), post()])).success).toBe(false);
  });

  it('keeps draft cover media out of the published tier', () => {
    const value = postsPayload([post({ cover: DRAFT_IMAGE })]);

    expect(tiers(posts, value)).toEqual({ editable: true, general: true, published: false });
    expect(tiers(posts, postsPayload([post({ cover: LOCAL_IMAGE })])).published).toBe(true);
  });

  it('caps the archive at 3000 posts', () => {
    const many = (count: number) => Array.from({ length: count }, (_, index) => post({ id: String(index) }));

    expect(posts.schema.safeParse(postsPayload(many(3000))).success).toBe(true);
    expect(posts.schema.safeParse(postsPayload(many(3001))).success).toBe(false);
  });

  it('returns issues instead of throwing for structurally malformed payloads', () => {
    const malformed = [null, [], { contentModel: 'localized-fields-v1' }, postsPayload('nope' as unknown as unknown[])];

    for (const value of malformed) {
      expect(() => posts.publishedSchema.safeParse(value)).not.toThrow();
      expect(posts.publishedSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe('department_info contract', () => {
  it('accepts the canonical programs and a department page', () => {
    expect(tiers(department, departmentPayload())).toEqual({ editable: true, general: true, published: true });
    expect(programs().map((program) => program.id)).toEqual(PROGRAM_IDS);
  });

  it.each([
    ['a missing program', () => departmentPayload({ programs: programs().slice(1) })],
    ['a duplicated program', () => departmentPayload({ programs: [...programs().slice(1), programs()[1]] })],
    ['an unknown program', () => departmentPayload({ programs: [...programs().slice(1), { ...programs()[0], id: 'nurses' }] })],
  ])('rejects %s', (_case, build) => {
    expect(department.schema.safeParse(build()).success).toBe(false);
  });

  function programPage(overrides: Record<string, unknown> = {}) {
    return { id: 'pgy-intro', section: 'program', owner: 'pgy', order: 0, title: { zh: 'PGY 簡介' }, body: { zh: [PARAGRAPH] }, ...overrides };
  }

  function withProgramPage(page: Record<string, unknown>, field = 'introPageId') {
    return departmentPayload({
      pages: [page],
      programs: programs().map((program) => program.id === 'pgy' ? { ...program, [field]: 'pgy-intro' } : program),
    });
  }

  it('accepts program page references owned by that program', () => {
    for (const field of ['introPageId', 'outcomesPageId', 'schedulePageId']) {
      expect(department.publishedSchema.safeParse(withProgramPage(programPage(), field)).success, field).toBe(true);
    }
  });

  it.each([
    ['a page that does not exist', departmentPayload({ programs: programs().map((program) => ({ ...program, introPageId: 'missing' })) })],
    ['a page in another section', withProgramPage(programPage({ section: 'about' }))],
    ['a page owned by another program', withProgramPage(programPage({ owner: 'residents' }))],
    ['a page with no owner', withProgramPage(programPage({ owner: undefined }))],
  ])('rejects a program reference to %s', (_case, value) => {
    expect(department.schema.safeParse(value).success).toBe(false);
  });

  it.each([
    ['duplicate page ids', departmentPayload({ pages: [programPage(), programPage()] })],
    ['an unknown page section', departmentPayload({ pages: [programPage({ section: 'misc' })] })],
    ['duplicate link ids in a group', departmentPayload({ linkGroups: [{
      id: 'related', owner: 'department', purpose: 'related', order: 0, title: { zh: '相關連結' },
      links: [
        { id: 'tmu', label: { zh: '北醫大' }, href: 'https://www.tmu.edu.tw' },
        { id: 'tmu', label: { zh: '北醫大' }, href: 'https://www.tmu.edu.tw' },
      ],
    }] })],
    ['a javascript link', departmentPayload({ linkGroups: [{
      id: 'related', owner: 'department', purpose: 'related', order: 0, title: { zh: '相關連結' },
      links: [{ id: 'x', label: { zh: '連結' }, href: 'javascript:void(0)' }],
    }] })],
    ['a link group with an unknown purpose', departmentPayload({ linkGroups: [{
      id: 'related', owner: 'department', purpose: 'misc', order: 0, title: { zh: '相關連結' }, links: [],
    }] })],
    ['duplicate download groups', departmentPayload({ downloads: [
      { id: 'forms', owner: 'pgy', title: { zh: '表單' }, items: [] },
      { id: 'forms', owner: 'pgy', title: { zh: '表單' }, items: [] },
    ] })],
    ['a download with a local file outside files/legacy', departmentPayload({ downloads: [
      { id: 'forms', owner: 'pgy', title: { zh: '表單' }, items: [{ id: 'f1', label: { zh: '表單' }, href: 'assets/form.pdf' }] },
    ] })],
  ])('rejects %s', (_case, value) => {
    expect(department.schema.safeParse(value).success).toBe(false);
  });

  it('keeps draft portraits out of the published tier', () => {
    const value = departmentPayload({ pages: [{ ...programPage(), portrait: DRAFT_IMAGE }] });

    expect(tiers(department, value)).toEqual({ editable: true, general: true, published: false });
  });
});

describe('gallery contract', () => {
  it('accepts an album and a video', () => {
    const value = galleryPayload({ videos: [{ id: 'pgy-intro', owner: 'pgy', title: { zh: '介紹影片' }, youtubeId: 'dQw4w9WgXcQ' }] });

    expect(tiers(gallery, value)).toEqual({ editable: true, general: true, published: true });
  });

  it('requires at least one photo per saved album but lets the editor start empty', () => {
    expect(tiers(gallery, galleryPayload({ albums: [album({ photos: [] })] }))).toEqual({ editable: true, general: false, published: false });
  });

  it('caps an album at 500 photos', () => {
    const photos = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `p${index}`, media: LOCAL_IMAGE }));

    expect(gallery.schema.safeParse(galleryPayload({ albums: [album({ photos: photos(500) })] })).success).toBe(true);
    expect(gallery.schema.safeParse(galleryPayload({ albums: [album({ photos: photos(501) })] })).success).toBe(false);
  });

  it.each([
    ['duplicate album ids', galleryPayload({ albums: [album(), album()] })],
    ['duplicate photo ids', galleryPayload({ albums: [album({ photos: [{ id: 'p1', media: LOCAL_IMAGE }, { id: 'p1', media: LOCAL_IMAGE }] })] })],
    ['an unknown owner', galleryPayload({ albums: [album({ owner: 'nurses' })] })],
    ['duplicate YouTube ids', galleryPayload({ videos: [
      { id: 'a', owner: 'pgy', title: { zh: '影片一' }, youtubeId: 'dQw4w9WgXcQ' },
      { id: 'b', owner: 'ebm', title: { zh: '影片二' }, youtubeId: 'dQw4w9WgXcQ' },
    ] })],
    ['an invalid YouTube id', galleryPayload({ videos: [{ id: 'a', owner: 'pgy', title: { zh: '影片' }, youtubeId: 'not-an-id' }] })],
  ])('rejects %s', (_case, value) => {
    expect(gallery.schema.safeParse(value).success).toBe(false);
  });

  it('keeps draft photos out of the published tier', () => {
    const value = galleryPayload({ albums: [album({ photos: [{ id: 'p1', media: DRAFT_IMAGE }] })] });

    expect(tiers(gallery, value)).toEqual({ editable: true, general: true, published: false });
  });
});
