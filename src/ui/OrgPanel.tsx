import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { CENTER_BRANCHES, type Center } from '@/data/centers';
import { CENTER_SLUG } from '@/app/routes';
import type { CenterId } from '@/data/types';
import { formatPhoneExt } from '@/utils/phone';
import { Reveal } from '@/motion/Reveal';
import { Icon } from './Icon';
import { PersonCard, PersonRoster } from './Person';

/** Detail for the unit selected in the constellation. */
export function OrgPanel({ center, onClose }: { center: Center; onClose: () => void }) {
  const { isZh, lang } = useSite();
  const branches = CENTER_BRANCHES[center.id];
  const slug = CENTER_SLUG[center.id as Exclude<CenterId, 'admin'>];
  const isAdmin = center.id === 'admin';

  // The admin team is 16 people; a portrait grid would swamp the panel, so the
  // leadership keeps portraits and the specialists become a duty roster.
  const leadership = isAdmin ? center.people.slice(0, 5) : center.people;
  const specialists = isAdmin ? center.people.slice(5) : [];

  return (
    <div
      className="panel stack gap-4"
      style={{ ['--tone' as string]: center.color, marginTop: 40 }}
      key={center.id}
    >
      <div className="row between wrap gap-3" style={{ alignItems: 'flex-start' }}>
        <div className="stack gap-2" style={{ minWidth: 0 }}>
          <span className="eyebrow" style={{ color: center.color }}>
            {isZh ? center.en : center.zh}
          </span>
          <h3 className="display d3">{isZh ? center.zh : center.en}</h3>
        </div>
        <div className="row gap-2">
          {slug && (
            <Link className="btn btn-ghost" to={`/centers/${slug}`}>
              {isZh ? '進入專頁' : 'Center page'}
              <Icon name="arrow" />
            </Link>
          )}
          <button
            className="pill"
            onClick={onClose}
            aria-label={isZh ? '收合' : 'Close'}
          >
            <Icon name="close" />
          </button>
        </div>
      </div>

      <p className="lede measure">{isZh ? center.introZh : center.introEn}</p>

      <div className="grid auto-fit">
        {branches.map((b, i) => (
          <Reveal
            key={b.id}
            variant="up"
            delay={i * 70}
            className="rail-card stack gap-1"
            style={{ ['--tone' as string]: center.color }}
          >
            <div className="row gap-2">
              {b.icon && (
                <span style={{ color: center.color, display: 'inline-flex' }}>
                  <Icon name={b.icon} size={16} />
                </span>
              )}
              <span style={{ fontFamily: "'Noto Sans TC',sans-serif", fontWeight: 700, color: 'var(--ink)' }}>
                {isZh ? b.zh : b.en}
              </span>
            </div>
            <p className="tiny">{isZh ? b.descZh : b.descEn}</p>
          </Reveal>
        ))}
      </div>

      <div className="stack gap-3">
        <div className="row between baseline">
          <span className="eyebrow" style={{ color: center.color }}>
            {isZh ? '團隊成員' : 'Team'}
          </span>
          <span className="mono tiny">{center.people.length}</span>
        </div>
        <Reveal variant="up" stagger={60} className="grid grid-people">
          {leadership.map((p, i) => (
            <PersonCard key={`${p.en}-${i}`} person={p} accent={center.color} compact />
          ))}
        </Reveal>
        {specialists.length > 0 && (
          <div className="stack gap-2" style={{ marginTop: 10 }}>
            <div className="row between baseline gap-2">
              <span className="eyebrow" style={{ color: center.color }}>
                {isZh ? '行政專員業務分工' : 'Specialists & Duties'}
              </span>
              <span className="eyebrow">{isZh ? '分機 · 信箱' : 'Ext. · Email'}</span>
            </div>
            <PersonRoster people={specialists} accent={center.color} showDuty showContact />
          </div>
        )}
      </div>

      {center.ext && (
        <div
          className="row between wrap gap-2"
          style={{ paddingTop: 22, borderTop: '1px solid var(--line)' }}
        >
          <span className="tiny">
            {isZh ? '聯絡窗口' : 'Contact'} · {isZh ? center.contactZh : center.contactEn}
          </span>
          <a className="tlink" href="tel:+886227372181" style={{ color: center.color }}>
            <Icon name="phone" />
            <span className="mono">{formatPhoneExt(center.ext, lang)}</span>
          </a>
        </div>
      )}
    </div>
  );
}
