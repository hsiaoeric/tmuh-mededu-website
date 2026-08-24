alter table public.cms_admins enable row level security;
alter table public.cms_documents enable row level security;
alter table public.cms_revisions enable row level security;

revoke all on table public.cms_admins from public, anon, authenticated;
revoke all on table public.cms_documents from public, anon, authenticated;
revoke all on table public.cms_revisions from public, anon, authenticated;

grant select on table public.cms_documents to anon, authenticated;
grant insert, update, delete on table public.cms_documents to authenticated;
grant select on table public.cms_revisions to anon, authenticated;
grant update (payload) on table public.cms_revisions to authenticated;

create policy cms_documents_public_read_published
on public.cms_documents
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cms_revisions
    where document_id = cms_documents.id and status = 'published'
  )
);

create policy cms_documents_admin_read_all
on public.cms_documents
for select
to authenticated
using ((select public.is_cms_admin()));

create policy cms_documents_admin_insert
on public.cms_documents
for insert
to authenticated
with check ((select public.is_cms_admin()) and created_by = (select auth.uid()));

create policy cms_documents_admin_update
on public.cms_documents
for update
to authenticated
using ((select public.is_cms_admin()))
with check ((select public.is_cms_admin()));

create policy cms_documents_admin_delete_empty
on public.cms_documents
for delete
to authenticated
using (
  (select public.is_cms_admin())
  and not exists (
    select 1 from public.cms_revisions where document_id = cms_documents.id
  )
);

create policy cms_revisions_public_read_published
on public.cms_revisions
for select
to anon, authenticated
using (status = 'published');

create policy cms_revisions_admin_read_all
on public.cms_revisions
for select
to authenticated
using ((select public.is_cms_admin()));

create policy cms_revisions_admin_update_draft
on public.cms_revisions
for update
to authenticated
using ((select public.is_cms_admin()) and status = 'draft')
with check ((select public.is_cms_admin()) and status = 'draft');

create view public.cms_published_content
with (security_invoker = true, security_barrier = true)
as
select
  documents.id as document_id,
  documents.kind,
  documents.stable_key,
  revisions.id as revision_id,
  revisions.version,
  revisions.payload,
  revisions.published_at
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where revisions.status = 'published';

grant select on table public.cms_published_content to anon, authenticated;

create function public.cms_get_published_content(
  p_kind public.cms_document_kind default null,
  p_stable_key text default null
)
returns setof public.cms_published_content
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.cms_published_content
  where (p_kind is null or kind = p_kind)
    and (p_stable_key is null or stable_key = p_stable_key)
  order by kind, stable_key;
$$;

revoke execute on function public.is_cms_admin() from public, anon, authenticated;
revoke execute on function public.cms_payload_is_publishable(jsonb) from public, anon, authenticated;
revoke execute on function public.cms_clone_revision(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cms_publish_revision(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cms_archive_revision(uuid) from public, anon, authenticated;
revoke execute on function public.cms_get_published_content(public.cms_document_kind, text) from public, anon, authenticated;

grant execute on function public.is_cms_admin() to authenticated;
grant execute on function public.cms_clone_revision(uuid, uuid) to authenticated;
grant execute on function public.cms_publish_revision(uuid, uuid) to authenticated;
grant execute on function public.cms_archive_revision(uuid) to authenticated;
grant execute on function public.cms_get_published_content(public.cms_document_kind, text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values
  ('public-media', 'public-media', true),
  ('draft-media', 'draft-media', false)
on conflict (id) do update set public = excluded.public;

create policy cms_public_media_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'public-media');

create policy cms_draft_media_admin_read
on storage.objects
for select
to authenticated
using (bucket_id = 'draft-media' and (select public.is_cms_admin()));

create policy cms_media_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('public-media', 'draft-media')
  and (select public.is_cms_admin())
);

create policy cms_media_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id in ('public-media', 'draft-media')
  and (select public.is_cms_admin())
)
with check (
  bucket_id in ('public-media', 'draft-media')
  and (select public.is_cms_admin())
);

create policy cms_media_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('public-media', 'draft-media')
  and (select public.is_cms_admin())
);

set local role supabase_storage_admin;
comment on policy cms_draft_media_admin_read on storage.objects is
  'Private draft assets are hidden from both anonymous and non-admin authenticated clients.';
reset role;
