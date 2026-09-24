import { Link } from 'react-router-dom';
import { publicCenterById, publicCenterExternalUrl, usePublicCenters } from '@/app/publicCenters';
import { useSite } from '@/app/site';
import { useGoToSection } from '@/app/navigation';
import { ANNOUNCEMENTS_PATH, CENTER_ORDER, HONORS_PATH } from '@/app/routes';
import { usePublicContentDocument } from '@/content';
import { Reveal } from '@/motion/Reveal';
import { assetUrl } from '@/utils/asset';
import { CenterLink } from './CenterLink';
import { Icon } from './Icon';

/** Students who designed and built this site. */
const DESIGN_TEAM = [
  {
    zh: '蕭名凱',
    en: 'Ming-Kai Hsiao',
    detailZh: '',
    detailEn: '',
    email: 'hsiaoeric.dev@gmail.com',
    github: 'https://github.com/hsiaoeric',
  },
  {
    zh: '古珉瑄',
    en: '古珉瑄',
    detailZh: '',
    detailEn: '',
    email: 'michelleku0813@gmail.com',
    github: 'https://github.com/michelleku0813-hub',
  },
];

export function Footer() {
  const { isZh, t, lang } = useSite();
  const centers = usePublicCenters(lang);
  const latestUpdate = usePublicContentDocument('news', 'announcements', lang).value.latestUpdate;
  const goToSection = useGoToSection();

  const sections = [
    { id: 'about', label: t.navAbout },
    { id: 'organisation', label: t.navOrg },
    { id: 'news', label: t.navNews, path: ANNOUNCEMENTS_PATH },
    { id: 'honors', label: isZh ? '品質榮譽' : 'Quality Honors', path: HONORS_PATH },
    { id: 'contact', label: t.navContact },
  ];

  return (
    <footer className="footer" id="site-footer">
      <div className="shell stack gap-5">
        <div className="grid g-aside">
          <div className="stack gap-3">
            <div className="row gap-2">
              <img src={assetUrl('assets/tmuh-logo.svg')} alt="" style={{ width: 52, height: 52 }} />
              <div className="stack">
                <span style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, color: 'var(--ink)' }}>
                  {isZh ? t.footBrand : t.footBrandEn}
                </span>
                <span className="mono" style={{ fontSize: '0.63rem', letterSpacing: '.14em', color: 'var(--faint)' }}>
                  {isZh ? t.footBrandEn : t.footBrand}
                </span>
              </div>
            </div>
            <div className="stack gap-1 tiny">
              <span>{t.footAddr}</span>
              <a
                className="tlink"
                href={`tel:+886227372181`}
                style={{ alignSelf: 'flex-start' }}
              >
                <Icon name="phone" />
                {t.footTel}
              </a>
            </div>
            <div className="mono" style={{ fontSize: '0.63rem', color: 'var(--faint)', letterSpacing: '.1em' }}>
              {isZh ? '最後更新' : 'Last updated'} · {latestUpdate}
            </div>
          </div>

          <div className="grid g2" style={{ gap: 32 }}>
            <div className="stack gap-2">
              <div className="eyebrow">{isZh ? '五大中心' : 'The Five Centers'}</div>
              <div className="stack gap-1">
                {CENTER_ORDER.map((id) => {
                  const c = publicCenterById(centers, id);
                  const externalUrl = publicCenterExternalUrl(c, isZh);
                  return (
                    <CenterLink
                      key={id}
                      id={id}
                      externalUrl={externalUrl}
                      style={{ fontSize: '0.86rem', color: 'var(--body)', transition: 'color .25s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = c.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
                    >
                      {isZh ? c.zh : c.en}
                      {externalUrl && ' ↗'}
                    </CenterLink>
                  );
                })}
              </div>
            </div>
            <div className="stack gap-2">
              <div className="eyebrow">{isZh ? '網站導覽' : 'Navigate'}</div>
              <div className="stack gap-1" style={{ alignItems: 'flex-start' }}>
                {sections.map((s) =>
                  s.path ? (
                    <Link
                      key={s.id}
                      to={s.path}
                      style={{ fontSize: '0.86rem', color: 'var(--body)', transition: 'color .25s' }}
                    >
                      {s.label}
                    </Link>
                  ) : (
                    <button
                      key={s.id}
                      onClick={() => goToSection(s.id)}
                      style={{ fontSize: '0.86rem', color: 'var(--body)', transition: 'color .25s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
                    >
                      {s.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        <Reveal variant="fade">
          <div className="footer-word" aria-hidden="true">
            {isZh ? '教學部　MEDICAL EDUCATION' : 'MEDICAL EDUCATION'}
          </div>
        </Reveal>

        {/* Compact build credit, kept just above the closing bar. */}
        <div
          className="row between wrap gap-3"
          style={{ paddingTop: 22, borderTop: '1px solid var(--line-soft)' }}
        >
          <span className="eyebrow">{isZh ? '網站設計' : 'Site by'}</span>
          <div className="row gap-3 wrap" style={{ justifyContent: 'flex-end' }}>
            {DESIGN_TEAM.map((m) => (
              <span key={m.email} className="row gap-1 wrap tiny">
                <span style={{ color: 'var(--ink)' }}>{isZh ? m.zh : m.en}</span>
                {(isZh ? m.detailZh : m.detailEn) && (
                  <span style={{ color: 'var(--faint)' }}>{isZh ? m.detailZh : m.detailEn}</span>
                )}
                <a className="tlink" href={`mailto:${m.email}`}>
                  {m.email}
                </a>
                <a className="tlink" href={m.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                  <Icon name="arrowUpRight" />
                </a>
              </span>
            ))}
          </div>
        </div>

        <div className="row between wrap gap-2" style={{ paddingTop: 22, borderTop: '1px solid var(--line-soft)' }}>
          <span className="tiny">{t.footNote}</span>
          <button className="tlink" onClick={() => goToSection('top')}>
            {isZh ? '回到頂端' : 'Back to top'}
            <Icon name="arrowUpRight" />
          </button>
        </div>
      </div>
    </footer>
  );
}
