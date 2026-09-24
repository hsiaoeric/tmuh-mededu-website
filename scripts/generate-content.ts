import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildArtifacts } from './content/artifacts';

const SNAPSHOT_PATH = fileURLToPath(
  new URL('../src/content/generated/cms-snapshot.json', import.meta.url),
);
const SEED_PATH = fileURLToPath(new URL('../supabase/seed.sql', import.meta.url));

class ArtifactMismatchError extends Error {
  constructor(path: string) {
    super(`Generated content is stale: ${path}`);
    this.name = 'ArtifactMismatchError';
  }
}

async function checkFile(path: string, expected: string): Promise<void> {
  const current = await readFile(path, 'utf8');
  if (current !== expected) throw new ArtifactMismatchError(path);
}

async function main(): Promise<void> {
  const artifacts = buildArtifacts();
  if (process.argv.includes('--check')) {
    await Promise.all([
      checkFile(SNAPSHOT_PATH, artifacts.snapshot),
      checkFile(SEED_PATH, artifacts.sql),
    ]);
    return;
  }
  await Promise.all([
    writeFile(SNAPSHOT_PATH, artifacts.snapshot, 'utf8'),
    writeFile(SEED_PATH, artifacts.sql, 'utf8'),
  ]);
}

await main();
