import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pgTap = readFileSync(
  new URL('../supabase/tests/database/012_glance_canonical_ids.test.sql', import.meta.url),
  'utf8',
);

const MUTATION_CASES = [
  ['glance_caption_not_identity', "'{zh,items,1,en}'", '"Renamed caption"'],
  ['glance_kpi_id_invalid', "'{zh,items,0,id}'", '"mismatch"'],
  ['glance_kpi_id_order', "'{zh,items,0}'", "'{zh,items,1}'"],
  ['glance_member_group_count', "#- '{zh,memberGroups,0}'", 'cms_people_payload_is_publishable'],
  ['glance_member_group_order', "'{zh,memberGroups,0}'", "'{zh,memberGroups,1}'"],
  ['glance_education_centers_group', "'{zh,memberGroups}'", "'education_centers'"],
  ['glance_member_people_parity', "#- '{en,memberGroups,1,people,0}'", 'cms_people_payload_is_publishable'],
  ['glance_member_role_key', "'{zh,memberGroups,0,people,0,roleKey}'", '"unknown"'],
] as const;

const UPGRADE_CASES = [
  'glance_kpi_upgrade_valid',
  'glance_people_upgrade_valid',
  'glance_kpi_upgrade_idempotent',
  'glance_people_upgrade_idempotent',
  'glance_kpi_partial_upgrade_rejected',
  'glance_people_partial_upgrade_rejected',
  'glance_kpi_upgrade_preserves_authored_copy',
  'glance_people_upgrade_preserves_existing_content',
] as const;

function sectionFor(label: string): string {
  const end = pgTap.indexOf(`'${label}'`);
  if (end < 0) return '';
  const start = pgTap.lastIndexOf('select ok(', end);
  return pgTap.slice(start, end);
}

describe('Glance pgTAP correspondence', () => {
  it('binds each validator label to its exact JSON path and mutation value', () => {
    for (const [label, path, mutation] of MUTATION_CASES) {
      const section = sectionFor(label);
      expect(section, label).toContain(path);
      expect(section, label).toContain(mutation);
    }
  });

  it('covers valid, idempotent, and partial-shape upgrade outcomes', () => {
    for (const label of UPGRADE_CASES) expect(pgTap, label).toContain(`'${label}'`);
  });
});
