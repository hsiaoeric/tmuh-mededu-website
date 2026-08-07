import { useRef } from 'react';
import { useSite } from '@/context/SiteContext';
import { useBackgroundFX } from '@/hooks/useBackgroundFX';

/** Fixed particle-network canvas + cursor glow behind all content. */
export function BackgroundFX() {
  const { theme } = useSite();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  useBackgroundFX(canvasRef, glowRef, theme);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.9,
        }}
      />
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 560,
          height: 560,
          margin: '-280px 0 0 -280px',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(circle,var(--accent-glow),transparent 62%)',
          opacity: 0.5,
          filter: 'blur(36px)',
          transition: 'opacity .5s ease',
          willChange: 'transform',
        }}
      />
    </>
  );
}
