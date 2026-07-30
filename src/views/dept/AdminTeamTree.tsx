import { useRef } from 'react';
import { useSite } from '@/context/SiteContext';
import type { Center } from '@/data/centers';
import { resolvePerson, type RawPerson, type RoleKey } from '@/data/people';
import { useCenteredScroll } from '@/hooks/useCenteredScroll';

const KNOWN_EXTENSIONS: Record<string, string> = {
  王怡文: '3752',
  陳均茹: '3757',
  江明憲: '3760',
  賴哲民: '3770',
  張家銘: '3770',
};

function TeamNode({
  person,
  color,
  compact = false,
}: {
  person: RawPerson;
  color: string;
  compact?: boolean;
}) {
  const { lang, isZh } = useSite();
  const resolved = resolvePerson(person, color, lang);
  const extension = KNOWN_EXTENSIONS[person.zh];
  const responsibility =
    person.role === 'spec'
      ? resolved.duty || resolved.dept
      : person.role === 'head'
        ? resolved.dept
        : resolved.role;

  return (
    <div
      style={{
        position: 'relative',
        minWidth: compact ? 88 : 142,
        minHeight: compact ? 86 : 76,
        padding: compact ? '10px 8px' : '11px 14px',
        border: `1px solid color-mix(in srgb,${color} 30%,var(--border))`,
        borderTop: `3px solid ${color}`,
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-card)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <strong
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: compact ? 13 : 14.5,
          lineHeight: 1.25,
          color: 'var(--text)',
        }}
      >
        {resolved.fullname}
      </strong>
      <span
        style={{
          marginTop: 4,
          fontFamily: 'var(--font-sans)',
          fontSize: compact ? 10.5 : 11.5,
          lineHeight: 1.35,
          color: 'var(--body)',
        }}
      >
        {responsibility}
      </span>
      {extension && (
        <span
          style={{
            marginTop: 5,
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            lineHeight: 1,
            color: color,
          }}
        >
          {isZh ? `分機 ${extension}` : `Ext. ${extension}`}
        </span>
      )}
    </div>
  );
}

function Connector() {
  return <div style={{ width: 2, height: 18, background: 'var(--border)' }} aria-hidden="true" />;
}

export function AdminTeamTree({ center }: { center: Center }) {
  const { isZh } = useSite();
  const scrollRef = useRef<HTMLDivElement>(null);
  useCenteredScroll(scrollRef, [center.id, isZh]);
  const byRole = (role: RoleKey) => center.people.filter((person) => person.role === role);
  const singleLevels = [byRole('vp'), byRole('ddir')];
  const deputies = byRole('ddep');
  const heads = byRole('head');
  const specialists = byRole('spec');

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {isZh ? '由上而下呈現領導層級與主要業務分工' : 'Leadership hierarchy and primary responsibilities'}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
          {isZh ? '僅顯示已確認的桌機分機' : 'Verified desk extensions only'}
        </div>
      </div>

      <div ref={scrollRef} className="admin-tree-scroll">
        <div className="admin-tree-canvas">
          {singleLevels.map((level, levelIndex) => (
            <div key={levelIndex} style={{ display: 'contents' }}>
              <div className="admin-tree-row">
                {level.map((person) => (
                  <TeamNode key={person.zh} person={person} color={center.color} />
                ))}
              </div>
              <Connector />
            </div>
          ))}

          <div className="admin-tree-row admin-tree-branch">
            {deputies.map((person) => (
              <TeamNode key={person.zh} person={person} color={center.color} />
            ))}
          </div>
          <Connector />

          <div className="admin-tree-row">
            {heads.map((person) => (
              <TeamNode key={person.zh} person={person} color={center.color} />
            ))}
          </div>
          <Connector />

          <div className="admin-tree-specialists">
            {specialists.map((person) => (
              <TeamNode key={person.zh} person={person} color={center.color} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
