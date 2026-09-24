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
  if value ~ '[[:space:][:cntrl:]]'
    or value !~* '^https://[^/?#]+([/?#][^[:space:][:cntrl:]]*)?$' then
    return false;
  end if;

  authority := substring(lower(value) from '^https://([^/?#]+)');
  if authority is null or authority !~ '^[a-z0-9.-]+(:[0-9]{1,5})?$' then
    return false;
  end if;

  hostname := regexp_replace(authority, ':[0-9]{1,5}$', '');
  if length(hostname) > 253
    or hostname !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$' then
    return false;
  end if;

  port_value := substring(authority from ':([0-9]{1,5})$');
  return port_value is null or port_value::integer between 1 and 65535;
end;
$$;

create or replace function public.cms_jsonb_is_https_url(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_is_credential_free_https_url(candidate);
$$;

alter function public.cms_jsonb_is_credential_free_https_url(jsonb) owner to postgres;
alter function public.cms_jsonb_is_https_url(jsonb) owner to postgres;

revoke all on function public.cms_jsonb_is_credential_free_https_url(jsonb),
  public.cms_jsonb_is_https_url(jsonb)
from public, anon, authenticated;

comment on function public.cms_jsonb_is_credential_free_https_url(jsonb) is
  'Accepts the CMS HTTPS subset: ASCII DNS-style host labels, no credentials or whitespace, optional port 1-65535, and an optional path, query, or fragment.';

commit;
