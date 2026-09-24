import type { PublishedMediaReference } from '@/content/media/references';
import { assetUrl } from '@/utils/asset';

export type PublicMediaLocation = {
  readonly baseUrl: string;
  readonly supabaseUrl: string;
};

function assertNever(value: never): never {
  throw new TypeError(`Unexpected published media kind: ${String(value)}`);
}

export function resolvePublishedMediaUrl(
  reference: PublishedMediaReference,
  location: PublicMediaLocation,
): string {
  switch (reference.kind) {
    case 'local':
      return assetUrl(reference.path, location.baseUrl);
    case 'public': {
      const projectUrl = location.supabaseUrl.replace(/\/+$/, '');
      if (projectUrl.length === 0) return '';
      const objectPath = [reference.bucket, ...reference.path.split('/')]
        .map(encodeURIComponent)
        .join('/');
      return `${projectUrl}/storage/v1/object/public/${objectPath}`;
    }
    default:
      return assertNever(reference);
  }
}
