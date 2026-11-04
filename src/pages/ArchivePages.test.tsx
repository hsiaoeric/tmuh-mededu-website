// @vitest-environment jsdom
import { cleanup, render, within, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicSiteProvider } from '@/app/PublicSiteProvider';
import { ContentProvider } from '@/content/ContentProvider';
import { parseSupabaseConfiguration } from '@/content/env';
import { committedSnapshotRepository, createSnapshotRepository } from '@/content/snapshotRepository';
import type { ContentSnapshotRepository } from '@/content/domain';
import type { Lang } from '@/i18n';
import { AlbumPage } from './AlbumPage';
import { AnnouncementsPage } from './AnnouncementsPage';
import { DepartmentPage } from './DepartmentPage';
import { DepartmentPageDetail } from './DepartmentPageDetail';
import { DigitalMaterialsPage } from './DigitalMaterialsPage';
import { GalleryPage } from './GalleryPage';
import { HonorsPage } from './HonorsPage';
import { PostDetailPage } from './PostDetailPage';
import { ProgramPage } from './ProgramPage';
import { ResourcesPage } from './ResourcesPage';
import { TraineesPage } from './TraineesPage';
import { VideosPage } from './VideosPage';
import { CenterArchiveSections } from './centers/CenterArchiveSections';
import { sampleSnapshotRows } from './archive/testFixtures';

vi.mock('@/motion/Counter', () => ({ Counter: ({ to }: { readonly to: number }) => <>{to}</> }));
vi.mock('@/motion/Reveal', () => ({
  Reveal: ({ children, className, id }: { readonly children: ReactNode; readonly className?: string; readonly id?: string }) => (
    <div className={className} id={id}>{children}</div>
  ),
}));
vi.mock('@/motion/SplitLines', () => ({
  SplitLines: ({ children, className, as: Tag = 'h2' }: { readonly children: ReactNode; readonly className?: string; readonly as?: 'h1' | 'h2' }) => (
    <Tag className={className}>{children}</Tag>
  ),
}));

vi.mock('@/motion/gsap', () => ({
  gsap: { context: () => ({ revert: () => undefined }) },
  ScrollTrigger: { refresh: () => undefined },
  prefersReducedMotion: () => true,
}));

const OFFLINE = parseSupabaseConfiguration({});
const SAMPLE = createSnapshotRepository(sampleSnapshotRows());

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>;
}

function renderAt(path: string, options: { readonly lang?: Lang; readonly snapshot?: ContentSnapshotRepository } = {}): RenderResult {
  localStorage.setItem('tmuh.lang', options.lang ?? 'zh');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ContentProvider configuration={OFFLINE} snapshotRepository={options.snapshot ?? committedSnapshotRepository}>
        <PublicSiteProvider>
          <Routes>
            <Route path="/department" element={<DepartmentPage />} />
            <Route path="/department/:pageId" element={<DepartmentPageDetail />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/announcements/:postId" element={<PostDetailPage />} />
            <Route path="/honors" element={<HonorsPage />} />
            <Route path="/honors/:postId" element={<PostDetailPage />} />
            <Route path="/trainees" element={<TraineesPage />} />
            <Route path="/trainees/:programId" element={<ProgramPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/gallery/:albumId" element={<AlbumPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/centers/:slug/articles/:postId" element={<PostDetailPage />} />
            <Route path="/digital-materials" element={<DigitalMaterialsPage />} />
            <Route path="/digital-materials/articles/:postId" element={<PostDetailPage />} />
            <Route path="/ebm-archive" element={<CenterArchiveSections owner="ebm" />} />
            <Route path="/faculty-archive" element={<><p>center page</p><CenterArchiveSections owner="faculty_dev" /></>} />
          </Routes>
          <LocationProbe />
        </PublicSiteProvider>
      </ContentProvider>
    </MemoryRouter>,
  );
}

const location = (view: RenderResult) => view.getByTestId('location').textContent;

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
});
afterEach(() => cleanup());

