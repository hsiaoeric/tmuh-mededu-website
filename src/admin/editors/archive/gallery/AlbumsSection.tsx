import { useMemo, useState } from 'react';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { useFieldDecorations } from '@/admin/fieldDecorations';
import { GALLERY_LIMITS } from '@/content/contracts/gallery';
import { ArchiveRecordList } from '../ArchiveRecordList';
import type { ArchiveCommit, ArchiveCommitResult, ArchiveIssues, EditableAlbum, EditableGalleryPayload, EditablePhoto } from '../archiveTypes';
import { insertAt, moveItem, removeAt, replaceAt } from '../blocks/blockModel';
import { collectionCopy, NOUNS, ownerLabel } from '../copy';
import { DateField, FieldGrid, IdField, issueFor, SelectField, useIsZh } from '../fields';
import { nextSequencedId } from '../ids';
import type { IdLock } from '../lockedIds';
import { LocalizedTextField } from '../LocalizedTextField';
import { withOptional } from '../localizedValue';
import { ArchiveMediaField } from '../media/ArchiveMediaField';
import { audienceOwnerOptions, recordRow, untranslatedBadge } from '../recordRows';

type AlbumsSectionProps = {
  readonly payload: EditableGalleryPayload;
  readonly issues: ArchiveIssues;
  readonly onChange: ArchiveCommit<EditableGalleryPayload>;
  readonly lock: IdLock;
  readonly showNewBadge: boolean;
  readonly expanded: number | null;
  readonly onExpandedChange: (index: number | null) => void;
};

function sizeOf(photo: EditablePhoto): string | null {
  return photo.width === undefined || photo.height === undefined ? null : `${photo.width} × ${photo.height} px`;
}

function PhotosEditor({ albumIndex, album, issues, onChange }: {
  readonly albumIndex: number;
  readonly album: EditableAlbum;
  readonly issues: ArchiveIssues;
  readonly onChange: (album: EditableAlbum) => ArchiveCommitResult;
}) {
  const isZh = useIsZh();
  const [adding, setAdding] = useState(false);
  const photos = album.photos;
  const path = ['albums', albumIndex, 'photos'] as const;
  const noun = isZh ? NOUNS.photo.zh : NOUNS.photo.en;
  const photosIssue = issueFor(path, issues);
  return (
    <div className="admin-stack">
      <EditorCollection
        id={`archive-album-${albumIndex}-photos`}
        title={isZh ? `照片（${photos.length}）` : `Photos (${photos.length})`}
        description={isZh ? '依顯示順序排列，可用上移、下移調整。發布前每本相簿至少要有一張照片。' : 'In display order; use move up and down to reorder. Each album needs at least one photo to publish.'}
        itemCount={photos.length}
        revisionKeys={[photos]}
        copy={collectionCopy(NOUNS.photo, isZh)}
        onAdd={() => {
          if (photos.length < GALLERY_LIMITS.photosPerAlbum) setAdding(true);
          return { status: 'unchanged' };
        }}
        onMove={(from, to) => onChange({ ...album, photos: moveItem(photos, from, to) })}
        onRemove={(position) => onChange({ ...album, photos: removeAt(photos, position) })}
        renderItem={(position) => {
          const photo = photos[position];
          if (photo === undefined) return null;
          const photoPath = [...path, position];
          const update = (next: EditablePhoto) => onChange({ ...album, photos: replaceAt(photos, position, next) });
          const size = sizeOf(photo);
          return (
            <div className="admin-stack admin-archive-photo">
              <ArchiveMediaField
                slot={{ slotKind: 'album-photo', path: [...photoPath, 'media'], reference: photo.media, required: true }}
                label={isZh ? `${noun} ${position + 1}` : `${noun} ${position + 1}`}
                altText={photo.alt?.zh ?? ''}
                issues={issues}
                onChange={(media, meta) => {
                  if (media === null) return { status: 'unchanged' };
                  const { width: _width, height: _height, ...rest } = photo;
                  return update({ ...rest, media, ...(meta?.width === undefined ? {} : { width: meta.width }), ...(meta?.height === undefined ? {} : { height: meta.height }) });
                }}
              />
              {size === null ? null : <p className="admin-field-message mono">{size}</p>}
              <LocalizedTextField path={[...photoPath, 'alt']} label={isZh ? `${noun} ${position + 1} 替代文字（選填）` : `${noun} ${position + 1} alt text (optional)`} description={isZh ? '描述照片內容；留白時以相簿標題代替。' : 'Describe the photo; the album title is used when blank.'} optional value={photo.alt} issues={issues} onChange={(alt) => update(withOptional(photo, 'alt', alt))} />
              <LocalizedTextField path={[...photoPath, 'caption']} label={isZh ? `${noun} ${position + 1} 圖說（選填）` : `${noun} ${position + 1} caption (optional)`} optional value={photo.caption} issues={issues} onChange={(caption) => update(withOptional(photo, 'caption', caption))} />
            </div>
          );
        }}
      />
      {photosIssue === undefined ? null : <p className="admin-field-message admin-field-error" role="alert">{photosIssue}</p>}
      {adding ? (
        <ArchiveMediaField
          pending
          slot={{ slotKind: 'album-photo', path: [...path, photos.length, 'media'], reference: null, required: true }}
          label={isZh ? `新照片（第 ${photos.length + 1} 張）` : `New photo (${photos.length + 1})`}
          issues={issues}
          onCancel={() => setAdding(false)}
          onChange={(media, meta) => {
            if (media === null) return { status: 'unchanged' };
            const photo: EditablePhoto = {
              id: nextSequencedId('photo', photos.map((candidate) => candidate.id)),
              media,
              ...(meta?.width === undefined ? {} : { width: meta.width }),
              ...(meta?.height === undefined ? {} : { height: meta.height }),
            };
            const result = onChange({ ...album, photos: insertAt(photos, photos.length, photo) });
            if (result.status === 'emitted') setAdding(false);
            return result;
          }}
        />
      ) : null}
    </div>
  );
}

