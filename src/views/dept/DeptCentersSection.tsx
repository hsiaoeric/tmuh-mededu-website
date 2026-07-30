import { useState } from 'react';
import { useSite, type CenterId } from '@/context/SiteContext';
import {
  CENTER_ICON,
  CENTER_LINK_ORDER,
  READY_CENTER_PAGES,
  centerById,
} from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';
import { NxCardHead } from '@/components/common/NxCardHead';

/**
 * The five centers as Nexus's kinetic accordion: five columns that stay closed
 * as vertical spines until one is opened, when it takes most of the width and
 * reveals its introduction and a way in.
 *
 * The template drives its slices with photographs. There are none for the
 * centers, so each slice is washed in that center's own accent instead — which
 * is also why the accents were retuned to a single saturated system.
 */
export function DeptCentersSection() {
  const { isZh, enterCenter } = useSite();
  const [active, setActive] = useState<CenterId | null>(null);
  const hoverCapable =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const slices = CENTER_LINK_ORDER.map((id) => centerById(id)!).map((c, i) => ({
    id: c.id,
    num: `A.0${i + 1}`,
    name: isZh ? c.zh : c.en,
    en: c.en,
    intro: isZh ? c.introZh : c.introEn,
    color: c.color,
    icon: CENTER_ICON[c.id] as IconName,
    ready: READY_CENTER_PAGES.includes(c.id),
  }));

  return (
    <section id="centers">
      <NxCardHead
        num="04"
        kicker={isZh ? 'FIVE CENTERS / 展開任一欄' : 'FIVE CENTERS / OPEN A COLUMN'}
        title={isZh ? '五個中心，同一條主軸' : 'Five centers. One spine.'}
        desc={
          isZh
            ? '教學部下轄五個教育中心，各自負責一段培育任務，共同構成從課堂到床邊的完整路徑。'
            : 'Five education centers, each owning one stretch of the training path — together a complete route from classroom to bedside.'
        }
      />

      <div className="nx-accordion">
        {slices.map((s) => {
          const on = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={`nx-slice${on ? ' nx-slice--active' : ''}`}
              aria-expanded={on}
              onMouseEnter={hoverCapable ? () => setActive(s.id) : undefined}
              onFocus={hoverCapable ? () => setActive(s.id) : undefined}
              onClick={() => {
                if (on) enterCenter(s.id);
                else setActive(s.id);
              }}
            >
              <span
                className="nx-slice__wash"
                style={{
                  background: `linear-gradient(180deg,color-mix(in srgb,${s.color} 22%,var(--carbon)),${s.color})`,
                }}
                aria-hidden="true"
              />
              <span className="nx-slice__shade" aria-hidden="true" />

              <span className="nx-slice__idle">
                <span className="nx-tag">{s.num}</span>
                <span className="nx-slice__idle-title">{s.name}</span>
                <span
                  className="nx-tag"
                  style={{ color: s.color, fontSize: 14 }}
                  aria-hidden="true"
                >
                  +
                </span>
              </span>

              <span className="nx-slice__reveal">
                <span
                  className="nx-tag"
                  style={{ display: 'block', marginBottom: 12, color: 'var(--volt)' }}
                >
                  {s.num} / {s.en}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      flex: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(244,245,246,.4)',
                      color: 'var(--titanium)',
                    }}
                  >
                    <span style={{ width: 17, height: 17, display: 'block' }}>
                      <Icon name={s.icon} />
                    </span>
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 700,
                      fontSize: 'clamp(19px,2.4vw,28px)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {s.name}
                  </span>
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    maxWidth: 460,
                    color: 'rgba(244,245,246,.86)',
                  }}
                >
                  {s.intro}
                </span>
                <span
                  className="nx-tag"
                  style={{
                    display: 'inline-block',
                    marginTop: 16,
                    padding: '7px 12px',
                    background: s.ready ? 'var(--volt)' : 'transparent',
                    border: s.ready ? 'none' : '1px solid rgba(244,245,246,.45)',
                    color: s.ready ? 'var(--volt-ink)' : 'var(--titanium)',
                  }}
                >
                  {s.ready
                    ? isZh
                      ? '進入專頁 →'
                      : 'ENTER PAGE →'
                    : isZh
                      ? '建置中 →'
                      : 'IN PROGRESS →'}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
