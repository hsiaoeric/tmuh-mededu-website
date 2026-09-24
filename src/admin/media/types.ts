import type { DraftMediaReference } from '@/content/media';

export type UploadProgress = {
  readonly loaded: number;
  readonly total: number;
};

export type DraftUploadRequest = {
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly file: File;
  readonly signal: AbortSignal;
  readonly onProgress: (progress: UploadProgress) => void;
};

export type DraftUploadResponse = {
  readonly status: number;
  readonly body: unknown;
};

export interface DraftUploadTransport {
  upload(request: DraftUploadRequest): Promise<DraftUploadResponse>;
}

export interface DraftMediaOperations {
  getSession(): Promise<unknown>;
  getUser(): Promise<unknown>;
  createSignedUrl(path: string, expiresIn: number): Promise<unknown>;
  remove(paths: readonly string[]): Promise<unknown>;
}

export type DraftMediaFailure =
  | { readonly kind: 'invalid-file'; readonly reason: 'empty' | 'too-large' | 'unsupported-type' }
  | { readonly kind: 'authentication-required' }
  | { readonly kind: 'owner-mismatch' }
  | { readonly kind: 'still-referenced' }
  | { readonly kind: 'storage-failure' }
  | { readonly kind: 'transport-error' }
  | { readonly kind: 'malformed-response' }
  | { readonly kind: 'aborted' };

export type DraftUploadResult =
  | {
      readonly ok: true;
      readonly outcome: 'created' | 'reused';
      readonly reference: DraftMediaReference;
      readonly sha256: string;
    }
  | { readonly ok: false; readonly failure: DraftMediaFailure };

export type DraftPreviewResult =
  | { readonly ok: true; readonly url: string; readonly expiresAt: number }
  | { readonly ok: false; readonly failure: DraftMediaFailure };

export type DraftDeleteGuard = {
  readonly referencedByEditor: boolean;
  readonly referencedBySavedDraft: boolean;
};

export type DraftDeleteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly failure: DraftMediaFailure };

export interface DraftMediaClient {
  upload(
    file: File,
    onProgress: (progress: UploadProgress) => void,
    signal?: AbortSignal,
  ): Promise<DraftUploadResult>;
  createPreview(reference: DraftMediaReference, signal?: AbortSignal): Promise<DraftPreviewResult>;
  delete(
    reference: DraftMediaReference,
    guard: DraftDeleteGuard,
    signal?: AbortSignal,
  ): Promise<DraftDeleteResult>;
}
