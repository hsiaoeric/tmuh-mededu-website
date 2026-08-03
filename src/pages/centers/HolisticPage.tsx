import { useMemo } from 'react';
import { useSite, usePageTitle } from '@/app/site';
import { type HolisticSection } from '@/app/routes';
import { pick, type Lang } from '@/i18n';
import { centerById, CENTER_ICON } from '@/data/centers';
import { buildAiEcosystem, holisticFeatures, holisticKpis, HOLISTIC_AI_TEAM } from '@/data/holistic';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { PageHero, ClosingContact } from '@/ui/PageParts';
import { SectionRail, type PageSection } from '@/ui/SectionRail';
import { PersonCard } from '@/ui/Person';
import { StatRow } from '@/ui/Stats';
import { Icon, type IconName } from '@/ui/Icon';
import { Algee } from './holistic/Algee';
import { AiEcosystem } from './holistic/AiEcosystem';
import { Activities, International } from './holistic/Bulletin';
import { Symposia, Training } from './holistic/Outcomes';
import { Research } from './holistic/Research';

const TEAL = '#4f8c7d';
const RESEARCH_TONE = '#5E7A8C';

/** Rail labels. Keyed by `HolisticSection`, so a new section id fails the build
 *  until it is given a label here. */
const SECTION_LABELS: Record<HolisticSection, [zh: string, en: string]> = {
  'h-about': ['關於中心', 'About'],
  'h-news': ['近期活動', 'Activities'],
  symposia: ['國內外研討會', 'Symposia'],
  'h-members': ['行政團隊', 'Administration'],
  'h-research-team': ['研究團隊', 'Research Team'],
  ai: ['生態系', 'Ecosystem'],
  mhfa: ['心理健康急救', 'MHFA'],
  training: ['師資培訓', 'Training'],
  'h-intl': ['國際合作', 'International'],
  research: ['研究成果', 'Research'],
  contact: ['聯絡資訊', 'Contact'],
};

/**
 * The banner across the top of the page. Sections that belong together are
 * gathered under one heading and opened from a dropdown, so the eight entries
 * here stand for the eleven sections below.
 */
const RAIL: Array<[zh: string, en: string, of: HolisticSection[]]> = [
  ['關於中心', 'About', ['h-about']],
  ['最新消息', 'News', ['h-news', 'symposia']],
  ['中心成員', 'Members', ['h-members', 'h-research-team']],
  ['全人專案', 'Programs', ['ai', 'mhfa']],
  ['師資培訓', 'Training', ['training']],
  ['國際合作', 'International', ['h-intl']],
  ['研究成果', 'Research', ['research']],
  ['聯絡資訊', 'Contact', ['contact']],
];

function railSections(lang: Lang): PageSection[] {
  return RAIL.map(([zh, en, of]) => {
    const label = pick(lang, zh, en);
    const child = (id: HolisticSection) => ({ id, label: pick(lang, ...SECTION_LABELS[id]) });
    return of.length === 1
      ? { id: of[0], label }
      : { id: of[0], label, children: of.map(child) };
  });
}

export function HolisticPage() {
  const { t, isZh, lang } = useSite();
  const center = centerById('holistic')!;
  usePageTitle(isZh ? center.zh : center.en);

  const features = holisticFeatures(lang);
  const kpis = holisticKpis(lang);
  const ai = buildAiEcosystem(lang);

  const sections = useMemo<PageSection[]>(() => railSections(lang), [lang]);

  return (
    <>
      <PageHero
        eyebrow="Center for Education in Holistic Care and Human Flourishing"
        title={t.hHeroTitle}
        tag={t.hHeroTag}
        tone={TEAL}
        icon={CENTER_ICON.holistic}
        scrollTo="h-about"
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

      {/* About, figures and the core services */}
      <Section id="h-about">
        <SectionHeader index="01" eyebrow="About" title={t.hAboutTitle} desc={t.hAboutBody} />

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

      {/* 最新消息: what is coming up, and the symposia already held. */}
      <Activities />
      <Symposia />

      {/* Center members, split into the two teams the rail lists separately. */}
      <Section id="h-members" tight>
        <SectionHeader
          index="04"
          eyebrow="People"
          title={isZh ? '行政團隊' : 'Administrative Team'}
        />
        <Reveal variant="up" stagger={80} className="grid grid-people">
          {center.people.map((p, i) => (
            <PersonCard key={`${p.en}-${i}`} person={p} accent={TEAL} />
          ))}
        </Reveal>
      </Section>

      <Section id="h-research-team" tight>
        <SectionHeader
          index="05"
          eyebrow="People"
          title={isZh ? '研究團隊' : 'Research Team'}
          desc={ai.teamLabel}
        />
        <Reveal variant="up" stagger={80} className="grid grid-people">
          {HOLISTIC_AI_TEAM.map((p, i) => (
            <PersonCard key={`${p.en}-${i}`} person={p} accent={RESEARCH_TONE} compact />
          ))}
        </Reveal>
      </Section>

      {/* 全人專案: the Scope 2 ecosystem, then MHFA — the ALGEE steps, the
          instructors and the seed teachers. */}
      <AiEcosystem />
      <Algee />

      <Training />
      <International />
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
