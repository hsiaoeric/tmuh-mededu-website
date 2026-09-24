import { useState, type ReactElement } from 'react';
import { mapStructuredEditorIssues as mapGlobalEditorIssues } from '@/admin/editors/shared';
import { SiteProvider } from '@/app/site';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_PAYLOAD_REGISTRY,
  type CmsPayloadByKind,
} from '@/content/contracts/registry';
import {
  buildDraftMediaReference,
  buildPublicMediaReference,
} from '@/content/media';
import { PeopleEditor } from './PeopleEditor';

export type PeoplePayload = CmsPayloadByKind['people'];
export type Person = PeoplePayload['zh']['holisticInstructors'][number];

const fixtureDocument = snapshot.find((document) => document.kind === 'people');
if (fixtureDocument === undefined) throw new TypeError('Missing people fixture');

export const FULL_FIXTURE: PeoplePayload = CMS_PAYLOAD_REGISTRY.people.schema.parse(
  fixtureDocument.payload,
);

function withoutPortrait(person: Person): Person {
  return {
    id: person.id,
    name: person.name,
    alternateName: person.alternateName,
    roleKey: person.roleKey,
    role: person.role,
    department: person.department,
    slug: person.slug,
    hubId: person.hubId,
    duty: person.duty,
    ext: person.ext,
    email: person.email,
  };
}

export function compactFixture(): PeoplePayload {
  const publicPortrait = buildPublicMediaReference('b'.repeat(64), 'image/webp');
  const draftPortrait = buildDraftMediaReference({
    ownerId: '11111111-1111-4111-8111-111111111111',
    sha256: 'a'.repeat(64),
    mediaType: 'image/png',
  });
  const makeLocale = (locale: 'zh' | 'en'): PeoplePayload['zh'] => {
    const source = FULL_FIXTURE[locale];
    const center = source.centerPeople[0];
    const instructor = source.holisticInstructors[0];
    const seed = source.holisticSeedTeachers[0];
    const ai = source.holisticAiTeam[0];
    if (center === undefined || instructor === undefined || seed === undefined || ai === undefined) {
      throw new TypeError('Incomplete people fixture');
    }
    return {
      centerPeople: [{ ...center, people: center.people.slice(0, 1) }],
      holisticInstructors: [{ ...instructor, portrait: publicPortrait }],
      holisticSeedTeachers: [{ ...seed, portrait: draftPortrait }],
      holisticAiTeam: [withoutPortrait(ai)],
      memberGroups: source.memberGroups.map((group) => ({
        ...group,
        people: group.people.slice(0, 1),
      })),
    };
  };
  return { zh: makeLocale('zh'), en: makeLocale('en') };
}

export function ControlledPeopleEditor({ initial = compactFixture() }: {
  readonly initial?: PeoplePayload;
}): ReactElement {
  const [payload, setPayload] = useState(initial);
  return (
    <SiteProvider>
      <PeopleEditor payload={payload} issues={mapGlobalEditorIssues([])} onChange={(next) => {
        setPayload(next);
        return { status: 'emitted' };
      }} />
      <output data-testid="people-payload">{JSON.stringify(payload)}</output>
    </SiteProvider>
  );
}
