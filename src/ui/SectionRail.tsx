import { useEffect, useState } from 'react';
import { useSite } from '@/app/site';
import { scrollToId } from '@/motion/smoothScroll';

export interface PageSection {
  /** id of the `<section>` this entry scrolls to. */
  id: string;
  label: string;
}

/**
 * Wayfinding for the long center pages: a numbered rail pinned to the left
 * gutter on wide screens, and a sticky strip of chips under the nav below
 * 1280px, where there is no gutter to put it in.
 *
 * Scroll-spy is a plain rAF-throttled scroll listener rather than a
 * ScrollTrigger, so it keeps working under reduced motion (where the motion
 * layer creates no triggers at all).
 */
export function SectionRail({ sections, tone }: { sections: PageSection[]; tone: string }) {
  const { isZh } = useSite();
  const [active, setActive] = useState(sections[0]?.id ?? '');
  const [past, setPast] = useState(false);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      // A section counts as current once its top crosses a third of the way
      // down the viewport — the last one past that line wins.
      const line = window.innerHeight * 0.34;
      let current = sections[0]?.id ?? '';
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActive(current);
      // On wide screens the rail stays hidden until the hero is behind you.
      setPast(window.scrollY > window.innerHeight * 0.6);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sections]);

  return (
    <nav
      className="sec-rail"
      data-past={past}
      style={{ ['--tone' as string]: tone }}
      aria-label={isZh ? '本頁章節' : 'Sections on this page'}
    >
      {sections.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className="sec-rail-item"
          data-on={s.id === active}
          aria-current={s.id === active ? 'true' : undefined}
          onClick={() => scrollToId(s.id)}
        >
          <span className="sec-rail-num mono">{String(i + 1).padStart(2, '0')}</span>
          <span className="sec-rail-label">{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
