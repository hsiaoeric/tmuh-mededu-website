// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SiteProvider } from '@/app/site';
import { AdminButton } from './AdminButton';
import { AdminDataTable, type AdminTableColumn } from './AdminData';
import { AdminMediaPicker } from './AdminMedia';
import { AdminDialog } from './AdminOverlays';
import { AdminCheckbox, AdminField, BilingualFieldPair } from './AdminFields';
import { AdminAppShell } from './AdminShell';
import { ShowcaseData } from './showcase/ShowcaseData';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('admin primitives', () => {
  it('prevents duplicate submission when a button is loading', () => {
    // Given
    const view = render(<AdminButton loading>儲存草稿</AdminButton>);

    // When
    const button = view.getByRole('button', { name: '儲存草稿' });

    // Then
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('associates field errors with the native control', () => {
    // Given
    const view = render(
      <AdminField label="英文公告標題" error="請補上英文翻譯" defaultValue="" />,
    );

    // When
    const field = view.getByRole('textbox', { name: '英文公告標題' });

    // Then
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe(view.getByRole('alert').id);
  });

  it('keeps Traditional Chinese first in a named bilingual group', () => {
    // Given
    const view = render(
      <BilingualFieldPair
        label="公告標題"
        zh={<AdminField label="繁體中文" defaultValue="住院醫師教學研討會" />}
        en={<AdminField label="English" defaultValue="Resident Teaching Symposium" />}
      />,
    );

    // When
    const fields = view.getAllByRole('textbox');

    // Then
    expect(fields.map((field) => field.closest('[lang]')?.getAttribute('lang'))).toEqual(['zh-Hant', 'en']);
  });

  it('renders an SVG state glyph inside custom checkbox marks', () => {
    // Given
    const view = render(<><AdminCheckbox label="Checked" defaultChecked /><AdminCheckbox label="Unchecked" /></>);

    // When
    const marks = [...view.container.querySelectorAll('.admin-check-mark')];

    // Then
    expect(marks).toHaveLength(2);
    expect(marks.every((mark) => mark.querySelector('svg.admin-check-glyph') !== null)).toBe(true);
    expect(view.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('marks the entire checkbox row as disabled while preserving native semantics', () => {
    // Given
    const view = render(<AdminCheckbox label="暫停發布" description="目前權限不足，無法變更。" disabled />);

    // When
    const checkbox = view.getByRole('checkbox', { name: /暫停發布/ });
    const row = checkbox.closest('.admin-check');

    // Then
    expect(checkbox.hasAttribute('disabled')).toBe(true);
    expect(row?.getAttribute('data-disabled')).toBe('true');
  });

  it('returns focus to the trigger after Escape closes a dialog', async () => {
    // Given
    const user = userEvent.setup();
    const triggerRef = createRef<HTMLButtonElement>();
    const view = render(
      <>
        <button ref={triggerRef} type="button">開啟確認視窗</button>
        <AdminDialog
          open
          title="放棄未儲存的變更？"
          description="關閉後，本次修改將不會保留。"
          triggerRef={triggerRef}
          onClose={() => view.rerender(<button ref={triggerRef}>開啟確認視窗</button>)}
        >
          <AdminButton>繼續編輯</AdminButton>
        </AdminDialog>
      </>,
    );

    // When
    await user.keyboard('{Escape}');

    // Then
    expect(document.activeElement?.textContent).toBe('開啟確認視窗');
  });

  it('returns focus to the menu trigger after the mobile drawer closes', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><MemoryRouter><AdminAppShell><p>展示內容</p></AdminAppShell></MemoryRouter></SiteProvider>);
    const trigger = view.getByRole('button', { name: '開啟導覽' });
    await user.click(trigger);
    const closeButton = view.getByTitle('關閉導覽');

    expect(closeButton.closest('.admin-drawer-header')).not.toBeNull();

    // When
    await user.click(closeButton);

    // Then
    expect(document.activeElement).toBe(trigger);
  });

  it('marks the selected section as the current location', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><MemoryRouter><AdminAppShell><section id="foundation" /><section id="records" /></AdminAppShell></MemoryRouter></SiteProvider>);

    // When
    await user.click(view.getByRole('link', { name: '資料與紀錄' }));

    // Then
    expect(view.getByRole('link', { name: '資料與紀錄' }).getAttribute('aria-current')).toBe('location');
    expect(view.getByRole('link', { name: '基礎與操作' }).hasAttribute('aria-current')).toBe(false);
  });

  it('restores a direct design-system hash inside the admin scroll owner', async () => {
    // Given
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getBounds(this: HTMLElement) {
      const top = this.id === 'admin-main' ? 100 : this.id === 'overlays' ? 500 : 700;
      return new DOMRect(0, top, 100, 100);
    });

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter initialEntries={['/admin/design-system#overlays']}>
          <AdminAppShell>
            <section id="foundation" />
            <section id="forms" />
            <section id="states" />
            <section id="records" />
            <section id="overlays" />
          </AdminAppShell>
        </MemoryRouter>
      </SiteProvider>,
    );

    // Then
    await waitFor(() => {
      expect(view.getByRole('link', { name: '覆層與媒體' }).getAttribute('aria-current')).toBe('location');
    });
    expect(view.container.querySelector<HTMLElement>('#admin-main')?.scrollTop).toBe(400);
  });

  it('uses the drawer navigation as a named focusable scroll region', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><MemoryRouter><AdminAppShell><p>展示內容</p></AdminAppShell></MemoryRouter></SiteProvider>);

    // When
    await user.click(view.getByRole('button', { name: '開啟導覽' }));
    const drawerNavigation = view.getAllByRole('navigation', { name: '管理介面導覽' }).find((navigation) => navigation.hasAttribute('data-drawer'));

    // Then
    expect(drawerNavigation?.getAttribute('tabindex')).toBe('0');
  });

  it('preserves semantic table headers and selected-row state', () => {
    // Given
    type Row = { readonly id: string; readonly title: string };
    const columns: readonly AdminTableColumn<Row>[] = [
      { key: 'title', label: '公告標題', render: (row) => row.title },
    ];

    // When
    const view = render(<AdminDataTable caption="公告紀錄" columns={columns} rows={[{ id: 'NEWS-1', title: '教學研討會' }]} selectedIds={['NEWS-1']} selectedLabel="已選取" scrollRegionLabel="公告紀錄，可水平捲動" />);
    const region = view.getByRole('region', { name: '公告紀錄，可水平捲動' });
    const table = view.getByRole('table', { name: '公告紀錄' });

    // Then
    expect(region.contains(table)).toBe(true);
    expect(view.getByRole('columnheader', { name: '公告標題' })).toBeTruthy();
    expect(view.getByRole('columnheader', { name: '操作' })).toBeTruthy();
    expect(view.getByRole('row', { name: /教學研討會/ }).getAttribute('data-selected')).toBe('true');
    expect(view.getByRole('row', { name: /教學研討會/ }).getAttribute('aria-selected')).toBe('true');
    expect(view.getByText('已選取')).toBeTruthy();
  });

  it('exposes stable column keys on matching header and data cells', () => {
    // Given
    type Row = { readonly id: string; readonly title: string; readonly status: string };
    const columns: readonly AdminTableColumn<Row>[] = [
      { key: 'title', label: 'Announcement title', render: (row) => row.title },
      { key: 'status', label: 'Status', render: (row) => row.status },
    ];

    // When
    const view = render(<AdminDataTable caption="Announcement records" columns={columns} rows={[{ id: 'NEWS-1', title: 'Resident Teaching Symposium', status: 'Draft' }]} selectedLabel="Selected" scrollRegionLabel="Announcement records, scroll horizontally" />);
    const titleHeader = view.getByRole('columnheader', { name: 'Announcement title' });
    const titleCell = view.getByRole('cell', { name: 'Resident Teaching Symposium' });
    const statusHeader = view.getByRole('columnheader', { name: 'Status' });
    const statusCell = view.getByRole('cell', { name: 'Draft' });

    // Then
    expect(titleHeader.getAttribute('data-column-key')).toBe('title');
    expect(titleCell.getAttribute('data-column-key')).toBe('title');
    expect(statusHeader.getAttribute('data-column-key')).toBe('status');
    expect(statusCell.getAttribute('data-column-key')).toBe('status');
  });

  it('ties a visible scroll hint to the keyboard-scrollable table region', () => {
    // Given
    type Row = { readonly id: string; readonly title: string };
    const columns: readonly AdminTableColumn<Row>[] = [
      { key: 'title', label: '公告標題', render: (row) => row.title },
    ];

    // When
    const view = render(<AdminDataTable caption="公告紀錄" columns={columns} rows={[{ id: 'NEWS-1', title: '教學研討會' }]} selectedLabel="已選取" scrollRegionLabel="公告紀錄，可水平捲動" />);
    const region = view.getByRole('region', { name: '公告紀錄，可水平捲動' });
    const hint = region.querySelector('.admin-table-scroll-hint');

    // Then
    expect(hint).not.toBeNull();
    expect(region.getAttribute('aria-describedby')).toBe(hint?.id);
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('renders localized horizontal-scroll guidance in the table variant', () => {
    // Given
    const view = render(<SiteProvider><ShowcaseData /></SiteProvider>);

    // When
    const tableVariant = view.container.querySelector('.admin-table-view');
    const hint = tableVariant?.querySelector('.admin-table-scroll-hint');
    const region = hint?.closest('[role="region"]');

    // Then
    expect(hint?.textContent).toMatch(/左右滑動/);
    expect(region?.getAttribute('aria-describedby')).toBe(hint?.id);
    expect(region?.getAttribute('tabindex')).toBe('0');
  });

  it('uses the supplied localized table action header', () => {
    // Given
    type Row = { readonly id: string; readonly title: string };
    const columns: readonly AdminTableColumn<Row>[] = [
      { key: 'title', label: 'Announcement title', render: (row) => row.title },
    ];

    // When
    const view = render(<AdminDataTable caption="Announcement records" columns={columns} rows={[{ id: 'NEWS-1', title: 'Teaching symposium' }]} selectedIds={['NEWS-1']} actionHeaderLabel="Actions" selectedLabel="Selected" scrollRegionLabel="Announcement records, scroll horizontally" />);

    // Then
    expect(view.getByRole('region', { name: 'Announcement records, scroll horizontally' })).toBeTruthy();
    expect(view.getByRole('columnheader', { name: 'Actions' })).toBeTruthy();
    expect(view.getByText('Selected')).toBeTruthy();
  });

  it('keeps the native media input inside its visible focus label', () => {
    // Given
    const view = render(<AdminMediaPicker label="公告主視覺" description="選擇一張圖片" />);

    // When
    const fileInput = view.getByLabelText('選擇圖片');

    // Then
    expect(fileInput.closest('label')?.classList.contains('admin-media-action')).toBe(true);
  });

  it('restricts media selection to supported image types and describes the control', () => {
    // Given
    const view = render(<AdminMediaPicker label="人物照片" description="選擇清楚的正面照片" />);

    // When
    const fileInput = view.getByLabelText('選擇圖片');
    const describedIds = fileInput.getAttribute('aria-describedby')?.split(' ') ?? [];

    // Then
    expect(fileInput.getAttribute('accept')).toBe('image/jpeg,image/png,image/webp');
    expect(describedIds.length).toBeGreaterThanOrEqual(2);
    expect(describedIds.every((id) => document.getElementById(id) !== null)).toBe(true);
    expect(view.getByText(/10 MiB/)).toBeTruthy();
  });

  it('clears the native file value so the same image can be selected again', async () => {
    // Given
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const view = render(<AdminMediaPicker label="人物照片" description="選擇圖片" onSelect={onSelect} />);
    const fileInput = view.getByLabelText('選擇圖片') as HTMLInputElement;
    const file = new File(['portrait'], 'portrait.webp', { type: 'image/webp' });

    // When
    await user.upload(fileInput, file);
    await user.upload(fileInput, file);

    // Then
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(fileInput.value).toBe('');
  });

  it('renders determinate upload progress with a concise live status', () => {
    // Given / When
    const view = render(
      <AdminMediaPicker
        label="人物照片"
        description="正在上傳圖片"
        uploading
        progress={{ loaded: 5, total: 10 }}
      />,
    );

    // Then
    const progress = view.getByRole('progressbar');
    expect(progress.getAttribute('value')).toBe('5');
    expect(progress.getAttribute('max')).toBe('10');
    expect(view.getAllByRole('status')).toHaveLength(1);
  });

  it('replaces a failed preview image with the media fallback', () => {
    // Given
    const view = render(
      <AdminMediaPicker
        label="人物照片"
        description="目前照片"
        previewUrl="https://media.example/missing.webp"
        altText="王醫師"
      />,
    );
    const image = view.getByRole('img', { name: '王醫師' });

    // When
    fireEvent.error(image);

    // Then
    expect(view.queryByRole('img')).toBeNull();
    expect(view.getByText('圖片無法預覽')).toBeTruthy();
  });

  it('renders required table and shell state contracts', () => {
    // Given
    const notices = [
      { status: 'warning', title: '工作階段即將到期', description: '儲存後重新登入。' },
      { status: 'error', title: '目前離線', description: '重新連線後再試。' },
    ] as const;

    // When
    const view = render(<SiteProvider><MemoryRouter><AdminAppShell notices={notices}><ShowcaseData /></AdminAppShell></MemoryRouter></SiteProvider>);

    // Then
    expect(view.container.querySelector('[data-state="loading"]')).not.toBeNull();
    expect(view.container.querySelector('[data-state="error"]')).not.toBeNull();
    expect(view.container.querySelector('[data-state="refreshing"]')).not.toBeNull();
    expect(view.container.querySelector('.admin-shell-notices [data-status="warning"]')).not.toBeNull();
    expect(view.container.querySelector('.admin-shell-notices [data-status="error"]')).not.toBeNull();
  });
});
