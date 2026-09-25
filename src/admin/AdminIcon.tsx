import { Icon, type IconName } from '@/ui/Icon';

/**
 * Admin-only glyphs. They live apart from the site's `Icon` set because that set doubles as the
 * list of icons CMS content may reference, which the database validates.
 */
const ADMIN_PATHS = {
  more: 'M5 12h.01 M12 12h.01 M19 12h.01',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5 M12 7v5l3 2',
  undo: 'M9 14 4 9l5-5 M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'M15 14l5-5-5-5 M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
} as const;

/** Filled 16-unit glyphs, drawn differently from the stroked 24-unit set. */
const ADMIN_FILLED_PATHS = {
  chevronLeft: 'm9.25 12.06-.53-.53L5.9 8.71a1 1 0 0 1 0-1.42l2.82-2.82.53-.53L10.31 5l-.53.53L7.31 8l2.47 2.47.53.53z',
} as const;

export type AdminIconName = IconName | keyof typeof ADMIN_PATHS | keyof typeof ADMIN_FILLED_PATHS;

function isAdminOnly(name: AdminIconName): name is keyof typeof ADMIN_PATHS {
  return name in ADMIN_PATHS;
}

function isFilled(name: AdminIconName): name is keyof typeof ADMIN_FILLED_PATHS {
  return name in ADMIN_FILLED_PATHS;
}

export function AdminIcon({ name }: { readonly name: AdminIconName }) {
  if (isFilled(name)) {
    return (
      <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false" className="admin-icon-filled">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={ADMIN_FILLED_PATHS[name]} />
      </svg>
    );
  }
  if (!isAdminOnly(name)) return <Icon name={name} />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === 'more' ? 2.6 : 1.6} strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" aria-hidden="true" focusable="false">
      {ADMIN_PATHS[name].split(' M').map((d, i) => <path key={i} d={i === 0 ? d : `M${d}`} />)}
    </svg>
  );
}
