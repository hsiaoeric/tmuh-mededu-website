// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderContent } from './testHarness';
import { VideoFacade } from './VideoFacade';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('VideoFacade', () => {
  it('shows only a thumbnail until pressed, then loads the privacy-enhanced player', () => {
    const { container } = renderContent(<VideoFacade youtubeId="dQw4w9WgXcQ" title="OSCE 測驗說明" />);

    expect(container.querySelector('iframe')).toBeNull();
    const thumbnail = container.querySelector('img');
    expect(thumbnail?.getAttribute('src')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(thumbnail?.getAttribute('loading')).toBe('lazy');
    expect(container.innerHTML).not.toContain('youtube-nocookie.com');

    fireEvent.click(screen.getByRole('button', { name: '播放影片：OSCE 測驗說明' }));

    const frame = container.querySelector('iframe');
    expect(frame?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
    expect(frame?.getAttribute('title')).toBe('OSCE 測驗說明');
    expect(document.activeElement).toBe(frame);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('labels the button in English and keeps a fallback title marked as Chinese', () => {
    const { container } = renderContent(
      <VideoFacade youtubeId="abcdefghijk" title="臨床技能" titleLang="zh-Hant" />,
      { lang: 'en' },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Play video: 臨床技能' }));
    expect(container.querySelector('iframe')?.getAttribute('lang')).toBe('zh-Hant');
  });

  it('renders nothing for an id that is not a YouTube id', () => {
    const { container } = renderContent(<VideoFacade youtubeId={'"><script>'} title="x" />);
    expect(container.querySelector('.video-facade')).toBeNull();
  });
});
