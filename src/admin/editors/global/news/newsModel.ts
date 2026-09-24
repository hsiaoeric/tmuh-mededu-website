import {
  insertPaired,
  movePaired,
  nextCollectionId,
  removePaired,
  type PairedCollectionResult,
} from '../pairedCollections';
import type {
  NewsAnnouncement,
  NewsLocale,
  NewsMutationResult,
  NewsPayload,
  NewsRowLocation,
  NewsScope,
} from './newsTypes';

function withAnnouncements(
  payload: NewsPayload,
  scope: NewsScope,
  result: PairedCollectionResult<NewsAnnouncement>,
): NewsMutationResult {
  if (!result.ok) return result;
  return {
    ok: true,
    payload: {
      ...payload,
      zh: { ...payload.zh, [scope]: result.collection.zh },
      en: { ...payload.en, [scope]: result.collection.en },
    },
  };
}

function announcementRows(payload: NewsPayload, scope: NewsScope) {
  return { zh: payload.zh[scope], en: payload.en[scope] };
}

function defaultAnnouncement(id: string, locale: NewsLocale): NewsAnnouncement {
  return {
    id,
    publishedOn: '1970-01-01',
    category: 'department',
    pinned: false,
    tag: '',
    title: locale === 'zh' ? '新公告' : 'New announcement',
    lines: [],
  };
}

export function addAnnouncement(payload: NewsPayload, scope: NewsScope): NewsMutationResult {
  const id = nextCollectionId('new-announcement', [
    ...payload.zh.department.map((row) => row.id),
    ...payload.zh.holistic.map((row) => row.id),
    ...payload.en.department.map((row) => row.id),
    ...payload.en.holistic.map((row) => row.id),
  ]);
  return withAnnouncements(payload, scope, insertPaired(announcementRows(payload, scope), {
    index: payload.zh[scope].length,
    rows: { zh: defaultAnnouncement(id, 'zh'), en: defaultAnnouncement(id, 'en') },
  }));
}

export function removeAnnouncement(payload: NewsPayload, scope: NewsScope, index: number): NewsMutationResult {
  return withAnnouncements(payload, scope, removePaired(announcementRows(payload, scope), { index }));
}

export function moveAnnouncement(payload: NewsPayload, scope: NewsScope, fromIndex: number, toIndex: number): NewsMutationResult {
  return withAnnouncements(payload, scope, movePaired(announcementRows(payload, scope), { fromIndex, toIndex }));
}

export function updateAnnouncementLocale(
  payload: NewsPayload,
  location: NewsRowLocation,
  update: (row: NewsAnnouncement) => NewsAnnouncement,
): NewsMutationResult {
  const rows = payload[location.locale][location.scope];
  if (!Number.isInteger(location.index) || location.index < 0 || location.index >= rows.length) {
    return { ok: false, reason: 'index-out-of-bounds' };
  }
  return {
    ok: true,
    payload: {
      ...payload,
      [location.locale]: {
        ...payload[location.locale],
        [location.scope]: rows.map((row, index) => index === location.index ? update(row) : row),
      },
    },
  };
}

export function updateAnnouncementShared(
  payload: NewsPayload,
  scope: NewsScope,
  index: number,
  update: (row: NewsAnnouncement) => NewsAnnouncement,
): NewsMutationResult {
  const rows = announcementRows(payload, scope);
  if (rows.zh.length !== rows.en.length) return { ok: false, reason: 'length-mismatch' };
  if (!Number.isInteger(index) || index < 0 || index >= rows.zh.length) return { ok: false, reason: 'index-out-of-bounds' };
  return withAnnouncements(payload, scope, {
    ok: true,
    collection: {
      zh: rows.zh.map((row, rowIndex) => rowIndex === index ? update(row) : row),
      en: rows.en.map((row, rowIndex) => rowIndex === index ? update(row) : row),
    },
  });
}

export function setAnnouncementPinned(payload: NewsPayload, scope: NewsScope, index: number, pinned: boolean): NewsMutationResult {
  return updateAnnouncementShared(payload, scope, index, (row) => ({ ...row, pinned }));
}

type LineLocation = NewsRowLocation & { readonly lineIndex?: number };

export function addLine(payload: NewsPayload, location: NewsRowLocation): NewsMutationResult {
  return updateAnnouncementLocale(payload, location, (row) => ({ ...row, lines: [...row.lines, ''] }));
}

export function updateLine(payload: NewsPayload, location: Required<LineLocation>, value: string): NewsMutationResult {
  const row = payload[location.locale][location.scope][location.index];
  if (row === undefined || location.lineIndex < 0 || location.lineIndex >= row.lines.length) return { ok: false, reason: 'index-out-of-bounds' };
  return updateAnnouncementLocale(payload, location, (current) => ({
    ...current,
    lines: current.lines.map((line, index) => index === location.lineIndex ? value : line),
  }));
}

export function removeLine(payload: NewsPayload, location: NewsRowLocation, lineIndex: number): NewsMutationResult {
  const row = payload[location.locale][location.scope][location.index];
  if (row === undefined || lineIndex < 0 || lineIndex >= row.lines.length) return { ok: false, reason: 'index-out-of-bounds' };
  return updateAnnouncementLocale(payload, location, (current) => ({ ...current, lines: current.lines.filter((_line, index) => index !== lineIndex) }));
}

export function moveLine(payload: NewsPayload, location: NewsRowLocation, fromIndex: number, toIndex: number): NewsMutationResult {
  const row = payload[location.locale][location.scope][location.index];
  if (row === undefined || fromIndex < 0 || toIndex < 0 || fromIndex >= row.lines.length || toIndex >= row.lines.length) return { ok: false, reason: 'index-out-of-bounds' };
  const moving = row.lines.slice(fromIndex, fromIndex + 1);
  const remaining = [...row.lines.slice(0, fromIndex), ...row.lines.slice(fromIndex + 1)];
  const lines = [...remaining.slice(0, toIndex), ...moving, ...remaining.slice(toIndex)];
  return updateAnnouncementLocale(payload, location, (current) => ({ ...current, lines }));
}
