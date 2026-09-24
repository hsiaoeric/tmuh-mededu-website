import { z } from 'zod'

export const PublishRequestSchema = z.object({
  documentId: z.uuid(),
  revisionId: z.uuid(),
  expectedEditVersion: z.number().int().positive().safe(),
}).strict()

export type PublishRequest = z.infer<typeof PublishRequestSchema>

export const PreparedPublicationSchema = z.object({
  kind: z.string().min(1),
  status: z.enum(['draft', 'published']),
  payload: z.json(),
  persisted_replacements: z.record(z.string(), z.json()).default({}),
}).strict()

export type PreparedPublication = z.infer<typeof PreparedPublicationSchema>

export const RevisionSchema = z.object({
  id: z.uuid(),
  status: z.literal('published'),
}).passthrough()

export type PublishedRevision = z.infer<typeof RevisionSchema>
