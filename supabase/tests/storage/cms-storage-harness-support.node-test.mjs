import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertObjectAbsent,
  cleanup,
  createCleanupJournal,
  provision,
  runWithCleanup,
  uploadTracked,
} from './cms-storage-harness-support.mjs';

const fixture = {
  adminEmail: 'admin@example.test',
  readerEmail: 'reader@example.test',
  password: 'test-only-password',
};

function fakeProvisioningService(failureStep, initialUsers = []) {
  const state = {
    users: new Map(initialUsers.map((user) => [user.id, user.email])),
    allowlist: new Set(),
    userSequence: 0,
    listCalls: [],
    deleteCalls: [],
  };
  return {
    state,
    auth: {
      admin: {
        async createUser(request) {
          state.userSequence += 1;
          if (failureStep === 'reader' && state.userSequence === 2) {
            return { data: null, error: new Error('reader creation failed') };
          }
          const user = {
            id: state.userSequence === 1 ? 'admin-id' : 'reader-id',
            email: request.email,
          };
          state.users.set(user.id, user.email);
          if (failureStep === 'admin-response-lost' && state.userSequence === 1) {
            throw new TypeError('response lost');
          }
          if (failureStep === 'reader-response-lost' && state.userSequence === 2) {
            throw new TypeError('response lost');
          }
          return { data: { user }, error: null };
        },
        async listUsers({ page, perPage }) {
          state.listCalls.push({ page, perPage });
          if (failureStep === 'list-users') {
            return { data: { users: [] }, error: new Error('list users failed') };
          }
          const users = [...state.users].map(([id, email]) => ({ id, email }));
          const offset = (page - 1) * perPage;
          return { data: { users: users.slice(offset, offset + perPage) }, error: null };
        },
        async deleteUser(userId) {
          state.deleteCalls.push(userId);
          state.users.delete(userId);
          return { data: {}, error: null };
        },
      },
    },
    from() {
      return {
        async insert(row) {
          if (failureStep === 'allowlist') {
            return { data: null, error: new Error('allowlist insertion failed') };
          }
          state.allowlist.add(row.user_id);
          return { data: {}, error: null };
        },
        delete() {
          return {
            async eq(_column, userId) {
              state.allowlist.delete(userId);
              return { data: {}, error: null };
            },
          };
        },
      };
    },
    storage: {
      from() {
        return { async remove() { return { data: [], error: null }; } };
      },
    },
  };
}

test('cleanup removes the admin when reader provisioning fails', async () => {
  // Given
  const service = fakeProvisioningService('reader');
  const journal = createCleanupJournal();

  // When
  await assert.rejects(provision(service, journal, fixture), /reader creation failed/);
  await cleanup(service, journal);

  // Then
  assert.deepEqual([...service.state.users.keys()], []);
});

test('cleanup removes both users when allowlist provisioning fails', async () => {
  // Given
  const service = fakeProvisioningService('allowlist');
  const journal = createCleanupJournal();

  // When
  await assert.rejects(provision(service, journal, fixture), /allowlist insertion failed/);
  await cleanup(service, journal);

  // Then
  assert.deepEqual([...service.state.users.keys()], []);
});

test('cleanup discovers the admin when create commits before losing its response', async () => {
  // Given
  const service = fakeProvisioningService('admin-response-lost');
  const journal = createCleanupJournal();

  // When
  await assert.rejects(provision(service, journal, fixture), /response lost/);
  await cleanup(service, journal);

  // Then
  assert.deepEqual([...service.state.users.keys()], []);
});

test('cleanup discovers the reader when create commits before losing its response', async () => {
  // Given
  const service = fakeProvisioningService('reader-response-lost');
  const journal = createCleanupJournal();

  // When
  await assert.rejects(provision(service, journal, fixture), /response lost/);
  await cleanup(service, journal);

  // Then
  assert.deepEqual([...service.state.users.keys()], []);
});

test('cleanup preserves listUsers failure instead of claiming success', async () => {
  // Given
  const service = fakeProvisioningService('list-users');
  const journal = createCleanupJournal();
  journal.userEmails = [fixture.adminEmail];

  // When
  const outcome = cleanup(service, journal);

  // Then
  await assert.rejects(outcome, /list users failed/);
});

test('cleanup paginates exact email discovery and deduplicates known IDs', async () => {
  // Given
  const unrelated = Array.from({ length: 50 }, (_, index) => ({
    id: `unrelated-${index}`,
    email: `unrelated-${index}@example.test`,
  }));
  const service = fakeProvisioningService(null, [
    ...unrelated,
    { id: 'admin-id', email: fixture.adminEmail },
    { id: 'near-match', email: `prefix-${fixture.adminEmail}` },
  ]);
  const journal = createCleanupJournal();
  journal.userEmails = [fixture.adminEmail];
  journal.userIds.push('admin-id');

  // When
  await cleanup(service, journal);

  // Then
  assert.equal(service.state.listCalls.length, 2);
  assert.deepEqual(service.state.deleteCalls, ['admin-id']);
  assert.equal(service.state.users.has('near-match'), true);
});

test('cleanup removes an object committed before an ambiguous upload failure', async () => {
  // Given
  const objects = new Set();
  const journal = createCleanupJournal();
  const client = {
    storage: {
      from(bucket) {
        return {
          async upload(path) {
            objects.add(`${bucket}/${path}`);
            throw new TypeError('response lost');
          },
        };
      },
    },
  };
  const service = {
    storage: {
      from(bucket) {
        return {
          async remove(paths) {
            for (const path of paths) objects.delete(`${bucket}/${path}`);
            return { data: [], error: null };
          },
        };
      },
    },
    from() {
      throw new Error('allowlist cleanup should be unused');
    },
    auth: { admin: { deleteUser() { throw new Error('user cleanup should be unused'); } } },
  };

  // When
  await assert.rejects(uploadTracked(client, journal, {
    bucket: 'draft-media', path: 'owner/hash.jpg', bytes: Buffer.from('image'), contentType: 'image/jpeg',
  }), /response lost/);
  await cleanup(service, journal);

  // Then
  assert.deepEqual([...objects], []);
});

test('run failure reports both primary and cleanup errors', async () => {
  // Given
  const primary = new Error('primary failed');
  const cleanupFailure = new Error('cleanup failed');

  // When
  const failure = await runWithCleanup(
    async () => { throw primary; },
    async () => { throw cleanupFailure; },
  ).catch((error) => error);

  // Then
  assert.ok(failure instanceof AggregateError);
  assert.deepEqual(failure.errors.map((error) => error.message), ['primary failed', 'cleanup failed']);
});

function downloadService(error) {
  return {
    storage: {
      from() {
        return { async download() { return { data: null, error }; } };
      },
    },
  };
}

test('explicit Supabase object-not-found is accepted as absence', async () => {
  // Given
  const service = downloadService({ status: 404, statusCode: '404', code: 'NoSuchKey', message: 'Object not found' });

  // When
  const outcome = await assertObjectAbsent(service, 'draft-media', 'owner/missing.jpg');

  // Then
  assert.equal(outcome, undefined);
});

for (const [label, error] of [
  ['401', { status: 401, statusCode: '401', message: 'Invalid JWT' }],
  ['500', { status: 500, statusCode: '500', message: 'Internal error' }],
  ['network', new TypeError('fetch failed')],
]) {
  test(`${label} download failure is not accepted as absence`, async () => {
    // Given
    const service = downloadService(error);

    // When
    const outcome = assertObjectAbsent(service, 'draft-media', 'owner/unknown.jpg');

    // Then
    await assert.rejects(outcome);
  });
}
