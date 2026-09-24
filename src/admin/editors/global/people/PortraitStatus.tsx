import { StatusBadge } from '@/admin/AdminFeedback';
import type { Person } from './peopleEditorModel';

function initials(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return (name || '?').slice(0, 2).toUpperCase();
  return `${words[0]?.[0] ?? ''}${words[words.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function portraitLabel(person: Person, isZh: boolean): string {
  switch (person.portrait?.kind) {
    case 'local':
      return isZh ? '本機照片' : 'Local portrait';
    case 'public':
      return isZh ? '公開照片' : 'Public portrait';
    case 'draft':
      return isZh ? '草稿照片' : 'Draft portrait';
    case undefined:
      return isZh ? '尚未連結照片' : 'No portrait linked';
  }
}

export function PortraitStatus({ person, isZh }: {
  readonly person: Person;
  readonly isZh: boolean;
}) {
  const label = portraitLabel(person, isZh);
  return (
    <div className="admin-media-picker" data-portrait-status={person.portrait?.kind ?? 'absent'} aria-label={label}>
      <div className="admin-media-preview">
        <span><strong aria-hidden="true">{initials(person.name)}</strong></span>
      </div>
      <div className="admin-media-copy">
        <StatusBadge status={person.portrait == null ? 'disabled' : 'info'}>{label}</StatusBadge>
        <p className="admin-field-message">{isZh ? '照片由媒體工作區管理；此處僅顯示連結狀態與姓名縮寫備援。' : 'Portraits are managed in the media workbench; this is a read-only link and initials fallback.'}</p>
        {person.portrait == null ? null : <p className="mono admin-break">{person.portrait.path}</p>}
      </div>
    </div>
  );
}
