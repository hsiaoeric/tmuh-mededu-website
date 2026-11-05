import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import type { ArchiveCommitResult, ArchiveIssues, EditableAttachment, JsonPath } from '../archiveTypes';
import { collectionCopy, NOUNS } from '../copy';
import { HrefField, useIsZh } from '../fields';
import { nextSequencedId } from '../ids';
import { LocalizedTextField } from '../LocalizedTextField';
import { insertAt, moveItem, removeAt, replaceAt } from '../blocks/blockModel';

type AttachmentsEditorProps = {
  /** JSON path of the attachments array. */
  readonly path: JsonPath;
  readonly attachments: readonly EditableAttachment[];
  readonly issues: ArchiveIssues;
  readonly onChange: (attachments: readonly EditableAttachment[]) => ArchiveCommitResult;
};

/** Files and links listed under a post: a label and a link or a kept legacy file. */
export function AttachmentsEditor({ path, attachments, issues, onChange }: AttachmentsEditorProps) {
  const isZh = useIsZh();
  const noun = isZh ? NOUNS.attachment.zh : NOUNS.attachment.en;
  return (
    <EditorCollection
      id={`archive-${path.map(String).join('-')}`}
      title={isZh ? '附件與相關連結' : 'Attachments and links'}
      description={isZh ? '連結可為 https 網址、站內路徑，或舊網站保留的 files/legacy/ 檔案。' : 'Each link can be an https URL, a site path, or a file kept from the old site under files/legacy/.'}
      itemCount={attachments.length}
      revisionKeys={[attachments]}
      copy={collectionCopy(NOUNS.attachment, isZh)}
      onAdd={() => onChange(insertAt(attachments, attachments.length, {
        id: nextSequencedId('attachment', attachments.map((attachment) => attachment.id)),
        label: { zh: '' },
        href: '',
      }))}
      onMove={(from, to) => onChange(moveItem(attachments, from, to))}
      onRemove={(index) => onChange(removeAt(attachments, index))}
      renderItem={(index) => {
        const attachment = attachments[index];
        if (attachment === undefined) return null;
        const update = (next: EditableAttachment) => onChange(replaceAt(attachments, index, next));
        return (
          <div className="admin-stack">
            <LocalizedTextField
              path={[...path, index, 'label']}
              label={isZh ? `${noun} ${index + 1} 名稱` : `${noun} ${index + 1} label`}
              required
              value={attachment.label}
              issues={issues}
              onChange={(label) => update({ ...attachment, label: label ?? { zh: '' } })}
            />
            <HrefField
              path={[...path, index, 'href']}
              issues={issues}
              label={isZh ? `${noun} ${index + 1} 連結` : `${noun} ${index + 1} link`}
              allowFile
              value={attachment.href}
              onChange={(href) => update({ ...attachment, href })}
            />
          </div>
        );
      }}
    />
  );
}
