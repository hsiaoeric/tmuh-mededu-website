begin;

create or replace function public.cms_people_payload_is_publishable(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(
          locale.value,
          array['centerPeople', 'holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam', 'memberGroups'],
          array[]::text[]
        )
        and not exists (
          select 1
          from jsonb_each(locale.value - 'memberGroups') as collection(key, value)
          where case when jsonb_typeof(collection.value) <> 'array' then true else exists (
            select 1 from jsonb_array_elements(collection.value) as item(value)
            where case when collection.key = 'centerPeople' then not (
              public.cms_jsonb_has_exact_keys(item.value, array['centerId', 'people'], array[]::text[])
              and jsonb_typeof(item.value -> 'centerId') = 'string'
              and case when jsonb_typeof(item.value -> 'people') <> 'array' then false else not exists (
                select 1 from jsonb_array_elements(item.value -> 'people') as person(value)
                where not public.cms_jsonb_is_person(person.value)
              ) end
            ) else not public.cms_jsonb_is_person(item.value) end
          ) end
        )
        and case when jsonb_typeof(locale.value -> 'centerPeople') <> 'array' then false else
          (select count(*) = count(distinct item.value ->> 'centerId') from jsonb_array_elements(locale.value -> 'centerPeople') as item(value))
        end
        and case when jsonb_typeof(locale.value -> 'memberGroups') <> 'array' then false else
          (select jsonb_agg(item.value -> 'id' order by item.ordinality)
            from jsonb_array_elements(locale.value -> 'memberGroups') with ordinality as item(value, ordinality))
            = '["department_advisors","teaching_attendings","teaching_allied_health"]'::jsonb
          and not exists (
            select 1 from jsonb_array_elements(locale.value -> 'memberGroups') as member_group(value)
            where not (
              public.cms_jsonb_has_exact_keys(member_group.value, array['id', 'people'], array[]::text[])
              and jsonb_typeof(member_group.value -> 'id') = 'string'
              and case when jsonb_typeof(member_group.value -> 'people') <> 'array' then false else not exists (
                select 1 from jsonb_array_elements(member_group.value -> 'people') as person(value)
                where not public.cms_jsonb_is_person(person.value)
                  or person.value ->> 'roleKey' <> all(array[
                    'director', 'deputy', 'cadmin', 'instructor', 'seed', 'vp', 'lead', 'ddir',
                    'ddep', 'head', 'spec', 'pm', 'advisor', 'ai', 'eng'
                  ])
              ) end
            )
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    )
    and public.cms_jsonb_arrays_have_matching_field(candidate #> '{zh,centerPeople}', candidate #> '{en,centerPeople}', 'centerId')
    and public.cms_jsonb_paired_nested_arrays_have_equal_length(candidate #> '{zh,centerPeople}', candidate #> '{en,centerPeople}', 'people')
    and public.cms_jsonb_arrays_have_matching_field(candidate #> '{zh,memberGroups}', candidate #> '{en,memberGroups}', 'id')
    and public.cms_jsonb_paired_nested_arrays_have_equal_length(candidate #> '{zh,memberGroups}', candidate #> '{en,memberGroups}', 'people');
$$;

create or replace function public.cms_kpis_payload_is_publishable(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array['items'], array[]::text[])
        and case when jsonb_typeof(locale.value -> 'items') <> 'array' then false else
          (select jsonb_agg(item.value -> 'id' order by item.ordinality)
            from jsonb_array_elements(locale.value -> 'items') with ordinality as item(value, ordinality))
            = '["department_advisors","teaching_attendings","teaching_allied_health","education_centers"]'::jsonb
          and not exists (
            select 1 from jsonb_array_elements(locale.value -> 'items') as item(value)
            where not (
              public.cms_jsonb_has_exact_keys(
                item.value,
                array['id', 'num', 'suffix', 'label', 'en', 'color', 'delay', 'panelTitle'],
                array['panelDescription']
              )
              and jsonb_typeof(item.value -> 'id') = 'string'
              and jsonb_typeof(item.value -> 'num') = 'number'
              and jsonb_typeof(item.value -> 'suffix') = 'string'
              and jsonb_typeof(item.value -> 'label') = 'string'
              and jsonb_typeof(item.value -> 'en') = 'string'
              and public.cms_jsonb_is_hex_color(item.value -> 'color')
              and jsonb_typeof(item.value -> 'delay') = 'number'
              and jsonb_typeof(item.value -> 'panelTitle') = 'string'
              and (not item.value ? 'panelDescription' or jsonb_typeof(item.value -> 'panelDescription') = 'string')
            )
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    )
    and public.cms_jsonb_arrays_have_matching_field(candidate #> '{zh,items}', candidate #> '{en,items}', 'id');
$$;

create function public.cms_upgrade_legacy_kpis_payload(candidate jsonb)
returns jsonb language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  upgraded jsonb := candidate;
  locale_name text;
  upgraded_items jsonb;
begin
  if public.cms_kpis_payload_is_publishable(candidate) then
    return candidate;
  end if;

  if not public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    or exists (
      select 1
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
      where not public.cms_jsonb_has_exact_keys(locale.value, array['items'], array[]::text[])
        or jsonb_typeof(locale.value -> 'items') <> 'array'
        or jsonb_array_length(locale.value -> 'items') <> 4
        or exists (
          select 1 from jsonb_array_elements(locale.value -> 'items') as item(value)
          where not public.cms_jsonb_has_exact_keys(
            item.value,
            array['num', 'suffix', 'label', 'en', 'color', 'delay'],
            array[]::text[]
          )
        )
    ) then
    raise exception 'ambiguous or partial legacy KPI payload' using errcode = '23514';
  end if;

  foreach locale_name in array array['zh', 'en'] loop
    select jsonb_agg(
      item.value || jsonb_build_object(
        'id', (array['department_advisors', 'teaching_attendings', 'teaching_allied_health', 'education_centers'])[item.ordinality],
        'panelTitle', case
          when locale_name = 'zh' then (array['教學部顧問', '教學型主治成員', '教學型醫事人員成員', '五大教育中心'])[item.ordinality]
          else (array['Department Advisors', 'Teaching Attendings', 'Teaching Allied Health', 'The Five Education Centers'])[item.ordinality]
        end
      ) || case when item.ordinality = 4 then jsonb_build_object(
        'panelDescription', case when locale_name = 'zh'
          then '每一個中心承擔一段教育旅程：從教師的養成、技能的錘鍊、證據的檢驗，到照護一個完整的⁠人。'
          else 'Each center carries one stage of the journey — growing teachers, honing skills, testing evidence, and caring for the whole person.'
        end
      ) else '{}'::jsonb end
      order by item.ordinality
    ) into upgraded_items
    from jsonb_array_elements(candidate #> array[locale_name, 'items']) with ordinality as item(value, ordinality);
    upgraded := jsonb_set(upgraded, array[locale_name, 'items'], upgraded_items);
  end loop;

  if public.cms_kpis_payload_is_publishable(upgraded) is not true then
    raise exception 'ambiguous or partial legacy KPI payload' using errcode = '23514';
  end if;
  return upgraded;
end;
$$;

create function public.cms_upgrade_legacy_people_payload(candidate jsonb)
returns jsonb language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  upgraded jsonb := candidate;
  zh_groups constant jsonb := '[{"id":"department_advisors","people":[{"alternateName":"To be updated","department":"","duty":"","email":"","ext":"","hubId":"","name":"待更新","role":"顧問","roleKey":"advisor","slug":""},{"alternateName":"To be updated","department":"","duty":"","email":"","ext":"","hubId":"","name":"待更新","role":"顧問","roleKey":"advisor","slug":""},{"alternateName":"To be updated","department":"","duty":"","email":"","ext":"","hubId":"","name":"待更新","role":"顧問","roleKey":"advisor","slug":""}]},{"id":"teaching_attendings","people":[{"alternateName":"Hsin-Yi Chiu","department":"西醫 · 助理教授","duty":"","email":"","ext":"","hubId":"hsin-yi-chiu","name":"邱欣怡","portrait":{"kind":"local","path":"assets/hsin-yi-chiu.jpg"},"role":"負責人","roleKey":"lead","slug":"hsin-yi-chiu"},{"alternateName":"Jeng-Cheng Wu","department":"西醫 · 助理教授<br>泌尿科","duty":"","email":"","ext":"","hubId":"jeng-cheng-wu","name":"吳政誠","portrait":{"kind":"local","path":"assets/jeng-cheng-wu.jpg"},"role":"負責人","roleKey":"lead","slug":"jeng-cheng-wu"},{"alternateName":"Jen-Chieh Wu","department":"西醫 · 助理教授","duty":"","email":"","ext":"","hubId":"jen-chieh-wu","name":"吳人傑","portrait":{"kind":"local","path":"assets/jen-chieh-wu.jpg"},"role":"負責人","roleKey":"lead","slug":"jen-chieh-wu"}]},{"id":"teaching_allied_health","people":[{"alternateName":"Li-Hsuan Wang","department":"藥劑 · 教授<br>藥劑部","duty":"","email":"","ext":"","hubId":"","name":"王莉萱","portrait":{"kind":"local","path":"assets/li-hsuan-wang.jpg"},"role":"負責人","roleKey":"lead","slug":"li-hsuan-wang"},{"alternateName":"Fang-Chun Fan","department":"放射<br>影像醫學部","duty":"","email":"","ext":"","hubId":"","name":"范芳郡","portrait":{"kind":"local","path":"assets/fang-chun-fan.jpg"},"role":"負責人","roleKey":"lead","slug":"fang-chun-fan"},{"alternateName":"Hui-Fen Hsiang","department":"","duty":"","email":"","ext":"","hubId":"","name":"向慧芬","role":"負責人","roleKey":"lead","slug":""},{"alternateName":"Hsien-Lin Cheng","department":"","duty":"","email":"","ext":"","hubId":"","name":"鄭憲霖","role":"負責人","roleKey":"lead","slug":""}]}]'::jsonb;
  en_groups constant jsonb := '[{"id":"department_advisors","people":[{"alternateName":"待更新","department":"","duty":"","email":"","ext":"","hubId":"","name":"To be updated","role":"Advisor","roleKey":"advisor","slug":""},{"alternateName":"待更新","department":"","duty":"","email":"","ext":"","hubId":"","name":"To be updated","role":"Advisor","roleKey":"advisor","slug":""},{"alternateName":"待更新","department":"","duty":"","email":"","ext":"","hubId":"","name":"To be updated","role":"Advisor","roleKey":"advisor","slug":""}]},{"id":"teaching_attendings","people":[{"alternateName":"邱欣怡","department":"Physician · Asst. Prof.","duty":"","email":"","ext":"","hubId":"hsin-yi-chiu","name":"Hsin-Yi Chiu","portrait":{"kind":"local","path":"assets/hsin-yi-chiu.jpg"},"role":"Lead","roleKey":"lead","slug":"hsin-yi-chiu"},{"alternateName":"吳政誠","department":"Physician · Asst. Prof.<br>Urology","duty":"","email":"","ext":"","hubId":"jeng-cheng-wu","name":"Jeng-Cheng Wu","portrait":{"kind":"local","path":"assets/jeng-cheng-wu.jpg"},"role":"Lead","roleKey":"lead","slug":"jeng-cheng-wu"},{"alternateName":"吳人傑","department":"Physician · Asst. Prof.","duty":"","email":"","ext":"","hubId":"jen-chieh-wu","name":"Jen-Chieh Wu","portrait":{"kind":"local","path":"assets/jen-chieh-wu.jpg"},"role":"Lead","roleKey":"lead","slug":"jen-chieh-wu"}]},{"id":"teaching_allied_health","people":[{"alternateName":"王莉萱","department":"Pharmacy · Prof.<br>Pharmacy","duty":"","email":"","ext":"","hubId":"","name":"Li-Hsuan Wang","portrait":{"kind":"local","path":"assets/li-hsuan-wang.jpg"},"role":"Lead","roleKey":"lead","slug":"li-hsuan-wang"},{"alternateName":"范芳郡","department":"Radiology<br>Medical Imaging","duty":"","email":"","ext":"","hubId":"","name":"Fang-Chun Fan","portrait":{"kind":"local","path":"assets/fang-chun-fan.jpg"},"role":"Lead","roleKey":"lead","slug":"fang-chun-fan"},{"alternateName":"向慧芬","department":"","duty":"","email":"","ext":"","hubId":"","name":"Hui-Fen Hsiang","role":"Lead","roleKey":"lead","slug":""},{"alternateName":"鄭憲霖","department":"","duty":"","email":"","ext":"","hubId":"","name":"Hsien-Lin Cheng","role":"Lead","roleKey":"lead","slug":""}]}]'::jsonb;
begin
  if public.cms_people_payload_is_publishable(candidate) then
    return candidate;
  end if;

  if not public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    or exists (
      select 1
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
      where not public.cms_jsonb_has_exact_keys(
        locale.value,
        array['centerPeople', 'holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam'],
        array[]::text[]
      )
    ) then
    raise exception 'ambiguous or partial legacy people payload' using errcode = '23514';
  end if;

  upgraded := jsonb_set(upgraded, '{zh,memberGroups}', zh_groups);
  upgraded := jsonb_set(upgraded, '{en,memberGroups}', en_groups);
  if public.cms_people_payload_is_publishable(upgraded) is not true then
    raise exception 'ambiguous or partial legacy people payload' using errcode = '23514';
  end if;
  return upgraded;
end;
$$;

alter table public.cms_revisions disable trigger cms_revisions_enforce_lifecycle;

with upgrades as (
  select revisions.id, case documents.kind
    when 'kpis' then public.cms_upgrade_legacy_kpis_payload(revisions.payload)
    when 'people' then public.cms_upgrade_legacy_people_payload(revisions.payload)
  end as payload
  from public.cms_revisions as revisions
  join public.cms_documents as documents on documents.id = revisions.document_id
  where documents.kind in ('kpis', 'people')
    and revisions.status in ('draft', 'published', 'archived')
)
update public.cms_revisions as revisions
set payload = upgrades.payload
from upgrades
where revisions.id = upgrades.id
  and revisions.payload is distinct from upgrades.payload;

alter table public.cms_revisions enable trigger cms_revisions_enforce_lifecycle;

do $$
begin
  if exists (
    select 1
    from public.cms_revisions as revisions
    join public.cms_documents as documents on documents.id = revisions.document_id
    where documents.kind in ('kpis', 'people')
      and revisions.status in ('draft', 'published', 'archived')
      and public.cms_payload_is_publishable(documents.kind, revisions.payload) is not true
  ) then
    raise exception 'Glance revision upgrade left an invalid payload' using errcode = '23514';
  end if;
end;
$$;

alter function public.cms_people_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_kpis_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_upgrade_legacy_kpis_payload(jsonb) owner to postgres;
alter function public.cms_upgrade_legacy_people_payload(jsonb) owner to postgres;
revoke all on function public.cms_people_payload_is_publishable(jsonb) from public, anon, authenticated;
revoke all on function public.cms_kpis_payload_is_publishable(jsonb) from public, anon, authenticated;
revoke all on function public.cms_upgrade_legacy_kpis_payload(jsonb) from public, anon, authenticated;
revoke all on function public.cms_upgrade_legacy_people_payload(jsonb) from public, anon, authenticated;

comment on function public.cms_people_payload_is_publishable(jsonb) is
  'Internal people validator requiring canonical localized Glance member groups and member parity.';
comment on function public.cms_kpis_payload_is_publishable(jsonb) is
  'Internal KPI validator requiring canonical localized Glance identities and panel copy.';
comment on function public.cms_upgrade_legacy_kpis_payload(jsonb) is
  'Internal idempotent upgrader for pre-Glance KPI revision payloads.';
comment on function public.cms_upgrade_legacy_people_payload(jsonb) is
  'Internal idempotent upgrader for pre-Glance people revision payloads.';

commit;
