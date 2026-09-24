export class StorageHarnessError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'StorageHarnessError';
  }
}

const AUTH_PAGE_SIZE = 50;
const AUTH_MAX_PAGES = 100;

export function createCleanupJournal() {
  return {
    userIds: [],
    userEmails: [],
    allowlistedUserIds: [],
    objects: [],
  };
}

export function requireSuccess(label, result) {
  if (result.error !== null) {
    throw new StorageHarnessError(`${label}: ${result.error.message}`, result.error);
  }
  return result.data;
}

export function requireDenied(label, result) {
  if (result.error === null) {
    throw new StorageHarnessError(`${label}: operation unexpectedly succeeded`);
  }
  const status = Number(result.error.statusCode ?? result.error.status ?? 0);
  if (status < 400 || status >= 500) {
    throw new StorageHarnessError(`${label}: expected a 4xx SDK outcome, received ${status}`, result.error);
  }
}

export async function provision(service, journal, fixture) {
  journal.userEmails.push(fixture.adminEmail);
  const admin = requireSuccess('create admin fixture', await service.auth.admin.createUser({
    email: fixture.adminEmail,
    password: fixture.password,
    email_confirm: true,
  })).user;
  journal.userIds.push(admin.id);
  journal.userEmails.push(fixture.readerEmail);
  const reader = requireSuccess('create reader fixture', await service.auth.admin.createUser({
    email: fixture.readerEmail,
    password: fixture.password,
    email_confirm: true,
  })).user;
  journal.userIds.push(reader.id);
  journal.allowlistedUserIds.push(admin.id);
  requireSuccess('allowlist admin fixture', await service.from('cms_admins').insert({
    user_id: admin.id,
    created_by: admin.id,
  }));
  return { admin, reader };
}

export function recordObjectCandidate(journal, bucket, path) {
  journal.objects.push({ bucket, path });
}

export async function uploadTracked(client, journal, request) {
  recordObjectCandidate(journal, request.bucket, request.path);
  return client.storage.from(request.bucket).upload(request.path, request.bytes, {
    contentType: request.contentType,
    upsert: request.upsert ?? false,
  });
}

function isObjectNotFound(error) {
  const status = Number(error.status ?? error.statusCode ?? 0);
  const hasNotFoundMarker = error.code === 'NoSuchKey'
    || error.error === 'not_found'
    || error.message === 'Object not found'
    || error.message === 'The resource was not found';
  return status === 404 && hasNotFoundMarker;
}

export async function assertObjectAbsent(service, bucket, path) {
  const result = await service.storage.from(bucket).download(path);
  if (result.error === null) {
    throw new StorageHarnessError(`${bucket}/${path}: denied operation created an object`);
  }
  if (!isObjectNotFound(result.error)) {
    throw new StorageHarnessError(`${bucket}/${path}: absence check failed: ${result.error.message}`, result.error);
  }
}

async function discoverCandidateUsers(service, journal, authCleanup) {
  if (journal.userEmails.length === 0) return;
  const candidateEmails = new Set(journal.userEmails);
  for (let page = 1; page <= AUTH_MAX_PAGES; page += 1) {
    let result;
    try {
      result = await service.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
    } catch (error) {
      authCleanup.failures.push(error instanceof Error
        ? error
        : new StorageHarnessError(`unknown user discovery failure on page ${page}`));
      return;
    }
    if (result.error !== null) {
      authCleanup.failures.push(new StorageHarnessError(
        `list users page ${page}: ${result.error.message}`,
        result.error,
      ));
      return;
    }
    for (const user of result.data.users) {
      if (candidateEmails.has(user.email)) authCleanup.userIds.add(user.id);
    }
    if (result.data.users.length < AUTH_PAGE_SIZE) return;
  }
  authCleanup.failures.push(new StorageHarnessError(
    `user discovery exceeded ${AUTH_MAX_PAGES} pages`,
  ));
}

export async function cleanup(service, journal) {
  const failures = [];
  for (const candidate of journal.objects) {
    try {
      const result = await service.storage.from(candidate.bucket).remove([candidate.path]);
      if (result.error !== null && !isObjectNotFound(result.error)) {
        failures.push(new StorageHarnessError(`${candidate.bucket}/${candidate.path}: ${result.error.message}`, result.error));
      }
    } catch (error) {
      failures.push(error instanceof Error ? error : new StorageHarnessError(`unknown object cleanup failure: ${candidate.bucket}/${candidate.path}`));
    }
  }
  for (const userId of journal.allowlistedUserIds) {
    try {
      const result = await service.from('cms_admins').delete().eq('user_id', userId);
      if (result.error !== null) {
        failures.push(new StorageHarnessError(`allowlist ${userId}: ${result.error.message}`, result.error));
      }
    } catch (error) {
      failures.push(error instanceof Error ? error : new StorageHarnessError(`unknown allowlist cleanup failure: ${userId}`));
    }
  }
  const authCleanup = { userIds: new Set(journal.userIds), failures };
  await discoverCandidateUsers(service, journal, authCleanup);
  for (const userId of authCleanup.userIds) {
    try {
      const result = await service.auth.admin.deleteUser(userId);
      if (result.error !== null) {
        failures.push(new StorageHarnessError(`user ${userId}: ${result.error.message}`, result.error));
      }
    } catch (error) {
      failures.push(error instanceof Error ? error : new StorageHarnessError(`unknown user cleanup failure: ${userId}`));
    }
  }
  if (failures.length > 0) {
    throw new AggregateError(failures, `cleanup failed: ${failures.map((error) => error.message).join('; ')}`);
  }
}

export async function runWithCleanup(work, cleanupWork) {
  let primaryFailure = null;
  try {
    await work();
  } catch (error) {
    primaryFailure = error instanceof Error ? error : new StorageHarnessError('unknown harness failure');
  }
  let cleanupFailure = null;
  try {
    await cleanupWork();
  } catch (error) {
    cleanupFailure = error instanceof Error ? error : new StorageHarnessError('unknown cleanup failure');
  }
  if (primaryFailure !== null && cleanupFailure !== null) {
    throw new AggregateError(
      [primaryFailure, cleanupFailure],
      `harness failed: ${primaryFailure.message}; cleanup failed: ${cleanupFailure.message}`,
    );
  }
  if (primaryFailure !== null) throw primaryFailure;
  if (cleanupFailure !== null) throw cleanupFailure;
}
