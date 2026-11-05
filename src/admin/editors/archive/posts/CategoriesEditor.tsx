import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import type { ArchiveCommit, ArchiveIssues, EditablePostsPayload } from '../archiveTypes';
import { channelLabel } from '../copy';
import { OrderField, useIsZh } from '../fields';
import { LocalizedTextField } from '../LocalizedTextField';
import { replaceAt } from '../blocks/blockModel';
import { sortedCategories } from './postsModel';

type CategoriesEditorProps = {
  readonly payload: EditablePostsPayload;
  readonly issues: ArchiveIssues;
  readonly onChange: ArchiveCommit<EditablePostsPayload>;
};

/**
 * Category names and order. The set of categories and the channel each belongs to are fixed by
 * the site (filters and legacy redirects use their ids), so only the wording and order change.
 */
export function CategoriesEditor({ payload, issues, onChange }: CategoriesEditorProps) {
  const isZh = useIsZh();
  const ordered = sortedCategories(payload.categories);
  return (
    <EditorSection
      id="posts-categories"
      title={isZh ? '文章分類' : 'Post categories'}
      description={isZh ? '分類與所屬頻道固定，只能修改顯示名稱與順序。分類名稱會出現在網站篩選器，請提供英文。' : 'The categories and their channels are fixed; only names and order change. Names appear in the site filters, so give them English too.'}
    >
      <ol className="admin-archive-categories">
        {ordered.map((category) => {
          const index = payload.categories.indexOf(category);
          const update = (next: typeof category) => onChange({ ...payload, categories: replaceAt(payload.categories, index, next) });
          return (
            <li key={category.id} className="admin-archive-category" data-category-id={category.id}>
              <p className="admin-archive-category-meta"><span className="mono">{category.id}</span> · {channelLabel(category.channel, isZh)}</p>
              <div className="admin-archive-category-fields">
                <LocalizedTextField
                  path={['categories', index, 'label']}
                  label={isZh ? `分類名稱 ${category.id}` : `Category name ${category.id}`}
                  required
                  value={category.label}
                  issues={issues}
                  onChange={(label) => update({ ...category, label: label ?? { zh: '' } })}
                />
                <OrderField path={['categories', index, 'order']} issues={issues} label={isZh ? `${category.id} 順序` : `${category.id} order`} value={category.order} onChange={(order) => update({ ...category, order })} />
              </div>
            </li>
          );
        })}
      </ol>
    </EditorSection>
  );
}
