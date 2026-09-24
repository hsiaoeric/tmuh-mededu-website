import {
  insertPaired,
  removePaired,
  updatePaired,
  type PairedCollectionResult,
} from '../pairedCollections';
import type {
  BranchRecord,
  CenterRecord,
  CentersLocale,
  CentersPayload,
} from './types';

type IndexChange = { readonly index: number };
type CenterTextField = 'id' | 'name' | 'intro' | 'contact' | 'ext';
type CenterTextChange = IndexChange & { readonly locale: CentersLocale; readonly field: CenterTextField; readonly value: string };
type CenterOptionalTextChange = IndexChange & { readonly locale: CentersLocale; readonly value: string };
type CenterDeepChange = IndexChange & { readonly locale: CentersLocale; readonly value: boolean };
type BranchIndexChange = IndexChange & { readonly centerIndex: number };
type BranchTextField = 'id' | 'name' | 'description';
type BranchTextChange = BranchIndexChange & { readonly locale: CentersLocale; readonly field: BranchTextField; readonly value: string };

const NEW_CENTER = {
  id: '', name: '', intro: '', contact: '', ext: '', branches: [],
} satisfies CenterRecord;
const NEW_BRANCH = {
  id: '', name: '', description: '',
} satisfies BranchRecord;

function applyCenters(payload: CentersPayload, result: PairedCollectionResult<CenterRecord>): CentersPayload {
  if (!result.ok) return payload;
  return {
    ...payload,
    zh: { ...payload.zh, centers: result.collection.zh },
    en: { ...payload.en, centers: result.collection.en },
  };
}

function replaceCenter(payload: CentersPayload, locale: CentersLocale, index: number, center: CenterRecord): CentersPayload {
  if (payload[locale].centers[index] === undefined) return payload;
  return {
    ...payload,
    [locale]: {
      ...payload[locale],
      centers: payload[locale].centers.map((current, currentIndex) => currentIndex === index ? center : current),
    },
  };
}

function applyBranches(
  payload: CentersPayload,
  centerIndex: number,
  result: PairedCollectionResult<BranchRecord>,
): CentersPayload {
  const zhCenter = payload.zh.centers[centerIndex];
  const enCenter = payload.en.centers[centerIndex];
  if (zhCenter === undefined || enCenter === undefined) return payload;
  if (!result.ok) return payload;
  return applyCenters(payload, updatePaired(
    { zh: payload.zh.centers, en: payload.en.centers },
    {
      index: centerIndex,
      rows: {
        zh: { ...zhCenter, branches: result.collection.zh },
        en: { ...enCenter, branches: result.collection.en },
      },
    },
  ));
}

export function addCenter(payload: CentersPayload): CentersPayload {
  return applyCenters(payload, insertPaired(
    { zh: payload.zh.centers, en: payload.en.centers },
    { index: payload.zh.centers.length, rows: { zh: { ...NEW_CENTER }, en: { ...NEW_CENTER } } },
  ));
}

export function removeCenter(payload: CentersPayload, change: IndexChange): CentersPayload {
  return applyCenters(payload, removePaired({ zh: payload.zh.centers, en: payload.en.centers }, change));
}

export function updateCenterText(payload: CentersPayload, change: CenterTextChange): CentersPayload {
  const center = payload[change.locale].centers[change.index];
  return center === undefined ? payload : replaceCenter(payload, change.locale, change.index, { ...center, [change.field]: change.value });
}

export function updateCenterExternalUrl(payload: CentersPayload, change: CenterOptionalTextChange): CentersPayload {
  const center = payload[change.locale].centers[change.index];
  if (center === undefined) return payload;
  const next = { ...center };
  if (change.value === '') delete next.externalUrl;
  else next.externalUrl = change.value;
  return replaceCenter(payload, change.locale, change.index, next);
}

export function updateCenterDeep(payload: CentersPayload, change: CenterDeepChange): CentersPayload {
  const center = payload[change.locale].centers[change.index];
  return center === undefined ? payload : replaceCenter(payload, change.locale, change.index, { ...center, deep: change.value });
}

export function addBranch(payload: CentersPayload, centerIndex: number): CentersPayload {
  const zhCenter = payload.zh.centers[centerIndex];
  const enCenter = payload.en.centers[centerIndex];
  if (zhCenter === undefined || enCenter === undefined) return payload;
  return applyBranches(payload, centerIndex, insertPaired(
    { zh: zhCenter.branches, en: enCenter.branches },
    { index: zhCenter.branches.length, rows: { zh: { ...NEW_BRANCH }, en: { ...NEW_BRANCH } } },
  ));
}

export function removeBranch(payload: CentersPayload, change: BranchIndexChange): CentersPayload {
  const zhCenter = payload.zh.centers[change.centerIndex];
  const enCenter = payload.en.centers[change.centerIndex];
  if (zhCenter === undefined || enCenter === undefined) return payload;
  return applyBranches(payload, change.centerIndex, removePaired(
    { zh: zhCenter.branches, en: enCenter.branches },
    { index: change.index },
  ));
}

export function updateBranchText(payload: CentersPayload, change: BranchTextChange): CentersPayload {
  const center = payload[change.locale].centers[change.centerIndex];
  const branch = center?.branches[change.index];
  if (center === undefined || branch === undefined) return payload;
  const branches = center.branches.map((current, currentIndex) => currentIndex === change.index ? { ...branch, [change.field]: change.value } : current);
  return replaceCenter(payload, change.locale, change.centerIndex, { ...center, branches });
}
