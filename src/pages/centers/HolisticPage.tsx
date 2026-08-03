import { useMemo } from 'react';
import { useSite, usePageTitle } from '@/app/site';
import { centerById, CENTER_ICON } from '@/data/centers';
import { holisticFeatures, holisticKpis } from '@/data/holistic';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { PageHero, ClosingContact } from '@/ui/PageParts';
import { SectionRail, type PageSection } from '@/ui/SectionRail';
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

  const sections = useMemo<PageSection[]>(
    () => [
      { id: 'ai', label: isZh ? 'AI 生態系' : 'AI Ecosystem' },
      { id: 'h-about', label: isZh ? '關於中心' : 'About' },
      { id: 'h-members', label: isZh ? '中心成員' : 'Members' },
      { id: 'mhfa', label: isZh ? '心理健康急救' : 'MHFA' },
      { id: 'symposia', label: isZh ? '全人研討會' : 'Symposia' },
      { id: 'training', label: isZh ? '師資培訓' : 'Training' },
      { id: 'research', label: isZh ? '研究成果' : 'Research' },
      { id: 'contact', label: isZh ? '聯絡' : 'Contact' },
    ],
    [isZh],
  );

  return (
    <>
      <PageHero
        eyebrow="Center for Education in Holistic Care and Human Flourishing"
        title={t.hHeroTitle}
        tag={t.hHeroTag}
        tone={TEAL}
        icon={CENTER_ICON.holistic}
        scrollTo="ai"
        meta={
          <div className="grid g2" style={{ gap: 18 }}>
            {kpis.slice(0, 2).map((k) => (
              <div className="stat" key={k.label} style={{ ['--tone' as string]: k.color }}>
                <div className="stat-num" style={{ fontSize: 'clamp(2rem, 3.6vw, 2.8rem)' }}>
                  {k.isStatic ? k.display : k.num}
                </div>
                <span className="stat-label">{k.label}</span>
              </div>
            ))}
          </div>
        }
      />

      <SectionRail sections={sections} tone={TEAL} />

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

      {/* MHFA: the ALGEE steps, the instructors and the seed teachers */}
      <Algee />

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
