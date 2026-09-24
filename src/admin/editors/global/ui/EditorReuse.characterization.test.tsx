// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminButton } from '@/admin/AdminButton';
import { AdminField, BilingualFieldPair } from '@/admin/AdminFields';
import { StatePanel } from '@/admin/AdminFeedback';
import { ConfirmDialog } from '@/admin/AdminOverlays';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function ConfirmationHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = createRef<HTMLButtonElement>();
  return (
    <>
      <AdminButton ref={triggerRef} onClick={() => setOpen(true)}>刪除項目</AdminButton>
      <ConfirmDialog
        open={open}
        title="刪除此項目？"
        description="刪除前需要確認。"
        confirmLabel="確認刪除"
        cancelLabel="保留項目"
        triggerRef={triggerRef}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

describe('editor primitive reuse characterization', () => {
  it('links a supplied field id to its inline error', () => {
    // Given / When
    const view = render(<AdminField id="stable-field" label="英文標題" error="請補上英文標題" />);

    // Then
    const field = view.getByRole('textbox', { name: '英文標題' });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe('stable-field-error');
    expect(view.getByRole('alert').id).toBe('stable-field-error');
  });

  it('renders Traditional Chinese before English in a named group', () => {
    // Given / When
    const view = render(
      <BilingualFieldPair
        label="標題"
        zh={<AdminField label="繁體中文" />}
        en={<AdminField label="English" />}
      />,
    );

    // Then
    expect(view.getAllByRole('textbox').map((field) => field.closest('[lang]')?.getAttribute('lang'))).toEqual(['zh-Hant', 'en']);
  });

  it('gives an empty state a heading, explanation, and native action', async () => {
    // Given
    const user = userEvent.setup();
    const onAction = vi.fn();
    const view = render(<StatePanel kind="empty" title="尚無項目" description="建立第一個項目後會顯示在這裡。" actionLabel="新增項目" onAction={onAction} />);

    // When
    await user.click(view.getByRole('button', { name: '新增項目' }));

    // Then
    expect(view.getByRole('heading', { name: '尚無項目' })).toBeTruthy();
    expect(view.getByText('建立第一個項目後會顯示在這裡。')).toBeTruthy();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('returns focus to the destructive trigger after cancellation', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<ConfirmationHarness />);
    const trigger = view.getByRole('button', { name: '刪除項目' });
    await user.click(trigger);

    // When
    await user.click(view.getByRole('button', { name: '保留項目' }));

    // Then
    expect(document.activeElement).toBe(trigger);
  });
});
