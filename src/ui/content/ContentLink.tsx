import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { classifyLinkHref, type LinkHrefKind } from '@/content/contracts/blocks';
import { Icon } from '@/ui/Icon';
import { useContentCopy } from './copy';

export type ContentLinkKind = LinkHrefKind | 'file';

interface ContentLinkProps {
  readonly href: string;
  /**
   * How the target was classified. Omit it to classify `href` here. Pass `'file'` for a committed
   * download that `resolveFileHref` already resolved against the deployed base: it must not go
   * through the router, which would prefix the base a second time.
   */
  readonly kind?: ContentLinkKind;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * One anchor, chosen by target: a site path becomes a router `<Link>` so the Pages basename
 * applies; `mailto:`/`tel:` and committed files are plain anchors; http(s) opens in a new tab with
 * an announced hint. Anything else, such as a `javascript:` URL, renders as plain text.
 */
export function ContentLink({ href, kind, className, children }: ContentLinkProps) {
  const copy = useContentCopy();
  // The target is always re-classified, so a mislabelled `kind` can never smuggle an unsafe URL
  // into an anchor; `kind` only decides whether a safe same-site path skips the router.
  const classified = classifyLinkHref(href);
  const resolved = classified !== null && kind === 'file' ? 'file' : classified;

  switch (resolved) {
    case 'internal':
      return <Link className={className} to={href}>{children}</Link>;
    case 'mailto':
    case 'tel':
    case 'file':
      return <a className={className} href={href}>{children}</a>;
    case 'https':
    case 'http':
      return (
        <a className={className} href={href} target="_blank" rel="noreferrer noopener">
          {children}
          <span className="sr-only"> {copy.opensInNewTab}</span>
          <Icon name="arrowUpRight" size="0.8em" className="content-link-external" />
        </a>
      );
    default:
      return <span className={className}>{children}</span>;
  }
}
