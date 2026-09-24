import { fileURLToPath } from 'node:url';
import { checkpointPublishedContent, nodeCheckpointFileSystem } from './content/checkpoint-file';
import { runCheckpointCommand } from './content/checkpoint-command';
import { formatCheckpointError } from './content/checkpoint-error';
import { createSupabaseCheckpointSession } from './content/checkpoint-supabase';

const SNAPSHOT_PATH = fileURLToPath(
  new URL('../src/content/generated/cms-snapshot.json', import.meta.url),
);

try {
  await runCheckpointCommand({
    environment: process.env,
    createSession: createSupabaseCheckpointSession,
    checkpoint: (repository) => checkpointPublishedContent({
      repository,
      fileSystem: nodeCheckpointFileSystem,
      targetPath: SNAPSHOT_PATH,
    }),
  });
} catch (error: unknown) {
  console.error(formatCheckpointError(error));
  process.exitCode = 1;
}
