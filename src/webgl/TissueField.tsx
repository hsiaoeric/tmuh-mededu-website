import { useEffect, useRef } from 'react';
import {
  Color,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';
import { gsap, prefersReducedMotion } from '@/motion/gsap';
import { useSite } from '@/app/site';
import { FRAG, VERT } from './tissueShader';

/** The field is a soft backdrop, so it renders below 1:1 and costs less. */
const RES_SCALE = 0.62;
const MAX_DPR = 1.5;

function readFieldColors() {
  const s = getComputedStyle(document.documentElement);
  const triplet = (name: string, fallback: [number, number, number]) => {
    const raw = s.getPropertyValue(name).trim().split(/\s+/).map(Number);
    return raw.length === 3 && raw.every((n) => Number.isFinite(n))
      ? (raw as [number, number, number])
      : fallback;
  };
  const strength = parseFloat(s.getPropertyValue('--field-strength'));
  return {
    a: triplet('--field-a', [0.9, 0.89, 0.84]),
    b: triplet('--field-b', [0.82, 0.85, 0.81]),
    c: triplet('--field-c', [0.18, 0.49, 0.41]),
    strength: Number.isFinite(strength) ? strength : 0.5,
  };
}

/**
 * The living-tissue backdrop: one fullscreen fragment shader, fixed behind the
 * whole site. It reads its palette from the CSS theme tokens so a theme switch
 * cross-fades the field instead of cutting.
 */
export function TissueField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { theme } = useSite();
  const materialRef = useRef<ShaderMaterial | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    } catch {
      // No WebGL — the CSS background colour is a perfectly good fallback.
      return;
    }

    const reduced = prefersReducedMotion();
    const colors = readFieldColors();

    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: new Vector2(1, 1) },
        uPointer: { value: new Vector2(0, 0) },
        uScroll: { value: 0 },
        uA: { value: new Color(...colors.a) },
        uB: { value: new Color(...colors.b) },
        uC: { value: new Color(...colors.c) },
        uStrength: { value: colors.strength },
        uIntro: { value: reduced ? 1 : 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    materialRef.current = material;

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    scene.add(new Mesh(new PlaneGeometry(2, 2), material));

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR) * RES_SCALE);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      material.uniforms.uRes.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
    };
    resize();

    // Pointer and scroll are eased toward their targets so the field never
    // snaps — it should feel like it is breathing, not tracking.
    const pointerTarget = new Vector2(0, 0);
    const onPointer = (e: PointerEvent) => {
      const m = Math.min(window.innerWidth, window.innerHeight);
      pointerTarget.set(
        (e.clientX - window.innerWidth / 2) / m,
        -(e.clientY - window.innerHeight / 2) / m,
      );
    };

    let scrollTarget = 0;
    const onScroll = () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      scrollTarget = (window.scrollY / max) * 2 - 1;
    };
    onScroll();

    let raf = 0;
    let visible = !document.hidden;
    const clock = { t: 0, last: performance.now() };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;

      const now = performance.now();
      const dt = Math.min((now - clock.last) / 1000, 0.05);
      clock.last = now;
      clock.t += dt;

      const u = material.uniforms;
      u.uTime.value = clock.t;
      u.uPointer.value.lerp(pointerTarget, 0.045);
      u.uScroll.value += (scrollTarget - u.uScroll.value) * 0.06;
      renderer.render(scene, camera);
    };

    if (reduced) {
      // One static frame: the texture without the animation.
      material.uniforms.uTime.value = 12;
      renderer.render(scene, camera);
    } else {
      gsap.to(material.uniforms.uIntro, {
        value: 1,
        duration: 2.4,
        ease: 'power2.inOut',
      });
      raf = requestAnimationFrame(frame);
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    const onVisibility = () => {
      visible = !document.hidden;
      clock.last = performance.now();
    };
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      materialRef.current = null;
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // Cross-fade the palette when the theme flips.
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    // Wait a frame so the new CSS custom properties are committed.
    const id = requestAnimationFrame(() => {
      const next = readFieldColors();
      const dur = prefersReducedMotion() ? 0 : 0.7;
      const tween = (u: { value: Color }, rgb: [number, number, number]) =>
        gsap.to(u.value, { r: rgb[0], g: rgb[1], b: rgb[2], duration: dur, ease: 'power2.inOut' });
      tween(material.uniforms.uA as { value: Color }, next.a);
      tween(material.uniforms.uB as { value: Color }, next.b);
      tween(material.uniforms.uC as { value: Color }, next.c);
      gsap.to(material.uniforms.uStrength, {
        value: next.strength,
        duration: dur,
        ease: 'power2.inOut',
      });
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);

  return <div className="field" ref={hostRef} aria-hidden="true" />;
}
