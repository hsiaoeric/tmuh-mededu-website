begin;

create or replace function public.cms_jsonb_is_credential_free_https_url(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  value text;
  authority text;
  hostname text;
  port_value text;
begin
  if jsonb_typeof(candidate) <> 'string' then
    return false;
  end if;

  value := candidate #>> '{}';
  if exists (
    select 1
    from (
      select codepoint from generate_series(1, 32) as codepoint
      union all select 127
      union all select 160
      union all select 5760
      union all select codepoint from generate_series(8192, 8202) as codepoint
      union all select unnest(array[8232, 8233, 8239, 8287, 12288, 65279])
    ) as forbidden
    where strpos(value, chr(forbidden.codepoint)) > 0
  ) or value collate "C" !~ '^[Hh][Tt][Tt][Pp][Ss]://[^/?#]+([/?#].*)?$' then
    return false;
  end if;

  authority := substring(
    value collate "C" from '^[Hh][Tt][Tt][Pp][Ss]://([^/?#]+)'
  );
  if authority is null
    or authority collate "C" !~ '^[A-Za-z0-9.-]+(:[0-9]{1,5})?$' then
    return false;
  end if;

  hostname := regexp_replace(authority collate "C", ':[0-9]{1,5}$', '');
  if length(hostname) > 253
    or hostname collate "C" !~ '^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$' then
    return false;
  end if;

  port_value := substring(authority collate "C" from ':([0-9]{1,5})$');
  return port_value is null or port_value::integer between 1 and 65535;
end;
$$;

create or replace function public.cms_jsonb_is_https_url(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_is_credential_free_https_url(candidate);
$$;

create or replace function public.cms_jsonb_is_published_media_reference(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case candidate ->> 'kind'
    when 'local' then
      public.cms_jsonb_has_exact_keys(candidate, array['kind', 'path'], array[]::text[])
      and jsonb_typeof(candidate -> 'path') = 'string'
      and candidate ->> 'path' collate "C" ~* '^assets/([A-Za-z0-9._-]+/)*[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp)$'
      and not exists (
        select 1 from unnest(string_to_array(candidate ->> 'path', '/')) as segment(value)
        where segment.value in ('.', '..')
      )
    when 'public' then
      public.cms_jsonb_has_exact_keys(candidate, array['kind', 'bucket', 'path'], array[]::text[])
      and candidate ->> 'bucket' = 'public-media'
      and jsonb_typeof(candidate -> 'path') = 'string'
      and candidate ->> 'path' collate "C" ~ '^[0-9a-f]{64}/[0-9a-f]{64}\.(jpg|png|webp)$'
      and split_part(candidate ->> 'path', '/', 1)
        = split_part(split_part(candidate ->> 'path', '/', 2), '.', 1)
    else false
  end;
$$;

alter function public.cms_jsonb_is_credential_free_https_url(jsonb) owner to postgres;
alter function public.cms_jsonb_is_https_url(jsonb) owner to postgres;
alter function public.cms_jsonb_is_published_media_reference(jsonb) owner to postgres;

revoke all on function
  public.cms_jsonb_is_credential_free_https_url(jsonb),
  public.cms_jsonb_is_https_url(jsonb),
  public.cms_jsonb_is_published_media_reference(jsonb)
from public, anon, authenticated;

comment on function public.cms_jsonb_is_credential_free_https_url(jsonb) is
  'Accepts the CMS HTTPS subset: ASCII DNS-style host labels, no credentials or ECMAScript whitespace/control characters, optional port 1-65535, and an optional path, query, or fragment.';
comment on function public.cms_jsonb_is_published_media_reference(jsonb) is
  'Accepts strict published CMS media references and requires public-media directory and filename SHA-256 digests to match exactly.';

commit;
