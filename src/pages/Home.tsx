import { useSite, usePageTitle } from '@/app/site';
import { useConsumePendingSection } from '@/app/navigation';
import { CENTERS } from '@/data/centers';
import { Marquee } from '@/ui/Marquee';
import { Hero } from './home/Hero';
import { About } from './home/About';
import { Organisation } from './home/Organisation';
import { Centers } from './home/Centers';
import { Glance } from './home/Glance';
import { News } from './home/News';
import { Honors } from './home/Honors';
import { Contact } from './home/Contact';

export function Home() {
  const { isZh } = useSite();
  usePageTitle(isZh ? '教學部' : 'Dept. of Medical Education');
  useConsumePendingSection();

  const ticker = CENTERS.map((c) => (isZh ? c.zh : c.en));

  return (
    <>
      <Hero />
      <Marquee items={ticker} />
      <About />
      <Organisation />
      <Centers />
      <Glance />
      <News />
      <Honors />
      <Contact />
    </>
  );
}
