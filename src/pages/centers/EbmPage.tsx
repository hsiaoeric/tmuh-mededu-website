import type { CSSProperties } from 'react';
import { useSite, usePageTitle } from '@/app/site';
import { CENTER_ICON } from '@/data/centers';
import type { PublicAdapterResultFor } from '@/content/adapters';
import { usePublicContentDocument } from '@/content/usePublicContentDocument';
import { Reveal } from '@/motion/Reveal';
import { HorizontalScroll } from '@/motion/HorizontalScroll';
import { Section, SectionHeader, SectionTag } from '@/ui/Section';
import { PageHero, ClosingContact } from '@/ui/PageParts';
import { PersonCard } from '@/ui/Person';
import { StatRow } from '@/ui/Stats';
import { Icon, type IconName } from '@/ui/Icon';

type EbmAward = PublicAdapterResultFor<'ebm'>['value']['awardsLit'][number];
const EBM_COLORS = { gold: '#B0894B', blue: '#5E7A8C' };
const EBM_KPI_TONES: readonly string[] = [EBM_COLORS.gold, EBM_COLORS.blue, '#6E8A77', '#A87A6B'];
const EBM_STAGE_TONES: readonly string[] = [EBM_COLORS.gold, EBM_COLORS.blue, '#6E8A77'];
const EBM_AWARD_TONES: Readonly<Record<'lit' | 'clinical' | 'translation', readonly string[]>> = {
  lit: ['#9AA0A6', '#6E8A77', EBM_COLORS.gold, EBM_COLORS.blue],
  clinical: ['#6E8A77', EBM_COLORS.gold, '#6E8A77'],
  translation: ['#7A95A8', '#6E8A77'],
};
const EBM_COURSES: readonly { readonly icon: IconName; readonly tone: string }[] = [
  { icon: 'chart', tone: EBM_COLORS.gold }, { icon: 'skills', tone: EBM_COLORS.blue },
  { icon: 'cap', tone: '#6E8A77' },
];

function toneStyle(tone: string): CSSProperties & { readonly '--tone': string } {
  return { '--tone': tone };
}

function toneAt(tones: readonly string[], index: number): string {
  return tones[index % tones.length] ?? EBM_COLORS.gold;
}

