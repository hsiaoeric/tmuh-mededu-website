import { describe, expect, it } from 'vitest';
import { stableStringify } from './json';

describe('stableStringify', () => {
  it('orders punctuation and case-sensitive keys by ECMAScript code unit', () => {
    // Given
    const value = {
      zebra: 6,
      'a-key': 5,
      _key: 4,
      'A-key': 3,
      '0-key': 2,
      '!bang': 1,
    };

    // When
    const serialized = stableStringify(value);

    // Then
    expect(serialized).toBe(`{
  "!bang": 1,
  "0-key": 2,
  "A-key": 3,
  "_key": 4,
  "a-key": 5,
  "zebra": 6
}\n`);
  });
});
