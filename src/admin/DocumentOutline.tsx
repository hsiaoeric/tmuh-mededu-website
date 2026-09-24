import { useEffect, useState, type RefObject } from 'react';
import { useSite } from '@/app/site';

type OutlineEntry = { readonly id: string; readonly title: string };

const SECTION_SELECTOR = '.admin-editor-section';

function topLevelSections(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(SECTION_SELECTOR)].filter(
    (section) => section.parentElement?.closest(SECTION_SELECTOR) === null && section.id !== '',
  );
}

function readEntries(root: HTMLElement): OutlineEntry[] {
  return topLevelSections(root).map((section) => ({
    id: section.id,
    title: section.querySelector('h2')?.textContent?.trim() ?? section.id,
  }));
}

function sameEntries(left: readonly OutlineEntry[], right: readonly OutlineEntry[]): boolean {
  return left.length === right.length
    && left.every((entry, index) => entry.id === right[index]?.id && entry.title === right[index]?.title);
}

function scrollContainer(element: HTMLElement): HTMLElement | null {
  return element.closest<HTMLElement>('.admin-main');
}

/** Distance from the scroll container's top edge that the sticky action bar covers. */
function stickyOffset(main: HTMLElement): number {
  const bar = main.querySelector<HTMLElement>('.admin-action-bar');
  return bar === null ? 0 : bar.getBoundingClientRect().height;
}

type DocumentOutlineProps = {
  readonly editorRef: RefObject<HTMLElement>;
  /** Changes whenever the editor re-renders with new content, so sections are re-read. */
  readonly revision: unknown;
};

export function DocumentOutline({ editorRef, revision }: DocumentOutlineProps) {
  const { isZh } = useSite();
  const [entries, setEntries] = useState<readonly OutlineEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const root = editorRef.current;
    if (root === null) return;
    const next = readEntries(root);
    setEntries((current) => (sameEntries(current, next) ? current : next));
  }, [editorRef, revision]);

  useEffect(() => {
    const root = editorRef.current;
    const main = root === null ? null : scrollContainer(root);
    if (root === null || main === null || entries.length === 0) return;
    const update = () => {
      const line = main.getBoundingClientRect().top + stickyOffset(main) + 24;
      let current: string | null = entries[0]?.id ?? null;
      for (const entry of entries) {
        const section = document.getElementById(entry.id);
        if (section !== null && section.getBoundingClientRect().top <= line) current = entry.id;
      }
      setActiveId(current);
    };
    update();
    main.addEventListener('scroll', update, { passive: true });
    return () => main.removeEventListener('scroll', update);
  }, [editorRef, entries]);

  if (entries.length < 2) return null;

  const jumpTo = (id: string) => {
    const section = document.getElementById(id);
    const main = section === null ? null : scrollContainer(section);
    if (section === null || main === null) return;
    const top = main.scrollTop + section.getBoundingClientRect().top - main.getBoundingClientRect().top - stickyOffset(main) - 12;
    main.scrollTop = top;
    section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    setActiveId(id);
  };

  return (
    <nav className="admin-outline" aria-label={isZh ? '本頁章節' : 'Sections on this page'}>
      <h2>{isZh ? '本頁章節' : 'On this page'}</h2>
      <ol>
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={entry.id === activeId ? 'location' : undefined}
              onClick={(event) => { event.preventDefault(); jumpTo(entry.id); }}
            >
              {entry.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
