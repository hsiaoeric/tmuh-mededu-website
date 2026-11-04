// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adaptGalleryLibrary } from '@/content/adapters/archive';
import { PublishedGalleryPayloadSchema } from '@/content/contracts/gallery';
import { StillMotion } from '@/motion/MotionPreference';
import { PhotoGrid } from './PhotoGrid';
import { renderContent } from './testHarness';

const motion = vi.hoisted(() => {
  const state = { reduced: false };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: query === '(prefers-reduced-motion: reduce)' && state.reduced,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
  return state;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  motion.reduced = false;
  document.body.style.overflow = '';
});

function album(lang: 'zh' | 'en') {
  const payload = PublishedGalleryPayloadSchema.parse({
    contentModel: 'localized-fields-v1',
    albums: [{
      id: 'osce-2024',
      owner: 'clinical_skills',
      title: { zh: '2024 OSCE 測驗' },
      date: '2024-05-01',
      photos: [
        { id: 'p1', media: { kind: 'local', path: 'assets/legacy/album/p1.webp' }, alt: { zh: '考生報到' }, width: 1600, height: 1067 },
        { id: 'p2', media: { kind: 'local', path: 'assets/legacy/album/p2.webp' }, caption: { zh: '考官說明', en: 'Briefing' } },
        { id: 'p3', media: { kind: 'local', path: 'assets/legacy/album/p3.webp' }, alt: { zh: '合影', en: 'Group photo' } },
      ],
    }],
    videos: [],
  });
  return adaptGalleryLibrary(payload, lang, { baseUrl: '/', supabaseUrl: '' }).albums[0];
}

function renderGrid(lang: 'zh' | 'en' = 'zh') {
  const value = album(lang);
  return renderContent(<PhotoGrid photos={value.photos} title={value.title.text} />, { lang });
}

describe('PhotoGrid', () => {
  it('lists lazy thumbnails, naming photos without alt text after the album', () => {
    renderGrid();
    const list = screen.getByRole('list', { name: '2024 OSCE 測驗' });
    const images = within(list).getAllByRole('img');
    expect(images.map((image) => image.getAttribute('alt'))).toEqual(['考生報到', '2024 OSCE 測驗 — 相片 2', '合影']);
    expect(images.every((image) => image.getAttribute('loading') === 'lazy')).toBe(true);
    expect(images[0].getAttribute('width')).toBe('1600');
  });
});

describe('Lightbox keyboard contract', () => {
  it('opens on the chosen photo with focus inside, and Escape returns focus to the opener', () => {
    renderGrid();
    const opener = screen.getByRole('button', { name: '考生報到' });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog', { name: '相片檢視：2024 OSCE 測驗' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: '關閉相片檢視' }));
    expect(within(dialog).getByText('第 1 張，共 3 張')).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe('');
  });

  it('steps with the arrow keys and wraps at either end', () => {
    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: '合影' }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('第 3 張，共 3 張')).toBeTruthy();
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(within(dialog).getByText('第 1 張，共 3 張')).toBeTruthy();
    expect(within(dialog).getByRole('img', { name: '考生報到' })).toBeTruthy();
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    expect(within(dialog).getByText('第 2 張，共 3 張')).toBeTruthy();
    expect(within(dialog).getByText('考官說明')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: '下一張' }));
    expect(within(dialog).getByText('第 3 張，共 3 張')).toBeTruthy();
  });

  it('traps Tab inside the dialog', () => {
    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: '考生報到' }));
    const dialog = screen.getByRole('dialog');
    const close = within(dialog).getByRole('button', { name: '關閉相片檢視' });
    const next = within(dialog).getByRole('button', { name: '下一張' });

    next.focus();
    fireEvent.keyDown(next, { key: 'Tab' });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(next);
  });

  it('marks Chinese fallback alt and captions in the English UI', () => {
    renderGrid('en');
    fireEvent.click(screen.getByRole('button', { name: '考生報到' }));
    const dialog = screen.getByRole('dialog', { name: 'Photo viewer: 2024 OSCE 測驗' });
    expect(dialog.querySelector('figure')?.getAttribute('lang')).toBe('zh-Hant');
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(within(dialog).getByText('Photo 3 of 3')).toBeTruthy();
    expect(dialog.querySelector('figure')?.hasAttribute('lang')).toBe(false);
  });

  it('drops the entrance transition under reduced motion and inside StillMotion', () => {
    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: '考生報到' }));
    expect(screen.getByRole('dialog').getAttribute('data-motion')).toBe('on');
    cleanup();

    motion.reduced = true;
    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: '考生報到' }));
    expect(screen.getByRole('dialog').getAttribute('data-motion')).toBe('off');
    cleanup();

    motion.reduced = false;
    const value = album('zh');
    renderContent(<StillMotion><PhotoGrid photos={value.photos} title={value.title.text} /></StillMotion>);
    fireEvent.click(screen.getByRole('button', { name: '考生報到' }));
    expect(screen.getByRole('dialog').getAttribute('data-motion')).toBe('off');
  });
});
