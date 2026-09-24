import { describe, expect, it } from 'vitest';
import type { DraftMediaFailure } from './types';
import { draftMediaFailureMessage } from './mediaFeedback';

type InvalidFileFailure = Extract<DraftMediaFailure, { readonly kind: 'invalid-file' }>;

const INVALID_FAILURES = {
  empty: { kind: 'invalid-file', reason: 'empty' },
  'too-large': { kind: 'invalid-file', reason: 'too-large' },
  'unsupported-type': { kind: 'invalid-file', reason: 'unsupported-type' },
} as const satisfies Readonly<Record<InvalidFileFailure['reason'], InvalidFileFailure>>;

const FAILURE_BY_KIND = {
  'invalid-file': INVALID_FAILURES.empty,
  'authentication-required': { kind: 'authentication-required' },
  'owner-mismatch': { kind: 'owner-mismatch' },
  'still-referenced': { kind: 'still-referenced' },
  'storage-failure': { kind: 'storage-failure' },
  'transport-error': { kind: 'transport-error' },
  'malformed-response': { kind: 'malformed-response' },
  aborted: { kind: 'aborted' },
} as const satisfies Readonly<Record<DraftMediaFailure['kind'], DraftMediaFailure>>;

describe('draft media failure presentation', () => {
  it('presents every typed failure and invalid-file reason without a generic fallthrough', () => {
    // Given
    const failures = [
      ...Object.values(FAILURE_BY_KIND),
      ...Object.values(INVALID_FAILURES),
    ];

    // When
    const messages = failures.map((failure) => (
      draftMediaFailureMessage(failure, 'upload', 'en')
    ));

    // Then
    expect(messages.filter((message) => message === null)).toHaveLength(1);
    expect(messages.filter((message) => message !== null).every((message) => message.length > 20)).toBe(true);
  });

  it('uses operation-specific bilingual recovery copy', () => {
    // Given
    const tooLarge = INVALID_FAILURES['too-large'];
    const transport = FAILURE_BY_KIND['transport-error'];
    const storage = FAILURE_BY_KIND['storage-failure'];

    // When / Then
    expect(draftMediaFailureMessage(tooLarge, 'upload', 'zh')).toBe(
      '圖片超過 10 MiB。請壓縮圖片或選擇較小的檔案。',
    );
    expect(draftMediaFailureMessage(tooLarge, 'upload', 'en')).toBe(
      'The image exceeds 10 MiB. Compress it or choose a smaller file.',
    );
    expect(draftMediaFailureMessage(transport, 'preview', 'en')).toBe(
      'The portrait preview could not be prepared. Check the connection and try again.',
    );
    expect(draftMediaFailureMessage(storage, 'cleanup', 'zh')).toBe(
      'Storage 無法刪除檔案。檔案仍保留，請再試一次。',
    );
  });

  it('does not present expected cancellation as an error', () => {
    // Given / When
    const message = draftMediaFailureMessage(FAILURE_BY_KIND.aborted, 'upload', 'en');

    // Then
    expect(message).toBeNull();
  });
});
