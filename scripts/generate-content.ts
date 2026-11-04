import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LegacyRedirectTable } from '../src/app/legacyPaths';
import { buildArtifacts } from './content/artifacts';
import { renderRedirectTsv, renderVercelConfig } from './content/legacy/vercelRedirects';

const SNAPSHOT_PATH = fileURLToPath(
  new URL('../src/content/generated/cms-snapshot.json', import.meta.url),
);
const SEED_PATH = fileURLToPath(new URL('../supabase/seed.sql', import.meta.url));
const REDIRECTS_PATH = fileURLToPath(new URL('../src/data/legacy/redirects.json', import.meta.url));
const VERCEL_PATH = fileURLToPath(new URL('../vercel.json', import.meta.url));
const TSV_PATH = fileURLToPath(new URL('../deploy/legacy-redirects.tsv', import.meta.url));

class ArtifactMismatchError extends Error {
  constructor(path: string) {
    super(`Generated content is stale: ${path}`);
    this.name = 'ArtifactMismatchError';
  }
}

async function checkFile(path: string, expected: string): Promise<void> {
  const current = await readFile(path, 'utf8').catch(() => undefined);
  if (current !== expected) throw new ArtifactMismatchError(path);
}

async function main(): Promise<void> {
  const artifacts = buildArtifacts();
  const redirects = JSON.parse(await readFile(REDIRECTS_PATH, 'utf8')) as LegacyRedirectTable;
  const files: readonly (readonly [string, string])[] = [
    [SNAPSHOT_PATH, artifacts.snapshot],
    [SEED_PATH, artifacts.sql],
    [VERCEL_PATH, renderVercelConfig(await readFile(VERCEL_PATH, 'utf8'), redirects)],
    [TSV_PATH, renderRedirectTsv(redirects)],
  ];
  if (process.argv.includes('--check')) {
    await Promise.all(files.map(([path, expected]) => checkFile(path, expected)));
    return;
  }
  await Promise.all(files.map(async ([path, content]) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf8');
  }));
}

await main();