function AwardTrack({ title, rows, tones, colSession, colAward }: {
  title: string; rows: readonly EbmAward[]; tones: readonly string[];
  colSession: string; colAward: string;
}) {
  return (
    <div className="stack gap-2">
      <h4 className="display d4">{title}</h4>
      <table className="table">
        <thead>
          <tr><th style={{ width: '38%' }}>{colSession}</th><th>{colAward}</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ whiteSpace: 'nowrap' }}>{r.sess}</td>
              <td>
                <div className="stack gap-1">
                  <span className="row gap-2">
                    <span className="dot" style={toneStyle(toneAt(tones, i))} />
                    <span style={{ color: toneAt(tones, i), fontWeight: 500 }}>{r.award}</span>
                  </span>
                  {r.note && <span className="tiny">{r.note}</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EbmPage() {
  const { lang } = useSite();
  const e = usePublicContentDocument('ebm', 'page', lang).value;
  const centers = usePublicContentDocument('centers', 'directory', lang).value;
  const people = usePublicContentDocument('people', 'directory', lang).value;
  const center = centers.centers.find((candidate) => candidate.id === 'ebm');
  const centerPeople = people.centerPeople.find((group) => group.centerId === 'ebm');
  if (center === undefined || centerPeople === undefined) throw new TypeError('Missing evidence-based medicine center');
  usePageTitle(center.name);

  const tone = EBM_COLORS.gold;

  return (
    <>
      <PageHero eyebrow={e.eyebrow} title={e.heroTitle} tag={e.heroTag} tone={tone}
        icon={CENTER_ICON.ebm} scrollTo="ebm-about"
        meta={
          <div className="grid g2" style={{ gap: 18 }}>
            {e.kpis.slice(0, 2).map((k, index) => (
              <div className="stat" key={k.en} style={toneStyle(toneAt(EBM_KPI_TONES, index))}>
                <div className="stat-num" style={{ fontSize: 'clamp(2rem, 3.6vw, 2.8rem)' }}>
                  {k.num}{k.suffix && <span className="stat-suffix">{k.suffix}</span>}
                </div>
                <span className="stat-label">{k.label}</span>
              </div>
            ))}
          </div>
        }
      />

      {/* About + members */}
      <Section id="ebm-about">
        <SectionHeader index="01" eyebrow={e.aboutEyebrow} title={e.aboutTitle} />
        <div className="grid g-editorial" style={{ alignItems: 'start' }}>
          <Reveal variant="up" className="stack gap-3">
            <p className="lede">{e.aboutBody}</p>
            <p className="prose">{e.aboutBody2}</p>
          </Reveal>
          <div className="stack gap-3">
            <span className="eyebrow" style={{ color: tone }}>{e.membersTitle}</span>
            <Reveal variant="up" stagger={80} className="grid grid-people">
              {centerPeople.people.map((p, i) => (
                <PersonCard key={`${p.en}-${i}`} person={p} accent={tone} compact />
              ))}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* KPIs */}
      <Section tight>
        <StatRow items={e.kpis.map((k, index) => ({
          value: k.num, suffix: k.suffix, label: k.label, sub: k.en,
          tone: toneAt(EBM_KPI_TONES, index),
        }))} columns="auto-fit-sm" />
      </Section>

      {/* Four missions */}
      <Section id="ebm-missions">
        <SectionHeader index="02" eyebrow={e.missionsEyebrow} title={e.missionsTitle} desc={e.missionsDesc} />
        <Reveal variant="up" stagger={90} className="grid g2">
          {e.missions.map((m) => (
            <div key={m.tag} className="rail-card stack gap-2" style={{ ...toneStyle(tone), paddingBlock: 8 }}>
              <span className="mono" style={{ fontSize: '0.72rem', color: tone, letterSpacing: '.16em' }}>{m.tag}</span>
              <h3 className="display d4">{m.title}</h3>
              <p className="prose" style={{ fontSize: '0.94rem' }}>{m.desc}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* Contest record */}
      <Section id="ebm-awards">
        <SectionHeader index="03" eyebrow={e.awardsEyebrow} title={e.awardsTitle} desc={e.awardsDesc} />
        <Reveal variant="up" stagger={100} className="grid g3">
          <AwardTrack title={e.awardsLitTitle} rows={e.awardsLit} tones={EBM_AWARD_TONES.lit}
            colSession={e.colSession} colAward={e.colAward} />
          <AwardTrack title={e.awardsClinTitle} rows={e.awardsClin} tones={EBM_AWARD_TONES.clinical}
            colSession={e.colSession} colAward={e.colAward} />
          <AwardTrack title={e.awardsTransTitle} rows={e.awardsTrans} tones={EBM_AWARD_TONES.translation}
            colSession={e.colSession} colAward={e.colAward} />
        </Reveal>
      </Section>

      {/* Twenty-year journey — pinned horizontal scrub */}
      <section id="ebm-journey" className="section">
        <div className="shell">
          <SectionHeader index="04" eyebrow={e.journeyEyebrow} title={e.journeyTitle} desc={e.journeyDesc} />
        </div>
        <HorizontalScroll head={<SectionTag index="04" eyebrow={e.journeyEyebrow} />}>
          {e.stages.map((s, index) => {
            const stageTone = toneAt(EBM_STAGE_TONES, index);
            return (
            <article key={s.phase} className="hscroll-card card" style={toneStyle(stageTone)}>
              <div className="stage-mark">
                <span className="stage-dot" />
                <span className="mono" style={{ fontSize: '0.68rem', letterSpacing: '.16em', color: stageTone }}>{s.phase}</span>
                <span className="stage-line" />
              </div>
              <h3 className="display d3">{s.name}</h3>
              <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: 6 }}>{s.years}</span>
              <ul className="stack gap-2" style={{ marginTop: 22 }}>
                {s.items.map((item, i) => (
                  <li key={i} className="row start gap-2">
                    <span className="dot" style={{ ...toneStyle(stageTone), marginTop: 9, width: 5, height: 5 }} />
                    <span className="prose" style={{ fontSize: '0.9rem' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            );
          })}
        </HorizontalScroll>
      </section>

      {/* Stepwise curriculum */}
      <Section id="ebm-courses">
        <SectionHeader index="05" eyebrow={e.coursesEyebrow} title={e.coursesTitle} desc={e.coursesDesc} />
        <Reveal variant="up" stagger={90} className="grid g3">
          {e.courseGroups.map((g, index) => {
            const presentation = EBM_COURSES[index % EBM_COURSES.length] ?? EBM_COURSES[0];
            return (
            <div key={g.title} className="card stack gap-3" style={toneStyle(presentation.tone)}>
              <div className="row gap-2">
                <span style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center',
                  justifyContent: 'center', borderRadius: '50%', color: presentation.tone,
                  background: `color-mix(in srgb, ${presentation.tone} 12%, transparent)` }}>
                  <Icon name={presentation.icon} size={17} />
                </span>
                <h3 className="display d4">{g.title}</h3>
              </div>
              <div className="stack" style={{ gap: 0 }}>
                {g.rows.map((r) => (
                  <div key={r.name} className="stack gap-1"
                    style={{ padding: '13px 0', borderTop: '1px solid var(--line-soft)' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{r.name}</span>
                    <span className="mono tiny">{r.detail}</span>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </Reveal>
      </Section>

      <ClosingContact title={e.closingTitle} body={e.closingBody} person={e.contactPerson}
        ext={e.contactExt} place={e.contactPlace} quote={e.contactQuote} tone={tone} />
    </>
  );
}
