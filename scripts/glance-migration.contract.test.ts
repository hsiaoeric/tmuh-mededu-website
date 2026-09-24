import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../supabase/migrations/20260903000100_add_glance_canonical_ids.sql', import.meta.url),
  'utf8',
);

describe('Glance canonical-id revision upgrade migration', () => {
  it('upgrades every persisted KPI and people revision while the lifecycle trigger is disabled', () => {
    // Given / When / Then
    expect(migration).toContain('alter table public.cms_revisions disable trigger cms_revisions_enforce_lifecycle');
    expect(migration).toContain('update public.cms_revisions as revisions');
    expect(migration).toContain("documents.kind in ('kpis', 'people')");
    expect(migration).toContain("revisions.status in ('draft', 'published', 'archived')");
    expect(migration).toContain('alter table public.cms_revisions enable trigger cms_revisions_enforce_lifecycle');
  });

  it('uses idempotent helpers that reject partial legacy shapes and validates every upgraded row', () => {
    // Given / When / Then
    expect(migration).toContain('create function public.cms_upgrade_legacy_kpis_payload');
    expect(migration).toContain('create function public.cms_upgrade_legacy_people_payload');
    expect(migration).toContain('ambiguous or partial legacy KPI payload');
    expect(migration).toContain('ambiguous or partial legacy people payload');
    expect(migration).toContain('cms_payload_is_publishable(documents.kind, revisions.payload) is not true');
  });
});
