import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const FIXTURE_PAYLOAD = '(select payload from news_board_payload)';
const VALID_HTTPS_INPUT = `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', '"https://example.test/board"')`;
const DENIAL_CASES = [
  { name: 'news_board_missing', input: `${FIXTURE_PAYLOAD} - 'announcementBoardUrl'` },
  { name: 'news_board_http', input: `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', '"http://example.test/board"')` },
  { name: 'news_board_credentials', input: `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', '"https://editor:secret@example.test/board"')` },
  { name: 'news_board_leading_whitespace', input: `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', '" https://example.test/board"')` },
  { name: 'news_board_trailing_whitespace', input: `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', '"https://example.test/board "')` },
  { name: 'news_board_malformed_host', input: `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', '"https://-example.test/board"')` },
  { name: 'news_board_unicode_host', input: `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', to_jsonb('https://K.example/board'::text))` },
  { name: 'news_board_empty_port', input: `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', '"https://example.test:/board"')` },
  { name: 'news_board_zero_port', input: `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', '"https://example.test:0/board"')` },
  { name: 'news_board_out_of_range_port', input: `jsonb_set(${FIXTURE_PAYLOAD}, '{announcementBoardUrl}', '"https://example.test:65536/board"')` },
] as const;

function normalized(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

function expectStrictPgTapContract(pgTap: string): void {
  const sql = normalized(pgTap);
  expect(sql).toContain("select plan(12);");
  expect(sql).toContain("select is( (select count(*) from news_board_payload), 1::bigint, 'news_board_fixture_cardinality' );");
  expect(sql).toContain(`public.cms_news_payload_is_publishable(${FIXTURE_PAYLOAD}) is true, 'news_board_valid'`);
  for (const denialCase of DENIAL_CASES) {
    expect(sql, denialCase.name).toContain(
      `public.cms_news_payload_is_publishable(${denialCase.input}) is false, '${denialCase.name}'`,
    );
  }
}

describe('forward news announcement board SQL contract', () => {
  it('strengthens the existing news validator with the canonical HTTPS helper', () => {
    // Given
    const migration = readFileSync(
      new URL('../supabase/migrations/20260902000100_add_news_announcement_board_url.sql', import.meta.url),
      'utf8',
    );

    // When / Then
    expect(migration).toContain("array['announcementBoardUrl', 'zh', 'en']");
    expect(migration).toContain("candidate -> 'announcementBoardUrl'");
    expect(migration).toContain('cms_jsonb_is_credential_free_https_url');
    expect(migration).toContain('create or replace function public.cms_news_payload_is_publishable');
    expect(migration).not.toMatch(/create or replace function public\.cms_jsonb_is_credential_free_https_url/);
  });

  it('keeps every TypeScript denial case non-vacuously represented in pgTAP', () => {
    // Given
    const typeScript = readFileSync(
      new URL('../src/content/contracts/newsAnnouncementBoardUrl.test.ts', import.meta.url),
      'utf8',
    );
    const pgTap = readFileSync(
      new URL('../supabase/tests/database/011_news_announcement_board_url.test.sql', import.meta.url),
      'utf8',
    );

    // When / Then
    for (const denialCase of DENIAL_CASES) {
      expect(typeScript, `${denialCase.name}: TypeScript`).toContain(`'${denialCase.name}'`);
    }
    expectStrictPgTapContract(pgTap);
  });

  it('rejects an empty-fixture false positive', () => {
    // Given
    const pgTap = readFileSync(
      new URL('../supabase/tests/database/011_news_announcement_board_url.test.sql', import.meta.url),
      'utf8',
    );

    // When
    const mutated = pgTap.replace(
      /select is\(\s*\(select count\(\*\) from news_board_payload\),\s*1::bigint,\s*'news_board_fixture_cardinality'\s*\);/,
      '',
    );

    // Then
    expect(mutated).not.toBe(pgTap);
    expect(() => expectStrictPgTapContract(mutated)).toThrow();
  });

  it.each(DENIAL_CASES)('rejects an input mutation for $name', (denialCase) => {
    // Given
    const pgTap = readFileSync(
      new URL('../supabase/tests/database/011_news_announcement_board_url.test.sql', import.meta.url),
      'utf8',
    );

    // When
    const mutated = normalized(pgTap).replace(denialCase.input, VALID_HTTPS_INPUT);

    // Then
    expect(mutated).not.toBe(normalized(pgTap));
    expect(() => expectStrictPgTapContract(mutated)).toThrow();
  });
});
