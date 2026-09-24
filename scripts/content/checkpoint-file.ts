import { randomUUID } from 'node:crypto';
import { open, rename, unlink } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import type { PublishedContentRepository } from '../../src/content/domain';
import { renderCheckpointSnapshot } from './checkpoint-render';

export type CheckpointFileHandle = {
  readonly path: string;
  readonly write: (bytes: string) => Promise<void>;
  readonly sync: () => Promise<void>;
  readonly close: () => Promise<void>;
};

export interface CheckpointFileSystem {
  openTemporary(targetPath: string): Promise<CheckpointFileHandle>;
  renameTemporary(temporaryPath: string, targetPath: string): Promise<void>;
  removeTemporary(temporaryPath: string): Promise<void>;
}

export type CheckpointRequest = {
  readonly repository: PublishedContentRepository;
  readonly fileSystem: CheckpointFileSystem;
  readonly targetPath: string;
};

export const CHECKPOINT_FILE_CLEANUP_STAGES = ['close', 'remove'] as const;

export type CheckpointFileCleanupStage = (typeof CHECKPOINT_FILE_CLEANUP_STAGES)[number];

export class CheckpointFileCleanupError extends Error {
  readonly name = 'CheckpointFileCleanupError';

  constructor(
    readonly failedStages: readonly CheckpointFileCleanupStage[],
    cause: unknown,
  ) {
    super('Checkpoint file cleanup failed', { cause });
  }
}

function cleanupStage(
  stage: CheckpointFileCleanupStage,
  operation: () => Promise<void>,
): Promise<CheckpointFileCleanupStage | undefined> {
  return Promise.resolve()
    .then(operation)
    .then(
      () => undefined,
      () => stage,
    );
}

export const nodeCheckpointFileSystem: CheckpointFileSystem = {
  async openTemporary(targetPath) {
    const directory = dirname(targetPath);
    const temporaryPath = join(
      directory,
      `.${basename(targetPath)}.${process.pid}.${randomUUID()}.tmp`,
    );
    const handle = await open(temporaryPath, 'wx', 0o600);
    return {
      path: temporaryPath,
      write: (bytes) => handle.writeFile(bytes, 'utf8'),
      sync: () => handle.sync(),
      close: () => handle.close(),
    };
  },
  renameTemporary: rename,
  removeTemporary: unlink,
};

export async function checkpointPublishedContent(request: CheckpointRequest): Promise<void> {
  const batch = await request.repository.listPublished(new AbortController().signal);
  const bytes = renderCheckpointSnapshot(batch);
  const temporary = await request.fileSystem.openTemporary(request.targetPath);
  let closed = false;

  try {
    await temporary.write(bytes);
    await temporary.sync();
    await temporary.close();
    closed = true;
    await request.fileSystem.renameTemporary(temporary.path, request.targetPath);
  } catch (error: unknown) {
    const failedCleanupStages: CheckpointFileCleanupStage[] = [];
    if (!closed) {
      const retryCloseFailure = await cleanupStage('close', () => temporary.close());
      if (retryCloseFailure !== undefined) failedCleanupStages.push(retryCloseFailure);
    }
    const removalFailure = await cleanupStage('remove', () => (
      request.fileSystem.removeTemporary(temporary.path)
    ));
    if (removalFailure !== undefined) failedCleanupStages.push(removalFailure);
    if (failedCleanupStages.length > 0) {
      throw new CheckpointFileCleanupError(failedCleanupStages, error);
    }
    throw error;
  }
}