function AlbumFields({ index, album, otherIds, idLocked, issues, onChange }: {
  readonly index: number;
  readonly album: EditableAlbum;
  readonly otherIds: readonly string[];
  readonly idLocked: boolean;
  readonly issues: ArchiveIssues;
  readonly onChange: (album: EditableAlbum) => ArchiveCommitResult;
}) {
  const isZh = useIsZh();
  const path = ['albums', index] as const;
  return (
    <div className="admin-stack" data-album-id={album.id}>
      <FieldGrid>
        <IdField path={[...path, 'id']} issues={issues} label={isZh ? '相簿識別碼' : 'Album id'} value={album.id} locked={idLocked} others={otherIds} onChange={(id) => onChange({ ...album, id })} />
        <SelectField path={[...path, 'owner']} issues={issues} label={isZh ? '所屬單位' : 'Owner'} value={album.owner} options={audienceOwnerOptions(isZh)} onChange={(owner) => onChange({ ...album, owner })} />
        <DateField path={[...path, 'date']} issues={issues} label={isZh ? '活動日期（選填）' : 'Event date (optional)'} value={album.date} onChange={(date) => onChange(withOptional(album, 'date', date))} />
      </FieldGrid>
      <LocalizedTextField path={[...path, 'title']} label={{ zh: '相簿標題', en: 'Album title' }} required value={album.title} issues={issues} onChange={(title) => onChange({ ...album, title: title ?? { zh: '' } })} />
      <LocalizedTextField path={[...path, 'description']} label={{ zh: '說明（選填）', en: 'Description (optional)' }} optional multiline value={album.description} issues={issues} onChange={(description) => onChange(withOptional(album, 'description', description))} />
      <ArchiveMediaField
        slot={{ slotKind: 'album-cover', path: [...path, 'cover'], reference: album.cover ?? null, required: false }}
        label={isZh ? '封面（選填，預設為第一張照片）' : 'Cover (optional; defaults to the first photo)'}
        altText={album.title.zh}
        issues={issues}
        onChange={(cover) => onChange(withOptional(album, 'cover', cover ?? undefined))}
      />
      <PhotosEditor albumIndex={index} album={album} issues={issues} onChange={onChange} />
    </div>
  );
}

