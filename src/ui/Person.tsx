import { useState } from 'react';
import { useSite } from '@/app/site';
import { resolvePerson, type RawPerson, type ResolvedPerson } from '@/data/people';
import { Icon } from './Icon';

/**
 * Portrait with an initials fallback. Roughly half the people in `people.ts`
 * carry a slug with no matching file in public/assets, so a missing image has
 * to degrade to initials rather than a broken-image glyph.
 */
function Portrait({ person, accent }: { person: ResolvedPerson; accent: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = person.hasPhoto && !failed;

  return (
    <div className="portrait" style={{ ['--tone' as string]: accent }}>
      {showImage ? (
        <img
          src={person.photoSrc}
          alt={person.fullname}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ objectPosition: person.objectPosition }}
        />
      ) : (
        <span className="portrait-initials" aria-hidden="true">
          {person.initials}
        </span>
      )}
    </div>
  );
}

/** Small circular portrait used inline beside a name. */
export function Avatar({
  person,
  accent,
  size = 40,
}: {
  person: RawPerson;
  accent: string;
  size?: number;
}) {
  const { lang } = useSite();
  const p = resolvePerson(person, accent, lang);
  const [failed, setFailed] = useState(false);

  if (p.hasPhoto && !failed) {
    return (
      <img
        src={p.photoSrc}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          objectPosition: p.objectPosition,
          flex: 'none',
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        color: accent,
        background: `color-mix(in srgb, ${accent} 12%, transparent)`,
        fontFamily: "'Instrument Serif', serif",
        fontSize: size * 0.4,
      }}
    >
      {p.initials}
    </span>
  );
}

interface PersonCardProps {
  person: RawPerson;
  accent: string;
  /** Hide the role line when the surrounding group already states it. */
  hideRole?: boolean;
  compact?: boolean;
}

export function PersonCard({ person, accent, hideRole, compact }: PersonCardProps) {
  const { lang } = useSite();
  const p = resolvePerson(person, accent, lang);

  return (
    <div className="person">
      <Portrait person={p} accent={accent} />
      <div className="stack" style={{ gap: 3 }}>
        <span className="person-name">{p.fullname}</span>
        <span className="person-sub">{p.sub}</span>
        {!hideRole && (
          <span className="person-role" style={{ ['--tone' as string]: accent }}>
            {p.role}
          </span>
        )}
        {p.dept && !compact && <span className="person-dept">{p.dept}</span>}
        {p.duty && (
          <span className="person-dept">
            {p.dutyLabel}：{p.duty}
          </span>
        )}
        {p.profile && (
          <a
            className="tlink"
            href={p.profile}
            target="_blank"
            rel="noreferrer"
            style={{ marginTop: 6, alignSelf: 'flex-start', color: accent }}
          >
            {p.profileLabel}
            <Icon name="arrowUpRight" />
          </a>
        )}
      </div>
    </div>
  );
}

/** Dense list of people without portraits — used for large rosters. */
export function PersonRoster({
  people,
  accent,
  showDuty,
}: {
  people: RawPerson[];
  accent: string;
  showDuty?: boolean;
}) {
  const { lang } = useSite();
  return (
    <div>
      {people.map((raw, i) => {
        const p = resolvePerson(raw, accent, lang);
        return (
          <div className="roster-row" key={`${p.fullname}-${i}`}>
            <div className="row gap-2" style={{ alignItems: 'baseline' }}>
              <span className="person-name" style={{ fontSize: '0.95rem' }}>
                {p.fullname}
              </span>
              <span className="person-sub">{p.sub}</span>
            </div>
            <div className="stack" style={{ gap: 2 }}>
              <span className="person-role" style={{ ['--tone' as string]: accent }}>
                {p.role}
              </span>
              {showDuty && p.duty && <span className="person-dept">{p.duty}</span>}
              {!showDuty && p.dept && <span className="person-dept">{p.dept}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
