import { useSite, usePageTitle } from '@/app/site';
import { CENTER_BRANCHES, CENTER_ICON, centerById, centerExternalUrl } from '@/data/centers';
import type { CenterId } from '@/data/types';
import { formatPhoneExt } from '@/utils/phone';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { PageHero } from '@/ui/PageParts';
import { PersonCard } from '@/ui/Person';
import { Icon } from '@/ui/Icon';

/**
 * Serves the two centers without bespoke content (clinical skills, medical
 * education research) from the shared `centers.ts` record.
 */
export function GenericCenterPage({ id }: { id: CenterId }) {
  const { isZh, lang } = useSite();
  const center = centerById(id)!;
  const externalUrl = centerExternalUrl(id, isZh);
  const branches = CENTER_BRANCHES[id];
  const name = isZh ? center.zh : center.en;
  usePageTitle(name);

  return (
    <>
      <PageHero
        eyebrow={isZh ? center.en : center.zh}
        title={name}
        tag={isZh ? center.introZh : center.introEn}
        tone={center.color}
        icon={CENTER_ICON[id]}
        scrollTo="remit"
        meta={
          externalUrl && (
            <a
              className="tlink"
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: center.color, alignSelf: 'flex-start' }}
            >
              {isZh ? '前往官方網站' : 'Visit the official site'}
              <Icon name="arrowUpRight" />
            </a>
          )
        }
      />

      <Section id="remit">
        <SectionHeader
          index="01"
          eyebrow="Remit"
          title={isZh ? '中心面向' : 'What the center covers'}
        />
        <Reveal variant="up" stagger={90} className="grid auto-fit">
          {branches.map((b) => (
            <div
              key={b.id}
              className="card card-hover stack gap-2"
              style={{ ['--tone' as string]: center.color }}
            >
              {b.icon && (
                <span
                  style={{
                    width: 38,
                    height: 38,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    color: center.color,
                    background: `color-mix(in srgb, ${center.color} 12%, transparent)`,
                  }}
                >
                  <Icon name={b.icon} size={17} />
                </span>
              )}
              <h3 className="display d4">{isZh ? b.zh : b.en}</h3>
              <p className="prose" style={{ fontSize: '0.92rem' }}>
                {isZh ? b.descZh : b.descEn}
              </p>
            </div>
          ))}
        </Reveal>
      </Section>

      <Section id="team" tight>
        <SectionHeader index="02" eyebrow="Team" title={isZh ? '中心成員' : 'Center Members'} />
        <Reveal variant="up" stagger={80} className="grid grid-people">
          {center.people.map((p, i) => (
            <PersonCard key={`${p.en}-${i}`} person={p} accent={center.color} />
          ))}
        </Reveal>
      </Section>

      <Section id="contact">
        <div className="panel row between wrap gap-3" style={{ ['--tone' as string]: center.color }}>
          <div className="stack gap-1">
            <span className="eyebrow" style={{ color: center.color }}>
              {isZh ? '聯絡窗口' : 'Contact'}
            </span>
            <span className="display d4">{isZh ? center.contactZh : center.contactEn}</span>
            <span className="tiny">
              {isZh
                ? `臺北醫學大學附設醫院 · 教學部 ${center.zh}`
                : `TMU Hospital · ${center.en}, Dept. of Medical Education`}
            </span>
          </div>
          {center.ext && (
            <a className="tlink" href="tel:+886227372181" style={{ color: center.color }}>
              <Icon name="phone" />
              <span className="mono">{formatPhoneExt(center.ext, lang)}</span>
            </a>
          )}
        </div>
      </Section>
    </>
  );
}
