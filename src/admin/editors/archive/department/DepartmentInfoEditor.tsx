import { useCallback, useState } from 'react';
import type { ArchiveEditorProps, EditableDepartmentInfoPayload, JsonPath } from '../archiveTypes';
import { ArchiveValidation } from '../ArchiveValidation';
import { useIdLock } from '../lockedIds';
import { PagesSection } from './PagesSection';
import { ProgramsSection } from './ProgramsSection';
import { DownloadsSection, LinkGroupsSection } from './ResourcesSections';

export type DepartmentInfoEditorProps = ArchiveEditorProps<EditableDepartmentInfoPayload>;

type Collection = 'pages' | 'programs' | 'linkGroups' | 'downloads';
type Expanded = Readonly<Record<Collection, number | null>>;

const NONE_OPEN: Expanded = { pages: null, programs: null, linkGroups: null, downloads: null };

function isCollection(value: PropertyKey | undefined): value is Collection {
  return value === 'pages' || value === 'programs' || value === 'linkGroups' || value === 'downloads';
}

/** Department pages, the five trainee programs, link groups, and downloads. */
export function DepartmentInfoEditor({ payload, issues, onChange, lockedIds }: DepartmentInfoEditorProps) {
  const [expanded, setExpanded] = useState<Expanded>(NONE_OPEN);
  const pageLock = useIdLock('pages', lockedIds);
  const linkLock = useIdLock('linkGroups', lockedIds);
  const downloadLock = useIdLock('downloads', lockedIds);
  const open = (collection: Collection) => (index: number | null) => setExpanded((current) => ({ ...current, [collection]: index }));
  const openPath = useCallback((path: JsonPath) => {
    const [collection, index] = path;
    if (isCollection(collection) && typeof index === 'number') setExpanded((current) => ({ ...current, [collection]: index }));
  }, []);
  return (
    <div className="admin-stack" data-archive-editor="department_info">
      <ArchiveValidation issues={issues} openPath={openPath} />
      <PagesSection payload={payload} issues={issues} onChange={onChange} lock={pageLock} showNewBadge={lockedIds !== undefined} expanded={expanded.pages} onExpandedChange={open('pages')} />
      <ProgramsSection payload={payload} issues={issues} onChange={onChange} expanded={expanded.programs} onExpandedChange={open('programs')} />
      <LinkGroupsSection payload={payload} issues={issues} onChange={onChange} lock={linkLock} expanded={expanded.linkGroups} onExpandedChange={open('linkGroups')} />
      <DownloadsSection payload={payload} issues={issues} onChange={onChange} lock={downloadLock} expanded={expanded.downloads} onExpandedChange={open('downloads')} />
    </div>
  );
}
