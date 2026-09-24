import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ANN_URL } from '@/data/news';

const CURRENT_ANNOUNCEMENT_BOARD_URL =
  'https://script.google.com/a/macros/h.tmu.edu.tw/s/AKfycby2MW_ys1HQsgsgb_HnP0gKucbWONkN_cA_aFM3P98GJCS6f5B0JP4zTmiDeEVMjgnB/exec';

describe('CMS-backed public announcement board consumers', () => {
  it('keeps the snapshot fallback while both rendered hrefs use adapted news', () => {
    // Given
    const consumerSources = [
      new URL('./home/News.tsx', import.meta.url),
      new URL('./AnnouncementsPage.tsx', import.meta.url),
    ].map((path) => readFileSync(path, 'utf8'));

    // When / Then
    expect(ANN_URL).toBe(CURRENT_ANNOUNCEMENT_BOARD_URL);
    for (const source of consumerSources) {
      expect(source).toContain("usePublicContentDocument('news', 'announcements', lang)");
      expect(source).toContain('href={news.announcementBoardUrl}');
      expect(source).not.toContain("import { ANN_URL }");
    }
  });
});
