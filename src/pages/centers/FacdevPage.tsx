import { useSite, usePageTitle } from '@/app/site';
import { centerById, CENTER_ICON } from '@/data/centers';
import { buildFacdev } from '@/data/facdev';
import { resolvePerson } from '@/data/people';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { PageHero, ClosingContact } from '@/ui/PageParts';
import { Avatar, PersonCard } from '@/ui/Person';
import { StatRow } from '@/ui/Stats';
import { Icon, type IconName } from '@/ui/Icon';

export function FacdevPage() {
  const { isZh, lang } = useSite();
  const f = buildFacdev(lang);
  const center = centerById('faculty_dev')!;
  usePageTitle(isZh ? center.zh : center.en);

  const tone = f.colors.clay;

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
            {f.kpis.slice(0, 2).map((k) => (
              <div className="stat" key={k.en} style={{ ['--tone' as string]: k.color }}>
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
              {center.people.map((p, i) => (
                <PersonCard key={`${p.en}-${i}`} person={p} accent={tone} compact />
              ))}
            </Reveal>
          </div>
        </div>
      </Section>

      <Section tight>
        <StatRow
          items={f.kpis.map((k) => ({
            value: k.num,
            suffix: k.suffix,
            label: k.label,
            sub: k.en,
            tone: k.color,
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
          {f.services.map((s, i) => (
            <div key={s.title} className="card card-hover stack gap-2" style={{ ['--tone' as string]: s.tone }}>
              <div className="row between">
                <span
                  style={{
                    width: 40,
                    height: 40,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    color: s.tone,
                    background: `color-mix(in srgb, ${s.tone} 12%, transparent)`,
                  }}
                >
                  <Icon name={s.icon as IconName} size={18} />
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
          ))}
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
            style={{ ['--tone' as string]: tone, fontSize: '0.7rem', padding: '8px 18px' }}
          >
            <Icon name="cap" size={13} />
            {f.groupRoot}
          </span>
        </Reveal>

        <Reveal variant="up" stagger={80} className="grid g3">
          {f.groups.map((g) => {
            const lead = resolvePerson(g.lead, g.tone, lang);
            return (
              <div key={g.name} className="card card-hover stack gap-2" style={{ ['--tone' as string]: g.tone }}>
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
                  <Avatar person={g.lead} accent={g.tone} />
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
                <span className="tag" style={{ ['--tone' as string]: 'var(--muted)' }}>
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
