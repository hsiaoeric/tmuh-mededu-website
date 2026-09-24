begin;

create or replace function public.cms_news_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['announcementBoardUrl', 'zh', 'en'], array[]::text[])
    and public.cms_jsonb_is_credential_free_https_url(candidate -> 'announcementBoardUrl')
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array['department', 'holistic', 'categories', 'latestUpdate'], array[]::text[])
        and jsonb_typeof(locale.value -> 'latestUpdate') = 'string'
        and not exists (
          select 1
          from (values ('department'), ('holistic')) as scope(name)
          where case when jsonb_typeof(locale.value -> scope.name) <> 'array' then true else
            exists (
              select 1 from jsonb_array_elements(locale.value -> scope.name) as announcement(value)
              where not (
                public.cms_jsonb_has_exact_keys(
                  announcement.value,
                  array['category', 'categoryLabel', 'pinned', 'tag', 'date', 'title', 'lines', 'tagColor', 'tagBg', 'statFont', 'delay'],
                  array['statTop', 'statTopLabel', 'statBot', 'statBotLabel']
                )
                and jsonb_typeof(announcement.value -> 'category') = 'string'
                and jsonb_typeof(announcement.value -> 'categoryLabel') = 'string'
                and jsonb_typeof(announcement.value -> 'pinned') = 'boolean'
                and jsonb_typeof(announcement.value -> 'tag') = 'string'
                and jsonb_typeof(announcement.value -> 'date') = 'string'
                and jsonb_typeof(announcement.value -> 'title') = 'string'
                and public.cms_jsonb_is_text_array(announcement.value -> 'lines')
                and public.cms_jsonb_is_hex_color(announcement.value -> 'tagColor')
                and jsonb_typeof(announcement.value -> 'tagBg') = 'string'
                and jsonb_typeof(announcement.value -> 'statFont') = 'string'
                and jsonb_typeof(announcement.value -> 'delay') = 'number'
                and not exists (
                  select 1 from jsonb_each(case when jsonb_typeof(announcement.value) = 'object' then announcement.value else '{}'::jsonb end) as field(key, value)
                  where field.key = any(array['statTop', 'statTopLabel', 'statBot', 'statBotLabel'])
                    and jsonb_typeof(field.value) <> 'string'
                )
              )
            )
          end
        )
        and public.cms_jsonb_has_exact_keys(locale.value -> 'categories', array['department', 'holistic'], array[]::text[])
        and not exists (
          select 1
          from (values ('department'), ('holistic')) as scope(name)
          where case when jsonb_typeof(locale.value #> array['categories', scope.name]) <> 'array' then true else
            exists (
              select 1 from jsonb_array_elements(locale.value #> array['categories', scope.name]) as category(value)
              where not (
                public.cms_jsonb_has_exact_keys(category.value, array['id', 'label'], array[]::text[])
                and jsonb_typeof(category.value -> 'id') = 'string'
                and jsonb_typeof(category.value -> 'label') = 'string'
              )
            )
            or (select count(*) <> count(distinct category.value ->> 'id') from jsonb_array_elements(locale.value #> array['categories', scope.name]) as category(value))
          end
        )
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    )
    and not exists (
      select 1 from (values ('department'), ('holistic')) as scope(name)
      where case
        when jsonb_typeof(candidate #> array['zh', 'categories', scope.name]) <> 'array'
          or jsonb_typeof(candidate #> array['en', 'categories', scope.name]) <> 'array' then true
        else
          (select jsonb_agg(category.value -> 'id' order by category.ordinality) from jsonb_array_elements(candidate #> array['zh', 'categories', scope.name]) with ordinality as category(value, ordinality))
            is distinct from
          (select jsonb_agg(category.value -> 'id' order by category.ordinality) from jsonb_array_elements(candidate #> array['en', 'categories', scope.name]) with ordinality as category(value, ordinality))
      end
    );
$$;

alter function public.cms_news_payload_is_publishable(jsonb) owner to postgres;
revoke all on function public.cms_news_payload_is_publishable(jsonb) from public, anon, authenticated;

comment on function public.cms_news_payload_is_publishable(jsonb) is
  'Internal news publication-shape validator requiring one shared credential-free HTTPS announcement-board URL at the payload root.';

commit;
