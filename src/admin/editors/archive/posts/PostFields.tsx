import { AdminCheckbox } from '@/admin/AdminFields';
import { OWNER_IDS, POST_CHANNELS, PROGRAM_IDS } from '@/content/contracts/archiveIds';
import type { ArchiveCommitResult, ArchiveIssues, EditablePost, EditablePostCategory } from '../archiveTypes';
import { BlockListEditor } from '../blocks/BlockListEditor';
import { channelLabel, ownerLabel, programLabel } from '../copy';
import { DateField, FieldGrid, IdField, issueFor, SelectField, useIsZh } from '../fields';
import { LocalizedTextField } from '../LocalizedTextField';
import { withOptional } from '../localizedValue';
import { ArchiveMediaField } from '../media/ArchiveMediaField';
import { AttachmentsEditor } from './AttachmentsEditor';
import { categoryLabel, changePostChannel, setPostAudience, sortedCategories } from './postsModel';

type PostFieldsProps = {
  readonly index: number;
  readonly post: EditablePost;
  readonly categories: readonly EditablePostCategory[];
  /** Ids of every other post, for the uniqueness check. */
  readonly otherIds: readonly string[];
  readonly idLocked: boolean;
  readonly issues: ArchiveIssues;
  readonly onChange: (post: EditablePost) => ArchiveCommitResult;
};

/** Every field of one post. Rendered only while its row is open. */
export function PostFields({ index, post, categories, otherIds, idLocked, issues, onChange }: PostFieldsProps) {
  const isZh = useIsZh();
  const path = ['posts', index] as const;
  const ownerOptions = OWNER_IDS
    .filter((owner) => post.channel !== 'center' || owner !== 'department')
    .map((owner) => ({ value: owner, label: ownerLabel(owner, isZh) }));
  const audienceIssue = issueFor([...path, 'audiences'], issues);
  return (
    <div className="admin-stack admin-archive-post" data-post-id={post.id}>
      <FieldGrid>
        <IdField path={[...path, 'id']} issues={issues} label={isZh ? '文章識別碼' : 'Post id'} value={post.id} locked={idLocked} others={otherIds} onChange={(id) => onChange({ ...post, id })} />
        <DateField path={[...path, 'publishedOn']} issues={issues} label={isZh ? '發布日期' : 'Date'} required value={post.publishedOn} onChange={(publishedOn) => onChange({ ...post, publishedOn: publishedOn ?? '' })} />
        <SelectField
          path={[...path, 'channel']}
          issues={issues}
          label={isZh ? '頻道' : 'Channel'}
          helper={isZh ? '決定文章出現在公告、榮譽榜或中心頁。' : 'Where the post appears: announcements, the honor board, or a center page.'}
          value={post.channel}
          options={POST_CHANNELS.map((channel) => ({ value: channel, label: channelLabel(channel, isZh) }))}
          onChange={(channel) => onChange(changePostChannel(post, channel, categories))}
        />
        <SelectField
          path={[...path, 'categoryId']}
          issues={issues}
          label={isZh ? '分類' : 'Category'}
          value={post.categoryId}
          options={sortedCategories(categories, post.channel).map((category) => ({ value: category.id, label: categoryLabel(categories, category.id, isZh) }))}
          onChange={(categoryId) => onChange({ ...post, categoryId })}
        />
        <SelectField
          path={[...path, 'owner']}
          issues={issues}
          label={isZh ? '所屬單位' : 'Owner'}
          value={post.owner}
          options={ownerOptions}
          onChange={(owner) => onChange({ ...post, owner })}
        />
      </FieldGrid>
      <AdminCheckbox
        switchControl
        checked={post.pinned}
        label={isZh ? '置頂' : 'Pinned'}
        description={isZh ? '置頂文章排在同頻道清單的最前面。' : 'Pinned posts are listed first in their channel.'}
        onChange={(event) => onChange({ ...post, pinned: event.currentTarget.checked })}
      />
      <fieldset className="admin-archive-checkset" aria-describedby={audienceIssue === undefined ? undefined : `${path.join('-')}-audiences-error`}>
        <legend>{isZh ? '學員專區對象（選填）' : 'Trainee audiences (optional)'}</legend>
        <p className="admin-field-message">{isZh ? '勾選後，文章也會列在對應訓練計畫的頁面。' : 'Checked programs also list the post on their trainee page.'}</p>
        <div className="admin-archive-checkset-grid">
          {PROGRAM_IDS.map((program) => (
            <AdminCheckbox
              key={program}
              checked={post.audiences?.includes(program) ?? false}
              label={programLabel(program, isZh)}
              onChange={(event) => onChange(setPostAudience(post, program, event.currentTarget.checked))}
            />
          ))}
        </div>
        {audienceIssue === undefined ? null : <p id={`${path.join('-')}-audiences-error`} className="admin-field-message admin-field-error" role="alert">{audienceIssue}</p>}
      </fieldset>
      <LocalizedTextField path={[...path, 'title']} label={{ zh: '標題', en: 'Title' }} required value={post.title} issues={issues} onChange={(title) => onChange({ ...post, title: title ?? { zh: '' } })} />
      <LocalizedTextField path={[...path, 'summary']} label={{ zh: '摘要（選填）', en: 'Summary (optional)' }} optional multiline value={post.summary} issues={issues} onChange={(summary) => onChange(withOptional(post, 'summary', summary))} />
      <ArchiveMediaField
        slot={{ slotKind: 'post-cover', path: [...path, 'cover'], reference: post.cover ?? null, required: false }}
        label={isZh ? '封面圖片（選填）' : 'Cover image (optional)'}
        altText=""
        issues={issues}
        onChange={(cover) => onChange(withOptional(post, 'cover', cover ?? undefined))}
      />
      <BlockListEditor
        path={[...path, 'body']}
        label={{ zh: '內文', en: 'Body' }}
        value={post.body}
        issues={issues}
        imageSlotKind="post-block-image"
        onChange={(body) => onChange({ ...post, body })}
      />
      <AttachmentsEditor path={[...path, 'attachments']} attachments={post.attachments} issues={issues} onChange={(attachments) => onChange({ ...post, attachments })} />
    </div>
  );
}
