import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { LOCALIZED_CONTENT_MODEL } from '../../src/content/contracts/localized';
import { POST_CATEGORY_TAXONOMY, PROGRAM_TAXONOMY } from '../../src/data/legacy/taxonomy';

/**
 * Bootstrap sources for the archive documents. The importer
 * (`npm run content:import-legacy`) writes `src/data/legacy/*.json`; this module merges those
 * records with the hand-written taxonomy (category labels, program titles) and adds the
 * `contentModel` marker. Item shapes are validated later by the CMS source contracts, so
 * only the file envelopes are checked here.
 */

const LEGACY_DATA_DIRECTORY = new URL('../../src/data/legacy/', import.meta.url);

const PostsFileSchema = z.strictObject({
  version: z.literal(1),
  posts: z.array(z.unknown()),
});

/** Per-program fields the importer can supply; title, summary, and order come from the taxonomy. */
const ProgramOverrideSchema = z.looseObject({ id: z.string() });

const DepartmentInfoFileSchema = z.strictObject({
  version: z.literal(1),
  pages: z.array(z.unknown()),
  programs: z.array(ProgramOverrideSchema),
  linkGroups: z.array(z.unknown()),
  downloads: z.array(z.unknown()),
});

const GalleryFileSchema = z.strictObject({
  version: z.literal(1),
  albums: z.array(z.unknown()),
  videos: z.array(z.unknown()),
});

export class LegacySourceError extends Error {
  readonly name = 'LegacySourceError';
  constructor(file: string, readonly detail: unknown) {
    super(`Legacy source ${file} is malformed`);
  }
}

function readLegacyFile<S extends z.ZodType>(file: string, schema: S): z.output<S> {
  const path = fileURLToPath(new URL(file, LEGACY_DATA_DIRECTORY));
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error: unknown) {
    throw new LegacySourceError(file, error);
  }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new LegacySourceError(file, result.error);
  return result.data;
}

export function buildPostsSource() {
  const file = readLegacyFile('posts.json', PostsFileSchema);
  return {
    contentModel: LOCALIZED_CONTENT_MODEL,
    categories: POST_CATEGORY_TAXONOMY.map((category) => ({
      id: category.id,
      channel: category.channel,
      label: category.label,
      order: category.order,
    })),
    posts: file.posts,
  };
}

export function buildDepartmentInfoSource() {
  const file = readLegacyFile('departmentInfo.json', DepartmentInfoFileSchema);
  const overrides = new Map(file.programs.map((program) => [program.id, program]));
  const unknown = [...overrides.keys()].filter((id) => !PROGRAM_TAXONOMY.some((program) => program.id === id));
  if (unknown.length > 0) {
    throw new LegacySourceError('departmentInfo.json', new TypeError(`Unknown program ids: ${unknown.join(', ')}`));
  }
  return {
    contentModel: LOCALIZED_CONTENT_MODEL,
    pages: file.pages,
    programs: PROGRAM_TAXONOMY.map((program) => ({
      ...overrides.get(program.id),
      id: program.id,
      order: program.order,
      title: program.title,
      summary: program.summary,
    })),
    linkGroups: file.linkGroups,
    downloads: file.downloads,
  };
}

export function buildGallerySource() {
  const file = readLegacyFile('gallery.json', GalleryFileSchema);
  return {
    contentModel: LOCALIZED_CONTENT_MODEL,
    albums: file.albums,
    videos: file.videos,
  };
}
