// @vitest-environment jsdom

import { cleanup, fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { issuesFor, renderArchiveEditor, snapshotPayload } from '../archiveTestHarness';
import { publishedArchiveIds } from '../lockedIds';
import { GalleryEditor } from './GalleryEditor';

afterEach(cleanup);

const payload = snapshotPayload('gallery');
const lockedIds = publishedArchiveIds('gallery', payload as never);

describe('GalleryEditor', () => {
  it('adds a video from a pasted YouTube link and stores only its id', () => {
    const view = renderArchiveEditor('gallery', GalleryEditor, payload, { lockedIds });
    fireEvent.click(view.getByRole('button', { name: '新增影片' }));
    const added = view.latest().videos.slice(-1)[0]!;
    expect(added.id).toBe('video-1');
    const field = view.getByRole('textbox', { name: /^YouTube 網址或影片 ID/ });
    fireEvent.change(field, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s' } });
    expect(view.latest().videos.slice(-1)[0]?.youtubeId).toBe('dQw4w9WgXcQ');
    fireEvent.change(view.getByRole('textbox', { name: /^影片標題（中文）/ }), { target: { value: '新影片' } });
    expect(CMS_PAYLOAD_REGISTRY.gallery.schema.safeParse(view.latest()).success).toBe(true);
  });

  it('warns at once when a video is already on the board and the contract rejects it', () => {
    const view = renderArchiveEditor('gallery', GalleryEditor, payload, { lockedIds });
    fireEvent.click(view.getByRole('button', { name: '新增影片' }));
    const existing = payload.videos[0]!.youtubeId;
    const field = view.getByRole('textbox', { name: /^YouTube 網址或影片 ID/ });
    fireEvent.change(field, { target: { value: `https://youtu.be/${existing}` } });
    expect(view.getByText('另一部影片已使用這個 YouTube 影片。')).toBeTruthy();
    // The contract checks duplicates once every field is otherwise valid.
    fireEvent.change(view.getByRole('textbox', { name: /^影片標題（中文）/ }), { target: { value: '重複的影片' } });
    expect(issuesFor('gallery', view.latest()).map((summary) => summary.message)).toContain(`識別碼「${existing}」重複。`);
  });

  it('rejects text that is not a YouTube video with an explanation', () => {
    const view = renderArchiveEditor('gallery', GalleryEditor, payload, { lockedIds });
    fireEvent.click(view.getByRole('button', { name: '新增影片' }));
    const field = view.getByRole('textbox', { name: /^YouTube 網址或影片 ID/ });
    fireEvent.change(field, { target: { value: 'https://vimeo.com/123' } });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(view.getByText(/無法辨識這個 YouTube 影片網址/)).toBeTruthy();
  });

  it('reorders album photos and adds one by linking an image', () => {
    const index = payload.albums.findIndex((album) => album.photos.length >= 2);
    const album = payload.albums[index]!;
    const view = renderArchiveEditor('gallery', GalleryEditor, payload, { lockedIds });
    const row = view.container.querySelector<HTMLElement>(`[data-archive-list="gallery-albums-list"][data-archive-row-index="${index}"]`)!;
    fireEvent.click(within(row).getByRole('button', { expanded: false }));
    expect((view.getByRole('textbox', { name: /^相簿識別碼/ }) as HTMLInputElement).readOnly).toBe(true);
    fireEvent.click(view.getByRole('button', { name: '下移照片 1' }));
    const moved = view.latest().albums[index]!.photos;
    expect(moved.map((photo) => photo.id).slice(0, 2)).toEqual([album.photos[1]!.id, album.photos[0]!.id]);

    fireEvent.click(view.getByRole('button', { name: '新增照片' }));
    const path = view.getByRole('textbox', { name: /^新照片.*網站圖片路徑/ });
    fireEvent.change(path, { target: { value: 'assets/legacy/album/new-photo.webp' } });
    const photos = view.latest().albums[index]!.photos;
    expect(photos).toHaveLength(album.photos.length + 1);
    expect(photos.slice(-1)[0]).toEqual({ id: 'photo-1', media: { kind: 'local', path: 'assets/legacy/album/new-photo.webp' } });
  });
});
