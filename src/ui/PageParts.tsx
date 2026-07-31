import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { Reveal } from '@/motion/Reveal';
import { SplitLines } from '@/motion/SplitLines';
import { Parallax } from '@/motion/Parallax';
import { scrollToId } from '@/motion/smoothScroll';
import { Icon, type IconName } from './Icon';

/** Hero used by every center page. */
export function PageHero({
  eyebrow,
  title,
  tag,
  tone,
  icon,
  scrollTo,
  meta,
}: {
  eyebrow: string;
  title: string;
  tag: string;
  tone: string;
  icon: IconName;
  scrollTo: string;
  meta?: ReactNode;
}) {
  const { isZh } = useSite();

  return (
    <header
      id="top"
      style={{
        position: 'relative',
        minHeight: 'min(94vh, 900px)',
        display: 'flex',
        alignItems: 'flex-end',
        paddingTop: 'calc(var(--nav-h) + 60px)',
        paddingBottom: 'clamp(48px, 8vh, 96px)',
        ['--tone' as string]: tone,
      }}
    >
      <div className="shell stack gap-4" style={{ width: '100%' }}>
        <Reveal variant="fade">
          <Link className="tlink" to="/" style={{ color: 'var(--muted)' }}>
            <Icon name="arrow" style={{ transform: 'rotate(180deg)' }} />
            {isZh ? '返回教學部' : 'Back to the department'}
          </Link>
        </Reveal>

        <Reveal variant="left" delay={80}>
          <div className="row gap-2">
            <span
              style={{
                display: 'inline-flex',
                width: 46,
                height: 46,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                color: tone,
                border: `1px solid color-mix(in srgb, ${tone} 40%, transparent)`,
                background: `color-mix(in srgb, ${tone} 10%, transparent)`,
              }}
            >
              <Icon name={icon} size={20} />
            </span>
            <span className="eyebrow" style={{ color: tone }}>
              {eyebrow}
            </span>
          </div>
        </Reveal>

        {/* Center headlines are full sentences rather than the two-word home
            hero, so they sit one step down the scale. */}
        <SplitLines
          as="h1"
          className="display d2 title-measure"
          immediate
          delay={220}
        >
          {title}
        </SplitLines>

        <div className="grid g-editorial" style={{ alignItems: 'end' }}>
          <Reveal variant="up" delay={520}>
            <p className="lede measure">{tag}</p>
          </Reveal>
          {meta && (
            <Reveal variant="up" delay={620}>
              {meta}
            </Reveal>
          )}
        </div>

        <Reveal variant="fade" delay={760}>
          <button
            className="tlink"
            onClick={() => scrollToId(scrollTo)}
            style={{ color: tone, alignSelf: 'flex-start' }}
          >
            <Icon name="arrowDown" />
            {isZh ? '往下探索' : 'Explore'}
          </button>
        </Reveal>
      </div>

      <Parallax
        distance={70}
        style={{
          position: 'absolute',
          right: 'var(--edge)',
          top: '22%',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <div
          style={{
            width: 'clamp(180px, 26vw, 380px)',
            aspectRatio: '1',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${tone} 26%, transparent), transparent 66%)`,
            filter: 'blur(6px)',
          }}
        />
      </Parallax>
    </header>
  );
}

/** Closing statement + contact details shared by the center pages. */
export function ClosingContact({
  title,
  body,
  person,
  ext,
  place,
  quote,
  tone,
}: {
  title: string;
  body: string;
  person: string;
  ext: string;
  place: string;
  quote: string;
  tone: string;
}) {
  const { isZh } = useSite();
  return (
    <section
      id="contact"
      className="section"
      style={{ ['--tone' as string]: tone }}
    >
      <div className="shell">
        <div className="panel grid g-editorial" style={{ alignItems: 'start' }}>
          <div className="stack gap-3">
            <span className="eyebrow" style={{ color: tone }}>
              {isZh ? '結語' : 'In closing'}
            </span>
            <SplitLines as="h2" className="display d3">
              {title}
            </SplitLines>
            <Reveal variant="up">
              <p className="prose measure">{body}</p>
            </Reveal>
          </div>

          <div className="stack gap-3">
            <Reveal variant="up" delay={80}>
              <blockquote className="quote" style={{ maxWidth: '26ch' }}>
                <Icon name="quote" size={22} style={{ color: tone, marginBottom: 12 }} />
                {quote}
              </blockquote>
            </Reveal>
            <Reveal variant="up" delay={160}>
              <div className="stack gap-1" style={{ paddingTop: 20, borderTop: '1px solid var(--line)' }}>
                <span className="person-name">{person}</span>
                <a className="tlink" href={`tel:+886227372181`} style={{ color: tone, alignSelf: 'flex-start' }}>
                  <Icon name="phone" />
                  <span className="mono">{ext}</span>
                </a>
                <span className="tiny">{place}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
