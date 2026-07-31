import type { CSSProperties } from 'react';

interface TmuhLogoProps {
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Official Taipei Medical University Hospital (TMUH / 臺北醫學大學附設醫院) Logo
 * Renders the exact official SVG file directly from Wikipedia / Wikimedia Commons.
 */
export function TmuhLogo({ size = 36, className, style }: TmuhLogoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}assets/tmuh-logo.svg`}
      alt=""
      width={size}
      height={size}
      className={className}
      referrerPolicy="no-referrer"
      style={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
