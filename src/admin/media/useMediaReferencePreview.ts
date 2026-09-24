import { useEffect, useState } from 'react';
import { assertNever } from '@/admin/documents/assertNever';
import type { MediaReference } from '@/content/media';
import { useAdminMediaRuntime } from './AdminMediaRuntimeProvider';
import { settleResultOperation } from './draftMediaOperation';
import { resolveStoredMediaUrl } from './mediaPreview';

const PREVIEW_RENEWAL_LEAD_MS = 30_000;
const MIN_PREVIEW_RENEWAL_DELAY_MS = 1_000;

export type MediaReferencePreviewState =
  | { readonly status: 'empty' }
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly url: string; readonly expiresAt: number | null };

export function previewRenewalDelay(expiresAt: number, now = Date.now()): number {
  return Math.max(
    MIN_PREVIEW_RENEWAL_DELAY_MS,
    expiresAt - now - PREVIEW_RENEWAL_LEAD_MS,
  );
}

export function useMediaReferencePreview(
  reference: MediaReference | null,
): MediaReferencePreviewState {
  const runtime = useAdminMediaRuntime();
  const [state, setState] = useState<MediaReferencePreviewState>({ status: 'empty' });
  const readyClient = runtime.status === 'ready' ? runtime.client : null;
  const readyConfiguration = runtime.status === 'ready' ? runtime.configuration : null;

  useEffect(() => {
    if (reference === null) {
      setState({ status: 'empty' });
      return;
    }
    switch (reference.kind) {
      case 'local': {
        const url = resolveStoredMediaUrl({ reference });
        setState(url === null
          ? { status: 'error' }
          : { status: 'ready', url, expiresAt: null });
        return;
      }
      case 'public': {
        const configuration = readyConfiguration ?? undefined;
        const url = resolveStoredMediaUrl({ reference, configuration });
        setState(url === null
          ? { status: runtime.status === 'loading' ? 'loading' : 'error' }
          : { status: 'ready', url, expiresAt: null });
        return;
      }
      case 'draft': {
        if (readyClient === null) {
          setState({ status: runtime.status === 'loading' ? 'loading' : 'error' });
          return;
        }
        let active = true;
        let controller: AbortController | null = null;
        let renewalTimer: ReturnType<typeof setTimeout> | null = null;

        const sign = (initial: boolean): void => {
          const nextController = new AbortController();
          controller = nextController;
          if (initial) setState({ status: 'loading' });
          void settleResultOperation(
            () => readyClient.createPreview(reference, nextController.signal),
            nextController.signal,
          ).then((result) => {
            if (!active || controller !== nextController || nextController.signal.aborted) return;
            controller = null;
            if (!result.ok) {
              setState({ status: 'error' });
              return;
            }
            setState({ status: 'ready', url: result.url, expiresAt: result.expiresAt });
            renewalTimer = setTimeout(() => {
              renewalTimer = null;
              sign(false);
            }, previewRenewalDelay(result.expiresAt));
          });
        };

        sign(true);
        return () => {
          active = false;
          if (renewalTimer !== null) clearTimeout(renewalTimer);
          controller?.abort();
        };
      }
      default:
        return assertNever(reference, 'media preview reference');
    }
  }, [readyClient, readyConfiguration, reference?.kind, reference?.path, runtime.status]);

  return state;
}
