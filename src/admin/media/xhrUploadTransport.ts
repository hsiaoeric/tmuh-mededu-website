import type {
  DraftUploadResponse,
  DraftUploadTransport,
} from './types';

export interface XhrLike {
  readonly upload: EventTarget;
  readonly status: number;
  readonly responseText: string;
  open(method: string, url: string): void;
  setRequestHeader(name: string, value: string): void;
  send(body: File): void;
  abort(): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

function parseResponseBody(responseText: string): unknown {
  if (responseText === '') return null;
  try {
    return JSON.parse(responseText);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) return responseText;
    throw error;
  }
}

export function createXhrUploadTransport(
  createXhr: () => XhrLike = () => new XMLHttpRequest(),
): DraftUploadTransport {
  return {
    upload(request) {
      return new Promise<DraftUploadResponse>((resolve) => {
        const xhr = createXhr();
        let settled = false;
        const finish = (response: DraftUploadResponse): void => {
          if (settled) return;
          settled = true;
          request.signal.removeEventListener('abort', abort);
          resolve(response);
        };
        const abort = (): void => xhr.abort();
        xhr.open('POST', request.url);
        Object.entries(request.headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
        xhr.upload.addEventListener('progress', (event) => {
          if (event instanceof ProgressEvent && event.lengthComputable) {
            request.onProgress({ loaded: event.loaded, total: event.total });
          }
        });
        xhr.addEventListener('load', () => finish({ status: xhr.status, body: parseResponseBody(xhr.responseText) }));
        xhr.addEventListener('error', () => finish({ status: -1, body: null }));
        xhr.addEventListener('abort', () => finish({ status: 0, body: null }));
        request.signal.addEventListener('abort', abort, { once: true });
        if (request.signal.aborted) {
          abort();
          return;
        }
        xhr.send(request.file);
      });
    },
  };
}
