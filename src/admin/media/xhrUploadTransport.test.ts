// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createXhrUploadTransport, type XhrLike } from './xhrUploadTransport';

class FakeXhr implements XhrLike {
  readonly upload = new EventTarget();
  readonly headers = new Map<string, string>();
  status = 0;
  responseText = '';
  abort = vi.fn(() => this.dispatchEvent(new ProgressEvent('abort')));
  open = vi.fn();
  send = vi.fn();
  private readonly events = new EventTarget();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.events.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.events.removeEventListener(type, listener);
  }

  dispatchEvent(event: Event): boolean {
    return this.events.dispatchEvent(event);
  }

  setRequestHeader(name: string, value: string): void {
    this.headers.set(name, value);
  }
}

describe('XHR draft upload transport', () => {
  it('surfaces byte progress and parses an unknown JSON response', async () => {
    // Given
    const xhr = new FakeXhr();
    const progress = vi.fn();
    const adapter = createXhrUploadTransport(() => xhr);
    const request = adapter.upload({
      url: 'https://project.supabase.co/storage/v1/object/draft-media/path',
      headers: { apikey: 'key' },
      file: new File(['abc'], 'image.png', { type: 'image/png' }),
      signal: new AbortController().signal,
      onProgress: progress,
    });

    // When
    xhr.upload.dispatchEvent(new ProgressEvent('progress', { loaded: 2, total: 3, lengthComputable: true }));
    xhr.status = 201;
    xhr.responseText = '{"Key":"draft-media/path"}';
    xhr.dispatchEvent(new ProgressEvent('load'));

    // Then
    await expect(request).resolves.toEqual({ status: 201, body: { Key: 'draft-media/path' } });
    expect(progress).toHaveBeenCalledWith({ loaded: 2, total: 3 });
    expect(xhr.open).toHaveBeenCalledWith('POST', 'https://project.supabase.co/storage/v1/object/draft-media/path');
  });

  it('cancels the underlying XHR and resolves as aborted', async () => {
    // Given
    const xhr = new FakeXhr();
    const controller = new AbortController();
    const adapter = createXhrUploadTransport(() => xhr);
    const request = adapter.upload({
      url: 'https://project.supabase.co/storage/v1/object/draft-media/path',
      headers: {},
      file: new File(['abc'], 'image.png', { type: 'image/png' }),
      signal: controller.signal,
      onProgress: () => undefined,
    });

    // When
    controller.abort();

    // Then
    expect(xhr.abort).toHaveBeenCalledOnce();
    await expect(request).resolves.toEqual({ status: 0, body: null });
  });
});
