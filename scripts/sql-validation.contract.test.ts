import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import type { z } from 'zod';

type InvalidCase = {
  readonly name: string;
  readonly schema: z.ZodType;
  readonly payload: unknown;
};

const GLOBAL_KINDS = ['centers', 'people', 'news', 'activities', 'kpis', 'honors'] as const;

function sourcePayload(kind: CmsDocumentKind): unknown {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} snapshot`);
  return structuredClone(source.payload);
}

function invalidCases(): readonly InvalidCase[] {
  const centers = CMS_PAYLOAD_REGISTRY.centers.publishedSchema.parse(sourcePayload('centers'));
  const people = CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse(sourcePayload('people'));
  const news = CMS_PAYLOAD_REGISTRY.news.publishedSchema.parse(sourcePayload('news'));
  const activities = CMS_PAYLOAD_REGISTRY.activities.publishedSchema.parse(sourcePayload('activities'));
  const kpis = CMS_PAYLOAD_REGISTRY.kpis.publishedSchema.parse(sourcePayload('kpis'));
  const honors = CMS_PAYLOAD_REGISTRY.honors.publishedSchema.parse(sourcePayload('honors'));
  const center = centers.en.centers[0];
  const peopleGroup = people.en.centerPeople[0];
  const announcement = news.zh.department[0];
  const englishAnnouncement = news.en.department[0];
  const zhActivity = activities.zh.holistic[0];
  const enActivity = activities.en.holistic[0];
  const project = honors.en.snqProjects[0];
  if (center === undefined || peopleGroup === undefined || announcement === undefined || englishAnnouncement === undefined
    || zhActivity === undefined || enActivity === undefined || project === undefined) {
    throw new TypeError('Global validation snapshots must contain representative nested rows');
  }

  return [
    { name: 'news_wrong_locale_date', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, zh: { ...news.zh, department: [{ ...announcement, publishedOn: '2020-01-01' }, ...news.zh.department.slice(1)] } } },
    { name: 'news_wrong_english_locale_date', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, en: { ...news.en, department: [{ ...englishAnnouncement, publishedOn: '2020-01-01' }, ...news.en.department.slice(1)] } } },
    { name: 'news_wrong_zh_latest_update', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, zh: { ...news.zh, latestUpdate: '1999/01/01' } } },
    { name: 'news_wrong_en_latest_update', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, en: { ...news.en, latestUpdate: 'Jan 1, 1999' } } },
    { name: 'news_invalid_calendar_date', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, zh: { ...news.zh, department: [{ ...announcement, publishedOn: '2026-02-30' }, ...news.zh.department.slice(1)] } } },
    { name: 'news_non_string_title', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, zh: { ...news.zh, department: [{ ...announcement, title: 42 }, ...news.zh.department.slice(1)] } } },
    { name: 'news_department_parity', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, en: { ...news.en, department: news.en.department.slice(1) } } },
    { name: 'news_holistic_parity', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, en: { ...news.en, holistic: news.en.holistic.slice(1) } } },
    { name: 'news_department_category_parity', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, en: { ...news.en, department: [...news.en.department].reverse() } } },
    { name: 'news_holistic_category_parity', schema: CMS_PAYLOAD_REGISTRY.news.publishedSchema, payload: { ...news, en: { ...news.en, holistic: news.en.holistic.map((row) => ({ ...row, category: 'department' })) } } },
    { name: 'activities_wrong_locale_date', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, zh: { ...activities.zh, holistic: [{ ...zhActivity, date: enActivity.date }, ...activities.zh.holistic.slice(1)] } } },
    { name: 'activities_wrong_english_locale_date', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, en: { ...activities.en, holistic: [{ ...enActivity, date: zhActivity.date }, ...activities.en.holistic.slice(1)] } } },
    { name: 'activities_invalid_calendar_date', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, zh: { ...activities.zh, holistic: [{ ...zhActivity, date: '2026/02/30（一）12:30–13:30' }, ...activities.zh.holistic.slice(1)] } } },
    { name: 'activities_invalid_clock', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, en: { ...activities.en, holistic: [{ ...enActivity, date: 'Wed 2026/07/22 12:70–13:30' }, ...activities.en.holistic.slice(1)] } } },
    { name: 'activities_reversed_time', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, zh: { ...activities.zh, holistic: [{ ...zhActivity, date: '2026/07/22（三）13:30–12:30' }, ...activities.zh.holistic.slice(1)] } } },
    { name: 'activities_http_url', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, zh: { ...activities.zh, holistic: [{ ...zhActivity, link: 'http://example.test/course' }, ...activities.zh.holistic.slice(1)] } } },
    { name: 'activities_credentialed_url', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, zh: { ...activities.zh, holistic: [{ ...zhActivity, link: 'https://user:secret@example.test/course' }, ...activities.zh.holistic.slice(1)] } } },
    { name: 'activities_whitespace_url', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, zh: { ...activities.zh, holistic: [{ ...zhActivity, link: ' https://example.test/course' }, ...activities.zh.holistic.slice(1)] } } },
    { name: 'activities_embedded_whitespace_url', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, zh: { ...activities.zh, holistic: [{ ...zhActivity, link: 'https://exam\tple.test/course' }, ...activities.zh.holistic.slice(1)] } } },
    { name: 'activities_malformed_percent_host_url', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, zh: { ...activities.zh, holistic: [{ ...zhActivity, link: 'https://%zz/course' }, ...activities.zh.holistic.slice(1)] } } },
    { name: 'activities_malformed_ipv6_url', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, zh: { ...activities.zh, holistic: [{ ...zhActivity, link: 'https://[:::]/course' }, ...activities.zh.holistic.slice(1)] } } },
    { name: 'activities_department_parity', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, en: { ...activities.en, department: [enActivity] } } },
    { name: 'activities_holistic_parity', schema: CMS_PAYLOAD_REGISTRY.activities.publishedSchema, payload: { ...activities, en: { ...activities.en, holistic: activities.en.holistic.slice(1) } } },
    { name: 'centers_http_url', schema: CMS_PAYLOAD_REGISTRY.centers.publishedSchema, payload: { ...centers, zh: { centers: [{ ...centers.zh.centers[0], externalUrl: 'http://example.test/center' }, ...centers.zh.centers.slice(1)] } } },
    { name: 'centers_credentialed_url', schema: CMS_PAYLOAD_REGISTRY.centers.publishedSchema, payload: { ...centers, zh: { centers: [{ ...centers.zh.centers[0], externalUrl: 'https://user:secret@example.test/center' }, ...centers.zh.centers.slice(1)] } } },
    { name: 'centers_whitespace_url', schema: CMS_PAYLOAD_REGISTRY.centers.publishedSchema, payload: { ...centers, zh: { centers: [{ ...centers.zh.centers[0], externalUrl: 'https://example.test/center ' }, ...centers.zh.centers.slice(1)] } } },
    { name: 'centers_malformed_port_url', schema: CMS_PAYLOAD_REGISTRY.centers.publishedSchema, payload: { ...centers, zh: { centers: [{ ...centers.zh.centers[0], externalUrl: 'https://example.test:not-a-port/center' }, ...centers.zh.centers.slice(1)] } } },
    { name: 'centers_empty_port_url', schema: CMS_PAYLOAD_REGISTRY.centers.publishedSchema, payload: { ...centers, zh: { centers: [{ ...centers.zh.centers[0], externalUrl: 'https://example.test:/center' }, ...centers.zh.centers.slice(1)] } } },
    { name: 'centers_out_of_range_port_url', schema: CMS_PAYLOAD_REGISTRY.centers.publishedSchema, payload: { ...centers, zh: { centers: [{ ...centers.zh.centers[0], externalUrl: 'https://example.test:65536/center' }, ...centers.zh.centers.slice(1)] } } },
    { name: 'centers_ordered_id_parity', schema: CMS_PAYLOAD_REGISTRY.centers.publishedSchema, payload: { ...centers, en: { centers: [{ ...center, id: 'mismatch' }, ...centers.en.centers.slice(1)] } } },
    { name: 'centers_branch_id_parity', schema: CMS_PAYLOAD_REGISTRY.centers.publishedSchema, payload: { ...centers, en: { centers: [{ ...center, branches: center.branches.slice(1) }, ...centers.en.centers.slice(1)] } } },
    { name: 'people_group_id_parity', schema: CMS_PAYLOAD_REGISTRY.people.publishedSchema, payload: { ...people, en: { ...people.en, centerPeople: [{ ...peopleGroup, centerId: 'mismatch' }, ...people.en.centerPeople.slice(1)] } } },
    { name: 'people_nested_people_parity', schema: CMS_PAYLOAD_REGISTRY.people.publishedSchema, payload: { ...people, en: { ...people.en, centerPeople: [{ ...peopleGroup, people: peopleGroup.people.slice(1) }, ...people.en.centerPeople.slice(1)] } } },
    { name: 'people_holistic_instructors_parity', schema: CMS_PAYLOAD_REGISTRY.people.publishedSchema, payload: { ...people, en: { ...people.en, holisticInstructors: people.en.holisticInstructors.slice(1) } } },
    { name: 'people_holistic_seed_teachers_parity', schema: CMS_PAYLOAD_REGISTRY.people.publishedSchema, payload: { ...people, en: { ...people.en, holisticSeedTeachers: people.en.holisticSeedTeachers.slice(1) } } },
    { name: 'people_holistic_ai_team_parity', schema: CMS_PAYLOAD_REGISTRY.people.publishedSchema, payload: { ...people, en: { ...people.en, holisticAiTeam: people.en.holisticAiTeam.slice(1) } } },
    { name: 'kpis_items_parity', schema: CMS_PAYLOAD_REGISTRY.kpis.publishedSchema, payload: { ...kpis, en: { items: kpis.en.items.slice(1) } } },
    { name: 'honors_projects_parity', schema: CMS_PAYLOAD_REGISTRY.honors.publishedSchema, payload: { ...honors, en: { ...honors.en, snqProjects: honors.en.snqProjects.slice(1) } } },
    { name: 'honors_members_parity', schema: CMS_PAYLOAD_REGISTRY.honors.publishedSchema, payload: { ...honors, en: { ...honors.en, snqProjects: [{ ...project, members: project.members.slice(1) }, ...honors.en.snqProjects.slice(1)] } } },
    { name: 'honors_year_counts_parity', schema: CMS_PAYLOAD_REGISTRY.honors.publishedSchema, payload: { ...honors, en: { ...honors.en, snqYearCounts: honors.en.snqYearCounts.slice(1) } } },
    { name: 'honors_leads_parity', schema: CMS_PAYLOAD_REGISTRY.honors.publishedSchema, payload: { ...honors, en: { ...honors.en, nhqa: { ...honors.en.nhqa, leads: honors.en.nhqa.leads.slice(1) } } } },
    { name: 'honors_keywords_parity', schema: CMS_PAYLOAD_REGISTRY.honors.publishedSchema, payload: { ...honors, en: { ...honors.en, nhqa: { ...honors.en.nhqa, keywords: honors.en.nhqa.keywords.slice(1) } } } },
  ];
}

describe('Wave 5 SQL publication corpus parity', () => {
  it('accepts every current global snapshot through the canonical published schema', () => {
    for (const kind of GLOBAL_KINDS) {
      expect(CMS_PAYLOAD_REGISTRY[kind].publishedSchema.safeParse(sourcePayload(kind)).success).toBe(true);
    }
  });

  it('rejects every representative SQL mutation through the canonical published schema', () => {
    for (const invalidCase of invalidCases()) {
      expect(invalidCase.schema.safeParse(invalidCase.payload).success, invalidCase.name).toBe(false);
    }
  });

  it('keeps every canonical mutation case represented in the authoritative pgTAP corpus', () => {
    const pgTap = readFileSync(
      new URL('../supabase/tests/database/008_wave5_global_validation.test.sql', import.meta.url),
      'utf8',
    );
    for (const invalidCase of invalidCases()) expect(pgTap, invalidCase.name).toContain(`'${invalidCase.name}'`);
  });
});
