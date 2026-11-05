import { describe, expect, it } from 'vitest';
import redirects from '@/data/legacy/redirects.json';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { snapshotPayload } from './archiveTestHarness';
import { convertBlock, createBlock, moveItem, addTableColumn, removeTableColumn, setTableHeader } from './blocks/blockModel';
import { checkHref, hrefErrorMessage } from './hrefs';
import { isSlugId, newPostId, nextSequencedId, slugIdProblem } from './ids';
import { legacyArchiveIds, mergeLockedIds, publishedArchiveIds } from './lockedIds';
import { compactOptionalLocalized, setOptionalEnglish, setOptionalEnglishBlocks } from './localizedValue';
import { archiveMediaSlots } from './media/archiveMediaSlots';
import { changePostChannel, createPost, filteredPostIndexes, NO_FILTERS, setPostAudience } from './posts/postsModel';
import { parseYoutubeId } from './youtube';

describe('parseYoutubeId', () => {
  it.each([
    ['uu_RKgOvtAE', 'uu_RKgOvtAE'],
    ['https://www.youtube.com/watch?v=uu_RKgOvtAE', 'uu_RKgOvtAE'],
    ['https://www.youtube.com/watch?feature=share&v=uu_RKgOvtAE&t=42s', 'uu_RKgOvtAE'],
    ['youtube.com/watch?v=uu_RKgOvtAE', 'uu_RKgOvtAE'],
    ['https://m.youtube.com/watch?v=uu_RKgOvtAE', 'uu_RKgOvtAE'],
    ['https://youtu.be/uu_RKgOvtAE?si=abc', 'uu_RKgOvtAE'],
    ['https://www.youtube.com/embed/uu_RKgOvtAE', 'uu_RKgOvtAE'],
    ['https://www.youtube-nocookie.com/embed/uu_RKgOvtAE?rel=0', 'uu_RKgOvtAE'],
    ['https://www.youtube.com/shorts/uu_RKgOvtAE', 'uu_RKgOvtAE'],
    ['https://www.youtube.com/live/uu_RKgOvtAE', 'uu_RKgOvtAE'],
    ['  https://youtu.be/uu_RKgOvtAE  ', 'uu_RKgOvtAE'],
  ])('reads %s', (input, expected) => {
    expect(parseYoutubeId(input)).toBe(expected);
  });

  it.each([
    '',
    'uu_RKgOvtA',
    'https://www.youtube.com/playlist?list=PL123',
    'https://www.youtube.com/@channel/videos',
    'https://example.com/watch?v=uu_RKgOvtAE',
    'https://evil.youtube.com.example/watch?v=uu_RKgOvtAE',
    'javascript:alert(1)',
    'ftp://youtu.be/uu_RKgOvtAE',
  ])('rejects %s', (input) => {
    expect(parseYoutubeId(input)).toBeNull();
  });
});

describe('archive ids', () => {
  it('derives a unique slug id for a new post from its date and a sequence', () => {
    expect(newPostId('2026-11-04', ['185', '2026-11-04-1'])).toBe('2026-11-04-2');
    expect(newPostId('not-a-date', [])).toBe('post-1');
    expect(isSlugId(newPostId('2026-11-04', []))).toBe(true);
    expect(nextSequencedId('tmuh', ['tmuh-1', 'tmuh-2'])).toBe('tmuh-3');
  });

  it('reports empty, malformed, and duplicate ids', () => {
    expect(slugIdProblem('', [])).toBe('empty');
    expect(slugIdProblem('Bad_Id', [])).toBe('format');
    expect(slugIdProblem('a--b', [])).toBe('format');
    expect(slugIdProblem('185', ['185'])).toBe('duplicate');
    expect(slugIdProblem('2026-11-04-1', ['185'])).toBeNull();
  });

  it('locks every post, page, and album a legacy redirect points at', () => {
    const legacy = legacyArchiveIds(redirects);
    const posts = snapshotPayload('posts');
    const info = snapshotPayload('department_info');
    const gallery = snapshotPayload('gallery');
    expect(legacy.posts?.size).toBeGreaterThan(50);
    expect(legacy.posts?.has('185') || legacy.posts?.has(posts.posts[0]!.id)).toBe(true);
    expect(legacy.pages?.has('director-message')).toBe(true);
    expect([...legacy.albums ?? []].every((id) => gallery.albums.some((album) => album.id === id))).toBe(true);
    expect([...legacy.pages ?? []].every((id) => info.pages.some((page) => page.id === id))).toBe(true);
  });

  it('locks the ids of the published revision and merges both sources', () => {
    const published = publishedArchiveIds('gallery', { contentModel: 'localized-fields-v1', albums: [{ id: 'a' }], videos: [{ id: 'v' }] });
    expect([...published.albums ?? []]).toEqual(['a']);
    expect([...published.videos ?? []]).toEqual(['v']);
    const merged = mergeLockedIds(published, { albums: new Set(['b']) });
    expect([...merged.albums ?? []].sort()).toEqual(['a', 'b']);
    expect(publishedArchiveIds('posts', null).posts?.size).toBe(0);
  });
});

describe('optional English', () => {
  it('deletes the en key when English is cleared instead of storing an empty string', () => {
    const value = setOptionalEnglish({ zh: '標題', en: 'Title' }, '');
    expect(value).toEqual({ zh: '標題' });
    expect('en' in value).toBe(false);
    expect(setOptionalEnglish({ zh: '標題' }, 'Title')).toEqual({ zh: '標題', en: 'Title' });
  });

  it('deletes an empty English body and an optional field left blank', () => {
    expect(setOptionalEnglishBlocks({ zh: [], en: [{ type: 'divider' }] }, [])).toEqual({ zh: [] });
    expect(compactOptionalLocalized({ zh: '' })).toBeUndefined();
    expect(compactOptionalLocalized({ zh: '', en: 'x' })).toEqual({ zh: '', en: 'x' });
  });
});

