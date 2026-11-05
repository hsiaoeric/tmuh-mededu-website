import { useEffect, useState } from 'react';
import { AdminField } from '@/admin/AdminFields';
import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import { YOUTUBE_ID_PATTERN } from '@/content/contracts/blocks';
import type { ArchiveCommitResult, ArchiveIssues, JsonPath } from './archiveTypes';
import { issueFor, requiredText, useIsZh } from './fields';
import { parseYoutubeId } from './youtube';

type YoutubeFieldProps = {
  /** JSON path of the `youtubeId` string. */
  readonly path: JsonPath;
  readonly label: string;
  readonly value: string;
  readonly issues: ArchiveIssues;
  readonly onChange: (youtubeId: string) => ArchiveCommitResult;
  /** Another item already uses this video, for an immediate duplicate warning. */
  readonly duplicate?: boolean;
  /** Full accessible name when the visible label is shortened. */
  readonly accessibleLabel?: string;
};

/**
 * Takes a pasted YouTube link or a bare id and stores only the 11-character id. Text that is not
 * a YouTube video yet stays in the field with an explanation rather than being thrown away.
 */
export function YoutubeField({ path, label, value, issues, onChange, duplicate = false, accessibleLabel }: YoutubeFieldProps) {
  const isZh = useIsZh();
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft((current) => (parseYoutubeId(current) === value ? current : value));
  }, [value]);
  const parsed = parseYoutubeId(draft);
  const valid = YOUTUBE_ID_PATTERN.test(value) && parsed === value;
  const error = draft === ''
    ? (isZh ? '請貼上 YouTube 影片網址或影片 ID。' : 'Paste a YouTube video link or id.')
    : parsed === null
      ? (isZh ? '無法辨識這個 YouTube 影片網址。請貼上 youtube.com/watch?v=…、youtu.be/… 或 11 字元的影片 ID。' : 'This is not a YouTube video link. Paste youtube.com/watch?v=…, youtu.be/…, or the 11-character id.')
      : duplicate
        ? (isZh ? '另一部影片已使用這個 YouTube 影片。' : 'Another video already uses this YouTube video.')
        : issueFor(path, issues);
  return (
    <AdminField
      id={fieldIdForStructuredEditorIssuePath(path)}
      label={label}
      {...(accessibleLabel === undefined ? {} : { 'aria-label': accessibleLabel })}
      required
      requiredText={requiredText(isZh)}
      helper={valid ? (isZh ? `影片 ID：${value}` : `Video id: ${value}`) : (isZh ? '可直接貼上 YouTube 網址，會自動取出影片 ID。' : 'Paste a YouTube link; the video id is taken from it.')}
      status={valid && !duplicate ? 'valid' : undefined}
      error={error}
      value={draft}
      className="mono"
      spellCheck={false}
      autoComplete="off"
      inputMode="url"
      placeholder="https://www.youtube.com/watch?v=…"
      onChange={(event) => {
        const next = event.currentTarget.value.trim();
        const id = parseYoutubeId(next);
        setDraft(id ?? next);
        onChange(id ?? next);
      }}
    />
  );
}
