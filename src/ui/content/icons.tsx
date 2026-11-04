/**
 * The few glyphs the archive UI needs that the shared `Icon` set lacks. Same 24×24 stroke style,
 * and like `Icon`, width and height are attributes rather than CSS.
 */
const PATHS = {
  play: 'M8 5.5v13l10.5-6.5Z',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z M14 3v5h5',
} as const;

export type ContentIconName = keyof typeof PATHS;

export function ContentIcon({ name, size = '1em', filled = false }: {
  readonly name: ContentIconName;
  readonly size?: number | string;
  readonly filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : `M${d}`} />
      ))}
    </svg>
  );
}