describe('archive pages with no imported data', () => {
  it('render their empty states instead of failing', () => {
    let view = renderAt('/announcements');
    expect(view.getByRole('heading', { level: 1, name: '公告' })).toBeTruthy();
    expect(view.getByText('目前沒有公告。')).toBeTruthy();
    expect(view.queryByRole('search')).toBeNull();
    cleanup();

    view = renderAt('/honors');
    expect(view.getByRole('heading', { name: '榮譽榜' })).toBeTruthy();
    expect(view.getByText('榮譽榜尚無內容。')).toBeTruthy();
    cleanup();

    view = renderAt('/trainees');
    expect(view.getByText('目前沒有學員重要訊息。')).toBeTruthy();
    expect(view.getAllByRole('link', { name: /住院醫師|畢業後一般醫學訓練|醫學生|醫事見實習|代訓／聯合訓練/u })).toHaveLength(5);
    cleanup();

    view = renderAt('/trainees/residents');
    expect(view.getByRole('heading', { level: 1, name: '住院醫師' })).toBeTruthy();
    expect(view.getByText('本專區內容整理中，完成後將於此發布。')).toBeTruthy();
    cleanup();

    view = renderAt('/gallery');
    expect(view.getByText('目前沒有相簿。')).toBeTruthy();
    cleanup();

    view = renderAt('/videos');
    expect(view.getByText('目前沒有影片。')).toBeTruthy();
    cleanup();

    view = renderAt('/resources');
    expect(view.getByRole('link', { name: /E-Portfolio 學習歷程系統/u }).getAttribute('href')).toBe('http://ceep2.tmu.edu.tw/');
    cleanup();

    view = renderAt('/department');
    expect(view.getByRole('heading', { level: 2, name: '行政團隊' })).toBeTruthy();
    expect(view.queryByRole('heading', { name: '委員會' })).toBeNull();
    expect(view.container.querySelector('#team')).not.toBeNull();
    cleanup();

    view = renderAt('/digital-materials');
    expect(view.getByText('本頁內容仍在彙整中，完成後將於此發布。')).toBeTruthy();
    cleanup();

    view = renderAt('/faculty-archive');
    expect(view.getByText('center page')).toBeTruthy();
    expect(view.container.querySelector('section')).toBeNull();
  });

  it('shows NotFound for unknown ids', () => {
    for (const path of ['/announcements/999999', '/honors/nope', '/department/nope', '/trainees/interns', '/gallery/nope', '/digital-materials/articles/1']) {
      const view = renderAt(path);
      expect(view.getByRole('heading', { name: '這個頁面不存在' }), path).toBeTruthy();
      cleanup();
    }
  });
});

