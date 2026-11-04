import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '@/motion/MotionPreference';
import { setScrollLocked } from '@/motion/smoothScroll';
import { Icon } from '@/ui/Icon';
import { useContentCopy } from './copy';
import { ContentIcon } from './icons';

export interface LightboxItem {
  readonly url: string;
  readonly alt: string;
  readonly caption?: string | null;
  /** `'zh-Hant'` when alt/caption fell back to Chinese in the English UI. */
  readonly lang?: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

interface LightboxProps {
  readonly items: readonly LightboxItem[];
  /** The open photo, or null when closed. */
  readonly index: number | null;
  readonly onIndexChange: (index: number) => void;
  readonly onClose: () => void;
  /** What is being viewed, usually the album title; names the dialog. */
  readonly title: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => element.tabIndex >= 0);
}

/**
 * A modal photo viewer. While open it traps Tab inside itself, closes on Escape, steps through
 * photos with the arrow keys (wrapping at either end), locks the page scroll through the shared
 * scroll driver, and on close returns focus to whatever opened it. Reduced motion drops the
 * entrance transition.
 */
export function Lightbox({ items, index, onIndexChange, onClose, title }: LightboxProps) {
  const open = index !== null && items.length > 0;
  if (!open) return null;
  return (
    <LightboxDialog
      items={items}
      index={Math.min(Math.max(0, index), items.length - 1)}
      onIndexChange={onIndexChange}
      onClose={onClose}
      title={title}
    />
  );
}

function LightboxDialog({ items, index, onIndexChange, onClose, title }: LightboxProps & { readonly index: number }) {
  const copy = useContentCopy();
  const reduced = useReducedMotion();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const item = items[index];
  const total = items.length;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Opening: remember the opener, lock scroll, focus the close button. Closing undoes all three.
  useLayoutEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setScrollLocked(true);
    closeRef.current?.focus();
    return () => {
      setScrollLocked(false);
      if (opener !== null && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    setFailedUrl(null);
  }, [item.url]);

  const step = (delta: number) => onIndexChange((index + delta + total) % total);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (event.key === 'ArrowRight' && total > 1) {
      event.preventDefault();
      step(1);
      return;
    }
    if (event.key === 'ArrowLeft' && total > 1) {
      event.preventDefault();
      step(-1);
      return;
    }
    if (event.key === 'Tab') {
      const dialog = dialogRef.current;
      if (dialog === null) return;
      const focusable = focusableIn(dialog);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return createPortal(
    <div
      ref={dialogRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-motion={reduced ? 'off' : 'on'}
      data-lenis-prevent=""
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div className="lightbox-bar">
        <h2 className="lightbox-title" id={titleId}>{copy.photoDialog(title)}</h2>
        <p className="lightbox-position mono" aria-live="polite">{copy.photoPosition(index + 1, total)}</p>
        <button ref={closeRef} type="button" className="lightbox-button" onClick={() => onCloseRef.current()} aria-label={copy.closePhoto}>
          <Icon name="close" size={20} />
        </button>
      </div>

      <figure className="lightbox-stage" lang={item.lang}>
        {item.url !== '' && failedUrl !== item.url ? (
          <img
            key={item.url}
            className="lightbox-image"
            src={item.url}
            alt={item.alt}
            width={item.width ?? undefined}
            height={item.height ?? undefined}
            decoding="async"
            onError={() => setFailedUrl(item.url)}
          />
        ) : (
          <div className="lightbox-missing content-image-missing" role="img" aria-label={item.alt}>
            <Icon name="image" size={24} />
            <span className="tiny" aria-hidden="true">{copy.imageUnavailable}</span>
          </div>
        )}
        {item.caption != null && item.caption !== '' && <figcaption className="lightbox-caption">{item.caption}</figcaption>}
      </figure>

      {total > 1 && (
        <div className="lightbox-steps">
          <button type="button" className="lightbox-button" onClick={() => step(-1)} aria-label={copy.previousPhoto}>
            <ContentIcon name="chevronLeft" size={22} />
          </button>
          <button type="button" className="lightbox-button" onClick={() => step(1)} aria-label={copy.nextPhoto}>
            <ContentIcon name="chevronRight" size={22} />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
