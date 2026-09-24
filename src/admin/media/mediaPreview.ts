import { assertNever } from '@/admin/documents/assertNever';
import type { SupabaseConfig } from '@/content/env';
import type { LocalMediaReference, PublicMediaReference } from '@/content/media';
import { assetUrl } from '@/utils/asset';

type StoredMediaUrlInput = {
  readonly reference: LocalMediaReference | PublicMediaReference;
  readonly configuration?: SupabaseConfig;
  readonly baseUrl?: string;
};

export function resolveStoredMediaUrl(input: StoredMediaUrlInput): string | null {
  switch (input.reference.kind) {
    case 'local':
      return assetUrl(input.reference.path, input.baseUrl);
    case 'public': {
      if (input.configuration === undefined) return null;
      const projectUrl = input.configuration.url.replace(/\/+$/, '');
      const objectPath = [input.reference.bucket, ...input.reference.path.split('/')]
        .map(encodeURIComponent)
        .join('/');
      return `${projectUrl}/storage/v1/object/public/${objectPath}`;
    }
    default:
      return assertNever(input.reference, 'stored media reference');
  }
}
