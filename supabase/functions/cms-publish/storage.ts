import { createClient } from '@supabase/supabase-js'
import type { MediaStorage } from './promotion.ts'
import { PublishError } from './errors.ts'

type StorageConfiguration = { readonly url: string; readonly key: string; readonly timeoutMs: number }

function timedFetch(signal: AbortSignal, timeoutMs: number): typeof fetch {
  return (input, init) => fetch(input, {
    ...init,
    signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs), init?.signal].filter((value): value is AbortSignal => value instanceof AbortSignal)),
  })
}

function client(config: StorageConfiguration, signal: AbortSignal) {
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: timedFetch(signal, config.timeoutMs) },
  })
}

function storageError(error: unknown): { readonly status: number; readonly statusCode: string } | null {
  if (!(error instanceof Error)) return null
  const status = 'status' in error && typeof error.status === 'number' ? error.status : 0
  const statusCode = 'statusCode' in error && typeof error.statusCode === 'string' ? error.statusCode : ''
  return { status, statusCode }
}

function isDuplicate(error: unknown): boolean {
  const fields = storageError(error)
  return fields !== null && (fields.status === 409 || fields.statusCode === '409' || fields.statusCode === 'Duplicate')
}

function isMissing(error: unknown): boolean {
  return storageError(error)?.status === 404
}

async function downloaded(config: StorageConfiguration, bucket: string, path: string, signal: AbortSignal) {
  const { data, error } = await client(config, signal).storage.from(bucket).download(path)
  if (error !== null) {
    if (isMissing(error)) return null
    throw new PublishError('storage-failure', 502, true)
  }
  const contentType = data.type
  return { bytes: new Uint8Array(await data.arrayBuffer()), contentType }
}

export function createStorageAdapter(config: StorageConfiguration): MediaStorage {
  return {
    downloadDraft: (path, signal) => downloaded(config, 'draft-media', path, signal),
    downloadPublic: (path, signal) => downloaded(config, 'public-media', path, signal),
    async uploadPublic(path, bytes, contentType, signal) {
      const { error } = await client(config, signal).storage.from('public-media').upload(path, bytes, {
        contentType, cacheControl: '31536000', upsert: false,
      })
      if (error === null) return 'created'
      if (isDuplicate(error)) return 'duplicate'
      throw new PublishError('storage-failure', 502, true)
    },
  }
}
