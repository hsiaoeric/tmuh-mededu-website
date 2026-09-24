import { useSite } from '@/app/site';
import type { PublicAdapterResultFor } from '@/content/adapters';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { ActivityCard, AnnouncementRow } from '@/ui/NewsParts';
import { RAIL_INDEX } from './rail';

/**
 * The centre's own share of the department bulletin: courses it is running and
 * the international work it is doing. Both are scoped out of `news.ts` rather
 * than kept separately, so an entry lives in exactly one place and moves
 * between pages by changing its `scope`.
 */

/** 近期活動 — courses and talks the centre is running. */
export function Activities({ activities }: {
  readonly activities: PublicAdapterResultFor<'activities'>['value']['holistic'];
}) {
  const { isZh } = useSite();
  if (!activities.length) return null;

  return (
    <Section id="h-news">
      <SectionHeader
        index={RAIL_INDEX['h-news']}
        eyebrow="Activities"
        title={isZh ? '近期活動' : 'Upcoming Activities'}
        desc={
          isZh
            ? '全人照護相關課程與講座，報名與時數請至 TMS 系統。'
            : 'Holistic-care courses and talks; enrolment and credit hours are handled in TMS.'
        }
      />
      <Reveal variant="up" stagger={80} className="grid auto-fit-lg">
        {activities.map((a, i) => (
          <ActivityCard key={i} item={a} />
        ))}
      </Reveal>
    </Section>
  );
}

/** 國際合作 — cross-border exchange and collaboration. */
export function International({ items }: {
  readonly items: PublicAdapterResultFor<'news'>['value']['holistic'];
}) {
  const { isZh } = useSite();
  if (!items.length) return null;

  return (
    <Section id="h-intl">
      <SectionHeader
        index={RAIL_INDEX['h-intl']}
        eyebrow="International"
        title={isZh ? '國際合作' : 'International Collaboration'}
        desc={
          isZh
            ? '與國外醫學院校及虛擬醫院的跨域交流，深化全人照護與 AI 輔助教學。'
            : 'Cross-border exchange with overseas medical schools and virtual hospitals, deepening holistic care and AI-assisted teaching.'
        }
      />
      <div className="stack" style={{ gap: 0 }}>
        {items.map((a, i) => (
          <AnnouncementRow key={`${a.title}-${i}`} item={{ ...a, lines: [...a.lines] }} />
        ))}
      </div>
    </Section>
  );
}
