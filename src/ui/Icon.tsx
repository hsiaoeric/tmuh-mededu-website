import type { CSSProperties } from 'react';

/** Lucide-style stroke icons, 24×24, sized by the parent's font/width. */
const PATHS = {
  cap: 'M22 10 12 5 2 10l10 5 10-5Z M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5 M22 10v6',
  skills: 'M22 12h-4l-3 9L9 3l-3 9H2',
  chart: 'M3 3v18h18 M8 17V10 M13 17V6 M18 17v-4',
  holistic:
    'M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z',
  heart:
    'M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z',
  research:
    'M6 18h8 M3 22h18 M14 22a7 7 0 1 0 0-14h-1 M9 14h.01 M12 2h1a2 2 0 0 1 2 2v4h-5V4a2 2 0 0 1 2-2Z',
  admin:
    'M3 21h18 M5 21V7l7-4 7 4v14 M9 10h.01 M15 10h.01 M9 14h.01 M15 14h.01 M10 21v-4h4v4',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z',
  phone:
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
  clipboard:
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z',
  bulb: 'M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2Z',
  team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  brain:
    'M12 5a3 3 0 1 0-5.1 2.1A3 3 0 0 0 4 12a3 3 0 0 0 1.5 2.6A3 3 0 0 0 9 19a3 3 0 0 0 3-1.5V5Z M12 5a3 3 0 1 1 5.1 2.1A3 3 0 0 1 20 12a3 3 0 0 1-1.5 2.6A3 3 0 0 1 15 19a3 3 0 0 1-3-1.5V5Z',
  sprout:
    'M7 20h10 M12 20V9 M12 9C12 5.7 9.3 3 6 3c0 3.3 2.7 6 6 6Z M12 12c0-2.8 2.2-5 5-5 0 2.8-2.2 5-5 5Z',
  network:
    'M12 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M5 16a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M19 16a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M12 8v4 M12 12 6.5 15.5 M12 12l5.5 3.5',
  award:
    'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z M8.2 13.8 7 22l5-3 5 3-1.2-8.2',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M2 12h20 M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  arrowUpRight: 'M7 17 17 7 M8 7h9v9',
  arrowDown: 'M12 5v14 M6 13l6 6 6-6',
  close: 'M18 6 6 18 M6 6l12 12',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  quote: 'M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4 M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4',
  pin: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  calendar:
    'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  spark: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M5.6 5.6l2.8 2.8 M15.6 15.6l2.8 2.8 M18.4 5.6l-2.8 2.8 M8.4 15.6l-2.8 2.8',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function Icon({ name, size, className, strokeWidth = 1.6, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      // Width/height go on the attributes, not CSS: when this icon is nested
      // inside another <svg> (the org constellation) a styled size is ignored
      // and the icon inherits the outer viewport instead.
      width={size ?? '1em'}
      height={size ?? '1em'}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : `M${d}`} />
      ))}
    </svg>
  );
}
