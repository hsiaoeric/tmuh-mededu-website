export type TextSegment = { readonly kind: 'same' | 'removed' | 'added'; readonly text: string };

/** Above this many cells the LCS table is too costly; the whole value is shown as replaced. */
const MAX_CELLS = 250_000;

function push(segments: TextSegment[], kind: TextSegment['kind'], text: string): void {
  if (text === '') return;
  const last = segments[segments.length - 1];
  if (last?.kind === kind) segments[segments.length - 1] = { kind, text: last.text + text };
  else segments.push({ kind, text });
}

/**
 * Character-level differences between two strings. Characters rather than words, because most
 * of this content is Chinese, which has no spaces to split words on.
 */
export function diffText(before: string, after: string): TextSegment[] {
  const a = Array.from(before);
  const b = Array.from(after);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA -= 1; endB -= 1; }
  const segments: TextSegment[] = [];
  push(segments, 'same', a.slice(0, start).join(''));
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  if (midA.length * midB.length > MAX_CELLS) {
    push(segments, 'removed', midA.join(''));
    push(segments, 'added', midB.join(''));
  } else {
    // lengths[i][j]: LCS length of midA[i..] and midB[j..].
    const width = midB.length + 1;
    const lengths = new Uint32Array((midA.length + 1) * width);
    for (let i = midA.length - 1; i >= 0; i -= 1) {
      for (let j = midB.length - 1; j >= 0; j -= 1) {
        lengths[i * width + j] = midA[i] === midB[j]
          ? lengths[(i + 1) * width + j + 1]! + 1
          : Math.max(lengths[(i + 1) * width + j]!, lengths[i * width + j + 1]!);
      }
    }
    let i = 0;
    let j = 0;
    while (i < midA.length || j < midB.length) {
      if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
        push(segments, 'same', midA[i]!); i += 1; j += 1;
      } else if (j < midB.length && (i === midA.length || lengths[i * width + j + 1]! >= lengths[(i + 1) * width + j]!)) {
        push(segments, 'added', midB[j]!); j += 1;
      } else {
        push(segments, 'removed', midA[i]!); i += 1;
      }
    }
  }
  push(segments, 'same', a.slice(endA).join(''));
  return segments;
}
