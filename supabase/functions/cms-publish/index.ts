import { createClient } from '@supabase/supabase-js'
import { createAuthenticator } from './auth.ts'
import { createDatabaseAdapter } from './database.ts'
import { PublishError } from './errors.ts'
import { createPublishHandler } from './handler.ts'
import { promoteDraftMedia } from './promotion.ts'
import { createStorageAdapter } from './storage.ts'

declare const Deno: {
  readonly env: { readonly get: (name: string) => string | undefined }
  readonly serve: (handler: (request: Request) => Promise<Response>) => void
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)
  if (value === undefined || value.length === 0) throw new PublishError('publication-failed', 500, false)
  return value
}

const url = requiredEnv('SUPABASE_URL')
const publishableKey = requiredEnv('SUPABASE_ANON_KEY')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')
if (serviceKey === undefined || serviceKey.length === 0) throw new PublishError('publication-failed', 500, false)
const allowedOrigins = requiredEnv('CMS_ADMIN_ALLOWED_ORIGINS').split(',').map((origin) => origin.trim())
if (allowedOrigins.some((origin) => !/^https?:\/\/[^/]+$/.test(origin))) throw new PublishError('publication-failed', 500, false)

const serviceClient = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
const database = createDatabaseAdapter(serviceClient)
const storage = createStorageAdapter({ url, key: serviceKey, timeoutMs: 20_000 })
const handler = createPublishHandler({
  allowedOrigins,
  authenticate: createAuthenticator({ url, publishableKey, timeoutMs: 20_000 }),
  prepare: database.prepare,
  finalize: database.finalize,
  promote: (input) => promoteDraftMedia({ ...input, storage }),
})

Deno.serve(handler)
