import { useSite, usePageTitle } from '@/app/site';
import { centerById, CENTER_ICON } from '@/data/centers';
import {
  holisticFeatures,
  holisticKpis,
  HOLISTIC_INSTRUCTORS,
  HOLISTIC_SEED,
} from '@/data/holistic';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { PageHero, ClosingContact } from '@/ui/PageParts';
import { PersonCard } from '@/ui/Person';
import { StatRow } from '@/ui/Stats';
import { Icon, type IconName } from '@/ui/Icon';
import { Algee } from './holistic/Algee';
import { AiEcosystem } from './holistic/AiEcosystem';
import { Outcomes } from './holistic/Outcomes';
import { Research } from './holistic/Research';

const TEAL = '#4f8c7d';

export function HolisticPage() {
  const { t, isZh, lang } = useSite();
  const center = centerById('holistic')!;
  usePageTitle(isZh ? center.zh : center.en);

  const features = holisticFeatures(lang);
  const kpis = holisticKpis(lang);

  return (
    <>
      <PageHero
        eyebrow="Center for Education in Holistic Care and Human Flourishing"
        title={t.hHeroTitle}
        tag={t.hHeroTag}
        tone={TEAL}
        icon={CENTER_ICON.holistic}
        scrollTo="ai"
      />

      {/* Healthy Taiwan Scope 2 leads the page — it is the center's headline work. */}
      <AiEcosystem />

      {/* About, figures and the core services */}
      <Section id="h-about">
        <SectionHeader index="02" eyebrow="About" title={t.hAboutTitle} desc={t.hAboutBody} />

        <StatRow
          items={kpis.map((k) => ({
            value: k.isStatic ? k.display : k.num,
            label: k.label,
            sub: k.subtitle,
            tone: k.color,
          }))}
        />

        <Reveal variant="up" stagger={90} className="grid g2" style={{ marginTop: 'clamp(40px, 6vw, 72px)' }}>
          {features.map((f) => (
            <div key={f.title} className="card card-hover stack gap-2" style={{ ['--tone' as string]: TEAL }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  color: TEAL,
                  background: `color-mix(in srgb, ${TEAL} 12%, transparent)`,
                }}
              >
                <Icon name={f.iconId as IconName} size={18} />
              </span>
              <h3 className="display d4" style={{ marginTop: 8 }}>
                {f.title}
              </h3>
              <p className="prose" style={{ fontSize: '0.93rem' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* Center members */}
      <Section id="h-members" tight>
        <SectionHeader
          index="03"
          eyebrow="People"
          title={isZh ? '中心成員' : 'Center Members'}
        />
        <Reveal variant="up" stagger={80} className="grid grid-people">
          {center.people.map((p, i) => (
            <PersonCard key={`${p.en}-${i}`} person={p} accent={TEAL} />
          ))}
        </Reveal>
      </Section>

      <Algee />

      {/* Instructors + seed teachers */}
      <Section id="seed">
        <SectionHeader index="05" eyebrow="People" title={t.instructorsTitle} />
        <Reveal variant="up" stagger={90} className="grid grid-people" style={{ maxWidth: 620 }}>
          {HOLISTIC_INSTRUCTORS.map((p, i) => (
            <PersonCard key={`${p.en}-${i}`} person={p} accent={TEAL} />
          ))}
        </Reveal>

        <div className="stack gap-3" style={{ marginTop: 'clamp(46px, 7vw, 88px)' }}>
          <div className="row between wrap gap-2">
            <div className="stack gap-1">
              <h3 className="display d3">{t.seedTitle}</h3>
              <p className="prose measure">{t.seedDesc}</p>
            </div>
            <span className="stat" style={{ ['--tone' as string]: TEAL }}>
              <span className="stat-num" style={{ fontSize: '2.6rem' }}>
                {HOLISTIC_SEED.length}
              </span>
            </span>
          </div>

          <Reveal variant="up" stagger={50} className="grid grid-people" style={{ marginTop: 12 }}>
            {HOLISTIC_SEED.map((p, i) => (
              <PersonCard key={`${p.en}-${i}`} person={p} accent={TEAL} hideRole />
            ))}
          </Reveal>
        </div>
      </Section>

      <Outcomes />
      <Research />

      <ClosingContact
        title={isZh ? '讓關懷成為本能' : 'Making care instinctive'}
        body={t.hAboutBody}
        person={t.hContactPerson}
        ext={t.hContactExt}
        place={t.hContactPlace}
        quote={t.hContactQuote}
        tone={TEAL}
      />
    </>
  );
}
