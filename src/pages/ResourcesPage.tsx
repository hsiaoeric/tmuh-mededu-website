import { useMemo } from 'react';
import { EPORTFOLIO_URL } from '@/app/routes';
import { useSite, usePageTitle } from '@/app/site';
import { useHashScroll } from '@/app/hashScroll';
import { isProgramId } from '@/content/contracts/archiveIds';
import { Section } from '@/ui/Section';
import { useArchivePageCopy } from './archive/copy';
import { useDepartmentInfo, type ArchiveLinkGroup } from './archive/data';
import { ArchiveSectionHead, DownloadList, EmptyNote, LinkGroupList, PageIntro } from './archive/parts';

function sameUrl(left: string, right: string): boolean {
  const normalize = (value: string) => value.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
  return normalize(left) === normalize(right);
}

/**
 * The E-Portfolio entry the old site's menu carried. Built here so the systems section always
 * offers it, unless the CMS already lists the same address.
 */
function useSystemGroups(groups: readonly ArchiveLinkGroup[]): ArchiveLinkGroup[] {
  const { lang } = useSite();
  const copy = useArchivePageCopy();
  return useMemo(() => {
    const listed = groups.some((group) => group.links.some((link) => sameUrl(link.href, EPORTFOLIO_URL)));
    if (listed) return [...groups];
    const pick = (text: string) => ({ text, lang, fallback: false });
    const eportfolio: ArchiveLinkGroup = {
      id: 'eportfolio',
      owner: 'department',
      purpose: 'systems',
      order: -1,
      title: pick(copy.eportfolioGroup),
      links: [{
        id: 'eportfolio',
        label: pick(copy.eportfolioLabel),
        description: pick(copy.eportfolioDesc),
        href: EPORTFOLIO_URL,
        kind: 'http',
      }],
    };
    return [eportfolio, ...groups];
  }, [copy.eportfolioDesc, copy.eportfolioGroup, copy.eportfolioLabel, groups, lang]);
}

/**
 * 相關資源: related links (`#links`), downloads (`#downloads`), and the teaching systems
 * (`#systems`), including E-Portfolio. Program-owned links and files live on their program pages.
 */
export function ResourcesPage() {
  const copy = useArchivePageCopy();
  const info = useDepartmentInfo();
  const shared = useMemo(
    () => info.linkGroups.filter((group) => !isProgramId(group.owner) && group.links.length > 0),
    [info.linkGroups],
  );
  const related = shared.filter((group) => group.purpose !== 'systems');
  const systems = useSystemGroups(shared.filter((group) => group.purpose === 'systems'));
  const downloads = info.downloads.filter((group) => !isProgramId(group.owner) && group.items.length > 0);

  usePageTitle(copy.resourcesTitle);
  useHashScroll();

  return (
    <>
      <PageIntro eyebrow="Resources" title={copy.resourcesTitle} lede={copy.resourcesLede} />

      <Section id="links" tight>
        <ArchiveSectionHead eyebrow="Links" title={copy.relatedLinksTitle} />
        {related.length === 0 ? <EmptyNote>{copy.resourcesEmpty}</EmptyNote> : <LinkGroupList groups={related} />}
      </Section>

      <Section id="downloads" tight>
        <ArchiveSectionHead eyebrow="Downloads" title={copy.resourceDownloadsTitle} />
        {downloads.length === 0 ? <EmptyNote>{copy.resourcesEmpty}</EmptyNote> : <DownloadList groups={downloads} />}
      </Section>

      <Section id="systems" tight>
        <ArchiveSectionHead eyebrow="Systems" title={copy.systemsTitle} />
        <LinkGroupList groups={systems} />
      </Section>
    </>
  );
}
