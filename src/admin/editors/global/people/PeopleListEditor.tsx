import type {
  StructuredEditorCommitResult as GlobalEditorCommitResult,
  StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import { insertPaired, movePaired, nextCollectionId, removePaired, type PairedCollection } from '../pairedCollections';
import { EditorCollection } from '../ui/EditorCollection';
import { PersonFields } from './PersonFields';
import { peopleCollectionCopy } from './peopleEditorCopy';
import { EMPTY_PERSON, updatePerson, type Person } from './peopleEditorModel';

type PeopleListEditorProps = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly people: PairedCollection<Person>;
  readonly zhPath: readonly PropertyKey[];
  readonly enPath: readonly PropertyKey[];
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly isZh: boolean;
  readonly onChange: (change: (collection: PairedCollection<Person>) => ReturnType<typeof insertPaired<Person>>) => GlobalEditorCommitResult;
};

export function PeopleListEditor(props: PeopleListEditorProps) {
  return (
    <EditorCollection
      id={props.id}
      title={props.title}
      description={props.description}
      itemCount={Math.min(props.people.zh.length, props.people.en.length)}
      revisionKeys={[props.people.zh, props.people.en]}
      copy={peopleCollectionCopy(props.isZh, 'person')}
      onAdd={() => props.onChange((collection) => {
        const id = nextCollectionId('new-person', [
          ...collection.zh.map((person) => person.id),
          ...collection.en.map((person) => person.id),
        ]);
        const person = { ...EMPTY_PERSON, id };
        return insertPaired(collection, {
          index: collection.zh.length,
          rows: { zh: person, en: person },
        });
      })}
      onMove={(fromIndex, toIndex) => props.onChange((collection) => movePaired(collection, { fromIndex, toIndex }))}
      onRemove={(index) => props.onChange((collection) => removePaired(collection, { index }))}
      renderItem={(index) => {
        const zh = props.people.zh[index];
        const en = props.people.en[index];
        if (zh === undefined || en === undefined) return null;
        return (
          <PersonFields
            zh={zh}
            en={en}
            zhPath={[...props.zhPath, index]}
            enPath={[...props.enPath, index]}
            issues={props.issues}
            isZh={props.isZh}
            onChange={(locale, field, value) => props.onChange((collection) => (
              updatePerson(collection, { locale, index, field, value })
            ))}
          />
        );
      }}
    />
  );
}
