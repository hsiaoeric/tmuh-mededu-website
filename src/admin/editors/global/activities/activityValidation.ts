import { ActivitiesPayloadSchema } from '@/content/contracts/activities';
import {
  mapStructuredEditorIssues as mapGlobalEditorIssues,
  type StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import type { ActivitiesPayload } from './activityTypes';

function localizedMessage(path: readonly PropertyKey[], fallback: string): string {
  const locale = path[0];
  const field = path[path.length - 1];
  if (field === 'date') {
    return locale === 'zh'
      ? '日期與時間格式須為 YYYY/MM/DD（週）HH:MM–HH:MM，並使用有效日期及由早到晚的 24 小時時間。'
      : 'Use a valid date and time format: Ddd YYYY/MM/DD HH:MM–HH:MM, with an increasing 24-hour range.';
  }
  if (field === 'link') {
    return locale === 'zh'
      ? '連結必須是 HTTPS 絕對網址，不可含帳號、密碼或前後空白。'
      : 'Enter an absolute HTTPS link without credentials or surrounding whitespace.';
  }
  return fallback;
}

export function validateActivities(payload: ActivitiesPayload): readonly GlobalEditorIssueSummary[] {
  const result = ActivitiesPayloadSchema.safeParse(payload);
  if (result.success) return [];
  return mapGlobalEditorIssues(result.error.issues.map((issue) => ({
    path: issue.path,
    message: localizedMessage(issue.path, issue.message),
  })));
}
