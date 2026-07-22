import { useState } from 'react';
import type { ResolvedPerson } from '@/data/people';

interface PersonCardProps {
  person: ResolvedPerson;
  /** Color of the academic-profile link (defaults to the teal accent). */
  profileColor?: string;
  /** Disable reveal-on-scroll animation for immediate display contexts. */
  instant?: boolean;
  /** Hide role badge for simplified cards. */
  hideRole?: boolean;
}

const mix = (color: string, pct: number, base = 'transparent') =>
  `color-mix(in srgb,${color} ${pct}%,${base})`;

/** Team-member card: avatar (photo or initials), name, role, dept, duties. */
export function PersonCard({
  person,
  profileColor = 'var(--teal-700)',
  instant = false,
  hideRole = false,
}: PersonCardProps) {
  const [hover, setHover] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const { accent } = person;
  const showPhoto = person.hasPhoto && !imgFailed;

  return (
    <div
      {...(!instant ? { 'data-reveal': '' } : {})}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 6,
        padding: '22px 18px 20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: hover ? '0 16px 34px rgba(74,69,64,.16)' : 'var(--shadow-card)',
        borderColor: hover ? mix(accent, 45, 'var(--border)') : 'var(--border)',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        transition:
          'transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 88,
          height: 88,
          borderRadius: '50%',
          padding: 3,
          background: `linear-gradient(140deg,${accent},transparent 70%)`,
        }}
      >
        {showPhoto ? (
          <img
            src={person.photoSrc}
            alt={person.fullname}
            onError={() => setImgFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: person.objectPosition,
              borderRadius: '50%',
              border: '2px solid var(--surface)',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 600,
              fontSize: 24,
              color: '#fff',
              background: accent,
            }}
          >
            {person.initials}
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: "'Noto Sans TC', sans-serif",
          fontWeight: 700,
          fontSize: 17,
          color: 'var(--text)',
          lineHeight: 1.25,
          marginTop: 4,
        }}
      >
        {person.fullname}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 11.5,
          letterSpacing: '.04em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
        }}
      >
        {person.sub}
      </div>
      {!hideRole && (
        <div
          style={{
            marginTop: 4,
            padding: '3px 13px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            color: accent,
            background: mix(accent, 13),
            border: `1px solid ${mix(accent, 30)}`,
          }}
        >
          {person.role}
        </div>
      )}
      {person.dept && (
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--muted)',
            lineHeight: 1.45,
            marginTop: 2,
            whiteSpace: 'pre-line',
          }}
        >
          {person.dept}
        </div>
      )}
      {person.duty && (
        <div
          style={{
            marginTop: 8,
            width: '100%',
            padding: '9px 11px',
            borderRadius: 9,
            background: mix(accent, 8),
            border: `1px solid ${mix(accent, 18)}`,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: 3,
            }}
          >
            {person.dutyLabel}
          </div>
          <div
            style={{
              fontFamily: "'Noto Sans TC', sans-serif",
              fontSize: 12,
              lineHeight: 1.55,
              color: 'var(--body)',
            }}
          >
            {person.duty}
          </div>
        </div>
      )}
      {person.profile && (
        <a
          href={person.profile}
          target="_blank"
          rel="noopener"
          style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
            color: profileColor,
            textDecoration: 'none',
          }}
        >
          {person.profileLabel} ↗
        </a>
      )}
    </div>
  );
}
