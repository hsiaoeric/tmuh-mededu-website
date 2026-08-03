import { useEffect, useMemo, useRef, useState } from 'react';
import { useSite } from '@/app/site';
import { scrollToId } from '@/motion/smoothScroll';
import { Icon } from './Icon';

export interface PageSection {
  /** id of the `<section>` this entry scrolls to. */
  id: string;
  label: string;
  /**
   * Sub-entries shown in a dropdown. The parent is a heading for a run of
   * consecutive sections and is not itself a scroll target.
   */
  children?: PageSection[];
}

/** The ids a top-level entry lights up for. */
const own = (s: PageSection): string[] =>
  s.children?.length ? s.children.map((c) => c.id) : [s.id];

/** Every section in page order, groups flattened into their children. */
const flatten = (sections: PageSection[]): PageSection[] =>
  sections.flatMap((s) => (s.children?.length ? s.children : [s]));

/**
 * Wayfinding for the long center pages.
 *
 * Wide screens get a numbered rail in the left gutter, where entries with
 * `children` collapse a run of sections under one label and reveal them in a
 * dropdown — so a page with a dozen sections still reads as a short list.
 *
 * Below 1200px there is no gutter, so it becomes a sticky chip strip under the
 * nav. That strip scrolls horizontally and therefore cannot host a dropdown,
 * so it lists every section flat instead; the groups are a wide-screen
 * affordance only.
 *
 * Scroll-spy is a plain rAF-throttled scroll listener rather than a
 * ScrollTrigger, so it keeps working under reduced motion (where the motion
 * layer creates no triggers at all).
 */
export function SectionRail({ sections, tone }: { sections: PageSection[]; tone: string }) {
  const { isZh } = useSite();
  const flat = useMemo(() => flatten(sections), [sections]);
  const [active, setActive] = useState(flat[0]?.id ?? '');
  const [past, setPast] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const closeTimer = useRef<number>();

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      // A section counts as current once its top crosses a third of the way
      // down the viewport — the last one past that line wins.
      const line = window.innerHeight * 0.34;
      let current = flat[0]?.id ?? '';
      for (const s of flat) {
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
  }, [flat]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Same open/close delay as the nav's menus, so crossing the gap between a
  // label and its panel does not snap it shut.
  const schedule = (id: string, next: boolean) => {
    window.clearTimeout(closeTimer.current);
    if (next) setOpen(id);
    else closeTimer.current = window.setTimeout(() => setOpen(null), 140);
  };

  const go = (id: string) => {
    setOpen(null);
    scrollToId(id);
  };

  const label = isZh ? '本頁章節' : 'Sections on this page';

  return (
    <>
      <nav
        className="sec-rail"
        data-past={past}
        style={{ ['--tone' as string]: tone }}
        aria-label={label}
      >
        {sections.map((s, i) => {
          const on = own(s).includes(active);
          const num = <span className="sec-rail-num mono">{String(i + 1).padStart(2, '0')}</span>;

          if (!s.children?.length) {
            return (
              <button
                key={s.id}
                type="button"
                className="sec-rail-item"
                data-on={on}
                aria-current={on ? 'true' : undefined}
                onClick={() => go(s.id)}
              >
                {num}
                <span className="sec-rail-label">{s.label}</span>
              </button>
            );
          }

          return (
            <div
              key={s.id}
              className="sec-rail-group"
              onMouseEnter={() => schedule(s.id, true)}
              onMouseLeave={() => schedule(s.id, false)}
            >
              <button
                type="button"
                className="sec-rail-item"
                data-on={on}
                aria-expanded={open === s.id}
                aria-haspopup="true"
                onClick={() => setOpen((o) => (o === s.id ? null : s.id))}
              >
                {num}
                <span className="sec-rail-label">
                  {s.label}
                  <Icon name="arrowDown" size={10} />
                </span>
              </button>

              <div
                className="sec-rail-menu"
                data-open={open === s.id}
                onFocus={() => schedule(s.id, true)}
                onBlur={() => schedule(s.id, false)}
              >
                {s.children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="sec-rail-sub"
                    data-on={c.id === active}
                    aria-current={c.id === active ? 'true' : undefined}
                    onClick={() => go(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <nav className="sec-strip" style={{ ['--tone' as string]: tone }} aria-label={label}>
        {flat.map((s) => (
          <button
            key={s.id}
            type="button"
            className="sec-strip-item"
            data-on={s.id === active}
            aria-current={s.id === active ? 'true' : undefined}
            onClick={() => go(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </>
  );
}
