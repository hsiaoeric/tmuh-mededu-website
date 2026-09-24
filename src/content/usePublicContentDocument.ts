import {
  adaptPublishedContent,
  type PublicAdapterResult,
  type PublicAdapterResultFor,
} from './adapters';
import {
  useContent,
  useContentDocument,
  useContentMediaLocation,
} from './ContentProvider';
import {
  PUBLIC_CONTENT_IDENTITIES,
  type PublicContentDocumentRequest,
} from './contracts/public';
import { PublicContentInvariantError } from './errors';

export type { PublicContentDocumentRequest } from './contracts/public';

export function usePublicContentDocument<Request extends PublicContentDocumentRequest>(
  ...request: Request
): PublicAdapterResultFor<Request[0]>;
export function usePublicContentDocument(
  ...request: PublicContentDocumentRequest
): PublicAdapterResult {
  const [kind, stableKey, lang] = request;
  const content = useContent();
  const document = useContentDocument(kind, stableKey);
  const media = useContentMediaLocation();
  const expected = PUBLIC_CONTENT_IDENTITIES[kind];

  if (document === undefined) {
    const actual = content.content.find((candidate) => candidate.stableKey === stableKey) ?? null;
    if (actual === null) {
      throw new PublicContentInvariantError({ reason: 'missing', expected });
    }
    throw new PublicContentInvariantError({
      reason: 'mismatched',
      expected,
      actual: PUBLIC_CONTENT_IDENTITIES[actual.kind],
    });
  }

  const adapted = adaptPublishedContent(document, lang, media);
  if (adapted.kind !== kind || adapted.stableKey !== stableKey) {
    throw new PublicContentInvariantError({
      reason: 'mismatched',
      expected,
      actual: PUBLIC_CONTENT_IDENTITIES[adapted.kind],
    });
  }
  return adapted;
}
