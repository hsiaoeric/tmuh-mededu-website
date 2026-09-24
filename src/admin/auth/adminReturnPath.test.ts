import { describe, expect, it } from 'vitest';
import { resolveAdminReturnPath } from './adminReturnPath';

type ReturnPathCase = {
  readonly name: string;
  readonly input: unknown;
  readonly expected: string;
};

const VALID_RETURN_PATHS = [
  { name: 'admin root', input: '/admin', expected: '/admin' },
  {
    name: 'known admin route',
    input: '/admin/design-system',
    expected: '/admin/design-system',
  },
  {
    name: 'search and hash',
    input: '/admin/content/news?view=draft#record',
    expected: '/admin/content/news?view=draft#record',
  },
  {
    name: 'encoded search and hash data',
    input: '/admin/search?next=%2Fadmin%2Fcontent#record%2Fsection',
    expected: '/admin/search?next=%2Fadmin%2Fcontent#record%2Fsection',
  },
  {
    name: 'unknown internal admin route',
    input: '/admin/future/editor',
    expected: '/admin/future/editor',
  },
] satisfies readonly ReturnPathCase[];

const INVALID_RETURN_PATHS = [
  { name: 'empty string', input: '', expected: '/admin' },
  { name: 'whitespace', input: '   ', expected: '/admin' },
  { name: 'control character', input: '/admin/\u0000settings', expected: '/admin' },
  { name: 'line break', input: '/admin/\nsettings', expected: '/admin' },
  { name: 'backslash', input: '/admin\\evil', expected: '/admin' },
  { name: 'malformed percent', input: '/admin/%', expected: '/admin' },
  { name: 'short percent escape', input: '/admin/%2', expected: '/admin' },
  { name: 'non-hex percent escape', input: '/admin/%GG', expected: '/admin' },
  { name: 'invalid UTF-8 escape', input: '/admin/%FF', expected: '/admin' },
  { name: 'public root', input: '/', expected: '/admin' },
  { name: 'public route', input: '/announcements', expected: '/admin' },
  { name: 'admin lookalike', input: '/administrator', expected: '/admin' },
  {
    name: 'external absolute URL',
    input: 'https://example.test/admin',
    expected: '/admin',
  },
  {
    name: 'same-origin absolute URL',
    input: 'https://admin.invalid/admin',
    expected: '/admin',
  },
  {
    name: 'protocol-relative URL',
    input: '//example.test/admin',
    expected: '/admin',
  },
  {
    name: 'credential-bearing URL',
    input: 'https://user:placeholder@example.test/admin',
    expected: '/admin',
  },
  { name: 'literal parent traversal', input: '/admin/../public', expected: '/admin' },
  { name: 'literal current traversal', input: '/admin/./content', expected: '/admin' },
  { name: 'encoded parent traversal', input: '/admin/%2e%2e/public', expected: '/admin' },
  { name: 'mixed encoded traversal', input: '/admin/%2E./public', expected: '/admin' },
  {
    name: 'encoded forward separator',
    input: '/admin/content%2Fnews',
    expected: '/admin',
  },
  {
    name: 'encoded back separator',
    input: '/admin/content%5cnews',
    expected: '/admin',
  },
  {
    name: 'nested encoded traversal',
    input: '/admin/%252e%252e/public',
    expected: '/admin',
  },
  {
    name: 'nested encoded separator',
    input: '/admin/content%252fnews',
    expected: '/admin',
  },
  { name: 'login route', input: '/admin/login', expected: '/admin' },
  { name: 'login descendant', input: '/admin/login/reset', expected: '/admin' },
  { name: 'uppercase login route', input: '/admin/LOGIN', expected: '/admin' },
  { name: 'mixed-case login descendant', input: '/admin/Login/reset', expected: '/admin' },
  {
    name: 'login route with continuation data',
    input: '/admin/login?returnTo=/admin',
    expected: '/admin',
  },
  {
    name: 'encoded login route',
    input: '/admin/%6c%6f%67%69%6e',
    expected: '/admin',
  },
  {
    name: 'uppercase encoded login route',
    input: '/admin/%4C%4F%47%49%4E',
    expected: '/admin',
  },
  {
    name: 'uppercase encoded login descendant',
    input: '/admin/%4C%4F%47%49%4E/reset',
    expected: '/admin',
  },
  {
    name: 'mixed-case encoded login route',
    input: '/admin/%4c%4F%67%49%6e',
    expected: '/admin',
  },
  {
    name: 'mixed-case encoded login descendant',
    input: '/admin/%4c%4F%67%49%6e/reset',
    expected: '/admin',
  },
  { name: 'null', input: null, expected: '/admin' },
  { name: 'undefined', input: undefined, expected: '/admin' },
  { name: 'boolean', input: false, expected: '/admin' },
  { name: 'number', input: 0, expected: '/admin' },
  { name: 'object', input: { returnTo: '/admin' }, expected: '/admin' },
  { name: 'array', input: ['/admin'], expected: '/admin' },
] satisfies readonly ReturnPathCase[];

describe('resolveAdminReturnPath', () => {
  it.each(VALID_RETURN_PATHS)('preserves $name', ({ input, expected }) => {
    // Given: a valid root-relative administrator destination.
    // When: the untrusted continuation value is resolved.
    const result = resolveAdminReturnPath(input);

    // Then: the exact path, search, and hash are retained.
    expect(result).toBe(expected);
  });

  it.each(INVALID_RETURN_PATHS)('defaults $name', ({ input, expected }) => {
    // Given: an unsafe or non-string continuation value.
    // When: the untrusted continuation value is resolved.
    const result = resolveAdminReturnPath(input);

    // Then: navigation returns to the safe administrator root.
    expect(result).toBe(expected);
  });
});
