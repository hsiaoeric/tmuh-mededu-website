// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminMediaPicker } from './AdminMedia';

afterEach(cleanup);

describe('AdminMediaPicker feedback semantics', () => {
  it('uses assertive alerts for errors and polite statuses for success and progress', () => {
    // Given / When
    const error = render(
      <AdminMediaPicker label="Portrait" description="Current portrait" feedback={{ status: 'error', message: 'Upload failed' }} />,
    );

    // Then
    expect(error.getByRole('alert').textContent).toContain('Upload failed');
    error.unmount();

    // Given / When
    const success = render(
      <AdminMediaPicker label="Portrait" description="Current portrait" feedback={{ status: 'success', message: 'Portrait linked' }} />,
    );

    // Then
    expect(success.getByRole('status').textContent).toContain('Portrait linked');
    success.unmount();

    // Given / When
    const progress = render(
      <AdminMediaPicker label="Portrait" description="Current portrait" uploading />,
    );

    // Then
    expect(progress.getByRole('status')).toBeTruthy();
  });

  it('distinguishes a linked portrait with an unavailable localized preview', () => {
    // Given
    const view = render(
      <AdminMediaPicker
        label="Portrait"
        description="Current portrait"
        fileName="owner/portrait.webp"
        previewUrl="https://media.example/missing.webp"
        altText="Portrait"
        labels={{
          empty: 'No portrait linked',
          guidance: 'The name is used as alt text.',
          uploading: 'Uploading',
          choose: 'Choose portrait',
          replace: 'Replace portrait',
          remove: 'Unlink',
          previewUnavailable: 'Portrait preview unavailable',
        }}
      />,
    );

    // When
    fireEvent.error(view.getByRole('img'));

    // Then
    expect(view.getByText('Portrait preview unavailable')).toBeTruthy();
    expect(view.queryByText('No portrait linked')).toBeNull();
  });

  it('applies content language only to slot-derived name and context', () => {
    // Given / When
    const view = render(
      <AdminMediaPicker
        label="王醫師"
        labelLang="zh-Hant"
        description="全人照護指導員"
        descriptionLang="zh-Hant"
      />,
    );

    // Then
    expect(view.getByRole('heading', { name: '王醫師' }).getAttribute('lang')).toBe('zh-Hant');
    expect(view.getByText('全人照護指導員').getAttribute('lang')).toBe('zh-Hant');
    expect(view.getByLabelText('選擇圖片').closest('[lang]')).toBeNull();
  });
});
