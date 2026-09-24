begin;

create function public.cms_jsonb_is_holistic_symposium(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  date_parts text[];
  end_date text;
  ranges text[];
  range_value text;
  start_date text;
  time_parts text[];
  year_number numeric;
  year_value text;
begin
  if jsonb_typeof(candidate -> 'dates') is distinct from 'string'
    or jsonb_typeof(candidate -> 'time') is distinct from 'string'
    or jsonb_typeof(candidate -> 'year') is distinct from 'number' then
    return false;
  end if;
  year_number := (candidate ->> 'year')::numeric;
  if year_number <> trunc(year_number) or year_number not between 1000 and 9999 then return false; end if;
  year_value := trunc(year_number)::text;

  date_parts := regexp_match(candidate ->> 'dates', '^([0-9]{4})/([0-9]{2})/([0-9]{2})（[日一二三四五六]）– ([0-9]{2})/([0-9]{2})（[日一二三四五六]）$');
  if date_parts is not null then
    start_date := date_parts[1] || '/' || date_parts[2] || '/' || date_parts[3];
    end_date := date_parts[1] || '/' || date_parts[4] || '/' || date_parts[5];
  else
    date_parts := regexp_match(candidate ->> 'dates', '^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)–(Mon|Tue|Wed|Thu|Fri|Sat|Sun) ([0-9]{4})/([0-9]{2})/([0-9]{2})–([0-9]{2})$');
    if date_parts is not null then
      start_date := date_parts[3] || '/' || date_parts[4] || '/' || date_parts[5];
      end_date := date_parts[3] || '/' || date_parts[4] || '/' || date_parts[6];
    else
      date_parts := regexp_match(candidate ->> 'dates', '^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) ([0-9]{4})/([0-9]{2})/([0-9]{2})$');
      if date_parts is not null then
        start_date := date_parts[2] || '/' || date_parts[3] || '/' || date_parts[4];
      else
        date_parts := regexp_match(candidate ->> 'dates', '^([0-9]{4})/([0-9]{2})/([0-9]{2})(（[日一二三四五六]）)?$');
        if date_parts is null then return false; end if;
        start_date := date_parts[1] || '/' || date_parts[2] || '/' || date_parts[3];
      end if;
      end_date := null;
    end if;
  end if;

  if split_part(start_date, '/', 1) is distinct from year_value
    or public.cms_jsonb_is_localized_calendar_date(to_jsonb(start_date), 'zh') is not true
    or (end_date is not null and (
      public.cms_jsonb_is_localized_calendar_date(to_jsonb(end_date), 'zh') is not true
      or end_date <= start_date
    )) then
    return false;
  end if;

  ranges := string_to_array(candidate ->> 'time', ' / ');
  if cardinality(ranges) is distinct from (case when end_date is null then 1 else 2 end) then return false; end if;
  foreach range_value in array ranges loop
    time_parts := regexp_match(range_value, '^([0-9]{2}):([0-9]{2})–([0-9]{2}):([0-9]{2})$');
    if time_parts is null
      or time_parts[1]::integer > 23 or time_parts[2]::integer > 59
      or time_parts[3]::integer > 23 or time_parts[4]::integer > 59
      or time_parts[1]::integer * 60 + time_parts[2]::integer
        >= time_parts[3]::integer * 60 + time_parts[4]::integer then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create function public.cms_wave5_page_payload_is_valid(
  document_kind public.cms_document_kind,
  candidate jsonb
)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select (case document_kind
    when 'facdev' then
      public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,kpis}', candidate #> '{en,kpis}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,services}', candidate #> '{en,services}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,groups}', candidate #> '{en,groups}')
    when 'ebm' then
      public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,kpis}', candidate #> '{en,kpis}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,missions}', candidate #> '{en,missions}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,awardsLit}', candidate #> '{en,awardsLit}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,awardsClin}', candidate #> '{en,awardsClin}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,awardsTrans}', candidate #> '{en,awardsTrans}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,stages}', candidate #> '{en,stages}')
      and public.cms_jsonb_paired_nested_arrays_have_equal_length(
        candidate #> '{zh,stages}', candidate #> '{en,stages}', 'items'
      )
      and public.cms_jsonb_paired_nested_arrays_have_equal_length(
        candidate #> '{zh,courseGroups}', candidate #> '{en,courseGroups}', 'rows'
      )
    when 'holistic' then
      public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,kpis}', candidate #> '{en,kpis}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,features}', candidate #> '{en,features}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,algee}', candidate #> '{en,algee}')
      and public.cms_jsonb_arrays_have_equal_length(
        candidate #> '{zh,aiEcosystem,flow}', candidate #> '{en,aiEcosystem,flow}'
      )
      and public.cms_jsonb_arrays_have_equal_length(
        candidate #> '{zh,aiEcosystem,problems}', candidate #> '{en,aiEcosystem,problems}'
      )
      and public.cms_jsonb_arrays_have_equal_length(
        candidate #> '{zh,outcomes,symposiums}', candidate #> '{en,outcomes,symposiums}'
      )
      and not exists (
        select 1
        from jsonb_array_elements(
          case
            when jsonb_typeof(candidate #> '{zh,outcomes,symposiums}') = 'array'
              and jsonb_typeof(candidate #> '{en,outcomes,symposiums}') = 'array'
            then (candidate #> '{zh,outcomes,symposiums}') || (candidate #> '{en,outcomes,symposiums}')
            else '[]'::jsonb
          end
        ) as symposium(value)
        where public.cms_jsonb_is_holistic_symposium(symposium.value) is not true
      )
    when 'holistic_research' then
      public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,byYear}', candidate #> '{en,byYear}')
      and public.cms_jsonb_arrays_have_equal_length(
        candidate #> '{zh,clinicalStats}', candidate #> '{en,clinicalStats}'
      )
      and public.cms_jsonb_paired_nested_arrays_have_equal_length(
        candidate #> '{zh,papers}', candidate #> '{en,papers}', 'authors'
      )
    else true
  end) is true;
$$;

create or replace function public.cms_payload_is_publishable(
  document_kind public.cms_document_kind,
  candidate jsonb
)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_wave5_global_payload_is_valid(document_kind, candidate) is true
    and public.cms_wave5_page_payload_is_valid(document_kind, candidate) is true
    and (case document_kind
      when 'site_copy' then public.cms_site_copy_payload_is_publishable(candidate)
      when 'centers' then public.cms_centers_payload_is_publishable(candidate)
      when 'people' then public.cms_people_payload_is_publishable(candidate)
      when 'news' then public.cms_news_payload_is_publishable(candidate)
      when 'activities' then public.cms_activities_payload_is_publishable(candidate)
      when 'kpis' then public.cms_kpis_payload_is_publishable(candidate)
      when 'honors' then public.cms_honors_payload_is_publishable(candidate)
      when 'digital_materials' then public.cms_digital_materials_payload_is_publishable(candidate)
      when 'facdev' then public.cms_facdev_payload_is_publishable(candidate)
      when 'ebm' then public.cms_ebm_payload_is_publishable(candidate)
      when 'holistic' then public.cms_holistic_payload_is_publishable(candidate)
      when 'holistic_research' then public.cms_holistic_research_payload_is_publishable(candidate)
      else false
    end) is true;
$$;

alter function public.cms_jsonb_is_holistic_symposium(jsonb) owner to postgres;
alter function public.cms_wave5_page_payload_is_valid(public.cms_document_kind, jsonb) owner to postgres;
alter function public.cms_payload_is_publishable(public.cms_document_kind, jsonb) owner to postgres;

revoke all on function
  public.cms_jsonb_is_holistic_symposium(jsonb),
  public.cms_wave5_page_payload_is_valid(public.cms_document_kind, jsonb),
  public.cms_payload_is_publishable(public.cms_document_kind, jsonb)
from public, anon, authenticated;

comment on function public.cms_wave5_page_payload_is_valid(public.cms_document_kind, jsonb) is
  'Enforces bilingual positional collection parity for structured Wave 5 page editors.';

commit;
