import { describe, expect, it } from 'vitest';
import { diffText } from './textDiff';

describe('diffText', () => {
  it('marks only the changed characters of Chinese text', () => {
    expect(diffText('學術發表與國際舞台', '學術發表與國際舞台（更新）')).toEqual([
      { kind: 'same', text: '學術發表與國際舞台' },
      { kind: 'added', text: '（更新）' },
    ]);
  });

  it('keeps shared text around a replacement', () => {
    const segments = diffText('2023年通過', '2024年通過');
    expect(segments.filter((segment) => segment.kind === 'same').map((segment) => segment.text).join('')).toBe('202年通過');
    expect(segments.find((segment) => segment.kind === 'removed')?.text).toBe('3');
    expect(segments.find((segment) => segment.kind === 'added')?.text).toBe('4');
  });

  it('rebuilds both sides from its segments', () => {
    const before = 'The Center is officially established';
    const after = 'The Centre was established';
    const segments = diffText(before, after);
    expect(segments.filter((segment) => segment.kind !== 'added').map((segment) => segment.text).join('')).toBe(before);
    expect(segments.filter((segment) => segment.kind !== 'removed').map((segment) => segment.text).join('')).toBe(after);
  });
});
