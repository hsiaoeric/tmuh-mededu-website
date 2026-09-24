import type { Json } from '@/content/database.types';
import { diffPayloads, formatChangePath, formatChangeValue } from './payloadDiff';

const VISIBLE_CHANGES = 12;

type PublishChangesProps = {
  /** The currently public payload, or `null` when the document has never been published. */
  readonly published: Json | null;
  readonly next: Json;
  readonly isZh: boolean;
};

/** What publishing will change on the public site, as a short old → new list. */
export function PublishChanges({ published, next, isZh }: PublishChangesProps) {
  if (published === null) {
    return <p className="admin-publish-changes-note">{isZh ? '這是第一次發佈，整份內容都會公開。' : 'This is the first publication; the whole document goes live.'}</p>;
  }
  const changes = diffPayloads(published, next);
  if (changes.length === 0) {
    return <p className="admin-publish-changes-note">{isZh ? '與目前公開內容相同，沒有文字變更。' : 'Identical to the live content; no text changes.'}</p>;
  }
  const visible = changes.slice(0, VISIBLE_CHANGES);
  return (
    <div className="admin-publish-changes">
      <p>{isZh ? `將變更 ${changes.length} 處：` : `${changes.length} change${changes.length === 1 ? '' : 's'} will go live:`}</p>
      <ul>
        {visible.map((change) => (
          <li key={change.path.join('/')}>
            <span className="admin-publish-change-path">{formatChangePath(change.path, isZh)}</span>
            {change.kind === 'changed' ? (
              <span className="admin-publish-change-values">
                <del>{formatChangeValue(change.before)}</del>
                <span aria-hidden="true"> → </span>
                <ins>{formatChangeValue(change.after)}</ins>
              </span>
            ) : change.kind === 'added' ? (
              <span className="admin-publish-change-values"><ins>{isZh ? '新增：' : 'Added: '}{formatChangeValue(change.after)}</ins></span>
            ) : (
              <span className="admin-publish-change-values"><del>{isZh ? '移除：' : 'Removed: '}{formatChangeValue(change.before)}</del></span>
            )}
          </li>
        ))}
      </ul>
      {changes.length > VISIBLE_CHANGES ? <p>{isZh ? `還有 ${changes.length - VISIBLE_CHANGES} 處變更未列出。` : `${changes.length - VISIBLE_CHANGES} more not shown.`}</p> : null}
    </div>
  );
}
