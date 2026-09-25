import { Icon, type IconName } from '@/ui/Icon';

/**
 * Admin-only glyphs. They live apart from the site's `Icon` set because that set doubles as the
 * list of icons CMS content may reference, which the database validates.
 */
const ADMIN_PATHS = {
  more: 'M5 12h.01 M12 12h.01 M19 12h.01',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5 M12 7v5l3 2',
  sidebar: 'M3 4h18v16H3Z M9 4v16',
} as const;

export type AdminIconName = IconName | keyof typeof ADMIN_PATHS;

function isAdminOnly(name: AdminIconName): name is keyof typeof ADMIN_PATHS {
  return name in ADMIN_PATHS;
}

export function AdminIcon({ name }: { readonly name: AdminIconName }) {
  if (!isAdminOnly(name)) return <Icon name={name} />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === 'more' ? 2.6 : 1.6} strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" aria-hidden="true" focusable="false">
      {ADMIN_PATHS[name].split(' M').map((d, i) => <path key={i} d={i === 0 ? d : `M${d}`} />)}
    </svg>
  );
}
