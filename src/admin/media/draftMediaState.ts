import type { DraftMediaReference } from '@/content/media';
import type {
  DraftDeleteGuard,
  DraftMediaClient,
  DraftMediaFailure,
  UploadProgress,
} from './types';
import type { DraftMediaOwnershipScope } from './draftMediaOwnership';

export type DraftMediaState = {
  readonly status: 'idle' | 'uploading' | 'signing' | 'ready' | 'removing' | 'error';
  readonly reference: DraftMediaReference | null;
  readonly previewUrl: string | null;
  readonly previewExpiresAt: number | null;
  readonly progress: UploadProgress | null;
  readonly failure: DraftMediaFailure | null;
  readonly failureOperation: 'upload' | 'preview' | 'cleanup' | null;
  readonly unresolvedReferences: readonly DraftMediaReference[];
};

export type DraftMediaController = {
  readonly state: DraftMediaState;
  readonly replace: (file: File) => Promise<void>;
  readonly unlink: () => void;
  readonly deleteFromStorage: (guard: DraftDeleteGuard) => Promise<void>;
};

export type DraftMediaOptions = {
  readonly client: DraftMediaClient;
  readonly ownershipScope: DraftMediaOwnershipScope;
  readonly initialReference?: DraftMediaReference;
  readonly initialPreviewUrl?: string;
  readonly initialPreviewExpiresAt?: number;
};

export function initialDraftMediaState(
  options: DraftMediaOptions,
  unresolvedReferences: readonly DraftMediaReference[],
): DraftMediaState {
  return {
    status: options.initialReference === undefined ? 'idle' : 'ready',
    reference: options.initialReference ?? null,
    previewUrl: options.initialPreviewUrl ?? null,
    previewExpiresAt: options.initialPreviewExpiresAt ?? null,
    progress: null,
    failure: null,
    failureOperation: null,
    unresolvedReferences,
  };
}
