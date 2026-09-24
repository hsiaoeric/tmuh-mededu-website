import { PublishRequestSchema, type PreparedPublication, type PublishedRevision } from './contracts.ts'
import { isPublishError, PublishError } from './errors.ts'
import type { PromotionResult } from './promotion.ts'

const MAX_BODY_BYTES = 4096

type Coordinates = {
  readonly documentId: string
  readonly revisionId: string
  readonly expectedEditVersion: number
  readonly actorId: string
}
type HandlerDependencies = {
  readonly allowedOrigins: readonly string[]
  readonly deadlineMs?: number
  readonly authenticate: (token: string, signal: AbortSignal) => Promise<{ readonly actorId: string }>
  readonly prepare: (input: Coordinates, signal: AbortSignal) => Promise<PreparedPublication>
  readonly promote: (input: { readonly payload: unknown; readonly actorId: string; readonly signal: AbortSignal }) => Promise<PromotionResult>
  readonly finalize: (input: Coordinates & { readonly replacements: Readonly<Record<string, unknown>> }, signal: AbortSignal) => Promise<PublishedRevision>
}

function corsHeaders(origin: string): Headers {
  const headers = new Headers({
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    'content-type': 'application/json',
    vary: 'Origin',
  })
  if (origin.length > 0) headers.set('access-control-allow-origin', origin)
  return headers
}

function failure(origin: string, error: PublishError): Response {
  return new Response(JSON.stringify({ ok: false, error: { code: error.code, retryable: error.retryable } }), {
    status: error.status,
    headers: corsHeaders(origin),
  })
}

async function readBody(request: Request, signal: AbortSignal): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) throw new PublishError('body-too-large', 413, false)
  if (request.body === null) throw new PublishError('invalid-request', 400, false)
  const reader = request.body.getReader()
  const cancel = () => { void reader.cancel('request-aborted') }
  signal.addEventListener('abort', cancel, { once: true })
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      size += next.value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel('body-too-large')
        throw new PublishError('body-too-large', 413, false)
      }
      chunks.push(next.value)
    }
  } finally {
    signal.removeEventListener('abort', cancel)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch (error) {
    throw new PublishError('invalid-request', 400, false, { cause: error })
  }
}

async function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw new PublishError('deadline-exceeded', 504, true)
  let rejectAbort: ((error: PublishError) => void) | undefined
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectAbort = reject
  })
  const abort = () => rejectAbort?.(new PublishError('deadline-exceeded', 504, true))
  signal.addEventListener('abort', abort, { once: true })
  try {
    return await Promise.race([promise, aborted])
  } finally {
    signal.removeEventListener('abort', abort)
  }
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization')
  if (authorization === null || !authorization.startsWith('Bearer ') || authorization.length <= 7) {
    throw new PublishError('authentication-required', 401, false)
  }
  return authorization.slice(7)
}

function normalizeError(error: unknown): PublishError {
  if (isPublishError(error)) return error
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === 'stale-edit-version') return new PublishError('stale-edit-version', 409, false)
    if (error.code === 'superseded-revision') return new PublishError('superseded-revision', 409, false)
  }
  return new PublishError('publication-failed', 500, false)
}

export function createPublishHandler(dependencies: HandlerDependencies): (request: Request) => Promise<Response> {
  return async (request) => {
    const origin = request.headers.get('origin') ?? ''
    if (!dependencies.allowedOrigins.includes(origin)) return failure('', new PublishError('origin-denied', 403, false))
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
    if (request.method !== 'POST') return failure(origin, new PublishError('method-not-allowed', 405, false))
    const deadline = new AbortController()
    const timer = setTimeout(() => deadline.abort(new DOMException('deadline', 'TimeoutError')), dependencies.deadlineMs ?? 120_000)
    const signal = AbortSignal.any([deadline.signal, request.signal])
    try {
      const token = bearerToken(request)
      const parsed = PublishRequestSchema.safeParse(await abortable(readBody(request, signal), signal))
      if (!parsed.success) throw new PublishError('invalid-request', 400, false)
      const identity = await abortable(dependencies.authenticate(token, signal), signal)
      const coordinates = { ...parsed.data, actorId: identity.actorId }
      const prepared = await abortable(dependencies.prepare(coordinates, signal), signal)
      const promoted = prepared.status === 'published'
        ? { replacements: prepared.persisted_replacements, created: null, reused: null, references: Object.keys(prepared.persisted_replacements).length }
        : await abortable(dependencies.promote({ payload: prepared.payload, actorId: identity.actorId, signal }), signal)
      const revision = await abortable(dependencies.finalize({ ...coordinates, replacements: promoted.replacements }, signal), signal)
      return new Response(JSON.stringify({ ok: true, revision, media: { draftReferences: promoted.references, objectsCreated: promoted.created, objectsReused: promoted.reused } }), {
        status: 200,
        headers: corsHeaders(origin),
      })
    } catch (error) {
      return failure(origin, normalizeError(error))
    } finally {
      clearTimeout(timer)
      deadline.abort()
    }
  }
}
