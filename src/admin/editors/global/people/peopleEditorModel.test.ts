import { describe, expect, it } from 'vitest';
import {
  buildDraftMediaReference,
  buildPublicMediaReference,
  LocalMediaReferenceSchema,
} from '@/content/media';
import {
  peopleFeedback,
  updatePerson,
  type Person,
} from './peopleEditorModel';
import { compactFixture } from './PeopleEditor.testHarness';

const BASE_PERSON: Person = {
  id: 'person',
  name: 'Name', alternateName: '別名', roleKey: 'director', role: 'Director',
  department: 'Department', slug: 'slug', hubId: 'hub', duty: 'Duty', ext: '1000', email: 'name@example.test',
};

const REFERENCES = [
  LocalMediaReferenceSchema.parse({ kind: 'local', path: 'assets/person.jpg' }),
  buildPublicMediaReference('d'.repeat(64), 'image/jpeg'),
  buildDraftMediaReference({ ownerId: '33333333-3333-4333-8333-333333333333', sha256: 'e'.repeat(64), mediaType: 'image/png' }),
  undefined,
] as const;

describe('people editor model', () => {
  it.each(REFERENCES)('preserves a %s portrait state across a text edit', (portrait) => {
    // Given
    const person: Person = portrait === undefined ? BASE_PERSON : { ...BASE_PERSON, portrait };

    // When
    const result = updatePerson({ zh: [person], en: [person] }, { locale: 'en', index: 0, field: 'duty', value: 'Changed' });

    // Then
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.collection.en[0]?.portrait).toEqual(portrait);
    expect(result.collection.en[0]?.duty).toBe('Changed');
  });

  it('reports parity for each holistic person array', () => {
    // Given
    const fixture = compactFixture();
    const payload = {
      ...fixture,
      en: {
        ...fixture.en,
        holisticInstructors: [],
        holisticSeedTeachers: [],
        holisticAiTeam: [],
      },
    };

    // When / Then
    expect(peopleFeedback(payload)).toEqual([
      '全人照護指導員的中英文人員數量不一致。',
      '全人照護種子教師的中英文人員數量不一致。',
      '全人照護 AI 團隊的中英文人員數量不一致。',
    ]);
  });
});
