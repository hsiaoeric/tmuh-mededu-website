import { EDITOR_REVEAL_EVENT } from './editors/global/ui/EditorDensity';
import { fieldLabelText } from './preview/previewLinking';

/** A heading-level place in the editor: a section, a nested section, or a collection. */
export type OutlineNode = {
  readonly element: HTMLElement;
  readonly title: string;
  /** Items in a collection; `null` for sections. */
  readonly count: number | null;
  /** Holds a field that differs from the published revision. */
  readonly changed: boolean;
};

export type OutlineSection = OutlineNode & {
  readonly id: string;
  readonly children: readonly OutlineNode[];
};

/** Something the header search can jump to inside the open editor. */
export type EditorSearchTarget = {
  readonly kind: 'section' | 'item' | 'field';
  readonly element: HTMLElement;
  readonly title: string;
  /** Where the target sits, such as its section and collection. */
  readonly context: string;
  /** Searchable text that is not shown, such as every field value in an item. */
  readonly text: string;
};

const SECTION = '.admin-editor-section';
const COLLECTION = '.admin-editor-collection';
const ITEM = '.admin-editor-collection-item';
const FIELD_CONTROL = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea';

function text(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/gu, ' ').trim() ?? '';
}

/** The nearest section or collection that contains `element`, excluding itself. */
function parentNode(element: HTMLElement): HTMLElement | null {
  return element.parentElement?.closest<HTMLElement>(`${SECTION}, ${COLLECTION}`) ?? null;
}

function sectionTitle(section: HTMLElement): string {
  return text(section.querySelector(':scope > .admin-editor-section-header h2')) || text(section.querySelector('h2')) || section.id;
}

function collectionTitle(collection: HTMLElement): string {
  return text(collection.querySelector(':scope > .admin-editor-collection-header h3'));
}

function collectionCount(collection: HTMLElement): number {
  return collection.querySelectorAll(':scope > .admin-editor-collection-list > [data-editor-item-index]').length;
}

function hasChanges(element: HTMLElement): boolean {
  return element.querySelector('[data-changed]') !== null;
}

/**
 * Top-level editor sections with their direct sub-sections and collections, read from the
 * rendered editor so every document kind gets an outline without per-editor wiring.
 */
export function readOutline(root: HTMLElement): OutlineSection[] {
  const sections = [...root.querySelectorAll<HTMLElement>(SECTION)].filter((section) => parentNode(section) === null && section.id !== '');
  return sections.map((section) => {
    const title = sectionTitle(section);
    const children = [...section.querySelectorAll<HTMLElement>(`${SECTION}, ${COLLECTION}`)]
      .filter((child) => parentNode(child) === section)
      .map((child): OutlineNode => (child.matches(SECTION)
        ? { element: child, title: sectionTitle(child), count: null, changed: hasChanges(child) }
        : { element: child, title: collectionTitle(child), count: collectionCount(child), changed: hasChanges(child) }))
      .filter((child) => child.title !== '' && child.title !== title);
    return { id: section.id, element: section, title, count: null, changed: hasChanges(section), children };
  });
}

function contextOf(element: HTMLElement): string {
  const trail: string[] = [];
  let node = parentNode(element);
  while (node !== null) {
    const title = node.matches(SECTION) ? sectionTitle(node) : collectionTitle(node);
    if (title !== '' && trail[0] !== title) trail.unshift(title);
    node = parentNode(node);
  }
  return trail.join(' › ');
}

function fieldLabel(control: HTMLElement): string {
  const label = fieldLabelText(control.closest('.admin-field'));
  const lang = control.closest('[lang]')?.getAttribute('lang');
  const bilingual = control.closest('.admin-bilingual');
  const legend = text(bilingual?.querySelector('legend'));
  const base = label || legend || control.getAttribute('aria-label') || '';
  const langKey = text(control.closest('.admin-bilingual-grid > div')?.querySelector('.admin-language-key'));
  if (legend !== '' && label !== '' && legend !== label) return `${legend} › ${label}`;
  return langKey !== '' && lang !== null ? `${base} · ${langKey}` : base;
}

/** Every section, collection item, and text field in the editor, in document order. */
export function readSearchTargets(root: HTMLElement): EditorSearchTarget[] {
  const targets: EditorSearchTarget[] = [];
  for (const section of root.querySelectorAll<HTMLElement>(SECTION)) {
    targets.push({ kind: 'section', element: section, title: sectionTitle(section), context: contextOf(section), text: '' });
  }
  for (const item of root.querySelectorAll<HTMLElement>(ITEM)) {
    const values = [...item.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(FIELD_CONTROL)]
      .map((control) => control.value.trim())
      .filter((value) => value !== '');
    const label = text(item.querySelector('h4'));
    const summary = values.find((value) => !/^\d{4}[-/]\d{2}/u.test(value)) ?? '';
    targets.push({ kind: 'item', element: item, title: summary === '' ? label : `${label} · ${summary}`, context: contextOf(item), text: values.join(' ') });
  }
  for (const control of root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(FIELD_CONTROL)) {
    if (control.closest(ITEM) !== null || control.disabled) continue;
    const label = fieldLabel(control);
    if (label === '') continue;
    targets.push({ kind: 'field', element: control, title: label, context: contextOf(control), text: control.value });
  }
  return targets;
}

function scrollContainer(element: HTMLElement): HTMLElement | null {
  return element.closest<HTMLElement>('.admin-main');
}

/** Distance from the scroll container's top edge that the sticky action bar covers. */
export function stickyOffset(main: HTMLElement): number {
  const bar = main.querySelector<HTMLElement>('.admin-action-bar');
  return bar === null ? 0 : bar.getBoundingClientRect().height;
}

/** The top edge, in viewport coordinates, below which editor content is not covered. */
export function visibleTop(element: HTMLElement): number | null {
  const main = scrollContainer(element);
  return main === null ? null : main.getBoundingClientRect().top + stickyOffset(main);
}

/**
 * Scrolls `element` just below the sticky action bar, opening any collapsed collection item
 * around it first, then moves focus there so keyboard users continue from the target.
 */
export function jumpToEditorElement(element: HTMLElement): void {
  const main = scrollContainer(element);
  if (main === null) return;
  element.dispatchEvent(new CustomEvent(EDITOR_REVEAL_EVENT, { bubbles: true }));
  // A collapsed item re-renders open in a later task, not always by the next frame; wait for it.
  let frames = 0;
  const settle = () => {
    if (element.closest('[hidden]') !== null && frames < 12) {
      frames += 1;
      window.requestAnimationFrame(settle);
      return;
    }
    const anchor = element.matches(FIELD_CONTROL) ? (element.closest<HTMLElement>('.admin-field') ?? element) : element;
    main.scrollTop += anchor.getBoundingClientRect().top - main.getBoundingClientRect().top - stickyOffset(main) - 12;
    if (element.matches(FIELD_CONTROL)) {
      element.focus({ preventScroll: true });
      return;
    }
    const heading = element.querySelector<HTMLElement>('h2, h3, h4');
    if (heading === null) return;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  };
  window.requestAnimationFrame(settle);
}
