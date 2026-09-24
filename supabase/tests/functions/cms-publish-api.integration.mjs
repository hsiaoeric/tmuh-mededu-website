import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import {
  cleanupJournal,
  createCleanupJournal,
  createRunPng,
  createUserRecovering,
  inspectPublicCandidate,
  requireData,
  runWithCleanup,
  uploadJournaled,
  HarnessError,
} from './cms-publish-harness-support.mjs'

const PASSWORD = 'Local-media-publish-2026!'
const ORIGIN = 'http://127.0.0.1:5173'
const CLIENT_OPTIONS = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

function configuration() {
  const url = process.env.SUPABASE_URL ?? process.env.API_URL
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY
  if (url === undefined || anonKey === undefined || serviceKey === undefined) return null
  const parsed = new URL(url)
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) throw new HarnessError('cms-publish harness refuses non-local Supabase URLs')
  return { url, anonKey, serviceKey }
}

async function invoke(browser, body) {
  return requireData('invoke cms-publish', await browser.functions.invoke('cms-publish', {
    body,
    headers: { Origin: ORIGIN },
    signal: AbortSignal.timeout(125_000),
  }))
}

async function run(config) {
  const service = createClient(config.url, config.serviceKey, CLIENT_OPTIONS)
  const browser = createClient(config.url, config.anonKey, CLIENT_OPTIONS)
  const journal = createCleanupJournal()
  const runId = randomUUID()
  const png = createRunPng(runId)
  const email = `cms-publish-${runId}@example.test`
  const documentId = randomUUID()
  const publishedId = randomUUID()
  const draftId = randomUUID()
  const digest = createHash('sha256').update(png).digest('hex')
  await runWithCleanup(async () => {
    const actor = await createUserRecovering(service, journal, email, PASSWORD)
    journal.allowlistUserIds.push(actor.id)
    requireData('allowlist user', await service.from('cms_admins').insert({ user_id: actor.id, created_by: actor.id }))
    const draftPath = `${actor.id}/${digest}.png`
    const publicPath = `${digest}/${digest}.png`
    const expectedObjectOutcome = await inspectPublicCandidate(service.storage.from('public-media'), journal, 'public-media', publicPath)
    const source = requireData('load people fixture', await service.from('cms_revisions').select('payload,cms_documents!inner(kind)').eq('status', 'published').eq('cms_documents.kind', 'people').limit(1).single())
    const draftPayload = structuredClone(source.payload)
    const reference = { kind: 'draft', bucket: 'draft-media', path: draftPath }
    draftPayload.zh.centerPeople[0].people[0].portrait = reference
    draftPayload.en.centerPeople[0].people[0].portrait = reference
    journal.documentIds.push(documentId)
    requireData('create document', await service.from('cms_documents').insert({ id: documentId, kind: 'people', stable_key: `integration-${runId}` }))
    requireData('create revisions', await service.from('cms_revisions').insert([
      { id: publishedId, document_id: documentId, version: 1, status: 'published', payload: source.payload, published_at: new Date().toISOString(), published_by: actor.id },
      { id: draftId, document_id: documentId, version: 2, status: 'draft', payload: draftPayload },
    ]))
    await uploadJournaled(service.storage.from('draft-media'), journal, 'draft-media', draftPath, png, 'image/png')
    requireData('sign in browser admin', await browser.auth.signInWithPassword({ email, password: PASSWORD }))
    const body = { documentId, revisionId: draftId, expectedEditVersion: 1 }
    const first = await invoke(browser, body)
    if (first?.ok !== true || first.revision?.id !== draftId || first.media?.draftReferences !== 1) throw new HarnessError('first invocation returned misleading success')
    const retry = await invoke(browser, body)
    if (retry?.ok !== true || retry.media?.draftReferences !== 1 || retry.media?.objectsCreated !== null || retry.media?.objectsReused !== null) {
      throw new HarnessError('published retry accounting is inaccurate')
    }
    const prepared = requireData('read persisted retry state', await service.rpc('cms_prepare_media_publication', {
      p_document_id: documentId, p_revision_id: draftId, p_expected_edit_version: 1, p_actor_id: actor.id,
    }).single())
    if (prepared.persisted_replacements?.[draftPath]?.path !== publicPath) throw new HarnessError('persisted_replacements is inaccurate')
    const published = requireData('read publication', await service.from('cms_revisions').select('status,payload').eq('id', draftId).single())
    if (published.status !== 'published' || published.payload.zh.centerPeople[0].people[0].portrait.path !== publicPath) throw new HarnessError('database publication is inaccurate')
    requireData('download public media', await service.storage.from('public-media').download(publicPath))
    if (!['created', 'reused'].includes(expectedObjectOutcome)) throw new HarnessError('public object outcome is unknown')
  }, () => cleanupJournal(service, journal))
}

const config = configuration()
if (config === null) {
  console.error(JSON.stringify({ status: 'BLOCKED', reason: 'Set local SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY from supabase status -o env.' }))
  process.exitCode = 2
} else {
  run(config)
    .then(() => console.log(JSON.stringify({ status: 'PASS', proof: 'live-local-cms-publish' })))
    .catch((error) => {
      console.error(JSON.stringify({ status: 'FAIL', message: error instanceof Error ? error.message : 'unknown harness failure' }))
      process.exitCode = 1
    })
}
