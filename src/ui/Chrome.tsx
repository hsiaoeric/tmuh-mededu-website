import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/motion/gsap';

/** Thin scroll-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      const onScroll = () => {
        const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
        el.style.transform = `scaleX(${window.scrollY / max})`;
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => gsap.set(el, { scaleX: self.progress }),
    });
    return () => st.kill();
  }, []);

  return <div className="progress" ref={ref} aria-hidden="true" />;
}

/**
 * Trailing ring cursor. Elements opt into a label by setting
 * `data-cursor="読む"`; everything else just gets the ring.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!ring || !label) return;

    const xTo = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    const lxTo = gsap.quickTo(label, 'x', { duration: 0.6, ease: 'power3' });
    const lyTo = gsap.quickTo(label, 'y', { duration: 0.6, ease: 'power3' });

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      lxTo(e.clientX);
      lyTo(e.clientY);
      ring.dataset.visible = 'true';

      const host = (e.target as HTMLElement | null)?.closest?.('[data-cursor]');
      const text = host?.getAttribute('data-cursor') ?? '';
      label.textContent = text;
      label.dataset.visible = text ? 'true' : 'false';
      gsap.to(ring, {
        scale: host ? 1.9 : 1,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };

    const onLeave = () => {
      ring.dataset.visible = 'false';
      label.dataset.visible = 'false';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <>
      <div className="cursor" ref={ringRef} aria-hidden="true" />
      <div className="cursor-label mono" ref={labelRef} aria-hidden="true" />
    </>
  );
}

/** Curtain wipe played on every route change. */
export function RouteCurtain() {
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const first = useRef(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (prefersReducedMotion()) return;

    gsap
      .timeline()
      .set(el, { transformOrigin: 'bottom', scaleY: 1 })
      .to(el, { scaleY: 0, transformOrigin: 'top', duration: 0.85, ease: 'expo.inOut' });
  }, [pathname]);

  return <div className="curtain" ref={ref} aria-hidden="true" />;
}
