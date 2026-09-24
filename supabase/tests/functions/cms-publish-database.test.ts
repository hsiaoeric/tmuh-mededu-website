import { describe, expect, it, vi } from 'vitest'
import { callDatabase } from '../../functions/cms-publish/database.ts'

describe('cms-publish database transport', () => {
  it.each([
    ['HTTP 5xx', vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST', status: 503 } })],
    ['network response loss', vi.fn().mockRejectedValue(new TypeError('connection reset after commit'))],
  ])('maps %s after possible commit to retryable publication failure', async (_name, operation) => {
    await expect(callDatabase(operation, new AbortController().signal)).rejects.toMatchObject({ code: 'publication-failed', status: 502, retryable: true })
  })

  it('preserves nonretryable CAS details and maps timeout to 504', async () => {
    await expect(callDatabase(vi.fn().mockResolvedValue({ data: null, error: { code: 'PT409', details: 'stale_edit_version' } }), new AbortController().signal))
      .rejects.toMatchObject({ code: 'stale-edit-version', retryable: false })
    const controller = new AbortController()
    controller.abort(new DOMException('deadline', 'TimeoutError'))
    await expect(callDatabase(vi.fn(), controller.signal)).rejects.toMatchObject({ code: 'deadline-exceeded', status: 504, retryable: true })
  })
})
