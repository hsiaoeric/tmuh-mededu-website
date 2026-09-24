import { z } from 'zod';
import { DEPARTMENT_KPI_IDS, type DepartmentKpiId } from '@/data/kpis';
import { bilingual, EditableKpiSchema, KpiSchema, TextSchema } from './common';

const IdentityFields = {
  id: z.enum(DEPARTMENT_KPI_IDS),
  panelTitle: TextSchema,
  panelDescription: TextSchema.optional(),
} as const;

const DepartmentKpiSchema = KpiSchema.unwrap().extend(IdentityFields).readonly();
const EditableDepartmentKpiSchema = EditableKpiSchema.unwrap().extend(IdentityFields).readonly();

function addCanonicalIdIssue(
  items: readonly { readonly id: DepartmentKpiId }[],
  path: readonly PropertyKey[],
  context: { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] },
): void {
  if (items.length !== DEPARTMENT_KPI_IDS.length
    || items.some((item, index) => item.id !== DEPARTMENT_KPI_IDS[index])) {
    context.issues.push({
      code: 'custom',
      message: 'Department KPI identifiers must remain complete and in canonical order',
      path: [...path],
      input: context.value,
    });
  }
}

function kpisPayload<S extends z.ZodType<{ readonly id: DepartmentKpiId }>>(schema: S) {
  return bilingual(z.strictObject({ items: z.array(schema).readonly() }).readonly()).check((context) => {
    addCanonicalIdIssue(context.value.zh.items, ['zh', 'items'], context);
    addCanonicalIdIssue(context.value.en.items, ['en', 'items'], context);
  });
}

export const EditableKpisPayloadSchema = kpisPayload(EditableDepartmentKpiSchema);
export const KpisPayloadSchema = kpisPayload(DepartmentKpiSchema);
