import type { ZodError } from 'zod';
import type { PublicContentInvariantDetails } from './contracts/public';
import type { ContentIdentity } from './domain';

export class ContentConfigurationError extends Error {
  readonly name = 'ContentConfigurationError';

  constructor(
    readonly reason: 'partial' | 'invalid',
    message: string,
  ) {
    super(message);
  }
}

export class ContentBoundaryError extends Error {
  readonly name = 'ContentBoundaryError';

  constructor(readonly validationError: ZodError) {
    super('CMS content did not match the published content contract');
  }
}

export class ContentRepositoryError extends Error {
  readonly name = 'ContentRepositoryError';

  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class ContentRefreshError extends Error {
  readonly name = 'ContentRefreshError';

  constructor(message: string) {
    super(message);
  }
}

export class ContentVersionError extends Error {
  readonly name = 'ContentVersionError';

  constructor(
    readonly identity: ContentIdentity,
    readonly snapshotVersion: number,
    readonly remoteVersion: number,
  ) {
    super(`Remote CMS version ${remoteVersion} is older than snapshot version ${snapshotVersion}`);
  }
}

export class PublicContentInvariantError extends Error {
  readonly name = 'PublicContentInvariantError';

  constructor(readonly details: PublicContentInvariantDetails) {
    super(`Required public CMS document ${details.expected.kind}:${details.expected.stableKey} is ${details.reason}`);
  }
}

export type ContentError =
  | ContentConfigurationError
  | ContentBoundaryError
  | ContentRepositoryError
  | ContentRefreshError;
