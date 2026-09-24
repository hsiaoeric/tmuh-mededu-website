import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { PublishedContentRepository } from '../../src/content/domain';
import { ContentBoundaryError } from '../../src/content/errors';
import { createSupabaseContentRepositoryFromRequest } from '../../src/content/supabaseRepository';
import {
  CheckpointFileCleanupError,
  checkpointPublishedContent,
  nodeCheckpointFileSystem,
  type CheckpointFileCleanupStage,
  type CheckpointFileHandle,
  type CheckpointFileSystem,
} from './checkpoint-file';
import { checkpointBatch, checkpointContent, checkpointRepository } from './checkpoint.test-fixtures';

type FailureStep = 'write' | 'sync' | 'close' | 'rename';
type PrimaryFailure = {
  readonly step: FailureStep;
  readonly reason: unknown;
};
type CleanupFailure = {
  readonly stage: CheckpointFileCleanupStage;
  readonly mode: 'throw' | 'reject';
  readonly reason: unknown;
};
type FakeCheckpointFileSystemOptions = {
  readonly primaryFailure?: PrimaryFailure;
  readonly cleanupFailures?: readonly CleanupFailure[];
};

class FakeCheckpointFileSystem implements CheckpointFileSystem {
  readonly calls: string[] = [];
  targetBytes = 'original bytes';
  temporaryBytes: string | undefined;
  private primaryFailureOccurred = false;

  constructor(private readonly options: FakeCheckpointFileSystemOptions = {}) {}

  private primaryFailureFor(step: FailureStep): PrimaryFailure | undefined {
    const failure = this.options.primaryFailure;
    if (this.primaryFailureOccurred || failure?.step !== step) return undefined;
    this.primaryFailureOccurred = true;
    return failure;
  }

  private cleanupFailureFor(stage: CheckpointFileCleanupStage): CleanupFailure | undefined {
    return this.options.cleanupFailures?.find((failure) => failure.stage === stage);
  }

  async openTemporary(targetPath: string): Promise<CheckpointFileHandle> {
    this.calls.push('open');
    const path = `${targetPath}.test.tmp`;
    this.temporaryBytes = '';
    return {
      path,
      write: (bytes) => {
        this.calls.push('write');
        const failure = this.primaryFailureFor('write');
        if (failure !== undefined) return Promise.reject(failure.reason);
        this.temporaryBytes = bytes;
        return Promise.resolve();
      },
      sync: () => {
        this.calls.push('sync');
        const failure = this.primaryFailureFor('sync');
        if (failure !== undefined) return Promise.reject(failure.reason);
        return Promise.resolve();
      },
      close: () => {
        this.calls.push('close');
        const primaryFailure = this.primaryFailureFor('close');
        if (primaryFailure !== undefined) return Promise.reject(primaryFailure.reason);
        const cleanupFailure = this.cleanupFailureFor('close');
        if (cleanupFailure?.mode === 'throw') throw cleanupFailure.reason;
        if (cleanupFailure?.mode === 'reject') return Promise.reject(cleanupFailure.reason);
        return Promise.resolve();
      },
    };
  }

  renameTemporary(_temporaryPath: string, _targetPath: string): Promise<void> {
    this.calls.push('rename');
    const failure = this.primaryFailureFor('rename');
    if (failure !== undefined) return Promise.reject(failure.reason);
    this.targetBytes = this.temporaryBytes ?? '';
    this.temporaryBytes = undefined;
    return Promise.resolve();
  }

  removeTemporary(_temporaryPath: string): Promise<void> {
    this.calls.push('remove');
    const cleanupFailure = this.cleanupFailureFor('remove');
    if (cleanupFailure?.mode === 'throw') throw cleanupFailure.reason;
    if (cleanupFailure?.mode === 'reject') return Promise.reject(cleanupFailure.reason);
    this.temporaryBytes = undefined;
    return Promise.resolve();
  }
}

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, {
    recursive: true,
    force: true,
  })));
});