describe('links', () => {
  it('accepts the published contract’s link forms and rejects the rest', () => {
    expect(checkHref('https://example.org/a', false)).toEqual({ status: 'valid', kind: 'https' });
    expect(checkHref('http://ceep2.tmu.edu.tw/', false)).toEqual({ status: 'valid', kind: 'http' });
    expect(checkHref('/announcements/185#top', false)).toEqual({ status: 'valid', kind: 'internal' });
    expect(checkHref('mailto:a@tmu.edu.tw', false)).toEqual({ status: 'valid', kind: 'mailto' });
    expect(checkHref('files/legacy/downloads/a.pdf', true)).toEqual({ status: 'valid', kind: 'file' });
    expect(checkHref('files/legacy/downloads/a.pdf', false).status).toBe('invalid');
    expect(checkHref('javascript:alert(1)', false).status).toBe('invalid');
    expect(checkHref('//evil.example', false).status).toBe('invalid');
    expect(hrefErrorMessage(checkHref('javascript:x', false), false, true)).toContain('https://');
  });
});

describe('blocks', () => {
  it('moves items and converts text blocks keeping their text', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
    const paragraph = { type: 'paragraph' as const, runs: [{ text: '甲' }, { text: '乙', strong: true as const }] };
    expect(convertBlock(paragraph, 'heading')).toEqual({ type: 'heading', level: 2, text: '甲乙' });
    expect(convertBlock(paragraph, 'list')).toEqual({ type: 'list', ordered: false, items: [paragraph.runs] });
    expect(convertBlock({ type: 'paragraph', runs: [{ text: 'https://youtu.be/uu_RKgOvtAE' }] }, 'video')).toEqual({ type: 'video', youtubeId: 'uu_RKgOvtAE' });
  });

  it('keeps tables rectangular when columns and the header change', () => {
    const table = createBlock('table');
    if (table.type !== 'table') throw new TypeError('expected a table');
    const wider = addTableColumn(setTableHeader(table, true));
    expect(wider.header).toEqual(['', '', '']);
    expect(wider.rows.every((row) => row.length === 3)).toBe(true);
    const narrower = removeTableColumn(wider, 0);
    expect(narrower.rows.every((row) => row.length === 2)).toBe(true);
    expect('header' in setTableHeader(narrower, false)).toBe(false);
  });
});

describe('posts model', () => {
  const payload = snapshotPayload('posts');

  it('creates a valid empty post at the end without disturbing existing ids', () => {
    const post = createPost(payload, { today: '2026-11-04', channel: 'honors' });
    expect(post.channel).toBe('honors');
    expect(post.categoryId).toBe('teaching-recognition');
    expect(payload.posts.some((existing) => existing.id === post.id)).toBe(false);
    const filled = { ...post, title: { zh: '新文章' } };
    expect(CMS_PAYLOAD_REGISTRY.posts.schema.safeParse({ ...payload, posts: [...payload.posts, filled] }).success).toBe(true);
  });

  it('keeps channel, category, and owner consistent when the channel changes', () => {
    const post = createPost(payload, { today: '2026-11-04' });
    const center = changePostChannel(post, 'center', payload.categories);
    expect(center.categoryId).toBe('center-about');
    expect(center.owner).not.toBe('department');
  });

  it('stores audiences in program order and drops an empty list', () => {
    const post = createPost(payload, { today: '2026-11-04' });
    const both = setPostAudience(setPostAudience(post, 'residents', true), 'pgy', true);
    expect(both.audiences).toEqual(['residents', 'pgy']);
    expect('audiences' in setPostAudience(setPostAudience(both, 'pgy', false), 'residents', false)).toBe(false);
  });

  it('filters by channel, category, year, and text and sorts newest first', () => {
    const all = filteredPostIndexes(payload.posts, NO_FILTERS);
    expect(all).toHaveLength(payload.posts.length);
    const dates = all.map((index) => payload.posts[index]!.publishedOn);
    expect([...dates].sort().reverse()).toEqual(dates);
    const honors = filteredPostIndexes(payload.posts, { ...NO_FILTERS, channel: 'honors' });
    expect(honors.every((index) => payload.posts[index]!.channel === 'honors')).toBe(true);
    const sample = payload.posts[0]!;
    const byText = filteredPostIndexes(payload.posts, { ...NO_FILTERS, query: sample.title.zh.slice(0, 6), year: sample.publishedOn.slice(0, 4) });
    expect(byText).toContain(0);
  });
});

describe('media slots', () => {
  it('lists every image reference in the archive documents', () => {
    const posts = archiveMediaSlots('posts', snapshotPayload('posts'));
    const gallery = archiveMediaSlots('gallery', snapshotPayload('gallery'));
    expect(posts.some((slot) => slot.slotKind === 'post-block-image')).toBe(true);
    expect(gallery.filter((slot) => slot.slotKind === 'album-photo').length).toBe(snapshotPayload('gallery').albums.reduce((sum, album) => sum + album.photos.length, 0));
    const first = posts[0]!;
    expect(first.path[0]).toBe('posts');
    expect(first.path.slice(-1)[0]).toMatch(/^(cover|media)$/);
  });
});
