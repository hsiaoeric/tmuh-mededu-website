import { useSite } from '@/app/site';
import { CENTER_ORDER } from '@/app/routes';
import { centerById } from '@/data/centers';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { CenterLink } from '@/ui/CenterLink';
import { Icon } from '@/ui/Icon';

export function Centers() {
  const { isZh } = useSite();

  return (
    <Section id="centers">
      <SectionHeader
        index="03"
        eyebrow="The Five Centers"
        title={isZh ? '五大教育中心' : 'Five Education Centers'}
        desc={
          isZh
            ? '每一個中心承擔一段教育旅程：從教師的養成、技能的錘鍊、證據的檢驗，到照護一個完整的人。'
            : 'Each center carries one stage of the journey — growing teachers, honing skills, testing evidence, and caring for the whole person.'
        }
      />

      <Reveal variant="up" stagger={80} className="stack" style={{ gap: 0 }}>
        {CENTER_ORDER.map((id, i) => {
          const c = centerById(id)!;
          return (
            <CenterLink
              key={id}
              id={id}
              className="index-row"
              style={{ ['--tone' as string]: c.color }}
              data-cursor={c.externalUrl ? (isZh ? '官網' : 'Site') : isZh ? '進入' : 'Enter'}
            >
              <span className="num">0{i + 1}</span>
              <span className="stack gap-1" style={{ minWidth: 0 }}>
                <span className="row-title" lang={isZh ? 'zh-Hant' : 'en'}>
                  {isZh ? c.zh : c.en}
                </span>
                <span className="mono" style={{ fontSize: '0.63rem', letterSpacing: '.12em', color: 'var(--faint)' }}>
                  {isZh ? c.en : c.zh}
                </span>
              </span>
              <span className="row gap-3">
                <span className="row-meta">{isZh ? c.introZh : c.introEn}</span>
                <span className="row-go">
                  <Icon name={c.externalUrl ? 'arrowUpRight' : 'arrow'} />
                </span>
              </span>
            </CenterLink>
          );
        })}
      </Reveal>
    </Section>
  );
}
