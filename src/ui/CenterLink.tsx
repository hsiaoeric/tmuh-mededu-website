import type { ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { centerPath } from '@/app/routes';
import { centerExternalUrl } from '@/data/centers';
import type { CenterId } from '@/data/types';

interface CenterLinkProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
  id: Exclude<CenterId, 'admin'>;
}

/**
 * A center's entry in any listing. Centers whose site is maintained outside
 * this app (`externalUrl`) open it in a new tab, in the language currently
 * being read; the rest route to their in-app page. Centralised so no list has
 * to repeat the check.
 */
export function CenterLink({ id, children, ...rest }: CenterLinkProps) {
  const { isZh } = useSite();
  const externalUrl = centerExternalUrl(id, isZh);

  if (externalUrl) {
    return (
      <a href={externalUrl} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link to={centerPath(id)} {...rest}>
      {children}
    </Link>
  );
}
