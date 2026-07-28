import { useId, useState } from 'react';
import { Icon } from '@/components/common/Icon';

export interface NavMenuTarget {
  label: string;
  onClick: () => void;
}

/**
 * A destination row in the header menu. `nested` renders the smaller, quieter
 * treatment used for a group's children.
 */
export function NavMenuLink({
  label,
  onClick,
  nested = false,
}: NavMenuTarget & { nested?: boolean }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: nested ? '8px 10px' : '10px 12px',
        border: 'none',
        borderRadius: 8,
        background: hover ? 'var(--teal-50)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'Noto Sans TC', sans-serif",
        fontWeight: nested ? 500 : 600,
        fontSize: nested ? 13.5 : 14,
        color: hover ? 'var(--teal)' : nested ? 'var(--body)' : 'var(--text)',
        transition: 'background .15s ease, color .15s ease',
      }}
    >
      <span>{label}</span>
      <span
        style={{
          width: nested ? 12 : 14,
          height: nested ? 12 : 14,
          flex: 'none',
          opacity: nested ? 0.35 : 0.5,
        }}
      >
        <Icon name="arrow" />
      </span>
    </button>
  );
}

/**
 * A heading in the header menu that expands to reveal its sections. Open state
 * is owned by the menu so that only one group is expanded at a time, which
 * keeps the whole menu visible without scrolling on a phone.
 */
export function NavMenuGroup({
  label,
  items,
  open,
  onToggle,
}: {
  label: string;
  items: NavMenuTarget[];
  open: boolean;
  onToggle: () => void;
}) {
  const [hover, setHover] = useState(false);
  const panelId = useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 5,
          width: '100%',
          padding: '10px 12px',
          border: 'none',
          borderRadius: 8,
          background: hover || open ? 'var(--teal-50)' : 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'Noto Sans TC', sans-serif",
          fontWeight: 700,
          fontSize: 14,
          color: hover || open ? 'var(--teal)' : 'var(--text)',
          transition: 'background .2s, color .2s',
        }}
      >
        <span>{label}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            width: 13,
            height: 13,
            flex: 'none',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            margin: '2px 0 4px 12px',
            paddingLeft: 10,
            borderLeft: '1.5px solid var(--border)',
          }}
        >
          {items.map((item) => (
            <NavMenuLink key={item.label} label={item.label} onClick={item.onClick} nested />
          ))}
        </div>
      )}
    </div>
  );
}
