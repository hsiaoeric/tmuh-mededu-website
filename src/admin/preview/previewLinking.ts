/**
 * Links the live preview to the editor by matching text: the preview renders the editor's own
 * values, so an element in the preview belongs to the field whose value it displays. This works
 * for every public section without instrumenting them.
 */

export type EditorControl = HTMLInputElement | HTMLTextAreaElement;

const TEXT_CONTROL = 'input:not([type]), input[type="text"], input[type="url"], input[type="email"], input[type="tel"], textarea';
/** Short values ("12", "IF") are matched only as a whole element's text, never as a substring. */
const SUBSTRING_MIN_LENGTH = 4;

function normalize(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

/** The part of a control's value to look for: a textarea's first line, since lines render apart. */
export function needleFor(control: EditorControl): string {
  const value = control instanceof HTMLTextAreaElement
    ? (control.value.split(/\n/u).map(normalize).find((line) => line.length >= 2) ?? '')
    : normalize(control.value);
  return value.length >= 2 ? value : '';
}

function languageOf(control: Element): string {
  return control.closest('[lang]')?.getAttribute('lang') ?? '';
}

/** Text controls whose values could appear in the preview, those in the preview's language first. */
export function editorControls(root: HTMLElement, isZh: boolean): EditorControl[] {
  const controls = [...root.querySelectorAll<EditorControl>(TEXT_CONTROL)].filter((control) => needleFor(control) !== '');
  const own = (control: EditorControl) => languageOf(control).startsWith(isZh ? 'zh' : 'en');
  return [...controls.filter(own), ...controls.filter((control) => !own(control))];
}

/**
 * Below this share of an element's text, a contained value is incidental: hovering blank space in
 * a large container should not claim whichever field happens to sit somewhere inside it.
 */
const MIN_TEXT_SHARE = 0.6;

function matches(text: string, needle: string): boolean {
  if (needle.length < SUBSTRING_MIN_LENGTH) return text === needle;
  return text.includes(needle) && needle.length >= text.length * MIN_TEXT_SHARE;
}

/**
 * The innermost preview element around `target` that shows some field's value, and that field.
 * When several fields match one element, the longest value wins as the most specific.
 */
export function controlForPreviewTarget(
  target: Element,
  frame: Element,
  controls: readonly EditorControl[],
): { readonly element: HTMLElement; readonly control: EditorControl } | null {
  const needles = controls.map((control) => ({ control, needle: needleFor(control) }));
  for (let element: Element | null = target; element !== null && element !== frame; element = element.parentElement) {
    const text = normalize(element.textContent ?? '');
    if (text === '') continue;
    let best: { readonly control: EditorControl; readonly needle: string } | null = null;
    for (const candidate of needles) {
      if (matches(text, candidate.needle) && (best === null || candidate.needle.length > best.needle.length)) best = candidate;
    }
    if (best !== null) return { element: element as HTMLElement, control: best.control };
  }
  return null;
}

/** The innermost preview elements that show `control`'s value. */
export function previewElementsFor(control: EditorControl, frame: Element): HTMLElement[] {
  const needle = needleFor(control);
  if (needle === '') return [];
  const found = [...frame.querySelectorAll<HTMLElement>('*')].filter((element) => matches(normalize(element.textContent ?? ''), needle));
  return found.filter((element) => !found.some((other) => other !== element && element.contains(other)));
}

/** The editor card to mark for a field: the field itself, or its collapsed item while hidden. */
export function editorCardFor(control: EditorControl): HTMLElement | null {
  let card: HTMLElement | null = control.closest<HTMLElement>('.admin-field');
  for (let item = control.closest<HTMLElement>('.admin-editor-collection-item'); item !== null; item = item.parentElement?.closest<HTMLElement>('.admin-editor-collection-item') ?? null) {
    if (item.hasAttribute('data-collapsed')) card = item;
  }
  return card;
}

/** A readable name for a field, for the preview's "edit" hint. */
export function fieldLabelFor(control: EditorControl): string {
  const label = fieldLabelText(control.closest('.admin-field'));
  const legend = control.closest('.admin-bilingual')?.querySelector('legend')?.textContent?.trim() ?? '';
  const item = control.closest('.admin-editor-collection-item')?.querySelector('h4')?.textContent?.trim() ?? '';
  return [item, legend !== label ? legend : '', label].filter((part) => part !== '').join(' › ');
}

/** A field's own label, without its required marker or screen-reader-only annotations. */
export function fieldLabelText(field: Element | null): string {
  const label = field?.querySelector('.admin-field-label');
  if (label === null || label === undefined) return '';
  return [...label.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent ?? '').join('').trim();
}
