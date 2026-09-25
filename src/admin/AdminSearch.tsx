import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSite } from '@/app/site';
import { CMS_DOCUMENT_KINDS } from '@/content/contracts/kinds';
import { Icon } from '@/ui/Icon';
import { CMS_DOCUMENT_METADATA } from './documents/cmsDocumentMetadata';
import { jumpToEditorElement, readSearchTargets, type EditorSearchTarget } from './editorOutline';

const PAGE_LIMIT = 12;
const DOCUMENT_LIMIT = 6;
const SNIPPET_RADIUS = 28;

type SearchResult = {
  readonly key: string;
  readonly group: 'page' | 'documents';
  readonly icon: 'clipboard' | 'book' | 'chart' | 'arrow';
  readonly title: string;
  readonly context: string;
  readonly snippet: string;
  readonly run: () => void;
};

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/gu, ' ').trim();
}

function snippetAround(text: string, query: string): string {
  const oneLine = text.replace(/\s+/gu, ' ').trim();
  const index = normalize(oneLine).indexOf(query);
  if (index < 0) return '';
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(oneLine.length, index + query.length + SNIPPET_RADIUS);
  return `${start > 0 ? '…' : ''}${oneLine.slice(start, end)}${end < oneLine.length ? '…' : ''}`;
}

function Highlight({ text, query }: { readonly text: string; readonly query: string }): ReactNode {
  if (query === '') return text;
  const index = text.toLocaleLowerCase().indexOf(query);
  if (index < 0) return text;
  return <>{text.slice(0, index)}<mark>{text.slice(index, index + query.length)}</mark>{text.slice(index + query.length)}</>;
}

function editorRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.admin-workspace-editor');
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/u.test(navigator.userAgent);

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'));
}

/** Header search across every CMS document and, on a document page, its sections, items and fields. */
export function AdminSearch() {
  const { isZh } = useSite();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [targets, setTargets] = useState<readonly EditorSearchTarget[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
      const slash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target);
      if (!shortcut && !slash) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshTargets = () => {
    const root = editorRoot();
    setTargets(root === null ? [] : readSearchTargets(root));
  };

  const needle = normalize(query);
  const results = useMemo<SearchResult[]>(() => {
    const close = () => {
      setOpen(false);
      setQuery('');
    };
    const page = targets
      .filter((target) => (needle === ''
        ? target.kind === 'section' && target.context === ''
        : normalize(`${target.title} ${target.context}`).includes(needle) || normalize(target.text).includes(needle)))
      .sort((left, right) => Number(!normalize(left.title).includes(needle)) - Number(!normalize(right.title).includes(needle)))
      .slice(0, PAGE_LIMIT)
      .map((target, index): SearchResult => ({
        key: `page-${index}`,
        group: 'page',
        icon: target.kind === 'section' ? 'arrow' : 'clipboard',
        title: target.title,
        context: target.context,
        snippet: needle === '' || normalize(target.title).includes(needle) ? '' : snippetAround(target.text, needle),
        run: () => {
          close();
          inputRef.current?.blur();
          jumpToEditorElement(target.element);
        },
      }));
    const dashboard = { key: 'dashboard', label: isZh ? '管理總覽' : 'Dashboard', description: isZh ? '所有文件與待發布狀態' : 'All documents and what awaits publishing', path: '/admin', icon: 'chart' as const };
    const documents = [
      dashboard,
      ...CMS_DOCUMENT_KINDS.map((kind) => {
        const metadata = CMS_DOCUMENT_METADATA[kind];
        return {
          key: kind,
          label: isZh ? metadata.label.zh : metadata.label.en,
          description: isZh ? metadata.description.zh : metadata.description.en,
          path: `/admin/content/${kind}`,
          icon: 'book' as const,
          haystack: `${metadata.label.zh} ${metadata.label.en} ${metadata.description.zh} ${metadata.description.en} ${kind}`,
        };
      }),
    ]
      .filter((entry) => needle === '' || normalize('haystack' in entry ? entry.haystack : `${entry.label} ${entry.description}`).includes(needle))
      .slice(0, needle === '' ? undefined : DOCUMENT_LIMIT)
      .map((entry): SearchResult => ({
        key: `doc-${entry.key}`,
        group: 'documents',
        icon: entry.icon,
        title: entry.label,
        context: entry.description,
        snippet: '',
        run: () => {
          close();
          inputRef.current?.blur();
          navigate(entry.path);
        },
      }));
    return [...page, ...documents];
  }, [isZh, navigate, needle, targets]);

  const active = results[Math.min(activeIndex, results.length - 1)];
  const optionId = (key: string) => `${listId}-${key}`;

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!open) { refreshTargets(); setOpen(true); return; }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((current) => (results.length === 0 ? 0 : (Math.min(current, results.length - 1) + step + results.length) % results.length));
        return;
      }
      case 'Enter':
        if (!open || active === undefined) return;
        event.preventDefault();
        active.run();
        return;
      case 'Escape':
        event.preventDefault();
        if (query !== '') { setQuery(''); setActiveIndex(0); return; }
        setOpen(false);
        inputRef.current?.blur();
        return;
      default:
    }
  };

  // Keep the highlighted option inside the list's own scroll box as the arrow keys move it.
  useEffect(() => {
    if (!open || active === undefined) return;
    const list = document.getElementById(listId);
    const option = document.getElementById(`${listId}-${active.key}`);
    if (list === null || option === null) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [active, listId, open]);

  const groups = [
    { id: 'page', label: isZh ? '本頁內容' : 'On this page', items: results.filter((result) => result.group === 'page') },
    { id: 'documents', label: isZh ? '文件' : 'Documents', items: results.filter((result) => result.group === 'documents') },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="admin-search" role="search">
      <Icon name="search" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label={isZh ? '搜尋文件、章節與內容' : 'Search documents, sections and content'}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active !== undefined ? optionId(active.key) : undefined}
        placeholder={isZh ? '搜尋文件、章節或內容…' : 'Search documents, sections, content…'}
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); if (!open) { refreshTargets(); setOpen(true); } }}
        onFocus={() => { refreshTargets(); setOpen(true); setActiveIndex(0); }}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      <kbd aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      <div className="admin-search-results" id={listId} role="listbox" aria-label={isZh ? '搜尋結果' : 'Search results'} hidden={!open}>
        {groups.length === 0 ? (
          <p className="admin-search-empty" role="presentation">{isZh ? `找不到「${query.trim()}」` : `Nothing matches “${query.trim()}”`}</p>
        ) : groups.map((group) => (
          <div key={group.id} role="group" aria-labelledby={`${listId}-${group.id}`}>
            <p className="admin-search-group" id={`${listId}-${group.id}`} role="presentation">{group.label}</p>
            {group.items.map((result) => (
              <div
                key={result.key}
                id={optionId(result.key)}
                role="option"
                aria-selected={result === active}
                className="admin-search-option"
                // Keep focus in the input so the list does not close before the click lands.
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => { const index = results.indexOf(result); if (index !== activeIndex) setActiveIndex(index); }}
                onClick={result.run}
              >
                <Icon name={result.icon} />
                <span>
                  <strong><Highlight text={result.title} query={needle} /></strong>
                  {result.context === '' ? null : <small>{result.context}</small>}
                  {result.snippet === '' ? null : <small className="admin-search-snippet"><Highlight text={result.snippet} query={needle} /></small>}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
