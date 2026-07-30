import { useState } from 'react';

interface NavButtonProps {
  label: string;
  onClick: () => void;
}

/** Header nav link with the teal hover treatment from the original design. */
export function NavButton({ label, onClick }: NavButtonProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '8px 14px',
        border: 'none',
        background: hover ? 'var(--teal-50)' : 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: 14,
        color: hover ? 'var(--teal)' : 'var(--body)',
        transition: 'color .2s,background .2s',
      }}
    >
      {label}
    </button>
  );
}
