-- allow: SIZE_OK - This forward migration atomically replaces three stale bilingual publication contracts and their dispatcher binding.
begin;

create or replace function public.cms_news_payload_is_publishable(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  locale_name text;
  scope_name text;
  locale_value jsonb;
  announcements jsonb;
  announcement jsonb;
  zh_announcements jsonb;
  en_announcements jsonb;
  item_index integer;
begin
  if not public.cms_jsonb_has_exact_keys(candidate, array['announcementBoardUrl', 'zh', 'en'], array[]::text[])
    or public.cms_jsonb_is_credential_free_https_url(candidate -> 'announcementBoardUrl') is not true then
    return false;
  end if;

  foreach locale_name in array array['zh', 'en'] loop
    locale_value := candidate -> locale_name;
    if not public.cms_jsonb_has_exact_keys(locale_value, array['department', 'holistic'], array[]::text[]) then
      return false;
    end if;
    foreach scope_name in array array['department', 'holistic'] loop
      announcements := locale_value -> scope_name;
      if jsonb_typeof(announcements) <> 'array' then
        return false;
      end if;
      for announcement in select value from jsonb_array_elements(announcements) loop
        if not public.cms_jsonb_has_exact_keys(
          announcement,
          array['id', 'publishedOn', 'pinned', 'category', 'tag', 'title', 'lines'],
          array['statTop', 'statTopLabel', 'statBot', 'statBotLabel', 'compactStat']
        )
          or jsonb_typeof(announcement -> 'id') <> 'string'
          or length(announcement ->> 'id') = 0
          or jsonb_typeof(announcement -> 'publishedOn') <> 'string'
          or announcement ->> 'publishedOn' collate "C" !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          or public.cms_jsonb_is_localized_calendar_date(to_jsonb(replace(announcement ->> 'publishedOn', '-', '/')), 'zh') is not true
          or jsonb_typeof(announcement -> 'pinned') <> 'boolean'
          or jsonb_typeof(announcement -> 'category') <> 'string'
          or announcement ->> 'category' <> all(array['department', 'achievement', 'international'])
          or jsonb_typeof(announcement -> 'tag') <> 'string'
          or jsonb_typeof(announcement -> 'title') <> 'string'
          or public.cms_jsonb_is_text_array(announcement -> 'lines') is not true
          or (announcement ? 'statTop' and jsonb_typeof(announcement -> 'statTop') <> 'string')
          or (announcement ? 'statTopLabel' and jsonb_typeof(announcement -> 'statTopLabel') <> 'string')
          or (announcement ? 'statBot' and jsonb_typeof(announcement -> 'statBot') <> 'string')
          or (announcement ? 'statBotLabel' and jsonb_typeof(announcement -> 'statBotLabel') <> 'string')
          or (announcement ? 'compactStat' and jsonb_typeof(announcement -> 'compactStat') <> 'boolean') then
          return false;
        end if;
      end loop;
      if (select count(*) <> count(distinct item.value ->> 'id') from jsonb_array_elements(announcements) as item(value)) then
        return false;
      end if;
    end loop;
    if (
      select count(*) <> count(distinct item.value ->> 'id')
      from jsonb_array_elements((locale_value -> 'department') || (locale_value -> 'holistic')) as item(value)
    ) then
      return false;
    end if;
  end loop;

  foreach scope_name in array array['department', 'holistic'] loop
    zh_announcements := candidate #> array['zh', scope_name];
    en_announcements := candidate #> array['en', scope_name];
    if public.cms_jsonb_arrays_have_matching_field(zh_announcements, en_announcements, 'id') is not true then
      return false;
    end if;
    if jsonb_array_length(zh_announcements) > 0 then
      for item_index in 0..jsonb_array_length(zh_announcements) - 1 loop
        if zh_announcements #> array[item_index::text, 'publishedOn'] is distinct from en_announcements #> array[item_index::text, 'publishedOn']
          or zh_announcements #> array[item_index::text, 'pinned'] is distinct from en_announcements #> array[item_index::text, 'pinned']
          or zh_announcements #> array[item_index::text, 'category'] is distinct from en_announcements #> array[item_index::text, 'category']
          or zh_announcements #> array[item_index::text, 'statTop'] is distinct from en_announcements #> array[item_index::text, 'statTop']
          or zh_announcements #> array[item_index::text, 'statBot'] is distinct from en_announcements #> array[item_index::text, 'statBot']
          or zh_announcements #> array[item_index::text, 'compactStat'] is distinct from en_announcements #> array[item_index::text, 'compactStat'] then
          return false;
        end if;
      end loop;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.cms_activities_payload_is_publishable(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  locale_name text;
  scope_name text;
  locale_value jsonb;
  activities jsonb;
  activity jsonb;
  embedded_date text;
  zh_activities jsonb;
  en_activities jsonb;
  item_index integer;
begin
  if not public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[]) then
    return false;
  end if;
  foreach locale_name in array array['zh', 'en'] loop
    locale_value := candidate -> locale_name;
    if not public.cms_jsonb_has_exact_keys(locale_value, array['department', 'holistic'], array[]::text[]) then
      return false;
    end if;
    foreach scope_name in array array['department', 'holistic'] loop
      activities := locale_value -> scope_name;
      if jsonb_typeof(activities) <> 'array' then
        return false;
      end if;
      for activity in select value from jsonb_array_elements(activities) loop
        embedded_date := case locale_name
          when 'zh' then substring(activity ->> 'date' from '^([0-9]{4}/[0-9]{2}/[0-9]{2})')
          when 'en' then substring(activity ->> 'date' from '^[A-Za-z]{3} ([0-9]{4}/[0-9]{2}/[0-9]{2})')
        end;
        if not public.cms_jsonb_has_exact_keys(
          activity,
          array['id', 'sortDate', 'cat', 'date', 'enrolled', 'link', 'place', 'speaker', 'status', 'title', 'topic'],
          array[]::text[]
        )
          or exists (select 1 from jsonb_each(activity) as field(key, value) where jsonb_typeof(field.value) <> 'string')
          or length(activity ->> 'id') = 0
          or activity ->> 'sortDate' collate "C" !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          or public.cms_jsonb_is_localized_calendar_date(to_jsonb(replace(activity ->> 'sortDate', '-', '/')), 'zh') is not true
          or public.cms_jsonb_is_localized_activity_datetime(activity -> 'date', locale_name) is not true
          or replace(embedded_date, '/', '-') is distinct from activity ->> 'sortDate'
          or (activity ->> 'link' <> '' and public.cms_jsonb_is_credential_free_https_url(activity -> 'link') is not true) then
          return false;
        end if;
      end loop;
      if (select count(*) <> count(distinct item.value ->> 'id') from jsonb_array_elements(activities) as item(value)) then
        return false;
      end if;
    end loop;
    if (
      select count(*) <> count(distinct item.value ->> 'id')
      from jsonb_array_elements((locale_value -> 'department') || (locale_value -> 'holistic')) as item(value)
    ) then
      return false;
    end if;
  end loop;

  foreach scope_name in array array['department', 'holistic'] loop
    zh_activities := candidate #> array['zh', scope_name];
    en_activities := candidate #> array['en', scope_name];
    if public.cms_jsonb_arrays_have_matching_field(zh_activities, en_activities, 'id') is not true then
      return false;
    end if;
    if jsonb_array_length(zh_activities) > 0 then
      for item_index in 0..jsonb_array_length(zh_activities) - 1 loop
        if zh_activities #> array[item_index::text, 'sortDate'] is distinct from en_activities #> array[item_index::text, 'sortDate']
          or zh_activities #> array[item_index::text, 'link'] is distinct from en_activities #> array[item_index::text, 'link'] then
          return false;
        end if;
      end loop;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.cms_holistic_research_payload_is_publishable(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  locale_name text;
  locale_value jsonb;
  item jsonb;
  collection_name text;
  zh_items jsonb;
  en_items jsonb;
  item_index integer;
begin
  if not public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[]) then
    return false;
  end if;
  foreach locale_name in array array['zh', 'en'] loop
    locale_value := candidate -> locale_name;
    if not public.cms_jsonb_has_exact_keys(locale_value, array[
      'authorsLabel', 'byYear', 'byYearTitle', 'clinicalDesc', 'clinicalLegend', 'clinicalStats',
      'clinicalTitle', 'desc', 'eduDesc', 'eduLegend', 'eduTitle', 'eyebrow', 'papers', 'title', 'totalLabel'
    ], array[]::text[])
      or exists (
        select 1 from jsonb_each(locale_value - array['byYear', 'clinicalStats', 'papers']) as field(key, value)
        where jsonb_typeof(field.value) <> 'string'
      )
      or jsonb_typeof(locale_value -> 'byYear') <> 'array'
      or jsonb_typeof(locale_value -> 'clinicalStats') <> 'array'
      or jsonb_typeof(locale_value -> 'papers') <> 'array' then
      return false;
    end if;

    for item in select value from jsonb_array_elements(locale_value -> 'byYear') loop
      if not public.cms_jsonb_has_exact_keys(item, array['id', 'clinical', 'edu', 'year'], array[]::text[])
        or jsonb_typeof(item -> 'id') <> 'string'
        or length(item ->> 'id') = 0
        or jsonb_typeof(item -> 'clinical') <> 'number'
        or (item ->> 'clinical')::numeric <> trunc((item ->> 'clinical')::numeric)
        or (item ->> 'clinical')::numeric < 0
        or jsonb_typeof(item -> 'edu') <> 'number'
        or (item ->> 'edu')::numeric <> trunc((item ->> 'edu')::numeric)
        or (item ->> 'edu')::numeric < 0
        or jsonb_typeof(item -> 'year') <> 'number'
        or (item ->> 'year')::numeric <> trunc((item ->> 'year')::numeric)
        or (item ->> 'year')::numeric not between 1900 and 2100 then
        return false;
      end if;
    end loop;
    if (select count(*) <> count(distinct row_item.value ->> 'id') from jsonb_array_elements(locale_value -> 'byYear') as row_item(value))
      or (select count(*) <> count(distinct row_item.value ->> 'year') from jsonb_array_elements(locale_value -> 'byYear') as row_item(value)) then
      return false;
    end if;

    for item in select value from jsonb_array_elements(locale_value -> 'clinicalStats') loop
      if not public.cms_jsonb_has_exact_keys(item, array['id', 'label', 'num'], array[]::text[])
        or jsonb_typeof(item -> 'id') <> 'string'
        or length(item ->> 'id') = 0
        or jsonb_typeof(item -> 'label') <> 'string'
        or jsonb_typeof(item -> 'num') <> 'number'
        or (item ->> 'num')::numeric <> trunc((item ->> 'num')::numeric)
        or (item ->> 'num')::numeric < 0 then
        return false;
      end if;
    end loop;
    if (select count(*) <> count(distinct row_item.value ->> 'id') from jsonb_array_elements(locale_value -> 'clinicalStats') as row_item(value)) then
      return false;
    end if;

    for item in select value from jsonb_array_elements(locale_value -> 'papers') loop
      if not public.cms_jsonb_has_exact_keys(item, array['id', 'authors', 'byline', 'journal', 'month', 'title', 'year'], array[]::text[])
        or jsonb_typeof(item -> 'id') <> 'string'
        or length(item ->> 'id') = 0
        or public.cms_jsonb_is_text_array(item -> 'authors') is not true
        or jsonb_typeof(item -> 'byline') <> 'string'
        or jsonb_typeof(item -> 'journal') <> 'string'
        or jsonb_typeof(item -> 'title') <> 'string'
        or jsonb_typeof(item -> 'month') <> 'number'
        or (item ->> 'month')::numeric <> trunc((item ->> 'month')::numeric)
        or (item ->> 'month')::numeric not between 1 and 12
        or jsonb_typeof(item -> 'year') <> 'number'
        or (item ->> 'year')::numeric <> trunc((item ->> 'year')::numeric)
        or (item ->> 'year')::numeric not between 1900 and 2100 then
        return false;
      end if;
    end loop;
    if (select count(*) <> count(distinct row_item.value ->> 'id') from jsonb_array_elements(locale_value -> 'papers') as row_item(value)) then
      return false;
    end if;
  end loop;

  foreach collection_name in array array['byYear', 'clinicalStats', 'papers'] loop
    zh_items := candidate #> array['zh', collection_name];
    en_items := candidate #> array['en', collection_name];
    if public.cms_jsonb_arrays_have_matching_field(zh_items, en_items, 'id') is not true then
      return false;
    end if;
    if jsonb_array_length(zh_items) > 0 then
      for item_index in 0..jsonb_array_length(zh_items) - 1 loop
        if collection_name = 'byYear' and (
          zh_items #> array[item_index::text, 'year'] is distinct from en_items #> array[item_index::text, 'year']
          or zh_items #> array[item_index::text, 'edu'] is distinct from en_items #> array[item_index::text, 'edu']
          or zh_items #> array[item_index::text, 'clinical'] is distinct from en_items #> array[item_index::text, 'clinical']
        ) then
          return false;
        elsif collection_name = 'clinicalStats'
          and zh_items #> array[item_index::text, 'num'] is distinct from en_items #> array[item_index::text, 'num'] then
          return false;
        elsif collection_name = 'papers' and (
          zh_items #> array[item_index::text, 'year'] is distinct from en_items #> array[item_index::text, 'year']
          or zh_items #> array[item_index::text, 'month'] is distinct from en_items #> array[item_index::text, 'month']
          or zh_items #> array[item_index::text, 'journal'] is distinct from en_items #> array[item_index::text, 'journal']
          or zh_items #> array[item_index::text, 'title'] is distinct from en_items #> array[item_index::text, 'title']
          or zh_items #> array[item_index::text, 'byline'] is distinct from en_items #> array[item_index::text, 'byline']
          or jsonb_array_length(zh_items #> array[item_index::text, 'authors']) <> jsonb_array_length(en_items #> array[item_index::text, 'authors'])
        ) then
          return false;
        end if;
      end loop;
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(candidate #> '{zh,byYear}') as year_item(value)
    where (year_item.value ->> 'edu')::numeric <> (
      select count(*)::numeric
      from jsonb_array_elements(candidate #> '{zh,papers}') as paper(value)
      where paper.value ->> 'year' = year_item.value ->> 'year'
    )
  ) or exists (
    select 1
    from jsonb_array_elements(candidate #> '{zh,papers}') as paper(value)
    where not exists (
      select 1
      from jsonb_array_elements(candidate #> '{zh,byYear}') as year_item(value)
      where year_item.value ->> 'year' = paper.value ->> 'year'
    )
  ) then
    return false;
  end if;
  return true;
end;
$$;

create or replace function public.cms_payload_is_publishable(
  document_kind public.cms_document_kind,
  candidate jsonb
)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select (document_kind = any(array['centers', 'news', 'activities']::public.cms_document_kind[])
      or public.cms_wave5_global_payload_is_valid(document_kind, candidate) is true)
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

alter function public.cms_news_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_activities_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_holistic_research_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_payload_is_publishable(public.cms_document_kind, jsonb) owner to postgres;

revoke all on function
  public.cms_news_payload_is_publishable(jsonb),
  public.cms_activities_payload_is_publishable(jsonb),
  public.cms_holistic_research_payload_is_publishable(jsonb),
  public.cms_payload_is_publishable(public.cms_document_kind, jsonb)
from public, anon, authenticated;

comment on function public.cms_news_payload_is_publishable(jsonb) is
  'Validates the current bilingual announcement identity, date, category, optional-stat, and board-link publication contract.';
comment on function public.cms_activities_payload_is_publishable(jsonb) is
  'Validates the current bilingual activity identity, localized date, shared sort-date, and credential-free link publication contract.';
comment on function public.cms_holistic_research_payload_is_publishable(jsonb) is
  'Validates the current bilingual research identities, shared metrics, publication dates, and derived yearly paper totals.';
comment on function public.cms_payload_is_publishable(public.cms_document_kind, jsonb) is
  'Fail-closed exhaustive publication validator binding a CMS document kind to its current payload shape.';

notify pgrst, 'reload schema';
commit;
