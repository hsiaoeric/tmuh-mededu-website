import { useEffect, useState, type RefObject } from 'react';
import { useSite } from '@/app/site';
import { jumpToEditorElement, readOutline, visibleTop, type OutlineNode, type OutlineSection } from './editorOutline';

function sameNodes(left: readonly OutlineNode[], right: readonly OutlineNode[]): boolean {
  return left.length === right.length
    && left.every((node, index) => node.element === right[index]?.element && node.title === right[index]?.title && node.count === right[index]?.count);
}

function sameSections(left: readonly OutlineSection[], right: readonly OutlineSection[]): boolean {
  return sameNodes(left, right) && left.every((section, index) => sameNodes(section.children, right[index]?.children ?? []));
}

type DocumentOutlineProps = {
  readonly editorRef: RefObject<HTMLElement>;
  /** Changes whenever the editor re-renders with new content, so sections are re-read. */
  readonly revision: unknown;
  /** Collapse behind a disclosure, for when the rail is busy showing the preview. */
  readonly compact?: boolean;
};

export function DocumentOutline({ editorRef, revision, compact = false }: DocumentOutlineProps) {
  const { isZh } = useSite();
  const [sections, setSections] = useState<readonly OutlineSection[]>([]);
  const [active, setActive] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = editorRef.current;
    if (root === null) return;
    const next = readOutline(root);
    setSections((current) => (sameSections(current, next) ? current : next));
  }, [editorRef, revision]);

  useEffect(() => {
    const root = editorRef.current;
    const main = root?.closest<HTMLElement>('.admin-main') ?? null;
    if (root === null || main === null || sections.length === 0) return;
    const update = () => {
      const top = visibleTop(root);
      if (top === null) return;
      const line = top + 24;
      let current: HTMLElement | null = sections[0]?.element ?? null;
      for (const section of sections) {
        if (section.element.getBoundingClientRect().top > line) break;
        current = section.element;
        for (const child of section.children) {
          if (child.element.getBoundingClientRect().top <= line) current = child.element;
        }
      }
      setActive(current);
    };
    update();
    main.addEventListener('scroll', update, { passive: true });
    return () => main.removeEventListener('scroll', update);
  }, [editorRef, sections]);

  if (sections.length < 2 && (sections[0]?.children.length ?? 0) < 2) return null;

  const jumpTo = (element: HTMLElement) => {
    jumpToEditorElement(element);
    setActive(element);
  };
  const activeSection = sections.find((section) => section.element === active || section.children.some((child) => child.element === active));
  const heading = isZh ? '本頁章節' : 'On this page';

  const list = (
    <ol>
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            aria-current={section.element === active ? 'location' : undefined}
            data-within={section === activeSection || undefined}
            onClick={(event) => { event.preventDefault(); jumpTo(section.element); }}
          >
            {section.title}
          </a>
          {section.children.length > 0 ? (
            <ol>
              {section.children.map((child, index) => (
                <li key={`${section.id}-${index}`}>
                  <button type="button" aria-current={child.element === active ? 'location' : undefined} onClick={() => jumpTo(child.element)}>
                    <span>{child.title}</span>
                    {child.count === null ? null : <small className="mono" aria-label={isZh ? `${child.count} 項` : `${child.count} items`}>{child.count}</small>}
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
        </li>
      ))}
    </ol>
  );

  if (compact) {
    return (
      <details className="admin-outline" data-compact>
        <summary>
          <span>{heading}</span>
          {activeSection === undefined ? null : <strong>{activeSection.title}</strong>}
        </summary>
        <nav aria-label={heading}>{list}</nav>
      </details>
    );
  }
  return (
    <nav className="admin-outline" aria-label={heading}>
      <h2>{heading}</h2>
      {list}
    </nav>
  );
}
