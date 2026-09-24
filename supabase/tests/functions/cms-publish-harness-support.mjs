import { deflateSync } from 'node:zlib'

export class HarnessError extends Error {
  constructor(message, options) {
    super(message, options)
    this.name = 'HarnessError'
  }
}

export function createCleanupJournal() {
  return { userEmails: [], userIds: [], allowlistUserIds: [], objects: [], documentIds: [] }
}

export function requireData(label, result) {
  if (result.error !== null) throw new HarnessError(`${label} failed`, { cause: result.error })
  return result.data
}

function isNotFound(error) {
  const status = Number(error?.status ?? error?.statusCode ?? 0)
  return status === 404 || error?.code === 'NoSuchKey' || error?.error === 'not_found'
}

async function exactUser(service, email) {
  for (let page = 1; page <= 100; page += 1) {
    const result = await service.auth.admin.listUsers({ page, perPage: 50 })
    if (result.error !== null) throw new HarnessError('user recovery failed', { cause: result.error })
    const matches = result.data.users.filter((user) => user.email === email)
    if (matches.length > 1) throw new HarnessError('user recovery found duplicate exact emails')
    if (matches.length === 1) return matches[0]
    if (result.data.users.length < 50) return null
  }
  throw new HarnessError('user recovery exceeded pagination bound')
}

export async function createUserRecovering(service, journal, email, password) {
  journal.userEmails.push(email)
  let primaryError = null
  try {
    const result = await service.auth.admin.createUser({ email, password, email_confirm: true })
    if (result.error === null) {
      journal.userIds.push(result.data.user.id)
      return result.data.user
    }
    primaryError = result.error
  } catch (error) {
    primaryError = error
  }
  const recovered = await exactUser(service, email)
  if (recovered === null) throw new HarnessError('create user failed without recoverable exact email', { cause: primaryError })
  journal.userIds.push(recovered.id)
  return recovered
}

export async function uploadJournaled(bucketClient, journal, bucket, path, bytes, contentType) {
  journal.objects.push({ bucket, path })
  const result = await bucketClient.upload(path, bytes, { contentType, upsert: false })
  return requireData(`upload ${bucket}/${path}`, result)
}

export async function inspectPublicCandidate(bucketClient, journal, bucket, path) {
  const result = await bucketClient.download(path)
  if (result.error === null) return 'reused'
  if (!isNotFound(result.error)) throw new HarnessError(`inspect ${bucket}/${path} failed`, { cause: result.error })
  journal.objects.push({ bucket, path })
  return 'created'
}

async function attempt(failures, label, operation) {
  try {
    const result = await operation()
    if (result?.error !== null && result?.error !== undefined && !isNotFound(result.error)) {
      failures.push(new HarnessError(`${label} failed`, { cause: result.error }))
    }
  } catch (error) {
    failures.push(error instanceof Error ? error : new HarnessError(`${label} failed`))
  }
}

async function discoverUsers(service, journal, failures) {
  for (const email of new Set(journal.userEmails)) {
    try {
      const user = await exactUser(service, email)
      if (user !== null && !journal.userIds.includes(user.id)) journal.userIds.push(user.id)
    } catch (error) {
      failures.push(error instanceof Error ? error : new HarnessError(`discover ${email} failed`))
    }
  }
}

export async function cleanupJournal(service, journal) {
  const failures = []
  for (const item of journal.objects) await attempt(failures, `remove ${item.bucket}/${item.path}`, () => service.storage.from(item.bucket).remove([item.path]))
  for (const documentId of journal.documentIds) {
    await attempt(failures, `remove revisions ${documentId}`, () => service.from('cms_revisions').delete().eq('document_id', documentId))
    await attempt(failures, `remove document ${documentId}`, () => service.from('cms_documents').delete().eq('id', documentId))
  }
  for (const userId of journal.allowlistUserIds) {
    await attempt(failures, `remove allowlist ${userId}`, () => service.from('cms_admins').delete().eq('user_id', userId))
  }
  await discoverUsers(service, journal, failures)
  for (const userId of new Set(journal.userIds)) await attempt(failures, `remove user ${userId}`, () => service.auth.admin.deleteUser(userId))
  if (failures.length > 0) throw new AggregateError(failures, failures.map((error) => error.message).join('; '))
}

export async function runWithCleanup(work, cleanup) {
  const failures = []
  try { await work() } catch (error) { failures.push(error instanceof Error ? error : new HarnessError('unknown harness failure')) }
  try { await cleanup() } catch (error) { failures.push(error instanceof Error ? error : new HarnessError('unknown cleanup failure')) }
  if (failures.length === 1) throw failures[0]
  if (failures.length > 1) throw new AggregateError(failures, failures.map((error) => error.message).join('; '))
}

function u32be(value) {
  return Buffer.from([value >>> 24, value >>> 16, value >>> 8, value])
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data])
  return Buffer.concat([u32be(data.length), body, u32be(crc32(body))])
}

export function createRunPng(seed) {
  const color = Buffer.from(seed.replaceAll('-', '').slice(0, 6), 'hex')
  const raw = Buffer.from([0, color[0], color[1], color[2], 255])
  const ihdr = Buffer.concat([u32be(1), u32be(1), Buffer.from([8, 6, 0, 0, 0])])
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
