import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { useGoToSection } from '@/app/navigation';
import { CENTER_ORDER, centerPath } from '@/app/routes';
import { centerById } from '@/data/centers';
import { latestUpdate } from '@/data/news';
import { MAIN_PHONE } from '@/utils/phone';
import { Reveal } from '@/motion/Reveal';
import { assetUrl } from '@/utils/asset';
import { Icon } from './Icon';

export function Footer() {
  const { isZh, t, lang } = useSite();
  const goToSection = useGoToSection();

  const sections = [
    { id: 'about', label: isZh ? '關於教學部' : 'About' },
    { id: 'organisation', label: isZh ? '組織架構' : 'Structure' },
    { id: 'news', label: isZh ? '最新公告' : 'News' },
    { id: 'honors', label: isZh ? '品質榮譽' : 'Quality Honors' },
    { id: 'contact', label: isZh ? '聯絡我們' : 'Contact' },
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
              <span>{isZh ? t.footAddr : 'No. 252 Wuxing St., Xinyi Dist., Taipei 110301, Taiwan'}</span>
              <a
                className="tlink"
                href={`tel:+886227372181`}
                style={{ alignSelf: 'flex-start' }}
              >
                <Icon name="phone" />
                {MAIN_PHONE}
              </a>
            </div>
            <div className="mono" style={{ fontSize: '0.63rem', color: 'var(--faint)', letterSpacing: '.1em' }}>
              {isZh ? '最後更新' : 'Last updated'} · {latestUpdate(lang)}
            </div>
          </div>

          <div className="grid g2" style={{ gap: 32 }}>
            <div className="stack gap-2">
              <div className="eyebrow">{isZh ? '五大中心' : 'The Five Centers'}</div>
              <div className="stack gap-1">
                {CENTER_ORDER.map((id) => {
                  const c = centerById(id)!;
                  return (
                    <Link
                      key={id}
                      to={centerPath(id)}
                      style={{ fontSize: '0.86rem', color: 'var(--body)', transition: 'color .25s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = c.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
                    >
                      {isZh ? c.zh : c.en}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="stack gap-2">
              <div className="eyebrow">{isZh ? '網站導覽' : 'Navigate'}</div>
              <div className="stack gap-1" style={{ alignItems: 'flex-start' }}>
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => goToSection(s.id)}
                    style={{ fontSize: '0.86rem', color: 'var(--body)', transition: 'color .25s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Reveal variant="fade">
          <div className="footer-word" aria-hidden="true">
            {isZh ? '教學部　MEDICAL EDUCATION' : 'MEDICAL EDUCATION'}
          </div>
        </Reveal>

        <div className="row between wrap gap-2" style={{ paddingTop: 22, borderTop: '1px solid var(--line-soft)' }}>
          <span className="tiny">{isZh ? t.footNote : '© Dept. of Medical Education, TMU Hospital · For departmental presentation only.'}</span>
          <button className="tlink" onClick={() => goToSection('top')}>
            {isZh ? '回到頂端' : 'Back to top'}
            <Icon name="arrowUpRight" />
          </button>
        </div>
      </div>
    </footer>
  );
}
