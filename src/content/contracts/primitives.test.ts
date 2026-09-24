import { describe, expect, it } from 'vitest';
import {
  CalendarDateSchema,
  CalendarDateTimeSchema,
  ChineseActivityDateSchema,
  ChineseNewsDateSchema,
  EnglishActivityDateSchema,
  EnglishNewsDateSchema,
  HttpsUrlSchema,
  MediaReferenceSchema,
} from './primitives';

describe('CMS contract primitives', () => {
  it('rejects unsafe external URLs while preserving HTTPS strings', () => {
    // Given
    const valid = 'https://tmuh.example/path?lang=zh#overview';
    const unsafe = ['http://tmuh.example', 'https://user:secret@tmuh.example', 'javascript:alert(1)'];

    // When
    const parsed = HttpsUrlSchema.safeParse(valid);

    // Then
    expect(parsed).toEqual({ success: true, data: valid });
    for (const url of unsafe) expect(HttpsUrlSchema.safeParse(url).success).toBe(false);
  });

  it('returns failed parses instead of throwing for malformed external URLs', () => {
    // Given
    const invalid = [
      'not a url',
      '//tmuh.example/path',
      ' https://tmuh.example/path',
      'https://tmuh.example/path ',
      'https://user:secret@tmuh.example/path',
      'http://tmuh.example/path',
    ];

    // When
    const parseAll = () => invalid.map((value) => HttpsUrlSchema.safeParse(value));

    // Then
    expect(parseAll).not.toThrow();
    expect(parseAll().every((result) => !result.success)).toBe(true);
  });

  it.each([
    ['ordinary DNS URL', 'https://tmuh.org.tw/education', true],
    ['uppercase ASCII host', 'https://TMUH.EXAMPLE/education', true],
    ['valid port', 'https://tmuh.org.tw:443/education', true],
    ['highest valid port', 'https://tmuh.org.tw:65535/education', true],
    ['Kelvin sign host', 'https://K.example/education', false],
    ['dotted-I host', 'https://İ.example/education', false],
    ['embedded whitespace', 'https://tmuh.org.tw/edu\tcation', false],
    ['vertical tab in path', 'https://tmuh.org.tw/edu\u000bcation', false],
    ['form feed in path', 'https://tmuh.org.tw/edu\u000ccation', false],
    ['NBSP in path', 'https://tmuh.org.tw/edu\u00a0cation', false],
    ['figure space in path', 'https://tmuh.org.tw/edu\u2007cation', false],
    ['line separator in path', 'https://tmuh.org.tw/edu\u2028cation', false],
    ['paragraph separator in path', 'https://tmuh.org.tw/edu\u2029cation', false],
    ['narrow NBSP in path', 'https://tmuh.org.tw/edu\u202fcation', false],
    ['BOM in path', 'https://tmuh.org.tw/edu\ufeffcation', false],
    ['malformed percent-encoded host', 'https://%zz/education', false],
    ['malformed IPv6 host', 'https://[:::]/education', false],
    ['credentials', 'https://editor:secret@tmuh.org.tw/education', false],
    ['empty port', 'https://tmuh.org.tw:/education', false],
    ['zero port', 'https://tmuh.org.tw:0/education', false],
    ['out-of-range port', 'https://tmuh.org.tw:65536/education', false],
    ['malformed DNS host', 'https://-tmuh.org.tw/education', false],
  ] as const)('classifies the supported credential-free HTTPS subset: %s', (_caseName, value, expected) => {
    // Given / When
    const result = HttpsUrlSchema.safeParse(value);

    // Then
    expect(result.success).toBe(expected);
  });

  it('uses dedicated calendar date and datetime formats', () => {
    // Given
    const dates = ['2024-02-29', '2023-02-29'];
    const datetimes = ['2026-08-14T00:00:00+08:00', '2026-08-14T00:00:00'];

    // When
    const results = [...dates.map((value) => CalendarDateSchema.safeParse(value).success), ...datetimes.map((value) => CalendarDateTimeSchema.safeParse(value).success)];

    // Then
    expect(results).toEqual([true, false, true, false]);
  });

  it.each([
    ['Chinese News', ChineseNewsDateSchema, '2026/08/27', 'Aug 27, 2026'],
    ['English News', EnglishNewsDateSchema, 'Aug 27, 2026', '2026/08/27'],
    ['Chinese Activities', ChineseActivityDateSchema, '2026/08/27（四）12:30–13:30', 'Thu 2026/08/27 12:30–13:30'],
    ['English Activities', EnglishActivityDateSchema, 'Thu 2026/08/27 12:30–13:30', '2026/08/27（四）12:30–13:30'],
  ] as const)('accepts only the authored %s locale format', (_label, schema, valid, wrongLocale) => {
    // Given / When
    const results = [schema.safeParse(valid), schema.safeParse(wrongLocale)];

    // Then
    expect(results.map((result) => result.success)).toEqual([true, false]);
  });

  it('rejects malformed and unsafe media paths', () => {
    // Given
    const valid = [
      { kind: 'local', path: 'assets/portrait.jpg' },
      { kind: 'public', bucket: 'public-media', path: `${'a'.repeat(64)}/${'a'.repeat(64)}.webp` },
      { kind: 'draft', bucket: 'draft-media', path: `11111111-1111-4111-8111-111111111111/${'a'.repeat(64)}.png` },
    ];
    const unsafe = [
      { kind: 'local', path: '/assets/portrait.jpg' },
      { kind: 'local', path: 'assets/../secret.jpg' },
      { kind: 'local', path: 'assets/portrait.svg' },
      { kind: 'public', bucket: 'public-media', path: 'portrait.webp' },
      { kind: 'public', bucket: 'public-media', path: `${'a'.repeat(64)}/${'b'.repeat(64)}.webp` },
      { kind: 'draft', bucket: 'draft-media', path: 'not-a-uuid/portrait.png' },
    ];

    // When
    const validResults = valid.map((value) => MediaReferenceSchema.safeParse(value));

    // Then
    expect(validResults.every((result) => result.success)).toBe(true);
    for (const value of unsafe) expect(MediaReferenceSchema.safeParse(value).success).toBe(false);
  });
});
