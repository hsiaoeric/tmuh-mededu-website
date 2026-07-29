import { useSite } from '@/context/SiteContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DeptView } from '@/views/DeptView';
import { HolisticView } from '@/views/HolisticView';
import { EbmView } from '@/views/EbmView';
import { FacdevView } from '@/views/FacdevView';
import { BuildingView } from '@/views/BuildingView';

export function App() {
  const { view, theme } = useSite();

  return (
    <div className="app-root" data-theme={theme}>
      <Header />
      {view === 'dept' && <DeptView />}
      {view === 'holistic' && <HolisticView />}
      {view === 'ebm' && <EbmView />}
      {view === 'facdev' && <FacdevView />}
      {view === 'building' && <BuildingView />}
      <Footer />
    </div>
  );
}
