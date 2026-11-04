import type { LegacyDocument } from 'jsdom';
import { elements } from './parsePage';
import { isBlank, singleLine } from './text';

export type LinkSighting = { readonly label: string; readonly description?: string; readonly href: string };

/** The link list on `other/links/L00x` pages: an anchor per item with an optional note below it. */
export function readLinkList(document: LegacyDocument): LinkSighting[] {
  return elements(document.querySelectorAll('.details-list > li')).flatMap((item) => {
    const anchor = item.querySelector('a[href]');
    if (anchor === null) return [];
    const label = singleLine(anchor.textContent);
    const note = singleLine(item.querySelector('div')?.textContent);
    const href = anchor.getAttribute('href') ?? '';
    if (label.length === 0) return [];
    return [{ label, href, ...(note.length > 0 && !isBlank(note) ? { description: note } : {}) }];
  });
}

/** The footer's 相關連結 column (library, TMS, E-Portfolio), present on every page. */
export function readFooterSystemLinks(document: LegacyDocument): LinkSighting[] {
  const widget = elements(document.querySelectorAll('footer .footer-widget-nav'))
    .find((element) => singleLine(element.querySelector('.footer-widget__title')?.textContent) === '相關連結');
  if (widget === undefined) return [];
  return elements(widget.querySelectorAll('a[href]')).map((anchor) => ({ label: singleLine(anchor.textContent), href: anchor.getAttribute('href') ?? '' }))
    .filter((link) => link.label.length > 0);
}

export type DownloadSighting = { readonly label: string; readonly description?: string; readonly href: string };

/** The file list on `other/download/DWN0x|REC0x` pages. */
export function readDownloadList(document: LegacyDocument): DownloadSighting[] {
  return elements(document.querySelectorAll('.list-group a.list-group-item[href]')).flatMap((anchor) => {
    const label = singleLine(anchor.querySelector('strong')?.textContent);
    const note = singleLine(anchor.querySelector('p')?.textContent);
    if (label.length === 0) return [];
    return [{ label, href: anchor.getAttribute('href') ?? '', ...(note.length > 0 && !isBlank(note) ? { description: note } : {}) }];
  });
}
