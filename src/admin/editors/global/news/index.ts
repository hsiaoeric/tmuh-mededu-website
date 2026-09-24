export { NewsEditor, type NewsEditorProps } from './NewsEditor';
export {
  addAnnouncement,
  addLine,
  moveAnnouncement,
  moveLine,
  removeAnnouncement,
  removeLine,
  setAnnouncementPinned,
  updateAnnouncementLocale,
  updateAnnouncementShared,
  updateLine,
} from './newsModel';
export { collectNewsIssues } from './newsValidation';
export type { NewsMutationResult, NewsPayload, NewsScope } from './newsTypes';
