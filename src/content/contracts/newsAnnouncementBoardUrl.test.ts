import { describe, expect, it } from 'vitest';
import { ANN_URL } from '@/data/news';
import snapshot from '../generated/cms-snapshot.json';
import { NewsPayloadSchema } from './news';

function sourcePayload() {
  const row = snapshot.find((candidate) => candidate.kind === 'news');
  if (row === undefined) throw new TypeError('Missing news snapshot');
  return row.payload;
}

describe('news announcement board URL contract', () => {
  it('requires one canonical shared root URL and keeps locale branches free of copies', () => {
    // Given
    const payload = sourcePayload();
    const missingPayload = { zh: payload.zh, en: payload.en };

    // When
    const present = NewsPayloadSchema.safeParse(payload);
    const missing = NewsPayloadSchema.safeParse(missingPayload);

    // Then
    expect(present.success).toBe(true);
    expect(missing.success).toBe(false);
    if (!present.success) return;
    expect(present.data.announcementBoardUrl).toBe(ANN_URL);
    expect(present.data.zh).not.toHaveProperty('announcementBoardUrl');
    expect(present.data.en).not.toHaveProperty('announcementBoardUrl');
  });

  it.each([
    ['news_board_http', 'HTTP', 'http://example.test/board'],
    ['news_board_credentials', 'credentials', 'https://editor:secret@example.test/board'],
    ['news_board_leading_whitespace', 'leading whitespace', ' https://example.test/board'],
    ['news_board_trailing_whitespace', 'trailing whitespace', 'https://example.test/board '],
    ['news_board_malformed_host', 'malformed URL', 'https://-example.test/board'],
    ['news_board_unicode_host', 'Unicode host', 'https://K.example/board'],
    ['news_board_empty_port', 'empty port', 'https://example.test:/board'],
    ['news_board_zero_port', 'zero port', 'https://example.test:0/board'],
    ['news_board_out_of_range_port', 'out-of-range port', 'https://example.test:65536/board'],
  ] as const)('%s rejects %s through the canonical HTTPS subset at the root issue path', (_caseName, _label, value) => {
    // Given
    const payload = { ...sourcePayload(), announcementBoardUrl: value };

    // When
    const result = NewsPayloadSchema.safeParse(payload);

    // Then
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues).toContainEqual(expect.objectContaining({
      path: ['announcementBoardUrl'],
      message: 'External URL must use HTTPS with a DNS host, no credentials or whitespace, and a valid port',
    }));
  });

  it('news_board_missing', () => {
    const payload = sourcePayload();
    expect(NewsPayloadSchema.safeParse({ zh: payload.zh, en: payload.en }).success).toBe(false);
  });
});
