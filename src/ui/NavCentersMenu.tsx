import { Link, useLocation } from 'react-router-dom';
import { publicCenterById, publicCenterExternalUrl, type PublicCenter } from '@/app/publicCenters';
import { CENTER_ORDER, DIGITAL_MATERIALS_PATH, centerPath } from '@/app/routes';
import { useSite } from '@/app/site';
import { CenterLink } from './CenterLink';
import { NavMenu, NavMenuItemBody } from './NavMenu';
import { useNavCopy } from './navCopy';
import { currentProps, isWithin } from './navActive';

interface NavCentersMenuProps {
  readonly centers: readonly PublicCenter[];
  readonly onNavigate: () => void;
}

/** 中心 ▾ — the five centers in site order, then the digital materials room. */
export function NavCentersMenu({ centers, onNavigate }: NavCentersMenuProps) {
  const { isZh } = useSite();
  const copy = useNavCopy();
  const { pathname } = useLocation();
  const active = isWithin(pathname, '/centers') || isWithin(pathname, DIGITAL_MATERIALS_PATH);

  return (
    <NavMenu label={copy.centers} active={active} panelClassName="nav-menu-panel-centers" onNavigate={onNavigate}>
      {CENTER_ORDER.map((id) => {
        const center = publicCenterById(centers, id);
        const externalUrl = publicCenterExternalUrl(center, isZh);
        return (
          <CenterLink
            key={id}
            id={id}
            externalUrl={externalUrl}
            className="nav-menu-item"
            {...(externalUrl === undefined ? currentProps(pathname, centerPath(id)) : {})}
          >
            <NavMenuItemBody
              title={isZh ? center.zh : center.en}
              sub={isZh ? center.en : center.zh}
              tone={center.color}
              external={externalUrl !== undefined}
            />
          </CenterLink>
        );
      })}
      <Link
        to={DIGITAL_MATERIALS_PATH}
        className="nav-menu-item nav-menu-item-divided"
        {...currentProps(pathname, DIGITAL_MATERIALS_PATH)}
      >
        <NavMenuItemBody title={copy.digitalMaterials} sub={copy.digitalMaterialsAlt} tone="var(--accent)" />
      </Link>
    </NavMenu>
  );
}
