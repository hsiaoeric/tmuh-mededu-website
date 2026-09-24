import { describe, expectTypeOf, it } from 'vitest';
import type { PublicAdapterResultFor } from './adapters';
import type {
  PublicContentDocumentRequest,
  PublicContentInvariantDetails,
} from './contracts/public';
import { PublicContentInvariantError } from './errors';
import { usePublicContentDocument } from './usePublicContentDocument';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;

type Assert<Condition extends true> = Condition;

type ExpectedRequest =
  | readonly ['site_copy', 'global', 'zh' | 'en']
  | readonly ['centers', 'directory', 'zh' | 'en']
  | readonly ['people', 'directory', 'zh' | 'en']
  | readonly ['news', 'announcements', 'zh' | 'en']
  | readonly ['activities', 'calendar', 'zh' | 'en']
  | readonly ['kpis', 'department', 'zh' | 'en']
  | readonly ['honors', 'department', 'zh' | 'en']
  | readonly ['digital_materials', 'page', 'zh' | 'en']
  | readonly ['facdev', 'page', 'zh' | 'en']
  | readonly ['ebm', 'page', 'zh' | 'en']
  | readonly ['holistic', 'page', 'zh' | 'en']
  | readonly ['holistic_research', 'registry', 'zh' | 'en'];

function useInferredDocuments() {
  return [
    usePublicContentDocument('site_copy', 'global', 'zh'),
    usePublicContentDocument('centers', 'directory', 'zh'),
    usePublicContentDocument('people', 'directory', 'zh'),
    usePublicContentDocument('news', 'announcements', 'zh'),
    usePublicContentDocument('activities', 'calendar', 'zh'),
    usePublicContentDocument('kpis', 'department', 'zh'),
    usePublicContentDocument('honors', 'department', 'zh'),
    usePublicContentDocument('digital_materials', 'page', 'zh'),
    usePublicContentDocument('facdev', 'page', 'zh'),
    usePublicContentDocument('ebm', 'page', 'zh'),
    usePublicContentDocument('holistic', 'page', 'zh'),
    usePublicContentDocument('holistic_research', 'registry', 'zh'),
  ] as const;
}

type HookReturnsAreExact = Assert<Equal<
  ReturnType<typeof useInferredDocuments>,
  readonly [
    PublicAdapterResultFor<'site_copy'>,
    PublicAdapterResultFor<'centers'>,
    PublicAdapterResultFor<'people'>,
    PublicAdapterResultFor<'news'>,
    PublicAdapterResultFor<'activities'>,
    PublicAdapterResultFor<'kpis'>,
    PublicAdapterResultFor<'honors'>,
    PublicAdapterResultFor<'digital_materials'>,
    PublicAdapterResultFor<'facdev'>,
    PublicAdapterResultFor<'ebm'>,
    PublicAdapterResultFor<'holistic'>,
    PublicAdapterResultFor<'holistic_research'>,
  ]
>>;
type RequestUnionIsComplete = Assert<Equal<PublicContentDocumentRequest, ExpectedRequest>>;
type InvalidPairIsRejected = Assert<Equal<
  ['news', 'global', 'zh'] extends PublicContentDocumentRequest
    ? true
    : false,
  false
>>;
type ValidPairIsAccepted = Assert<Equal<
  ['news', 'announcements', 'en'] extends PublicContentDocumentRequest
    ? true
    : false,
  true
>>;
type InvariantDetails = ConstructorParameters<typeof PublicContentInvariantError>[0];
type InvariantDetailsAreExact = Assert<Equal<
  InvariantDetails,
  PublicContentInvariantDetails
>>;
type MissingInvariantDetails = Extract<InvariantDetails, { readonly reason: 'missing' }>;
type MismatchedInvariantDetails = Extract<InvariantDetails, { readonly reason: 'mismatched' }>;
type MissingHasNoActual = Assert<Equal<
  'actual' extends keyof MissingInvariantDetails ? true : false,
  false
>>;
type MismatchedRequiresActual = Assert<Equal<
  Record<string, never> extends Pick<MismatchedInvariantDetails, 'actual'> ? false : true,
  true
>>;
type InvalidExpectedIdentityIsRejected = Assert<Equal<
  {
    readonly reason: 'missing';
    readonly expected: { readonly kind: 'news'; readonly stableKey: 'global' };
  } extends InvariantDetails ? true : false,
  false
>>;
type InvalidActualIdentityIsRejected = Assert<Equal<
  {
    readonly reason: 'mismatched';
    readonly expected: { readonly kind: 'news'; readonly stableKey: 'announcements' };
    readonly actual: { readonly kind: 'people'; readonly stableKey: 'global' };
  } extends InvariantDetails ? true : false,
  false
>>;
const requestRegistryProof = [
  'holistic_research',
  'registry',
  'zh',
] as const satisfies PublicContentDocumentRequest;

describe('usePublicContentDocument types', () => {
  it('preserves exact adapter results and authoritative kind-key pairs', () => {
    expectTypeOf<HookReturnsAreExact>().toEqualTypeOf<true>();
    expectTypeOf<RequestUnionIsComplete>().toEqualTypeOf<true>();
    expectTypeOf<InvalidPairIsRejected>().toEqualTypeOf<true>();
    expectTypeOf<ValidPairIsAccepted>().toEqualTypeOf<true>();
    expectTypeOf(requestRegistryProof).toMatchTypeOf<PublicContentDocumentRequest>();
  });

  it('rejects impossible public-content invariant details', () => {
    expectTypeOf<InvariantDetailsAreExact>().toEqualTypeOf<true>();
    expectTypeOf<MissingHasNoActual>().toEqualTypeOf<true>();
    expectTypeOf<MismatchedRequiresActual>().toEqualTypeOf<true>();
    expectTypeOf<InvalidExpectedIdentityIsRejected>().toEqualTypeOf<true>();
    expectTypeOf<InvalidActualIdentityIsRejected>().toEqualTypeOf<true>();
  });
});
