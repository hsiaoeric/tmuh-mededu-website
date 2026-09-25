import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSite } from '@/app/site';

export type PreviewDevice = 'desktop' | 'mobile';

/** CSS widths the preview lays the page out at; the frame is then scaled to fit the pane. */
export const PREVIEW_DEVICE_WIDTH: Readonly<Record<PreviewDevice, number>> = { desktop: 1280, mobile: 390 };

const FRAME_SOURCE = '<!doctype html><html><head></head><body style="margin:0"></body></html>';

/** Copies the page's stylesheets so the public components are styled inside the frame. */
function syncStyles(target: Document): void {
  target.head.replaceChildren(...[...document.head.querySelectorAll('style, link[rel="stylesheet"], link[rel="preconnect"]')].map((node) => node.cloneNode(true)));
}

type PreviewFrameProps = {
  readonly device: PreviewDevice;
  readonly title: string;
  /** Receives the frame's document once its content is mounted, and `null` when it goes away. */
  readonly onDocument?: (document: Document | null) => void;
  readonly children: ReactNode;
};

/**
 * Renders children into an iframe of the device's width. The site's breakpoints follow the
 * viewport, so only a real frame shows the phone layout; the frame is zoomed to fit the pane and
 * keeps a device-shaped viewport that scrolls on its own.
 */
export function PreviewFrame({ device, title, onDocument, children }: PreviewFrameProps) {
  const { lang, theme } = useSite();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const onDocumentRef = useRef(onDocument);
  onDocumentRef.current = onDocument;

  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  // Write a standards-mode document into the frame's initial blank one (a blank frame renders in
  // quirks mode). `load` re-checks, for engines that swap the initial document out afterwards.
  const adopt = () => {
    const next = iframeRef.current?.contentDocument ?? null;
    if (next === null) return;
    if (next.doctype === null) {
      next.open();
      next.write(FRAME_SOURCE);
      next.close();
    }
    if (next.body !== null) setFrameDocument((current) => (current === next ? current : next));
  };
  useLayoutEffect(adopt, []);

  useLayoutEffect(() => {
    if (frameDocument === null) return undefined;
    syncStyles(frameDocument);
    setBody(frameDocument.body);
    // Vite injects and replaces <style> tags as modules load and hot-reload; follow along.
    const observer = new MutationObserver(() => syncStyles(frameDocument));
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [frameDocument]);

  useEffect(() => {
    const root = body?.ownerDocument.documentElement;
    if (root === undefined) return;
    root.setAttribute('data-theme', theme);
    root.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');
  }, [body, lang, theme]);

  useEffect(() => {
    if (body === null) return undefined;
    onDocumentRef.current?.(body.ownerDocument);
    return () => onDocumentRef.current?.(null);
  }, [body]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const iframe = iframeRef.current;
    if (wrapper === null || iframe === null || typeof ResizeObserver === 'undefined') return undefined;
    const width = PREVIEW_DEVICE_WIDTH[device];
    const fit = () => {
      const style = getComputedStyle(wrapper);
      const innerWidth = wrapper.clientWidth - parseFloat(style.paddingInlineStart || '0') - parseFloat(style.paddingInlineEnd || '0');
      const innerHeight = wrapper.clientHeight - parseFloat(style.paddingBlockStart || '0') - parseFloat(style.paddingBlockEnd || '0');
      const zoom = Math.min(1, innerWidth / width);
      iframe.style.zoom = String(zoom);
      iframe.style.width = `${width}px`;
      iframe.style.height = `${Math.max(320, innerHeight / zoom)}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [device]);

  return (
    <div ref={wrapperRef} className="admin-preview-frame" data-device={device}>
      <iframe ref={iframeRef} title={title} className="admin-preview-iframe" onLoad={adopt} />
      {body === null ? null : createPortal(children, body)}
    </div>
  );
}
