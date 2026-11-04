import { describe, expect, it } from 'vitest';
import { POST_CATEGORY_CHANNELS, POST_CATEGORY_IDS, PROGRAM_IDS } from '../../src/content/contracts/archiveIds';
import { CMS_PAYLOAD_REGISTRY } from '../../src/content/contracts/registry';
import {
  LEGACY_BOARD_CATEGORY_CODES,
  LEGACY_CENTER_CODES,
  LEGACY_DEPARTMENT_PAGES,
  LEGACY_NEWS_CATEGORY_CODES,
  LEGACY_PROGRAM_CODES,
  POST_CATEGORY_TAXONOMY,
  PROGRAM_TAXONOMY,
  legacyCenterOwnerForCode,
} from '../../src/data/legacy/taxonomy';
import { buildSourceDocuments } from './extract';
import { buildDepartmentInfoSource, buildGallerySource, buildPostsSource } from './legacySources';

describe('legacy archive sources', () => {
  it('emits the three archive documents after the twelve page documents', () => {
    const kinds = buildSourceDocuments().map((document) => document.kind);

    expect(kinds).toHaveLength(15);
    expect(kinds.slice(12)).toEqual(['posts', 'department_info', 'gallery']);
  });

  it('builds placeholder-backed payloads that pass every contract tier', () => {
    const sources = [
      ['posts', buildPostsSource()],
      ['department_info', buildDepartmentInfoSource()],
      ['gallery', buildGallerySource()],
    ] as const;

    for (const [kind, payload] of sources) {
      const contract = CMS_PAYLOAD_REGISTRY[kind];
      expect(contract.editableSchema.safeParse(payload).success, kind).toBe(true);
      expect(contract.schema.safeParse(payload).success, kind).toBe(true);
      expect(contract.publishedSchema.safeParse(payload).success, kind).toBe(true);
      expect(payload.contentModel).toBe('localized-fields-v1');
    }
  });

  it('merges hand-written taxonomy labels and programs', () => {
    const posts = buildPostsSource();
    const department = buildDepartmentInfoSource();

    expect(posts.categories.map((category) => category.id)).toEqual(POST_CATEGORY_IDS);
    expect(department.programs.map((program) => program.id)).toEqual(PROGRAM_IDS);
  });
});

describe('legacy taxonomy', () => {
  it('labels every category and program in both languages', () => {
    for (const entry of [...POST_CATEGORY_TAXONOMY.map((category) => category.label), ...PROGRAM_TAXONOMY.flatMap((program) => [program.title, program.summary])]) {
      expect(entry.zh.trim()).toBe(entry.zh);
      expect(entry.en.trim()).toBe(entry.en);
      expect(entry.zh.length).toBeGreaterThan(0);
      expect(entry.en.length).toBeGreaterThan(0);
    }
    expect(POST_CATEGORY_TAXONOMY.map((category) => category.channel)).toEqual(POST_CATEGORY_IDS.map((id) => POST_CATEGORY_CHANNELS[id]));
  });

  it('maps every old code to its new identity', () => {
    expect(Object.keys(LEGACY_NEWS_CATEGORY_CODES)).toEqual(['N001', 'N002', 'N003', 'N004', 'N005', 'N006', 'N007', 'N008']);
    expect(Object.values(LEGACY_BOARD_CATEGORY_CODES).every((id) => POST_CATEGORY_CHANNELS[id] === 'honors')).toBe(true);
    expect(Object.values(LEGACY_NEWS_CATEGORY_CODES).every((id) => POST_CATEGORY_CHANNELS[id] === 'news')).toBe(true);
    expect(LEGACY_PROGRAM_CODES.stu05).toBe('joint-training');
    expect(LEGACY_CENTER_CODES).toEqual({ medical: 'ebm', clinical: 'clinical_skills', develop: 'faculty_dev', digital: 'digital_materials', care: 'holistic' });
    expect(LEGACY_DEPARTMENT_PAGES[29]).toEqual({ id: 'director-message', section: 'about' });
    expect(LEGACY_DEPARTMENT_PAGES[36].section).toBe('committee');
  });

  it.each([
    ['ABT01', 'ebm'],
    ['evt05', 'holistic'],
    ['ELB03', 'faculty_dev'],
    ['cvd04', 'digital_materials'],
    ['MEDICAL', 'ebm'],
    ['ABT06', undefined],
    ['ALB01', undefined],
  ])('resolves center code %s', (code, owner) => {
    expect(legacyCenterOwnerForCode(code)).toBe(owner);
  });
});
