export const PUBLISH_ERROR_CODES = [
  'authentication-required', 'administrator-required', 'origin-denied',
  'method-not-allowed', 'body-too-large', 'invalid-request',
  'invalid-draft-reference', 'draft-owner-mismatch', 'too-many-media',
  'draft-media-missing', 'invalid-image', 'image-too-large',
  'draft-media-mismatch', 'public-integrity-conflict', 'storage-failure',
  'stale-edit-version', 'superseded-revision', 'deadline-exceeded',
  'publication-failed',
] as const

export type PublishErrorCode = (typeof PUBLISH_ERROR_CODES)[number]

export class PublishError extends Error {
  readonly name = 'PublishError'

  constructor(
    readonly code: PublishErrorCode,
    readonly status: number,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(code, options)
  }
}

export function isPublishError(error: unknown): error is PublishError {
  return error instanceof PublishError
}
