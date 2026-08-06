import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { CENTER_ORDER, centerPath } from '@/app/routes';
import { centerById } from '@/data/centers';
import { gsap, prefersReducedMotion } from '@/motion/gsap';
import { SplitLines } from '@/motion/SplitLines';
import { Reveal } from '@/motion/Reveal';
import { scrollToId } from '@/motion/smoothScroll';
import { Icon } from '@/ui/Icon';

export function Hero() {
  const { isZh, t } = useSite();
  const rootRef = useRef<HTMLDivElement>(null);

  // Scrub the hero out as the page leaves it: the type lifts and dissolves so
  // the tissue field is briefly alone before the first section arrives.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.to('.hero-inner', {
        y: -110,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom 40%',
          scrub: 0.6,
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <header
      id="top"
      ref={rootRef}
      style={{
        position: 'relative',
        minHeight: 'min(100svh, 1000px)',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 'calc(var(--nav-h) + 40px)',
        paddingBottom: 'clamp(60px, 10vh, 120px)',
      }}
    >
      <div className="shell hero-inner" style={{ width: '100%' }}>
        <div className="stack gap-4">
          <Reveal variant="fade">
            <div className="row gap-2 wrap">
              <span className="eyebrow">{t.heroEyebrow}</span>
              <span style={{ width: 46, height: 1, background: 'var(--line)' }} />
              <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--faint)', letterSpacing: '.16em' }}>
                AY114
              </span>
            </div>
          </Reveal>

          <h1 className="display d1 hero-measure">
            <SplitLines as="span" immediate delay={180} style={{ display: 'block' }}>
              {t.heroTitle1}
            </SplitLines>
            <SplitLines
              as="span"
              immediate
              delay={320}
              style={{ display: 'block', color: 'var(--accent)' }}
            >
              {t.heroTitle2}
            </SplitLines>
          </h1>

          <div className="grid g-editorial" style={{ alignItems: 'end', marginTop: 10 }}>
            <Reveal variant="up" delay={620}>
              <p className="lede measure">{t.heroTag}</p>
            </Reveal>

            <Reveal variant="up" delay={720}>
              <div className="row gap-2 wrap">
                <button className="btn btn-solid" onClick={() => scrollToId('organisation')}>
                  {t.ctaOrg}
                  <Icon name="arrowDown" />
                </button>
              </div>
            </Reveal>
          </div>

          <Reveal variant="fade" delay={880}>
            <div
              className="row wrap"
              style={{
                gap: '10px 26px',
                marginTop: 'clamp(24px, 5vh, 56px)',
                paddingTop: 22,
                borderTop: '1px solid var(--line-soft)',
              }}
            >
              <span className="mono" style={{ fontSize: '0.62rem', letterSpacing: '.18em', color: 'var(--faint)' }}>
                {isZh ? '五大中心' : 'FIVE CENTERS'}
              </span>
              {CENTER_ORDER.map((id) => {
                const c = centerById(id)!;
                return (
                  <Link
                    key={id}
                    to={centerPath(id)}
                    className="row gap-1"
                    data-cursor={isZh ? '前往' : 'Enter'}
                    style={{ fontSize: '0.82rem', color: 'var(--muted)', transition: 'color .3s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = c.color)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
                  >
                    <span className="dot" style={{ ['--tone' as string]: c.color, width: 5, height: 5 }} />
                    {isZh ? c.zh : c.en}
                  </Link>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </header>
  );
}
