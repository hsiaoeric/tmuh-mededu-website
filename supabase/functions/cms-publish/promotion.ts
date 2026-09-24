import { inspectImage } from './image.ts'
import { PublishError } from './errors.ts'

const DRAFT_PATH = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([0-9a-f]{64})\.(jpg|png|webp)$/
const MAX_REFERENCES = 128

type StoredObject = { readonly bytes: Uint8Array; readonly contentType: string }
export type MediaStorage = {
  readonly downloadDraft: (path: string, signal: AbortSignal) => Promise<StoredObject | null>
  readonly uploadPublic: (path: string, bytes: Uint8Array, contentType: string, signal: AbortSignal) => Promise<'created' | 'duplicate'>
  readonly downloadPublic: (path: string, signal: AbortSignal) => Promise<StoredObject | null>
}
type PublicReference = { readonly kind: 'public'; readonly bucket: 'public-media'; readonly path: string }
export type PromotionResult = {
  readonly replacements: Readonly<Record<string, PublicReference>>
  readonly created: number | null
  readonly reused: number | null
  readonly references: number
}
type PromotionInput = { readonly payload: unknown; readonly actorId: string; readonly storage: MediaStorage; readonly signal: AbortSignal }

function visit(value: unknown, actorId: string, paths: Set<string>): void {
  if (Array.isArray(value)) {
    for (const child of value) visit(child, actorId, paths)
    return
  }
  if (value === null || typeof value !== 'object') return
  const record = Object.fromEntries(Object.entries(value))
  if (record.kind === 'draft' || record.bucket === 'draft-media') {
    const keys = Object.keys(record).sort()
    const path = record.path
    if (keys.join(',') !== 'bucket,kind,path' || record.kind !== 'draft' || record.bucket !== 'draft-media' || typeof path !== 'string') {
      throw new PublishError('invalid-draft-reference', 422, false)
    }
    const match = DRAFT_PATH.exec(path)
    if (match === null) throw new PublishError('invalid-draft-reference', 422, false)
    if (match[1] !== actorId) throw new PublishError('draft-owner-mismatch', 403, false)
    paths.add(path)
    if (paths.size > MAX_REFERENCES) throw new PublishError('too-many-media', 413, false)
    return
  }
  for (const child of Object.values(record)) visit(child, actorId, paths)
}

export function collectDraftReferences(payload: unknown, actorId: string): readonly string[] {
  const paths = new Set<string>()
  visit(payload, actorId, paths)
  return [...paths].sort()
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new PublishError('deadline-exceeded', 504, true, { cause: signal.reason })
}

export async function promoteDraftMedia(input: PromotionInput): Promise<PromotionResult> {
  const paths = collectDraftReferences(input.payload, input.actorId)
  const replacements: Record<string, PublicReference> = {}
  let created = 0
  let reused = 0
  for (const sourcePath of paths) {
    throwIfAborted(input.signal)
    const source = await input.storage.downloadDraft(sourcePath, input.signal)
    if (source === null) throw new PublishError('draft-media-missing', 404, false)
    const inspected = await inspectImage(source.bytes)
    const match = DRAFT_PATH.exec(sourcePath)
    if (match === null) throw new PublishError('invalid-draft-reference', 422, false)
    if (match[2] !== inspected.digest || match[3] !== inspected.extension || source.contentType !== inspected.mime) {
      throw new PublishError('draft-media-mismatch', 415, false)
    }
    const destination = `${inspected.digest}/${inspected.digest}.${inspected.extension}`
    const upload = await input.storage.uploadPublic(destination, source.bytes, inspected.mime, input.signal)
    const existing = await input.storage.downloadPublic(destination, input.signal)
    if (existing === null) throw new PublishError('public-integrity-conflict', 500, false)
    const verified = await inspectImage(existing.bytes).catch((error: unknown) => {
      throw new PublishError('public-integrity-conflict', 500, false, { cause: error })
    })
    if (verified.digest !== inspected.digest || verified.size !== inspected.size || verified.mime !== inspected.mime || existing.contentType !== inspected.mime) {
      throw new PublishError('public-integrity-conflict', 500, false)
    }
    if (upload === 'created') created += 1
    else reused += 1
    replacements[sourcePath] = { kind: 'public', bucket: 'public-media', path: destination }
  }
  return { replacements, created, reused, references: paths.length }
}
