import { useMemo, useState } from 'react';
import { AdminField, AdminSelect } from '@/admin/AdminFields';
import { AdminToolbar } from '@/admin/AdminShell';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { useFieldDecorations } from '@/admin/fieldDecorations';
import { AUDIENCE_OWNER_IDS } from '@/content/contracts/archiveIds';
import { ArchiveRecordList } from '../ArchiveRecordList';
import type { ArchiveCommit, ArchiveCommitResult, ArchiveIssues, EditableGalleryPayload, EditableVideo } from '../archiveTypes';
import { removeAt, replaceAt } from '../blocks/blockModel';
import { NOUNS, ownerLabel } from '../copy';
import { DateField, FieldGrid, IdField, SelectField, useIsZh } from '../fields';
import { nextSequencedId } from '../ids';
import type { IdLock } from '../lockedIds';
import { LocalizedTextField } from '../LocalizedTextField';
import { withOptional } from '../localizedValue';
import { audienceOwnerOptions, recordRow, untranslatedBadge } from '../recordRows';
import { YoutubeField } from '../YoutubeField';
import { youtubeWatchUrl } from '../youtube';

type VideosSectionProps = {
  readonly payload: EditableGalleryPayload;
  readonly issues: ArchiveIssues;
  readonly onChange: ArchiveCommit<EditableGalleryPayload>;
  readonly lock: IdLock;
  readonly showNewBadge: boolean;
  readonly expanded: number | null;
  readonly onExpandedChange: (index: number | null) => void;
};

const ALL = 'all';

function VideoFields({ index, video, videos, idLocked, issues, onChange }: {
  readonly index: number;
  readonly video: EditableVideo;
  readonly videos: readonly EditableVideo[];
  readonly idLocked: boolean;
  readonly issues: ArchiveIssues;
  readonly onChange: (video: EditableVideo) => ArchiveCommitResult;
}) {
  const isZh = useIsZh();
  const path = ['videos', index] as const;
  const others = videos.filter((_, position) => position !== index);
  const duplicate = video.youtubeId !== '' && others.some((other) => other.youtubeId === video.youtubeId);
  return (
    <div className="admin-stack" data-video-id={video.id}>
      <FieldGrid>
        <IdField path={[...path, 'id']} issues={issues} label={isZh ? '影片識別碼' : 'Video id'} value={video.id} locked={idLocked} others={others.map((other) => other.id)} onChange={(id) => onChange({ ...video, id })} />
        <SelectField path={[...path, 'owner']} issues={issues} label={isZh ? '所屬單位' : 'Owner'} value={video.owner} options={audienceOwnerOptions(isZh)} onChange={(owner) => onChange({ ...video, owner })} />
        <DateField path={[...path, 'publishedOn']} issues={issues} label={isZh ? '日期（選填）' : 'Date (optional)'} value={video.publishedOn} onChange={(publishedOn) => onChange(withOptional(video, 'publishedOn', publishedOn))} />
      </FieldGrid>
      <YoutubeField path={[...path, 'youtubeId']} label={isZh ? 'YouTube 網址或影片 ID' : 'YouTube link or id'} value={video.youtubeId} issues={issues} duplicate={duplicate} onChange={(youtubeId) => onChange({ ...video, youtubeId })} />
      {video.youtubeId.length === 11 ? (
        <p className="admin-field-message"><a href={youtubeWatchUrl(video.youtubeId)} target="_blank" rel="noreferrer noopener">{isZh ? '在 YouTube 開啟（新分頁）' : 'Open on YouTube (new tab)'}</a></p>
      ) : null}
      <LocalizedTextField path={[...path, 'title']} label={{ zh: '影片標題', en: 'Video title' }} required value={video.title} issues={issues} onChange={(title) => onChange({ ...video, title: title ?? { zh: '' } })} />
      <LocalizedTextField path={[...path, 'description']} label={{ zh: '說明（選填）', en: 'Description (optional)' }} optional multiline value={video.description} issues={issues} onChange={(description) => onChange(withOptional(video, 'description', description))} />
    </div>
  );
}

