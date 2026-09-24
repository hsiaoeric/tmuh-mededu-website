import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import {
  assertObjectAbsent,
  cleanup,
  createCleanupJournal,
  provision,
  recordObjectCandidate,
  requireDenied,
  requireSuccess,
  runWithCleanup,
  StorageHarnessError,
  uploadTracked,
} from './cms-storage-harness-support.mjs';

const TEN_MIB = 10485760;
const TEST_PASSWORD = 'Local-storage-test-2026!';
const CLIENT_OPTIONS = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};

function configuration() {
  const url = process.env.SUPABASE_URL ?? process.env.API_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (url === undefined || anonKey === undefined || serviceRoleKey === undefined) return null;

  const parsed = new URL(url);
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    throw new StorageHarnessError('Storage API harness refuses non-local Supabase URLs');
  }
  return { url, anonKey, serviceRoleKey };
}

function objectPath(ownerId, bytes, extension) {
  return `${ownerId}/${createHash('sha256').update(bytes).digest('hex')}.${extension}`;
}

async function signIn(client, email) {
  requireSuccess(`sign in ${email}`, await client.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  }));
}

async function run(config) {
  const service = createClient(config.url, config.serviceRoleKey, CLIENT_OPTIONS);
  const adminClient = createClient(config.url, config.anonKey, CLIENT_OPTIONS);
  const readerClient = createClient(config.url, config.anonKey, CLIENT_OPTIONS);
  const anonymousClient = createClient(config.url, config.anonKey, CLIENT_OPTIONS);
  const journal = createCleanupJournal();

  await runWithCleanup(async () => {
    const runId = randomUUID();
    const fixture = await provision(service, journal, {
      adminEmail: `storage-admin-${runId}@example.test`,
      readerEmail: `storage-reader-${runId}@example.test`,
      password: TEST_PASSWORD,
    });
    await signIn(adminClient, `storage-admin-${runId}@example.test`);
    await signIn(readerClient, `storage-reader-${runId}@example.test`);

    const jpeg = readFileSync(new URL('../../../public/assets/hero.jpg', import.meta.url));
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    const webp = Buffer.from('UklGRiIAAABXRUJQVlA4IC4AAACwAQCdASoBAAEALmk0mk0iIiIiIgBoSygABc6zbAAA', 'base64');
    const jpegAtLimit = Buffer.alloc(TEN_MIB);
    jpeg.copy(jpegAtLimit);
    const draftPaths = [];
    const valid = [
      [jpegAtLimit, 'jpg', 'image/jpeg'],
      [png, 'png', 'image/png'],
      [webp, 'webp', 'image/webp'],
    ];

    for (const [bytes, extension, contentType] of valid) {
      const path = objectPath(fixture.admin.id, bytes, extension);
      requireSuccess(`upload ${contentType}`, await uploadTracked(adminClient, journal, {
        bucket: 'draft-media', path, bytes, contentType,
      }));
      draftPaths.push(path);
      requireSuccess(`download ${contentType}`, await adminClient.storage.from('draft-media').download(path));
    }

    const oversized = Buffer.alloc(10485761);
    jpeg.copy(oversized);
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
    const html = Buffer.from('<!doctype html><title>x</title>');
    const gif = Buffer.from('GIF89a');
    const denied = [
      ['oversize', oversized, objectPath(fixture.admin.id, oversized, 'jpg'), 'image/jpeg'],
      ['SVG', svg, objectPath(fixture.admin.id, svg, 'jpg'), 'image/svg+xml'],
      ['HTML', html, objectPath(fixture.admin.id, html, 'jpg'), 'text/html'],
      ['unsupported MIME', gif, objectPath(fixture.admin.id, gif, 'jpg'), 'image/gif'],
      ['MIME extension mismatch', png, objectPath(fixture.admin.id, png, 'jpg'), 'image/png'],
      ['traversal', jpeg, `${fixture.admin.id}/../${createHash('sha256').update('traversal').digest('hex')}.jpg`, 'image/jpeg'],
      ['empty segment', jpeg, `${fixture.admin.id}//${createHash('sha256').update('empty').digest('hex')}.jpg`, 'image/jpeg'],
      ['malformed path', jpeg, `${fixture.admin.id}/not-content-addressed.jpg`, 'image/jpeg'],
    ];
    for (const [label, bytes, path, contentType] of denied) {
      requireDenied(label, await uploadTracked(adminClient, journal, {
        bucket: 'draft-media', path, bytes, contentType,
      }));
      await assertObjectAbsent(service, 'draft-media', path);
    }

    const readerPath = objectPath(fixture.reader.id, jpeg, 'jpg');
    requireDenied('non-admin upload', await uploadTracked(readerClient, journal, {
      bucket: 'draft-media', path: readerPath, bytes: jpeg, contentType: 'image/jpeg',
    }));
    await assertObjectAbsent(service, 'draft-media', readerPath);
    requireDenied('non-admin draft read', await readerClient.storage.from('draft-media').download(draftPaths[0]));
    const anonymousPath = objectPath('00000000-0000-0000-0000-000000000000', jpeg, 'jpg');
    requireDenied('anonymous upload', await uploadTracked(anonymousClient, journal, {
      bucket: 'draft-media', path: anonymousPath, bytes: jpeg, contentType: 'image/jpeg',
    }));
    await assertObjectAbsent(service, 'draft-media', anonymousPath);

    const publicPath = `sha256/${createHash('sha256').update(jpeg).digest('hex')}.jpg`;
    requireSuccess('create local public fixture', await uploadTracked(service, journal, {
      bucket: 'public-media', path: publicPath, bytes: jpeg, contentType: 'image/jpeg',
    }));
    requireDenied('public overwrite', await uploadTracked(adminClient, journal, {
      bucket: 'public-media', path: publicPath, bytes: jpeg, contentType: 'image/jpeg', upsert: true,
    }));
    requireDenied('public delete', await adminClient.storage.from('public-media').remove([publicPath]));
    const copiedPath = `sha256/${createHash('sha256').update('copy').digest('hex')}.jpg`;
    recordObjectCandidate(journal, 'public-media', copiedPath);
    requireDenied('public copy', await adminClient.storage.from('draft-media').copy(draftPaths[0], copiedPath, {
      destinationBucket: 'public-media',
    }));
    await assertObjectAbsent(service, 'public-media', copiedPath);

    const publicUrl = anonymousClient.storage.from('public-media').getPublicUrl(publicPath).data.publicUrl;
    const publicResponse = await fetch(publicUrl, { signal: AbortSignal.timeout(10000) });
    if (!publicResponse.ok) throw new StorageHarnessError(`public read returned HTTP ${publicResponse.status}`);

    requireSuccess('admin draft delete', await adminClient.storage.from('draft-media').remove([draftPaths[1]]));
    await assertObjectAbsent(service, 'draft-media', draftPaths[1]);
  }, async () => cleanup(service, journal));
}

const config = configuration();
if (config === null) {
  console.error(JSON.stringify({ status: 'BLOCKED', reason: 'Set local SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY (or API_URL, ANON_KEY, SERVICE_ROLE_KEY from supabase status -o env).' }));
  process.exitCode = 2;
} else {
  run(config)
    .then(() => console.log(JSON.stringify({ status: 'PASS', proof: 'live-local-storage-api' })))
    .catch((error) => {
      const message = error instanceof Error ? error.message : 'unknown harness failure';
      console.error(JSON.stringify({ status: 'FAIL', message }));
      process.exitCode = 1;
    });
}
