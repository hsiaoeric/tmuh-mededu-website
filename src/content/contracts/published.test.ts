import { describe, expect, it } from 'vitest';
import snapshot from '../generated/cms-snapshot.json';
import { ContentBoundaryError } from '../errors';
import { parsePublishedContentRows } from '../parsers';
import { FacdevPayloadSchema, PublishedFacdevPayloadSchema } from './facdev';
import { CentersPayloadSchema } from './centers';
import { PeoplePayloadSchema, PublishedPeoplePayloadSchema } from './people';

describe('published CMS boundary', () => {
  it('rejects a stable key that does not belong to its kind', () => {
    // Given
    const row = snapshot.find((item) => item.kind === 'news');
    expect(row).toBeDefined();
    if (row === undefined) return;
    const invalid = { ...row, stable_key: 'page' };

    // When
    const parse = () => parsePublishedContentRows([invalid]);

    // Then
    expect(parse).toThrow(ContentBoundaryError);
  });

  it('rejects duplicate document and revision identities', () => {
    // Given
    const row = snapshot.find((item) => item.kind === 'news');
    expect(row).toBeDefined();
    if (row === undefined) return;

    // When
    const parse = () => parsePublishedContentRows([row, row]);

    // Then
    expect(parse).toThrow(ContentBoundaryError);
  });

  it('wraps malformed nested URLs as content boundary errors', () => {
    // Given
    const row = snapshot.find((item) => item.kind === 'centers');
    expect(row).toBeDefined();
    if (row === undefined) return;
    const payload = CentersPayloadSchema.parse(row.payload);
    const center = payload.zh.centers[0];
    expect(center).toBeDefined();
    if (center === undefined) return;
    const invalid = {
      ...row,
      payload: {
        ...payload,
        zh: {
          ...payload.zh,
          centers: [
            { ...center, externalUrl: '//tmuh.example/path' },
            ...payload.zh.centers.slice(1),
          ],
        },
      },
    };

    // When
    const parse = () => parsePublishedContentRows([invalid]);

    // Then
    expect(parse).toThrow(ContentBoundaryError);
  });

  it('accepts draft portraits generally but rejects them from published payloads', () => {
    // Given
    const person = {
      id: 'person',
      name: 'Name', alternateName: 'Alternate', roleKey: 'director', role: 'Director',
      department: 'Department', slug: 'portrait', hubId: '', duty: '', ext: '', email: '',
      portrait: {
        kind: 'draft', bucket: 'draft-media',
        path: `11111111-1111-4111-8111-111111111111/${'a'.repeat(64)}.jpg`,
      },
    };
    const locale = (localizedPerson: typeof person) => ({
      centerPeople: [{ centerId: 'center', people: [localizedPerson] }],
      holisticInstructors: [], holisticSeedTeachers: [], holisticAiTeam: [],
      memberGroups: [
        { id: 'department_advisors', people: [localizedPerson] },
        { id: 'teaching_attendings', people: [localizedPerson] },
        { id: 'teaching_allied_health', people: [localizedPerson] },
      ],
    });
    const payload = {
      zh: locale({ ...person, name: '中文姓名', alternateName: 'English Name' }),
      en: locale({ ...person, name: 'English Name', alternateName: '中文姓名' }),
    };

    // When
    const general = PeoplePayloadSchema.safeParse(payload);
    const published = PublishedPeoplePayloadSchema.safeParse(payload);

    // Then
    expect(general.success).toBe(true);
    expect(published.success).toBe(false);
  });

  it('rejects a draft lead portrait from published facdev payloads', () => {
    // Given
    const row = snapshot.find((item) => item.kind === 'facdev');
    expect(row).toBeDefined();
    if (row === undefined) return;
    const general = FacdevPayloadSchema.parse(row.payload);
    const group = general.zh.groups[0];
    expect(group).toBeDefined();
    if (group === undefined) return;
    const payload = {
      ...general,
      zh: {
        ...general.zh,
        groups: [{
          ...group,
          lead: {
            ...group.lead,
            portrait: {
              kind: 'draft',
              bucket: 'draft-media',
              path: `11111111-1111-4111-8111-111111111111/${'a'.repeat(64)}.jpg`,
            },
          },
        }, ...general.zh.groups.slice(1)],
      },
    };

    // When
    const published = PublishedFacdevPayloadSchema.safeParse(payload);

    // Then
    expect(published.success).toBe(false);
  });
});
