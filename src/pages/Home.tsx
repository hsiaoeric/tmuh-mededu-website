import { useSite, usePageTitle } from '@/app/site';
import { useConsumePendingSection } from '@/app/navigation';
import { publicCenterById, usePublicCenters } from '@/app/publicCenters';
import { CENTER_ORDER } from '@/app/routes';
import { Marquee } from '@/ui/Marquee';
import { Hero } from './home/Hero';
import { About } from './home/About';
import { Organisation } from './home/Organisation';
import { Glance } from './home/Glance';
import { News } from './home/News';
import { Honors } from './home/Honors';
import { Contact } from './home/Contact';

const TICKER_CENTER_ORDER = [...CENTER_ORDER, 'admin'] as const;

export function Home() {
  const { isZh, lang } = useSite();
  const centers = usePublicCenters(lang);
  usePageTitle(isZh ? '教學部' : 'Dept. of Medical Education');
  useConsumePendingSection();

  const ticker = TICKER_CENTER_ORDER.map((id) => {
    const center = publicCenterById(centers, id);
    return isZh ? center.zh : center.en;
  });

  return (
    <>
      <Hero />
      <Marquee items={ticker} />
      <About />
      <Organisation centers={centers} />
      <News />
      <Glance />
      <Honors />
      <Contact />
    </>
  );
}
