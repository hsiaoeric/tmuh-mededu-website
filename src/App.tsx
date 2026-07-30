import { useRef } from 'react';
import { useSite } from '@/context/SiteContext';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Header } from '@/components/layout/Header';
import { Hud } from '@/components/layout/Hud';
import { BackgroundFX } from '@/components/layout/BackgroundFX';
import { ZStack } from '@/zdepth/ZStack';
import { DeptView } from '@/views/DeptView';
import { HolisticView } from '@/views/HolisticView';
import { EbmView } from '@/views/EbmView';
import { FacdevView } from '@/views/FacdevView';
import { BuildingView } from '@/views/BuildingView';

export function App() {
  const { view, theme, lang } = useSite();
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollReveal(rootRef, [view, theme, lang]);

  return (
    <div ref={rootRef} className="app-root" data-theme={theme}>
      <BackgroundFX />
      <Header />
      {/* Every view is a stack of pinned cards. A view swap replaces all of them,
          which is what re-measures the scroll track, so `view` must be in the
          deps; language and theme are there because both reflow content. */}
      <ZStack deps={[view, lang, theme]}>
        {view === 'dept' && <DeptView />}
        {view === 'holistic' && <HolisticView />}
        {view === 'ebm' && <EbmView />}
        {view === 'facdev' && <FacdevView />}
        {view === 'building' && <BuildingView />}
      </ZStack>
      {/* The HUD stands in for the old page footer: in a stack of fixed cards
          there is no end of the document to anchor one to. The footer's address
          and credits move into each view's closing card. */}
      <Hud />
    </div>
  );
}
