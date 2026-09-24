import type { CSSProperties } from 'react';
import { useSite, usePageTitle } from '@/app/site';
import { CENTER_ICON } from '@/data/centers';
import { resolvePerson } from '@/data/people';
import { usePublicContentDocument } from '@/content/usePublicContentDocument';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { PageHero, ClosingContact } from '@/ui/PageParts';
import { Avatar, PersonCard } from '@/ui/Person';
import { StatRow } from '@/ui/Stats';
import { Icon, type IconName } from '@/ui/Icon';

const FD_COLORS = {
  clay: '#A87A6B', blue: '#7A95A8', sage: '#8FA898', ochre: '#B69B66',
};
const FD_KPI_TONES: readonly string[] = [FD_COLORS.clay, FD_COLORS.blue, FD_COLORS.sage, FD_COLORS.ochre];
const FD_SERVICES: readonly { readonly icon: IconName; readonly tone: string }[] = [
  { icon: 'cap', tone: FD_COLORS.clay }, { icon: 'award', tone: FD_COLORS.blue },
  { icon: 'bulb', tone: FD_COLORS.ochre }, { icon: 'clipboard', tone: FD_COLORS.sage },
];
const FD_GROUP_TONES: readonly string[] = [
  FD_COLORS.clay, FD_COLORS.blue, FD_COLORS.sage, FD_COLORS.ochre, '#9C6F8E', '#6E8A77',
];

function toneStyle(tone: string): CSSProperties & { readonly '--tone': string } {
  return { '--tone': tone };
}

function toneAt(tones: readonly string[], index: number): string {
  return tones[index % tones.length] ?? FD_COLORS.clay;
}