describe('archive pages with imported data', () => {
  it('lists, filters, and links announcements to their detail pages', async () => {
    const user = userEvent.setup();
    const view = renderAt('/announcements', { snapshot: SAMPLE });
    const archive = within(view.container.querySelector('#archive') as HTMLElement);

    expect(archive.getAllByRole('article')).toHaveLength(3);
    expect(archive.getByRole('link', { name: /科技模擬國際研討會/u }).getAttribute('href')).toBe('/announcements/185');

    await user.click(archive.getByRole('button', { name: '招募相關' }));
    expect(location(view)).toBe('/announcements?category=recruitment');
    expect(archive.getAllByRole('article')).toHaveLength(1);
    expect(archive.getByRole('link', { name: '【醫事人員聯合訓練申請辦法】' })).toBeTruthy();
  });

  it('reads category filters from old-site redirects', () => {
    const view = renderAt('/honors?category=competitions-awards#board', { snapshot: SAMPLE });
    const board = within(view.container.querySelector('#board') as HTMLElement);
    expect(board.getByRole('button', { name: '參賽與獲獎' }).getAttribute('aria-pressed')).toBe('true');
    expect(board.getByRole('link', { name: /OSCE 教案競賽/u }).getAttribute('href')).toBe('/honors/150');
  });

  it('renders a post with its body, attachments, and neighbours', () => {
    const view = renderAt('/announcements/184', { snapshot: SAMPLE });
    expect(view.getByRole('heading', { level: 1, name: '【醫事人員聯合訓練申請辦法】' })).toBeTruthy();
    expect(view.getByText('申請辦法如附件。')).toBeTruthy();
    expect(view.getByRole('link', { name: /返回公告/u }).getAttribute('href')).toBe('/announcements');
    const steps = within(view.getByRole('navigation', { name: '前後篇' }));
    expect(steps.getByRole('link', { name: /科技模擬/u }).getAttribute('href')).toBe('/announcements/185');
    expect(steps.getByRole('link', { name: /台灣醫學教育學會/u }).getAttribute('href')).toBe('/announcements/183');
    cleanup();

    const withAttachment = renderAt('/announcements/185', { snapshot: SAMPLE });
    expect(withAttachment.getByRole('link', { name: /議程表/u }).getAttribute('href')).toBe('https://tmuh.org.tw/agenda.pdf');
  });

  it('marks Chinese-only posts in the English UI', () => {
    const view = renderAt('/announcements/185', { snapshot: SAMPLE, lang: 'en' });
    const title = view.getByRole('heading', { level: 1 });
    expect(title.textContent).toContain('科技模擬國際研討會');
    expect(title.getAttribute('lang')).toBe('zh-Hant');
    expect(view.getByText('Chinese only')).toBeTruthy();
    expect(view.getByRole('link', { name: /Back to announcements/u })).toBeTruthy();
    cleanup();

    const translated = renderAt('/announcements/184', { snapshot: SAMPLE, lang: 'en' });
    const heading = translated.getByRole('heading', { level: 1, name: 'Joint training applications for allied health staff' });
    expect(heading.getAttribute('lang')).toBeNull();
    expect(translated.queryByText('Chinese only')).toBeNull();
  });

  it('redirects a post opened under another path to its canonical page', () => {
    let view = renderAt('/announcements/150?from=old#top', { snapshot: SAMPLE });
    expect(location(view)).toBe('/honors/150?from=old#top');
    expect(view.getByRole('heading', { level: 1, name: /OSCE 教案競賽/u })).toBeTruthy();
    cleanup();

    view = renderAt('/centers/clinical-skills/articles/120', { snapshot: SAMPLE });
    expect(location(view)).toBe('/centers/evidence-based-medicine/articles/120');
    cleanup();

    view = renderAt('/honors/119', { snapshot: SAMPLE });
    expect(location(view)).toBe('/digital-materials/articles/119');
    expect(view.getByRole('link', { name: /返回數位教材室/u }).getAttribute('href')).toBe('/digital-materials');
  });

  it('builds a program page from its pages, posts, albums, videos, and links, hiding the rest', () => {
    const view = renderAt('/trainees/pgy', { snapshot: SAMPLE });
    for (const id of ['outcomes', 'notices', 'albums', 'videos', 'links']) {
      expect(view.container.querySelector(`#${id}`), id).not.toBeNull();
    }
    for (const id of ['intro', 'schedule', 'downloads']) {
      expect(view.container.querySelector(`#${id}`), id).toBeNull();
    }
    expect(view.getByText('一一三年度訓練成果。')).toBeTruthy();
    expect(view.getByRole('link', { name: '2024 PGY 新進人員訓練' }).getAttribute('href')).toBe('/gallery/pgy-orientation-2024');
    expect(view.getByRole('button', { name: /播放影片：PGY 訓練介紹/u })).toBeTruthy();
    cleanup();

    const redirected = renderAt('/department/pgy-outcomes', { snapshot: SAMPLE });
    expect(location(redirected)).toBe('/trainees/pgy#outcomes');
  });

  it('shows department pages and committees, and their details', () => {
    let view = renderAt('/department', { snapshot: SAMPLE });
    expect(view.getByRole('link', { name: '教學部主任的話' }).getAttribute('href')).toBe('/department/director-message');
    expect(view.container.querySelector('#committees')).not.toBeNull();
    cleanup();

    view = renderAt('/department/teaching-committee', { snapshot: SAMPLE, lang: 'en' });
    expect(view.getByRole('heading', { level: 1, name: 'Teaching Committee' })).toBeTruthy();
    expect(view.getByText('Membership and remit.')).toBeTruthy();
    expect(view.getByRole('link', { name: /Back to the department/u }).getAttribute('href')).toBe('/department#committees');
  });

  it('filters albums and videos by unit and opens an album', async () => {
    const user = userEvent.setup();
    const gallery = renderAt('/gallery?owner=ebm', { snapshot: SAMPLE });
    expect(gallery.getAllByRole('article')).toHaveLength(1);
    await user.click(gallery.getByRole('button', { name: '全部' }));
    expect(location(gallery)).toBe('/gallery');
    expect(gallery.getAllByRole('article')).toHaveLength(2);
    cleanup();

    const videos = renderAt('/videos', { snapshot: SAMPLE, lang: 'en' });
    expect(videos.getAllByRole('button', { name: /Play video/u })).toHaveLength(2);
    cleanup();

    const album = renderAt('/gallery/pgy-orientation-2024', { snapshot: SAMPLE });
    expect(album.getByRole('heading', { level: 1, name: '2024 PGY 新進人員訓練' })).toBeTruthy();
    expect(album.getAllByRole('button', { name: /2024 PGY 新進人員訓練|開訓典禮/u }).length).toBeGreaterThanOrEqual(2);
  });

  it('renders owner archive sections on center and digital materials pages', () => {
    let view = renderAt('/ebm-archive', { snapshot: SAMPLE });
    expect(view.getByRole('link', { name: '實證醫學競賽說明會' }).getAttribute('href')).toBe('/centers/evidence-based-medicine/articles/120');
    expect(view.container.querySelector('#center-albums')).not.toBeNull();
    expect(view.container.querySelector('#center-videos')).not.toBeNull();
    cleanup();

    view = renderAt('/digital-materials', { snapshot: SAMPLE });
    expect(view.queryByText('本頁內容仍在彙整中，完成後將於此發布。')).toBeNull();
    expect(view.getByRole('link', { name: '數位教材室簡介' }).getAttribute('href')).toBe('/digital-materials/articles/119');
  });

  it('lists shared resources and committed downloads', () => {
    const view = renderAt('/resources', { snapshot: SAMPLE });
    expect(view.getByRole('link', { name: /臺北醫學大學/u })).toBeTruthy();
    expect(view.queryByRole('link', { name: /請假單/u })).toBeNull();
    expect(view.getByRole('link', { name: /教學活動申請表/u }).getAttribute('href')).toBe('/files/legacy/forms/form-a.pdf');
  });
});
