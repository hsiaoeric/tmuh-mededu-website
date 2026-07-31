import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { CENTER_ORDER, centerPath } from '@/app/routes';
import { centerById, CENTER_ICON } from '@/data/centers';
import { deptKpis } from '@/data/kpis';
import { person, type RawPerson } from '@/data/people';
import { Counter } from '@/motion/Counter';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { Icon } from '@/ui/Icon';
import { PersonCard } from '@/ui/Person';

/** Named by the English KPI caption, which is the stable key in kpis.ts. */
const MEMBER_GROUPS: Record<string, RawPerson[]> = {
  'Teaching Attendings': [
    person('邱欣怡', 'Hsin-Yi Chiu', 'lead', '', '', 'hsin-yi-chiu', 'hsin-yi-chiu'),
    person('吳政誠', 'Jeng-Cheng Wu', 'lead', '', '', 'jeng-cheng-wu', 'jeng-cheng-wu'),
    person('吳人傑', 'Jen-Chieh Wu', 'lead', '', '', 'jen-chieh-wu', 'jen-chieh-wu'),
  ],
  'Teaching Allied Health': [
    person('王莉萱', 'Li-Hsuan Wang', 'lead', '', '', 'li-hsuan-wang'),
    person('范芳郡', 'Fang-Chun Fan', 'lead', '', '', 'fang-chun-fan'),
    person('向慧芬', 'Hui-Fen Hsiang', 'lead', '', ''),
    person('鄭憲霖', 'Hsien-Lin Cheng', 'lead', '', ''),
  ],
};

const GROUP_TITLE: Record<string, { zh: string; en: string }> = {
  'Teaching Attendings': { zh: '教學型主治成員', en: 'Teaching Attendings' },
  'Teaching Allied Health': { zh: '職類教學型醫事人員成員', en: 'Teaching Allied Health' },
  'Education Centers': { zh: '五中心專頁入口', en: 'The Five Center Pages' },
};

export function Glance() {
  const { t, isZh, lang } = useSite();
  const [open, setOpen] = useState<string | null>(null);
  const kpis = deptKpis(lang);

  const members = open && MEMBER_GROUPS[open] ? MEMBER_GROUPS[open] : [];
  const showCenters = open === 'Education Centers';

  return (
    <Section id="glance" tight>
      <SectionHeader index="04" eyebrow={t.kpiEyebrow} title={t.kpiTitle} />

      <div className="grid g3">
        {kpis.map((k) => {
          const expandable = !!MEMBER_GROUPS[k.en] || k.en === 'Education Centers';
          const on = open === k.en;
          return (
            <Reveal key={k.en} variant="up" delay={k.delay}>
              <button
                className="stat-cell"
                style={{
                  ['--tone' as string]: k.color,
                  width: '100%',
                  textAlign: 'left',
                  cursor: expandable ? 'pointer' : 'default',
                  borderTopColor: on ? k.color : undefined,
                  transition: 'border-color .4s ease',
                }}
                onClick={expandable ? () => setOpen((c) => (c === k.en ? null : k.en)) : undefined}
                aria-expanded={expandable ? on : undefined}
                data-cursor={expandable ? (isZh ? '展開' : 'Open') : undefined}
              >
                <div className="stat">
                  <div className="stat-num">
                    <Counter to={k.num} />
                    {k.suffix && <span className="stat-suffix">{k.suffix}</span>}
                  </div>
                  <div className="row between gap-2">
                    <span className="stat-label">{k.label}</span>
                    {expandable && (
                      <span style={{ color: k.color, display: 'inline-flex' }}>
                        <Icon name={on ? 'minus' : 'plus'} size={15} />
                      </span>
                    )}
                  </div>
                  <span className="stat-sub">{k.en}</span>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      {open && (members.length > 0 || showCenters) && (
        <div className="panel stack gap-3" style={{ marginTop: 30 }} key={open}>
          <span className="eyebrow">
            {isZh ? GROUP_TITLE[open].zh : GROUP_TITLE[open].en}
          </span>

          {members.length > 0 && (
            <Reveal variant="up" stagger={60} className="grid grid-people">
              {members.map((p, i) => (
                <PersonCard key={`${p.en}-${i}`} person={p} accent={kpis.find((k) => k.en === open)!.color} hideRole compact />
              ))}
            </Reveal>
          )}

          {showCenters && (
            <Reveal variant="up" stagger={60} className="grid auto-fit">
              {CENTER_ORDER.map((id) => {
                const c = centerById(id)!;
                return (
                  <Link
                    key={id}
                    to={centerPath(id)}
                    className="card card-hover stack gap-2"
                    style={{ ['--tone' as string]: c.color }}
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        color: c.color,
                        background: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                      }}
                    >
                      <Icon name={CENTER_ICON[id]} size={17} />
                    </span>
                    <span style={{ fontFamily: "'Noto Sans TC',sans-serif", fontWeight: 500, color: 'var(--ink)' }}>
                      {isZh ? c.zh : c.en}
                    </span>
                    <span className="tlink" style={{ color: c.color, marginTop: 'auto' }}>
                      {isZh ? '前往專頁' : 'Visit page'}
                      <Icon name="arrowUpRight" />
                    </span>
                  </Link>
                );
              })}
            </Reveal>
          )}
        </div>
      )}

      <p className="tiny" style={{ marginTop: 24 }}>
        {t.dataSource}
      </p>
    </Section>
  );
}