export function FacdevPage() {
  const { lang } = useSite();
  const f = usePublicContentDocument('facdev', 'page', lang).value;
  const centers = usePublicContentDocument('centers', 'directory', lang).value;
  const people = usePublicContentDocument('people', 'directory', lang).value;
  const center = centers.centers.find((candidate) => candidate.id === 'faculty_dev');
  const centerPeople = people.centerPeople.find((group) => group.centerId === 'faculty_dev');
  if (center === undefined || centerPeople === undefined) throw new TypeError('Missing faculty development center');
  usePageTitle(center.name);

  const tone = FD_COLORS.clay;

  return (
    <>
      <PageHero
        eyebrow={f.eyebrow}
        title={f.heroTitle}
        tag={f.heroTag}
        tone={tone}
        icon={CENTER_ICON.faculty_dev}
        scrollTo="fd-about"
        meta={
          <div className="grid g2" style={{ gap: 18 }}>
            {f.kpis.slice(0, 2).map((k, index) => (
              <div className="stat" key={k.en} style={toneStyle(toneAt(FD_KPI_TONES, index))}>
                <div className="stat-num" style={{ fontSize: 'clamp(2rem, 3.6vw, 2.8rem)' }}>
                  {k.num}
                </div>
                <span className="stat-label">{k.label}</span>
              </div>
            ))}
          </div>
        }
      />

      <Section id="fd-about">
        <SectionHeader index="01" eyebrow={f.aboutEyebrow} title={f.aboutTitle} />
        <div className="grid g-editorial" style={{ alignItems: 'start' }}>
          <Reveal variant="up" className="stack gap-3">
            <p className="lede">{f.aboutBody}</p>
            <p className="prose">{f.aboutBody2}</p>
          </Reveal>
          <div className="stack gap-3">
            <span className="eyebrow" style={{ color: tone }}>
              {f.membersTitle}
            </span>
            <Reveal variant="up" stagger={80} className="grid grid-people">
              {centerPeople.people.map((p, i) => (
                <PersonCard key={`${p.en}-${i}`} person={p} accent={tone} compact />
              ))}
            </Reveal>
          </div>
        </div>
      </Section>

      <Section tight>
        <StatRow
          items={f.kpis.map((k, index) => ({
            value: k.num,
            suffix: k.suffix,
            label: k.label,
            sub: k.en,
            tone: toneAt(FD_KPI_TONES, index),
          }))}
        />
      </Section>

      <Section id="fd-services">
        <SectionHeader
          index="02"
          eyebrow={f.servicesEyebrow}
          title={f.servicesTitle}
          desc={f.servicesDesc}
        />
        <Reveal variant="up" stagger={90} className="grid g2">
          {f.services.map((s, i) => {
            const presentation = FD_SERVICES[i % FD_SERVICES.length] ?? FD_SERVICES[0];
            return (
            <div key={s.title} className="card card-hover stack gap-2" style={toneStyle(presentation.tone)}>
              <div className="row between">
                <span
                  style={{
                    width: 40,
                    height: 40,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    color: presentation.tone,
                    background: `color-mix(in srgb, ${presentation.tone} 12%, transparent)`,
                  }}
                >
                  <Icon name={presentation.icon} size={18} />
                </span>
                <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--faint)' }}>
                  0{i + 1}
                </span>
              </div>
              <h3 className="display d4" style={{ marginTop: 8 }}>
                {s.title}
              </h3>
              <p className="prose" style={{ fontSize: '0.93rem' }}>
                {s.desc}
              </p>
            </div>
            );
          })}
        </Reveal>
      </Section>

      {/* Six cultivation groups */}
      <Section id="fd-groups">
        <SectionHeader
          index="03"
          eyebrow={f.groupsEyebrow}
          title={f.groupsTitle}
          desc={f.groupsDesc}
        />

        <Reveal variant="fade" className="row center" style={{ marginBottom: 34 }}>
          <span
            className="tag"
            style={{ ...toneStyle(tone), fontSize: '0.7rem', padding: '8px 18px' }}
          >
            <Icon name="cap" size={13} />
            {f.groupRoot}
          </span>
        </Reveal>

        <Reveal variant="up" stagger={80} className="grid g3">
          {f.groups.map((g, index) => {
            const groupTone = toneAt(FD_GROUP_TONES, index);
            const lead = resolvePerson(g.lead, groupTone, lang);
            return (
              <div key={g.name} className="card card-hover stack gap-2" style={toneStyle(groupTone)}>
                <span className="row gap-2">
                  <span className="dot" />
                  <span style={{ fontFamily: "'Noto Sans TC',sans-serif", fontWeight: 700, color: 'var(--ink)' }}>
                    {g.name}
                  </span>
                </span>
                <p className="prose" style={{ fontSize: '0.9rem' }}>
                  {g.desc}
                </p>
                <div
                  className="row gap-2"
                  style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}
                >
                  <Avatar person={g.lead} accent={groupTone} />
                  <span className="stack" style={{ gap: 1, minWidth: 0 }}>
                    <span className="mono" style={{ fontSize: '0.6rem', letterSpacing: '.14em', color: 'var(--faint)' }}>
                      {f.groupLeadLabel}
                    </span>
                    <span className="person-name" style={{ fontSize: '0.9rem' }}>
                      {lead.fullname}
                    </span>
                    <span className="person-dept">{lead.dept}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </Reveal>
      </Section>

      {/* News & activities placeholder — kept from the original site */}
      <Section id="fd-news" tight>
        <div className="grid g2">
          {[
            { eyebrow: f.newsEyebrow, title: f.newsTitle },
            { eyebrow: f.actEyebrow, title: f.actTitle },
          ].map((b) => (
            <Reveal key={b.eyebrow} variant="up" className="panel sunk stack gap-2">
              <div className="row between wrap gap-2">
                <span className="eyebrow" style={{ color: tone }}>
                  {b.eyebrow}
                </span>
                <span className="tag" style={toneStyle('var(--muted)')}>
                  {f.reservedTag}
                </span>
              </div>
              <h3 className="display d4">{b.title}</h3>
              <p className="prose" style={{ fontSize: '0.92rem' }}>
                {f.reservedNote}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      <ClosingContact
        title={f.closingTitle}
        body={f.closingBody}
        person={f.contactPerson}
        ext={f.contactExt}
        place={f.contactPlace}
        quote={f.contactQuote}
        tone={tone}
      />
    </>
  );
}
