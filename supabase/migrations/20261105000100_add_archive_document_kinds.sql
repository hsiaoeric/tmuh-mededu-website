-- Enum values only. PostgreSQL cannot use a newly added enum value in the transaction that adds it,
-- so every validator, dispatcher branch, and constraint that references these kinds lives in
-- 20261105000200_validate_archive_payloads.sql. Canonical identities: posts/archive,
-- department_info/directory, gallery/library (stable keys are constrained per kind in the
-- TypeScript contracts and generated seed; SQL only enforces the generic stable_key format).
begin;

alter type public.cms_document_kind add value 'posts';
alter type public.cms_document_kind add value 'department_info';
alter type public.cms_document_kind add value 'gallery';

commit;