/** Event photo albums (活動花絮), newest first. */
export function AlbumsSection({ payload, issues, onChange, lock, showNewBadge, expanded, onExpandedChange }: AlbumsSectionProps) {
  const isZh = useIsZh();
  const decorations = useFieldDecorations();
  const rows = useMemo(() => [...payload.albums.keys()]
    .sort((left, right) => (payload.albums[right]!.date ?? '').localeCompare(payload.albums[left]!.date ?? '') || left - right)
    .map((index) => {
      const album = payload.albums[index]!;
      return recordRow({
        collection: 'albums',
        index,
        title: album.title,
        meta: [...(album.date === undefined ? [] : [album.date]), ownerLabel(album.owner, isZh), isZh ? `${album.photos.length} 張` : `${album.photos.length} photo${album.photos.length === 1 ? '' : 's'}`],
        badges: [
          ...untranslatedBadge(album.title, isZh),
          ...(showNewBadge && !lock.isLocked(album.id) ? [{ label: isZh ? '新相簿' : 'New', status: 'success' as const }] : []),
        ],
      }, { isZh, issues, decorations });
    }), [decorations, isZh, issues, lock, payload.albums, showNewBadge]);
  return (
    <EditorSection id="gallery-albums" title={isZh ? '活動相簿' : 'Photo albums'} description={isZh ? '活動花絮相簿與照片。照片的替代文字與圖說皆可只填中文。' : 'Event albums and their photos. Photo alt text and captions may be Chinese only.'}>
      <ArchiveRecordList
        id="gallery-albums-list"
        title={isZh ? '相簿清單' : 'All albums'}
        rows={rows}
        totalCount={payload.albums.length}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        itemNoun={isZh ? NOUNS.album.zh : NOUNS.album.en}
        emptyTitle={isZh ? '尚無相簿' : 'No albums yet'}
        emptyDescription={isZh ? '新增第一本相簿。' : 'Add the first album.'}
        addLabel={isZh ? '新增相簿' : 'Add album'}
        onAdd={() => {
          const album: EditableAlbum = { id: nextSequencedId('album', payload.albums.map((candidate) => candidate.id)), owner: 'department', title: { zh: '' }, photos: [] };
          if (onChange({ ...payload, albums: [...payload.albums, album] }).status !== 'emitted') return null;
          lock.markCreated(album.id);
          return payload.albums.length;
        }}
        removal={{
          title: (row) => (isZh ? `刪除相簿「${row.title || '未命名'}」？` : `Delete album “${row.title || 'Untitled'}”?`),
          description: (row) => {
            const album = payload.albums[row.index];
            return album !== undefined && lock.isLocked(album.id)
              ? (isZh ? '這本相簿已發布或有舊網站連結轉址到它；刪除並發布後，這些連結會顯示找不到頁面。' : 'This album is published or a legacy link redirects to it; once deleted and published, those links show “not found”.')
              : (isZh ? '這本相簿尚未發布。' : 'This album is not published yet.');
          },
          onRemove: (index) => onChange({ ...payload, albums: removeAt(payload.albums, index) }),
        }}
        renderItem={(index) => {
          const album = payload.albums[index];
          if (album === undefined) return null;
          return (
            <AlbumFields
              index={index}
              album={album}
              otherIds={payload.albums.flatMap((candidate, position) => (position === index ? [] : [candidate.id]))}
              idLocked={lock.isLocked(album.id)}
              issues={issues}
              onChange={(next) => {
                if (next.id !== album.id) lock.markCreated(next.id);
                return onChange({ ...payload, albums: replaceAt(payload.albums, index, next) });
              }}
            />
          );
        }}
      />
    </EditorSection>
  );
}
