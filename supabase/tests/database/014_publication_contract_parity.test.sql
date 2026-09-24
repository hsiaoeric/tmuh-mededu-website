-- allow: SIZE_OK - This rollback-wrapped pgTAP corpus keeps three bilingual publication contracts and their semantic mutations auditable together.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(28);

create temporary table publication_contract_payloads on commit drop as
select documents.kind, revisions.payload
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where revisions.status = 'published'
  and documents.kind in ('news', 'activities', 'holistic_research');

select is((select count(*) from publication_contract_payloads), 3::bigint, 'publication_contract_fixture_cardinality');

select ok(public.cms_news_payload_is_publishable((select payload from publication_contract_payloads where kind = 'news')), 'publication_contract_news_seed_valid');
select ok(public.cms_activities_payload_is_publishable((select payload from publication_contract_payloads where kind = 'activities')), 'publication_contract_activities_seed_valid');
select ok(public.cms_holistic_research_payload_is_publishable((select payload from publication_contract_payloads where kind = 'holistic_research')), 'publication_contract_holistic_research_seed_valid');
select ok(public.cms_payload_is_publishable('news', (select payload from publication_contract_payloads where kind = 'news')), 'publication_contract_news_dispatch_valid');
select ok(public.cms_payload_is_publishable('activities', (select payload from publication_contract_payloads where kind = 'activities')), 'publication_contract_activities_dispatch_valid');
select ok(public.cms_payload_is_publishable('holistic_research', (select payload from publication_contract_payloads where kind = 'holistic_research')), 'publication_contract_holistic_research_dispatch_valid');

select ok(public.cms_news_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'news'), '{zh,unknown}', 'true')
) is false, 'publication_contract_news_rejects_unknown_locale_key');
select ok(public.cms_news_payload_is_publishable(
  (select payload #- '{zh,department,0,id}' from publication_contract_payloads where kind = 'news')
) is false, 'publication_contract_news_requires_announcement_id');
select ok(public.cms_news_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'news'), '{zh,department,0,id}', '""')
) is false, 'publication_contract_news_rejects_blank_announcement_id');
select ok(public.cms_news_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'news'), '{zh,department,0,publishedOn}', '"2025-02-29"')
) is false, 'publication_contract_news_rejects_invalid_published_date');
select ok(public.cms_news_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'news'), '{zh,department,0,category}', '"other"')
) is false, 'publication_contract_news_rejects_unknown_category');
select ok(public.cms_news_payload_is_publishable(
  jsonb_set(
    jsonb_set((select payload from publication_contract_payloads where kind = 'news'), '{zh,department,0,category}', 'null'),
    '{en,department,0,category}',
    'null'
  )
) is false, 'publication_contract_news_rejects_json_null_category');
select ok(public.cms_news_payload_is_publishable(
  jsonb_set(
    (select payload from publication_contract_payloads where kind = 'news'),
    '{zh,department}',
    (select (payload #> '{zh,department}') || jsonb_build_array(payload #> '{zh,department,0}') from publication_contract_payloads where kind = 'news')
  )
) is false, 'publication_contract_news_rejects_duplicate_id');
select ok(public.cms_news_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'news'), '{en,department,0,publishedOn}', '"2026-01-01"')
) is false, 'publication_contract_news_requires_shared_semantics');

select ok(public.cms_activities_payload_is_publishable(
  (select payload #- '{zh,holistic,0,id}' from publication_contract_payloads where kind = 'activities')
) is false, 'publication_contract_activities_requires_id');
select ok(public.cms_activities_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'activities'), '{zh,holistic,0,sortDate}', '"2025-02-29"')
) is false, 'publication_contract_activities_rejects_invalid_sort_date');
select ok(public.cms_activities_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'activities'), '{zh,holistic,0,sortDate}', '"2026-01-01"')
) is false, 'publication_contract_activities_matches_display_and_sort_dates');
select ok(public.cms_activities_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'activities'), '{zh,holistic,0,link}', '"http://example.test"')
) is false, 'publication_contract_activities_rejects_unsafe_link');
select ok(public.cms_activities_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'activities'), '{en,holistic,0,id}', '"different-activity"')
) is false, 'publication_contract_activities_requires_id_parity');
select ok(public.cms_activities_payload_is_publishable(
  jsonb_set(
    (select payload from publication_contract_payloads where kind = 'activities'),
    '{zh,holistic}',
    (select (payload #> '{zh,holistic}') || jsonb_build_array(payload #> '{zh,holistic,0}') from publication_contract_payloads where kind = 'activities')
  )
) is false, 'publication_contract_activities_rejects_duplicate_id');

select ok(public.cms_holistic_research_payload_is_publishable(
  (select payload #- '{zh,byYear,0,id}' from publication_contract_payloads where kind = 'holistic_research')
) is false, 'publication_contract_holistic_research_requires_row_id');
select ok(public.cms_holistic_research_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'holistic_research'), '{zh,total}', '94')
) is false, 'publication_contract_holistic_research_rejects_removed_total');
select ok(public.cms_holistic_research_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'holistic_research'), '{zh,clinicalStats,0,num}', '-1')
) is false, 'publication_contract_holistic_research_rejects_negative_count');
select ok(public.cms_holistic_research_payload_is_publishable(
  jsonb_set(
    (select payload from publication_contract_payloads where kind = 'holistic_research'),
    '{zh,clinicalStats}',
    (select (payload #> '{zh,clinicalStats}') || jsonb_build_array(payload #> '{zh,clinicalStats,0}') from publication_contract_payloads where kind = 'holistic_research')
  )
) is false, 'publication_contract_holistic_research_rejects_duplicate_id');
select ok(public.cms_holistic_research_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'holistic_research'), '{en,papers,0,id}', '"different-paper"')
) is false, 'publication_contract_holistic_research_requires_id_parity');
select ok(public.cms_holistic_research_payload_is_publishable(
  jsonb_set((select payload from publication_contract_payloads where kind = 'holistic_research'), '{en,papers,0,journal}', '"Different Journal"')
) is false, 'publication_contract_holistic_research_requires_shared_paper_semantics');
select ok(public.cms_holistic_research_payload_is_publishable(
  jsonb_set(
    jsonb_set((select payload from publication_contract_payloads where kind = 'holistic_research'), '{zh,byYear,0,edu}', '4'),
    '{en,byYear,0,edu}',
    '4'
  )
) is false, 'publication_contract_holistic_research_reconciles_yearly_paper_count');

select * from finish();
rollback;
