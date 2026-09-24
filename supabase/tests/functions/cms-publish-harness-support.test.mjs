import { describe, expect, it, vi } from 'vitest'
import {
  cleanupJournal,
  createCleanupJournal,
  createUserRecovering,
  inspectPublicCandidate,
  uploadJournaled,
} from './cms-publish-harness-support.mjs'

describe('cms-publish integration harness support', () => {
  it('journals email before ambiguous create and recovers only the exact user', async () => {
    const journal = createCleanupJournal()
    const service = {
      auth: { admin: {
        createUser: vi.fn().mockRejectedValue(new TypeError('response lost')),
        listUsers: vi.fn().mockResolvedValue({ data: { users: [{ id: 'wrong', email: 'other@example.test' }, { id: 'right', email: 'exact@example.test' }] }, error: null }),
      } },
    }
    await expect(createUserRecovering(service, journal, 'exact@example.test', 'password')).resolves.toMatchObject({ id: 'right' })
    expect(journal.userEmails).toEqual(['exact@example.test'])
    expect(journal.userIds).toEqual(['right'])
  })

  it('journals object before an ambiguous upload', async () => {
    const journal = createCleanupJournal()
    const bucket = { upload: vi.fn().mockRejectedValue(new TypeError('response lost')) }
    await expect(uploadJournaled(bucket, journal, 'draft-media', 'actor/hash.png', new Uint8Array([1]), 'image/png')).rejects.toThrow()
    expect(journal.objects).toEqual([{ bucket: 'draft-media', path: 'actor/hash.png' }])
  })

  it('never journals a pre-existing reused public object for deletion', async () => {
    const journal = createCleanupJournal()
    const bucket = { download: vi.fn().mockResolvedValue({ data: new Blob(['existing']), error: null }) }
    await expect(inspectPublicCandidate(bucket, journal, 'public-media', 'hash/hash.png')).resolves.toBe('reused')
    expect(journal.objects).toEqual([])
  })

  it('aggregates every cleanup failure', async () => {
    const journal = createCleanupJournal()
    journal.objects.push({ bucket: 'draft-media', path: 'a.png' }, { bucket: 'public-media', path: 'b.png' })
    const service = {
      storage: { from: vi.fn(() => ({ remove: vi.fn().mockResolvedValue({ error: { message: 'remove failed' } }) })) },
      from: vi.fn(() => ({ delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) })),
      auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }), deleteUser: vi.fn() } },
    }
    await expect(cleanupJournal(service, journal)).rejects.toMatchObject({ errors: expect.arrayContaining([expect.any(Error), expect.any(Error)]) })
  })
})