describe('checkpointPublishedContent', () => {
  it('does not touch the filesystem when the repository request rejects', async () => {
    // Given
    const fileSystem = new FakeCheckpointFileSystem();
    const repository: PublishedContentRepository = {
      listPublished: () => Promise.reject(new TypeError('request failed')),
    };

    // When
    const checkpoint = checkpointPublishedContent({
      repository,
      fileSystem,
      targetPath: '/content/cms-snapshot.json',
    });

    // Then
    await expect(checkpoint).rejects.toThrow('request failed');
    expect(fileSystem.calls).toEqual([]);
    expect(fileSystem.targetBytes).toBe('original bytes');
  });

  it('does not touch the filesystem when repository response parsing rejects', async () => {
    // Given
    const fileSystem = new FakeCheckpointFileSystem();
    const repository = createSupabaseContentRepositoryFromRequest(() => Promise.resolve({
      data: { partial: true },
      error: null,
    }));

    // When
    const checkpoint = checkpointPublishedContent({
      repository,
      fileSystem,
      targetPath: '/content/cms-snapshot.json',
    });

    // Then
    await expect(checkpoint).rejects.toBeInstanceOf(ContentBoundaryError);
    expect(fileSystem.calls).toEqual([]);
    expect(fileSystem.targetBytes).toBe('original bytes');
  });

  it('rejects an incomplete batch before opening a temporary file', async () => {
    // Given
    const fileSystem = new FakeCheckpointFileSystem();
    const repository = checkpointRepository(checkpointBatch(checkpointContent().slice(1)));

    // When
    const checkpoint = checkpointPublishedContent({
      repository,
      fileSystem,
      targetPath: '/content/cms-snapshot.json',
    });

    // Then
    await expect(checkpoint).rejects.toThrow('must contain exactly 12 rows');
    expect(fileSystem.calls).toEqual([]);
    expect(fileSystem.targetBytes).toBe('original bytes');
    expect(fileSystem.temporaryBytes).toBeUndefined();
  });

  it.each(['write', 'sync', 'close', 'rename'] as const)(
    'preserves target bytes and removes the temp when %s fails',
    async (failureStep) => {
      // Given
      const failure = new TypeError(`${failureStep} failed`);
      const fileSystem = new FakeCheckpointFileSystem({
        primaryFailure: { step: failureStep, reason: failure },
      });

      // When
      const checkpoint = checkpointPublishedContent({
        repository: checkpointRepository(),
        fileSystem,
        targetPath: '/content/cms-snapshot.json',
      });

      // Then
      await expect(checkpoint).rejects.toBe(failure);
      expect(fileSystem.targetBytes).toBe('original bytes');
      expect(fileSystem.temporaryBytes).toBeUndefined();
      expect(fileSystem.calls.at(-1)).toBe('remove');
    },
  );

  it('preserves an undefined primary rejection when cleanup succeeds', async () => {
    // Given
    const fileSystem = new FakeCheckpointFileSystem({
      primaryFailure: { step: 'write', reason: undefined },
    });

    // When
    const checkpoint = checkpointPublishedContent({
      repository: checkpointRepository(),
      fileSystem,
      targetPath: '/content/cms-snapshot.json',
    });

    // Then
    await expect(checkpoint).rejects.toBeUndefined();
    expect(fileSystem.calls).toEqual(['open', 'write', 'close', 'remove']);
    expect(fileSystem.targetBytes).toBe('original bytes');
    expect(fileSystem.temporaryBytes).toBeUndefined();
  });

  it.each([
    {
      description: 'retry close throws synchronously',
      cleanupFailures: [{ stage: 'close', mode: 'throw', reason: new TypeError('close cleanup failed') }],
      failedStages: ['close'],
      temporaryBytes: undefined,
    },
    {
      description: 'temp removal rejects',
      cleanupFailures: [{ stage: 'remove', mode: 'reject', reason: new TypeError('remove cleanup failed') }],
      failedStages: ['remove'],
      temporaryBytes: '',
    },
    {
      description: 'retry close throws and temp removal rejects',
      cleanupFailures: [
        { stage: 'close', mode: 'throw', reason: new TypeError('close cleanup failed') },
        { stage: 'remove', mode: 'reject', reason: new TypeError('remove cleanup failed') },
      ],
      failedStages: ['close', 'remove'],
      temporaryBytes: '',
    },
  ] satisfies readonly { readonly description: string; readonly cleanupFailures: readonly CleanupFailure[]; readonly failedStages: readonly CheckpointFileCleanupStage[]; readonly temporaryBytes: string | undefined }[])('reports failed cleanup stages when $description', async (cleanupCase) => {
    // Given
    const primaryFailure = new TypeError('write failed');
    const fileSystem = new FakeCheckpointFileSystem({
      primaryFailure: { step: 'write', reason: primaryFailure },
      cleanupFailures: cleanupCase.cleanupFailures,
    });

    // When
    const checkpoint = checkpointPublishedContent({
      repository: checkpointRepository(),
      fileSystem,
      targetPath: '/content/cms-snapshot.json',
    });

    // Then
    try {
      await checkpoint;
      throw new TypeError('checkpoint should reject');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(CheckpointFileCleanupError);
      if (!(error instanceof CheckpointFileCleanupError)) throw error;
      expect(error.message).toBe('Checkpoint file cleanup failed');
      expect(error.cause).toBe(primaryFailure);
      expect(error.failedStages).toEqual(cleanupCase.failedStages);
    }
    expect(fileSystem.calls).toEqual(['open', 'write', 'close', 'remove']);
    expect(fileSystem.targetBytes).toBe('original bytes');
    expect(fileSystem.temporaryBytes).toBe(cleanupCase.temporaryBytes);
  });

  it('writes, syncs, closes, and renames in that order on success', async () => {
    // Given
    const fileSystem = new FakeCheckpointFileSystem();

    // When
    await checkpointPublishedContent({
      repository: checkpointRepository(),
      fileSystem,
      targetPath: '/content/cms-snapshot.json',
    });

    // Then
    expect(fileSystem.calls).toEqual(['open', 'write', 'sync', 'close', 'rename']);
    expect(fileSystem.targetBytes).toMatch(/^\[\n/);
  });

  it('atomically replaces a real target through a same-directory unique temp', async () => {
    // Given
    const directory = await mkdtemp(join(tmpdir(), 'cms-checkpoint-'));
    temporaryDirectories.push(directory);
    const targetPath = join(directory, 'cms-snapshot.json');
    await writeFile(targetPath, 'original bytes', 'utf8');

    // When
    await checkpointPublishedContent({
      repository: checkpointRepository(),
      fileSystem: nodeCheckpointFileSystem,
      targetPath,
    });

    // Then
    expect(await readFile(targetPath, 'utf8')).toMatch(/^\[\n/);
    expect(await readdir(directory)).toEqual(['cms-snapshot.json']);
  });
});
