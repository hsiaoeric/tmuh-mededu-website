import { useCallback, useState } from 'react';
import type { ArchiveEditorProps, EditableGalleryPayload, JsonPath } from '../archiveTypes';
import { ArchiveValidation } from '../ArchiveValidation';
import { useIdLock } from '../lockedIds';
import { AlbumsSection } from './AlbumsSection';
import { VideosSection } from './VideosSection';

export type GalleryEditorProps = ArchiveEditorProps<EditableGalleryPayload>;

/** Photo albums and the YouTube video board. */
export function GalleryEditor({ payload, issues, onChange, lockedIds }: GalleryEditorProps) {
  const [albumOpen, setAlbumOpen] = useState<number | null>(null);
  const [videoOpen, setVideoOpen] = useState<number | null>(null);
  const albumLock = useIdLock('albums', lockedIds);
  const videoLock = useIdLock('videos', lockedIds);
  const openPath = useCallback((path: JsonPath) => {
    const [collection, index] = path;
    if (typeof index !== 'number') return;
    if (collection === 'albums') setAlbumOpen(index);
    if (collection === 'videos') setVideoOpen(index);
  }, []);
  return (
    <div className="admin-stack" data-archive-editor="gallery">
      <ArchiveValidation issues={issues} openPath={openPath} />
      <AlbumsSection payload={payload} issues={issues} onChange={onChange} lock={albumLock} showNewBadge={lockedIds !== undefined} expanded={albumOpen} onExpandedChange={setAlbumOpen} />
      <VideosSection payload={payload} issues={issues} onChange={onChange} lock={videoLock} showNewBadge={lockedIds !== undefined} expanded={videoOpen} onExpandedChange={setVideoOpen} />
    </div>
  );
}
