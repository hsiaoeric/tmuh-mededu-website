import { useState } from 'react';
import { useSite } from '@/context/SiteContext';
import { buildDeptAwards, type SnqProject } from '@/data/deptAwards';
import { Reveal } from '@/components/common/Reveal';
import { Eyebrow } from '@/components/common/Eyebrow';

const TEAL = '#0E8073';
const GOLD = '#A96B0A';

function SnqProjectCard({
  project,
  colUnit,
  colRole,
  colPerson,
  renewalLabel,
  delay,
}: {
  project: SnqProject;
  colUnit: string;
  colRole: string;
  colPerson: string;
  renewalLabel: string;
  delay?: number;
}) {
  const [open, setOpen] = useState(false);
  const renewalText = project.renewal?.replace(/^通過續審：|^Renewed: /, '');

  return (
    <Reveal
      delay={delay}
      style={{
        borderRadius: 2,
        background: `color-mix(in srgb,${TEAL} 5%,var(--surface))`,
        border: `1px solid color-mix(in srgb,${TEAL} 22%,var(--border))`,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: TEAL,
                  padding: '2px 8px',
                  borderRadius: 2,
                  background: `color-mix(in srgb,${TEAL} 12%,transparent)`,
                }}
              >
                {project.certYear}
              </span>
              {renewalText && (
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {renewalLabel} · {renewalText}
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 700,
                fontSize: 14.5,
                color: 'var(--text)',
                lineHeight: 1.45,
              }}
            >
              {project.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5, lineHeight: 1.5 }}>{project.badgeLabel}</div>
          </div>
          <span style={{ fontSize: 12, color: TEAL, flexShrink: 0, marginTop: 4 }}>{open ? '▲' : '▼'}</span>
        </div>
        <div style={{ fontSize: 12.5, color: TEAL, marginTop: 8, fontWeight: 600 }}>
          {project.members.length} {colPerson}
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {project.members.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr auto',
                gap: '4px 10px',
                padding: '8px 10px',
                borderRadius: 2,
                background: 'var(--surface)',
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: 'var(--muted)', fontSize: 11, gridColumn: '1 / -1' }}>
                {colUnit} · {colRole}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{m.unit}</span>
              <span style={{ color: 'var(--body)' }}>{m.role}</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{m.person}</span>
            </div>
          ))}
        </div>
      )}
    </Reveal>
  );
}

export function DeptAwardsSection() {
  const { lang, setView } = useSite();
  const awards = buildDeptAwards(lang);

  return (
    <section id="dept-awards" style={{ maxWidth: 1240, margin: '0 auto', padding: '34px 28px' }}>
      <Reveal style={{ marginBottom: 24 }}>
        <Eyebrow>{awards.eyebrow}</Eyebrow>
        <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 30, color: 'var(--text)' }}>
          {awards.title}
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 680, marginTop: 10 }}>{awards.desc}</p>
      </Reveal>

      <div className="grid grid-split" style={{ gap: 28, alignItems: 'start' }}>
        <Reveal delay={60}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 12 }}>
              {awards.snqTitle}
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {awards.snqYearCounts.map((y) => (
                <span
                  key={y.year}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 2,
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: TEAL,
                    background: `color-mix(in srgb,${TEAL} 10%,transparent)`,
                    border: `1px solid color-mix(in srgb,${TEAL} 25%,transparent)`,
                  }}
                >
                  {y.year} · {y.count}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {awards.snqProjects.map((p, i) => (
              <SnqProjectCard
                key={i}
                project={p}
                colUnit={awards.colUnit}
                colRole={awards.colRole}
                colPerson={awards.colPerson}
                renewalLabel={awards.renewalLabel}
                delay={i * 50}
              />
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h3 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>
            {awards.nhqaTitle}
          </h3>
          <div
            style={{
              padding: 26,
              borderRadius: 2,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <span
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: GOLD,
                  padding: '4px 12px',
                  borderRadius: 2,
                  background: `color-mix(in srgb,${GOLD} 14%,transparent)`,
                }}
              >
                {awards.nhqa.year}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: GOLD,
                  padding: '4px 12px',
                  borderRadius: 2,
                  background: `color-mix(in srgb,${GOLD} 10%,transparent)`,
                }}
              >
                {awards.nhqa.awardNote}
              </span>
            </div>
            <div
              style={{
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 800,
                fontSize: 17,
                color: 'var(--text)',
                lineHeight: 1.45,
                marginBottom: 12,
              }}
            >
              {awards.nhqa.project}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, lineHeight: 1.65, color: 'var(--body)', marginBottom: 16 }}>
              <div>
                <span style={{ color: 'var(--muted)' }}>{lang === 'zh' ? '組別' : 'Track'} · </span>
                {awards.nhqa.group}
              </div>
              <div>
                <span style={{ color: 'var(--muted)' }}>{lang === 'zh' ? '領域' : 'Domain'} · </span>
                {awards.nhqa.domain}
              </div>
              <div>
                <span style={{ color: 'var(--muted)' }}>{lang === 'zh' ? '報告' : 'Event'} · </span>
                {awards.nhqa.event}
              </div>
              <div>
                <span style={{ color: 'var(--muted)' }}>{lang === 'zh' ? '負責人' : 'Leads'} · </span>
                {awards.nhqa.leads.join(lang === 'zh' ? '、' : ', ')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {awards.nhqa.keywords.map((kw) => (
                <span
                  key={kw}
                  style={{
                    padding: '4px 11px',
                    borderRadius: 2,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1A63C4',
                    background: 'color-mix(in srgb,#1A63C4 12%,transparent)',
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setView('ebm')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 16,
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: "'Noto Sans TC', sans-serif",
              fontSize: 13.5,
              fontWeight: 600,
              color: TEAL,
            }}
          >
            {awards.nhqaEbmLink}
          </button>
        </Reveal>
      </div>

      <Reveal delay={180} style={{ marginTop: 22, textAlign: 'center' }}>
        <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 12, color: 'var(--muted)', letterSpacing: '.04em' }}>
          {awards.dataSource}
        </span>
      </Reveal>
    </section>
  );
}
