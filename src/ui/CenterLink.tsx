import type { ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router-dom';
import { centerPath } from '@/app/routes';
import { centerById } from '@/data/centers';
import type { CenterId } from '@/data/types';

interface CenterLinkProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
  id: Exclude<CenterId, 'admin'>;
}

/**
 * A center's entry in any listing. Centers whose site is maintained outside
 * this app (`externalUrl`) open it in a new tab; the rest route to their
 * in-app page. Centralised so no list has to repeat the check.
 */
export function CenterLink({ id, children, ...rest }: CenterLinkProps) {
  const externalUrl = centerById(id)?.externalUrl;

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