/** The YouTube video board (影音看板). */
export function VideosSection({ payload, issues, onChange, lock, showNewBadge, expanded, onExpandedChange }: VideosSectionProps) {
  const isZh = useIsZh();
  const decorations = useFieldDecorations();
  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState(ALL);
  const needle = query.trim().toLocaleLowerCase();
  const rows = useMemo(() => payload.videos.flatMap((video, index) => {
    if (owner !== ALL && video.owner !== owner) return [];
    if (needle !== '' && ![video.title.zh, video.title.en ?? '', video.youtubeId, video.id].join('\n').toLocaleLowerCase().includes(needle)) return [];
    return [recordRow({
      collection: 'videos',
      index,
      title: video.title,
      meta: [...(video.publishedOn === undefined ? [] : [video.publishedOn]), ownerLabel(video.owner, isZh)],
      badges: [
        ...untranslatedBadge(video.title, isZh),
        ...(showNewBadge && !lock.isLocked(video.id) ? [{ label: isZh ? '新影片' : 'New', status: 'success' as const }] : []),
      ],
    }, { isZh, issues, decorations })];
  }), [decorations, isZh, issues, lock, needle, owner, payload.videos, showNewBadge]);
  return (
    <EditorSection id="gallery-videos" title={isZh ? '影音看板' : 'Video board'} description={isZh ? '貼上 YouTube 網址即可新增影片；同一部影片只能出現一次。' : 'Paste a YouTube link to add a video; each video may appear once.'}>
      <ArchiveRecordList
        id="gallery-videos-list"
        title={isZh ? '影片清單' : 'All videos'}
        rows={rows}
        totalCount={payload.videos.length}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        itemNoun={isZh ? NOUNS.video.zh : NOUNS.video.en}
        emptyTitle={isZh ? '尚無影片' : 'No videos yet'}
        emptyDescription={isZh ? '新增第一部影片。' : 'Add the first video.'}
        addLabel={isZh ? '新增影片' : 'Add video'}
        toolbar={(
          <AdminToolbar label={isZh ? '篩選影片' : 'Filter videos'}>
            <AdminField className="admin-toolbar-search" type="search" label={isZh ? '搜尋標題或影片 ID' : 'Search titles or video ids'} value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
            <AdminSelect
              label={isZh ? '所屬單位' : 'Owner'}
              value={owner}
              options={[{ value: ALL, label: isZh ? '全部單位' : 'All owners' }, ...AUDIENCE_OWNER_IDS.filter((candidate) => payload.videos.some((video) => video.owner === candidate)).map((candidate) => ({ value: candidate, label: ownerLabel(candidate, isZh) }))]}
              onChange={(event) => setOwner(event.currentTarget.value)}
            />
          </AdminToolbar>
        )}
        onAdd={() => {
          const video: EditableVideo = { id: nextSequencedId('video', payload.videos.map((candidate) => candidate.id)), owner: owner === ALL ? 'department' : owner, title: { zh: '' }, youtubeId: '' };
          if (onChange({ ...payload, videos: [...payload.videos, video] }).status !== 'emitted') return null;
          lock.markCreated(video.id);
          setQuery('');
          return payload.videos.length;
        }}
        removal={{
          title: (row) => (isZh ? `刪除影片「${row.title || '未命名'}」？` : `Delete video “${row.title || 'Untitled'}”?`),
          description: () => (isZh ? '只會從影音看板移除，YouTube 上的影片不受影響。' : 'This only removes it from the video board; the video stays on YouTube.'),
          onRemove: (index) => onChange({ ...payload, videos: removeAt(payload.videos, index) }),
        }}
        renderItem={(index) => {
          const video = payload.videos[index];
          if (video === undefined) return null;
          return (
            <VideoFields
              index={index}
              video={video}
              videos={payload.videos}
              idLocked={lock.isLocked(video.id)}
              issues={issues}
              onChange={(next) => {
                if (next.id !== video.id) lock.markCreated(next.id);
                return onChange({ ...payload, videos: replaceAt(payload.videos, index, next) });
              }}
            />
          );
        }}
      />
    </EditorSection>
  );
}
