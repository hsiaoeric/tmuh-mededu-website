import { describe, expect, it } from 'vitest';
import {
  addAnnouncement,
  addLine,
  moveAnnouncement,
  removeAnnouncement,
  setAnnouncementPinned,
  updateAnnouncementShared,
  updateLine,
} from './newsModel';
import type { NewsMutationResult } from './newsTypes';
import { newsFixture } from './testFixture';

function accepted(result: NewsMutationResult) {
  if (!result.ok) throw new TypeError(`Unexpected mutation failure: ${result.reason}`);
  return result;
}

describe('news paired collection model', () => {
  it('assigns deterministic collision-free shared IDs and canonical dates to new rows', () => {
    // Given
    const source = newsFixture();

    // When
    const first = accepted(addAnnouncement(source, 'department')).payload;
    const second = accepted(addAnnouncement(first, 'holistic')).payload;

    // Then
    expect(first.zh.department[first.zh.department.length - 1]?.id).toBe('new-announcement-1');
    expect(first.en.department[first.en.department.length - 1]?.id).toBe('new-announcement-1');
    expect(second.zh.holistic[second.zh.holistic.length - 1]?.id).toBe('new-announcement-2');
    expect(second.en.holistic[second.en.holistic.length - 1]?.publishedOn).toBe('1970-01-01');
  });

  it('updates shared pinning and canonical dates across locales while preserving IDs', () => {
    // Given
    const source = newsFixture();
    const id = source.zh.department[0]?.id;

    // When
    const pinned = accepted(setAnnouncementPinned(source, 'department', 0, true)).payload;
    const dated = accepted(updateAnnouncementShared(pinned, 'department', 0, (row) => ({ ...row, publishedOn: '2026-12-31' }))).payload;

    // Then
    expect(dated.zh.department[0]).toMatchObject({ id, pinned: true, publishedOn: '2026-12-31' });
    expect(dated.en.department[0]).toMatchObject({ id, pinned: true, publishedOn: '2026-12-31' });
  });

  it('preserves paired identities through manual reorder and removal', () => {
    // Given
    const source = newsFixture();
    const firstId = source.zh.department[0]?.id;

    // When
    const moved = accepted(moveAnnouncement(source, 'department', 0, 1)).payload;
    const removed = accepted(removeAnnouncement(moved, 'department', 0)).payload;

    // Then
    expect(moved.zh.department[1]?.id).toBe(firstId);
    expect(moved.en.department[1]?.id).toBe(firstId);
    expect(removed.zh.department.map((row) => row.id)).toEqual(removed.en.department.map((row) => row.id));
  });

  it('edits nested localized lines without changing semantic identity', () => {
    // Given
    const source = newsFixture();
    const added = accepted(addLine(source, { scope: 'department', index: 0, locale: 'zh' })).payload;
    const lineIndex = (added.zh.department[0]?.lines.length ?? 0) - 1;

    // When
    const edited = accepted(updateLine(added, { scope: 'department', index: 0, locale: 'zh', lineIndex }, '新增內容')).payload;

    // Then
    expect(edited.zh.department[0]?.lines[lineIndex]).toBe('新增內容');
    expect(edited.zh.department[0]?.id).toBe(source.zh.department[0]?.id);
  });
});
