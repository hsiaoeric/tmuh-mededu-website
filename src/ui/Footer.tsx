import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { publicCenterById, publicCenterExternalUrl, usePublicCenters } from '@/app/publicCenters';
import { useSite } from '@/app/site';
import { useGoToSection } from '@/app/navigation';
import {
  ANNOUNCEMENTS_PATH,
  CENTER_ORDER,
  DEPARTMENT_PATH,
  DIGITAL_MATERIALS_PATH,
  EPORTFOLIO_URL,
  GALLERY_PATH,
  HONORS_PATH,
  RESOURCES_PATH,
  TRAINEES_PATH,
  VIDEOS_PATH,
  programPath,
} from '@/app/routes';
import { usePublicContentDocument } from '@/content';
import { Reveal } from '@/motion/Reveal';
import { assetUrl } from '@/utils/asset';
import { ARCHIVE_PARAMS } from './content/archiveParams';
import { fallbackLangProps } from './content/Localized';
import { CenterLink } from './CenterLink';
import { useNavCopy } from './navCopy';
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

function FooterColumn({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  const labelId = useId();
  return (
    <nav className="footer-col" aria-labelledby={labelId}>
      <div id={labelId} className="eyebrow">{label}</div>
      <div className="footer-col-links">{children}</div>
    </nav>
  );
}

export function Footer() {
  const { isZh, t, lang } = useSite();
  const copy = useNavCopy();
  const centers = usePublicCenters(lang);
  const latestUpdate = usePublicContentDocument('news', 'announcements', lang).value.latestUpdate;
  const programs = usePublicContentDocument('department_info', 'directory', lang).value.programs;
  const newsCategories = usePublicContentDocument('posts', 'archive', lang).value.categories
    .filter((category) => category.channel === 'news');
  const goToSection = useGoToSection();

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

          <div className="grid auto-fit footer-cols">
            <FooterColumn label={isZh ? '網站導覽' : 'Navigate'}>
              <Link className="footer-link" to={DEPARTMENT_PATH}>{copy.department}</Link>
              <button type="button" className="footer-link" onClick={() => goToSection('about')}>{t.navAbout}</button>
              <button type="button" className="footer-link" onClick={() => goToSection('organisation')}>{t.navOrg}</button>
              <Link className="footer-link" to={HONORS_PATH}>{copy.honors}</Link>
              <button type="button" className="footer-link" onClick={() => goToSection('contact')}>{t.navContact}</button>
            </FooterColumn>

            <FooterColumn label={copy.fiveCenters}>
              {CENTER_ORDER.map((id) => {
                const c = publicCenterById(centers, id);
                const externalUrl = publicCenterExternalUrl(c, isZh);
                return (
                  <CenterLink
                    key={id}
                    id={id}
                    externalUrl={externalUrl}
                    className="footer-link"
                    style={{ ['--tone' as string]: c.color }}
                  >
                    {isZh ? c.zh : c.en}
                    {externalUrl && ' ↗'}
                  </CenterLink>
                );
              })}
              <Link className="footer-link" to={DIGITAL_MATERIALS_PATH}>{copy.digitalMaterials}</Link>
            </FooterColumn>

            <FooterColumn label={t.navNews}>
              <Link className="footer-link" to={ANNOUNCEMENTS_PATH}>{copy.allAnnouncements}</Link>
              {newsCategories.map((category) => (
                <Link
                  key={category.id}
                  className="footer-link"
                  to={`${ANNOUNCEMENTS_PATH}?${ARCHIVE_PARAMS.category}=${encodeURIComponent(category.id)}`}
                  {...fallbackLangProps(category.label)}
                >
                  {category.label.text}
                </Link>
              ))}
            </FooterColumn>

            <FooterColumn label={copy.trainees}>
              <Link className="footer-link" to={TRAINEES_PATH}>{copy.traineesHub}</Link>
              {programs.map((program) => (
                <Link
                  key={program.id}
                  className="footer-link"
                  to={programPath(program.id)}
                  {...fallbackLangProps(program.title)}
                >
                  {program.title.text}
                </Link>
              ))}
            </FooterColumn>

            <FooterColumn label={copy.resources}>
              <Link className="footer-link" to={`${RESOURCES_PATH}#links`}>{copy.relatedLinks}</Link>
              <Link className="footer-link" to={`${RESOURCES_PATH}#downloads`}>{copy.downloads}</Link>
              <Link className="footer-link" to={GALLERY_PATH}>{copy.gallery}</Link>
              <Link className="footer-link" to={VIDEOS_PATH}>{copy.videos}</Link>
            </FooterColumn>

            <FooterColumn label={copy.externalSystems}>
              <a
                className="footer-link"
                href={EPORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${copy.eportfolio} ${copy.opensInNewTab}`}
              >
                {copy.eportfolio} ↗
              </a>
            </FooterColumn>
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
