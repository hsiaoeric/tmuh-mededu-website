import type { SupabaseClient } from '@supabase/supabase-js'
import { PreparedPublicationSchema, RevisionSchema, type PreparedPublication, type PublishedRevision } from './contracts.ts'
import { PublishError } from './errors.ts'

type PublishCoordinates = {
  readonly documentId: string
  readonly revisionId: string
  readonly expectedEditVersion: number
  readonly actorId: string
}
type DatabaseError = { readonly code?: string; readonly details?: string | null; readonly status?: number }
type DatabaseResult = { readonly data: unknown; readonly error: DatabaseError | null }

function mapDatabaseError(error: DatabaseError): never {
  if (error.code === 'PT409' && error.details === 'superseded_revision') throw new PublishError('superseded-revision', 409, false)
  if (error.code === 'PT409') throw new PublishError('stale-edit-version', 409, false)
  if (error.code === '22023' || error.code === '23514') throw new PublishError('invalid-draft-reference', 422, false)
  throw new PublishError('publication-failed', 502, true)
}

export async function callDatabase(operation: () => PromiseLike<DatabaseResult>, signal: AbortSignal): Promise<unknown> {
  if (signal.aborted) throw new PublishError('deadline-exceeded', 504, true, { cause: signal.reason })
  try {
    const result = await operation()
    if (result.error !== null) mapDatabaseError(result.error)
    return result.data
  } catch (error) {
    if (error instanceof PublishError) throw error
    if (signal.aborted) throw new PublishError('deadline-exceeded', 504, true, { cause: signal.reason })
    throw new PublishError('publication-failed', 502, true, { cause: error })
  }
}

function parsePrepared(value: unknown): PreparedPublication {
  try { return PreparedPublicationSchema.parse(value) } catch (error) { throw new PublishError('publication-failed', 502, true, { cause: error }) }
}

function parseRevision(value: unknown): PublishedRevision {
  try { return RevisionSchema.parse(value) } catch (error) { throw new PublishError('publication-failed', 502, true, { cause: error }) }
}

export function createDatabaseAdapter(client: SupabaseClient) {
  return {
    async prepare(input: PublishCoordinates, signal: AbortSignal): Promise<PreparedPublication> {
      const data = await callDatabase(() => client.rpc('cms_prepare_media_publication', {
        p_document_id: input.documentId, p_revision_id: input.revisionId,
        p_expected_edit_version: input.expectedEditVersion, p_actor_id: input.actorId,
      }).abortSignal(signal).single(), signal)
      return parsePrepared(data)
    },
    async finalize(input: PublishCoordinates & { readonly replacements: Readonly<Record<string, unknown>> }, signal: AbortSignal): Promise<PublishedRevision> {
      const data = await callDatabase(() => client.rpc('cms_finalize_media_publication', {
        p_document_id: input.documentId, p_revision_id: input.revisionId,
        p_expected_edit_version: input.expectedEditVersion, p_actor_id: input.actorId,
        p_replacements: input.replacements,
      }).abortSignal(signal).single(), signal)
      return parseRevision(data)
    },
  }
}
