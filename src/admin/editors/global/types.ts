export const GLOBAL_EDITOR_KINDS = [
  'site_copy',
  'centers',
  'people',
  'news',
  'activities',
  'kpis',
  'honors',
] as const;

export type GlobalEditorKind = (typeof GLOBAL_EDITOR_KINDS)[number];

export function isGlobalEditorKind(value: unknown): value is GlobalEditorKind {
  switch (value) {
    case 'site_copy':
    case 'centers':
    case 'people':
    case 'news':
    case 'activities':
    case 'kpis':
    case 'honors':
      return true;
    default:
      return false;
  }
}
