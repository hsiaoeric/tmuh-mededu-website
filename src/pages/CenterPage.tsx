import { Navigate, useParams } from 'react-router-dom';
import { SLUG_TO_CENTER } from '@/app/routes';
import { HolisticPage } from './centers/HolisticPage';
import { EbmPage } from './centers/EbmPage';
import { FacdevPage } from './centers/FacdevPage';
import { GenericCenterPage } from './centers/GenericCenterPage';

/** One route serves all five centers; three of them have a bespoke page. */
export function CenterPage() {
  const { slug } = useParams();
  const id = slug ? SLUG_TO_CENTER[slug] : undefined;

  if (!id) return <Navigate to="/" replace />;
  if (id === 'holistic') return <HolisticPage />;
  if (id === 'ebm') return <EbmPage />;
  if (id === 'faculty_dev') return <FacdevPage />;
  return <GenericCenterPage id={id} />;
}
