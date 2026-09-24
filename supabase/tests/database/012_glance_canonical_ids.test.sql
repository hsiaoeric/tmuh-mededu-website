begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(22);

create temporary table glance_payloads on commit drop as
select documents.kind, revisions.payload
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where revisions.status = 'published' and documents.kind in ('kpis', 'people');

create temporary table legacy_glance_payloads on commit drop as
select kind, case kind
  when 'kpis' then jsonb_build_object(
    'zh', jsonb_build_object('items', (
      select jsonb_agg(item.value - array['id', 'panelTitle', 'panelDescription'] order by item.ordinality)
      from jsonb_array_elements(payload #> '{zh,items}') with ordinality as item(value, ordinality)
    )),
    'en', jsonb_build_object('items', (
      select jsonb_agg(item.value - array['id', 'panelTitle', 'panelDescription'] order by item.ordinality)
      from jsonb_array_elements(payload #> '{en,items}') with ordinality as item(value, ordinality)
    ))
  )
  when 'people' then jsonb_build_object(
    'zh', (payload -> 'zh') - 'memberGroups',
    'en', (payload -> 'en') - 'memberGroups'
  )
end as payload
from glance_payloads;

select is((select count(*) from glance_payloads where kind = 'kpis'), 1::bigint, 'glance_kpi_fixture');
select is((select count(*) from glance_payloads where kind = 'people'), 1::bigint, 'glance_people_fixture');
select ok(public.cms_kpis_payload_is_publishable((select payload from glance_payloads where kind = 'kpis')), 'glance_kpi_valid');
select ok(public.cms_people_payload_is_publishable((select payload from glance_payloads where kind = 'people')), 'glance_people_valid');
select ok(public.cms_payload_is_publishable('kpis', (select payload from glance_payloads where kind = 'kpis')), 'glance_kpi_dispatch_valid');
select ok(public.cms_payload_is_publishable('people', (select payload from glance_payloads where kind = 'people')), 'glance_people_dispatch_valid');
select ok(
  public.cms_kpis_payload_is_publishable(
    jsonb_set((select payload from glance_payloads where kind = 'kpis'), '{zh,items,1,en}', '"Renamed caption"')
  ),
  'glance_caption_not_identity'
);
select ok(
  public.cms_kpis_payload_is_publishable(
    jsonb_set((select payload from glance_payloads where kind = 'kpis'), '{zh,items,0,id}', '"mismatch"')
  ) is false,
  'glance_kpi_id_invalid'
);
select ok(
  public.cms_kpis_payload_is_publishable(
    jsonb_set((select payload from glance_payloads where kind = 'kpis'), '{zh,items,0}', (select payload #> '{zh,items,1}' from glance_payloads where kind = 'kpis'))
  ) is false,
  'glance_kpi_id_order'
);
select ok(
  public.cms_people_payload_is_publishable((select payload #- '{zh,memberGroups,0}' from glance_payloads where kind = 'people')) is false,
  'glance_member_group_count'
);
select ok(
  public.cms_people_payload_is_publishable(
    jsonb_set((select payload from glance_payloads where kind = 'people'), '{zh,memberGroups,0}', (select payload #> '{zh,memberGroups,1}' from glance_payloads where kind = 'people'))
  ) is false,
  'glance_member_group_order'
);
select ok(
  public.cms_people_payload_is_publishable(
    jsonb_set(
      (select payload from glance_payloads where kind = 'people'),
      '{zh,memberGroups}',
      (select payload #> '{zh,memberGroups}' from glance_payloads where kind = 'people')
        || jsonb_build_array(jsonb_build_object('id', 'education_centers', 'people', jsonb_build_array()))
    )
  ) is false,
  'glance_education_centers_group'
);
select ok(
  public.cms_people_payload_is_publishable((select payload #- '{en,memberGroups,1,people,0}' from glance_payloads where kind = 'people')) is false,
  'glance_member_people_parity'
);
select ok(
  public.cms_people_payload_is_publishable(
    jsonb_set((select payload from glance_payloads where kind = 'people'), '{zh,memberGroups,0,people,0,roleKey}', '"unknown"')
  ) is false,
  'glance_member_role_key'
);
select ok(
  public.cms_kpis_payload_is_publishable(
    public.cms_upgrade_legacy_kpis_payload((select payload from legacy_glance_payloads where kind = 'kpis'))
  ),
  'glance_kpi_upgrade_valid'
);
select ok(
  public.cms_people_payload_is_publishable(
    public.cms_upgrade_legacy_people_payload((select payload from legacy_glance_payloads where kind = 'people'))
  ),
  'glance_people_upgrade_valid'
);
select is(
  public.cms_upgrade_legacy_kpis_payload((select payload from glance_payloads where kind = 'kpis')),
  (select payload from glance_payloads where kind = 'kpis'),
  'glance_kpi_upgrade_idempotent'
);
select is(
  public.cms_upgrade_legacy_people_payload((select payload from glance_payloads where kind = 'people')),
  (select payload from glance_payloads where kind = 'people'),
  'glance_people_upgrade_idempotent'
);
select throws_ok(
  $test$select public.cms_upgrade_legacy_kpis_payload(
    jsonb_set((select payload from legacy_glance_payloads where kind = 'kpis'), '{zh,items,0,id}', '"department_advisors"')
  )$test$,
  '23514',
  'ambiguous or partial legacy KPI payload',
  'glance_kpi_partial_upgrade_rejected'
);
select throws_ok(
  $test$select public.cms_upgrade_legacy_people_payload(
    jsonb_set((select payload from legacy_glance_payloads where kind = 'people'), '{zh,memberGroups}', '[]')
  )$test$,
  '23514',
  'ambiguous or partial legacy people payload',
  'glance_people_partial_upgrade_rejected'
);
select is(
  public.cms_upgrade_legacy_kpis_payload(
    jsonb_set((select payload from legacy_glance_payloads where kind = 'kpis'), '{zh,items,0,label}', '"自訂顧問標籤"')
  ) #>> '{zh,items,0,label}',
  '自訂顧問標籤',
  'glance_kpi_upgrade_preserves_authored_copy'
);
select is(
  public.cms_upgrade_legacy_people_payload((select payload from legacy_glance_payloads where kind = 'people')) #> '{zh,centerPeople}',
  (select payload #> '{zh,centerPeople}' from legacy_glance_payloads where kind = 'people'),
  'glance_people_upgrade_preserves_existing_content'
);

select * from finish();
rollback;
