import type {
  EditableDepartmentInfoPayload,
  EditableDepartmentPage,
  EditableDownloadGroup,
  EditableLinkGroup,
  EditableProgram,
} from '../archiveTypes';
import { nextSequencedId } from '../ids';
import { nextOrder } from '../recordRows';

export const PROGRAM_PAGE_FIELDS = ['introPageId', 'outcomesPageId', 'schedulePageId'] as const;
export type ProgramPageField = (typeof PROGRAM_PAGE_FIELDS)[number];

/** Pages a program may point at: program pages owned by that program. */
export function programPageOptions(pages: readonly EditableDepartmentPage[], program: EditableProgram): readonly EditableDepartmentPage[] {
  return pages.filter((page) => page.section === 'program' && page.owner === program.id);
}

/** Programs whose page references name `pageId`, so deleting it would break them. */
export function programsReferencingPage(programs: readonly EditableProgram[], pageId: string): readonly EditableProgram[] {
  return programs.filter((program) => PROGRAM_PAGE_FIELDS.some((field) => program[field] === pageId));
}

export function createPage(payload: EditableDepartmentInfoPayload): EditableDepartmentPage {
  return {
    id: nextSequencedId('page', payload.pages.map((page) => page.id)),
    section: 'about',
    owner: 'department',
    order: nextOrder(payload.pages),
    title: { zh: '' },
    body: { zh: [] },
  };
}

export function createLinkGroup(payload: EditableDepartmentInfoPayload): EditableLinkGroup {
  return {
    id: nextSequencedId('links', payload.linkGroups.map((group) => group.id)),
    owner: 'department',
    purpose: 'related',
    order: nextOrder(payload.linkGroups),
    title: { zh: '' },
    links: [],
  };
}

export function createDownloadGroup(payload: EditableDepartmentInfoPayload): EditableDownloadGroup {
  return {
    id: nextSequencedId('downloads', payload.downloads.map((group) => group.id)),
    owner: 'department',
    title: { zh: '' },
    items: [],
  };
}

/**
 * Renaming a page id would orphan any program that points at it, so references follow the
 * rename. (Only pages not yet published can be renamed at all.)
 */
export function renamePage(payload: EditableDepartmentInfoPayload, index: number, page: EditableDepartmentPage): EditableDepartmentInfoPayload {
  const previous = payload.pages[index];
  const pages = payload.pages.map((candidate, position) => (position === index ? page : candidate));
  if (previous === undefined || previous.id === page.id) return { ...payload, pages };
  const programs = payload.programs.map((program) => {
    let next = program;
    for (const field of PROGRAM_PAGE_FIELDS) if (program[field] === previous.id) next = { ...next, [field]: page.id };
    return next;
  });
  return { ...payload, pages, programs };
}
