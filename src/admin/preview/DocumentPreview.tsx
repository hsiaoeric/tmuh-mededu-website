import { useEffect, useMemo, useRef, useState, type ReactElement, type RefObject } from 'react';
import { KeepPageTitle, SiteLanguage, useSite } from '@/app/site';
import type { Lang } from '@/i18n';
import { InlineNotice } from '@/admin/AdminFeedback';
import type { DocumentWorkspace } from '@/admin/documents';
import { parseDraftPayload, withPublishableMediaReferences } from '@/admin/documents/workspaceValidation';
import { jumpToEditorElement } from '@/admin/editorOutline';
import { ContentPreviewProvider } from '@/content/ContentProvider';
import { StillMotion } from '@/motion/MotionPreference';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind } from '@/content/contracts/kinds';
import type { PublishedContent } from '@/content/domain';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';
import { DigitalMaterialsPage } from '@/pages/DigitalMaterialsPage';
import { HonorsPage } from '@/pages/HonorsPage';
import { GenericCenterPage } from '@/pages/centers/GenericCenterPage';
import { EbmPage } from '@/pages/centers/EbmPage';
import { FacdevPage } from '@/pages/centers/FacdevPage';
import { HolisticPage } from '@/pages/centers/HolisticPage';
import { Glance } from '@/pages/home/Glance';
import { Honors } from '@/pages/home/Honors';
import { News } from '@/pages/home/News';
import { PreviewFrame, PREVIEW_DEVICE_WIDTH, type PreviewDevice } from './PreviewFrame';
import { controlForPreviewTarget, editorCardFor, editorControls, fieldLabelFor, previewElementsFor, type EditorControl } from './previewLinking';

/** One public page or home section a document appears on. */
type PreviewSurface = { readonly id: string; readonly zh: string; readonly en: string; readonly Component: () => ReactElement };

const surface = (id: string, zh: string, en: string, Component: () => ReactElement): PreviewSurface => ({ id, zh, en, Component });

const HOME_NEWS = surface('home-news', '首頁公告', 'Home news', News);
const HOME_GLANCE = surface('home-glance', '首頁概覽', 'Home overview', Glance);
const HOME_HONORS = surface('home-honors', '首頁榮譽', 'Home honors', Honors);
const ANNOUNCEMENTS = surface('announcements', '公告頁', 'Announcements', AnnouncementsPage);
const HONORS = surface('honors', '品質榮譽頁', 'Honors page', HonorsPage);
const DIGITAL = surface('digital-materials', '數位教材頁', 'Digital materials', DigitalMaterialsPage);
const FACDEV = surface('facdev', '教師發展中心', 'Faculty development', FacdevPage);
const EBM = surface('ebm', '實證醫學中心', 'Evidence-based medicine', EbmPage);
const HOLISTIC = surface('holistic', '全人照護中心', 'Holistic care', HolisticPage);
const CLINICAL = surface('clinical-skills', '臨床技能中心', 'Clinical skills', () => <GenericCenterPage id="clinical_skills" />);
const MED_EDU_RESEARCH = surface('med-edu-research', '醫學教育研究中心', 'Medical education research', () => <GenericCenterPage id="med_edu_research" />);

/**
 * Where each previewable document shows up on the public site, fullest page first. These are the
 * components the live site uses, so the preview cannot drift from its real design. A document
 * on several pages gets a page switch, and locating a field moves to a page that shows it.
 */
const PREVIEW_SURFACES: Readonly<Partial<Record<CmsDocumentKind, readonly PreviewSurface[]>>> = {
  news: [ANNOUNCEMENTS, HOME_NEWS, HOLISTIC],
  activities: [ANNOUNCEMENTS, HOME_NEWS, HOLISTIC],
  people: [HOME_GLANCE, FACDEV, EBM, HOLISTIC, CLINICAL, MED_EDU_RESEARCH],
  kpis: [HOME_GLANCE],
  honors: [HONORS, HOME_HONORS],
  centers: [FACDEV, EBM, HOLISTIC, CLINICAL, MED_EDU_RESEARCH],
  digital_materials: [DIGITAL],
  facdev: [FACDEV],
  ebm: [EBM],
  holistic: [HOLISTIC],
  holistic_research: [HOLISTIC],
};

/** Kinds with a preview; must match `isPreviewableKind` (checked by a test). */
export const PREVIEW_SECTION_KINDS = Object.keys(PREVIEW_SURFACES) as CmsDocumentKind[];

/** A request to show one editor field's place in the preview; `nonce` repeats the same field. */
export type PreviewLocateRequest = { readonly control: EditorControl; readonly nonce: number };

type DocumentPreviewProps = {
  readonly kind: CmsDocumentKind;
  readonly workspace: DocumentWorkspace;
  /** The editor, so hovering or clicking the preview can point back at its fields. */
  readonly editorRef?: RefObject<HTMLElement>;
  readonly locate?: PreviewLocateRequest | null;
};

type PreviewResult =
  | { readonly ok: true; readonly content: PublishedContent }
  | { readonly ok: false };

function previewContent(kind: CmsDocumentKind, workspace: DocumentWorkspace): PreviewResult {
  const revision = workspace.actionableRevision;
  const draft = parseDraftPayload(workspace.editorText);
  if (revision === null || !draft.ok) return { ok: false };
  const parsed = CMS_PAYLOAD_REGISTRY[kind].publishedSchema.safeParse(withPublishableMediaReferences(draft.payload));
  if (!parsed.success) return { ok: false };
  return {
    ok: true,
    content: {
      documentId: workspace.document.id,
      kind,
      stableKey: CMS_DOCUMENT_STABLE_KEYS[kind],
      revisionId: revision.id,
      version: revision.version,
      payload: parsed.data,
      publishedAt: revision.updatedAt,
    } as PublishedContent,
  };
}

const LINK_ATTRIBUTE = 'data-admin-link';
const LOCATED_ATTRIBUTE = 'data-admin-located';
const EDITOR_LINKED_ATTRIBUTE = 'data-preview-linked';
const LOCATED_MS = 1600;

type Hint = { readonly left: number; readonly top: number; readonly label: string };

/** Viewport position in the admin page of a rectangle measured inside the zoomed frame. */
function hostPosition(frameDocument: Document, rect: DOMRect): { left: number; top: number } | null {
  const iframe = frameDocument.defaultView?.frameElement;
  if (iframe === null || iframe === undefined) return null;
  const outer = iframe.getBoundingClientRect();
  const scale = outer.width / Math.max(1, frameDocument.documentElement.clientWidth);
  return { left: outer.left + rect.left * scale, top: outer.top + rect.top * scale };
}

/** Hover and click in the preview point at the editor field that supplies the text. */
function usePreviewToEditorLinks(frameDocument: Document | null, editorRef: RefObject<HTMLElement> | undefined, isZh: boolean, previewIsZh: boolean) {
  const [hint, setHint] = useState<Hint | null>(null);
  useEffect(() => {
    if (frameDocument === null) return undefined;
    let linked: { preview: HTMLElement; card: HTMLElement | null } | null = null;
    const clear = () => {
      linked?.preview.removeAttribute(LINK_ATTRIBUTE);
      linked?.card?.removeAttribute(EDITOR_LINKED_ATTRIBUTE);
      linked = null;
      setHint(null);
    };
    const find = (target: EventTarget | null) => {
      const editor = editorRef?.current;
      if (editor === null || editor === undefined || !(target instanceof frameDocument.defaultView!.Element)) return null;
      return controlForPreviewTarget(target, frameDocument.body, editorControls(editor, previewIsZh));
    };
    const handleOver = (event: PointerEvent) => {
      const match = find(event.target);
      if (match?.element === linked?.preview) return;
      clear();
      if (match === null) return;
      const card = editorCardFor(match.control);
      match.element.setAttribute(LINK_ATTRIBUTE, '');
      card?.setAttribute(EDITOR_LINKED_ATTRIBUTE, '');
      linked = { preview: match.element, card };
      const position = hostPosition(frameDocument, match.element.getBoundingClientRect());
      const label = fieldLabelFor(match.control);
      if (position !== null) setHint({ ...position, label: isZh ? `點擊以編輯 · ${label}` : `Click to edit · ${label}` });
    };
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof frameDocument.defaultView!.Element ? event.target : null;
      // Links must not navigate away from unsaved edits; in-page toggles such as member panels still work.
      if (target?.closest('a') !== null && target?.closest('a') !== undefined) event.preventDefault();
      const match = find(event.target);
      if (match === null) return;
      clear();
      const control = match.control;
      // Put the caret at the end of the text once the jump has focused the field.
      control.addEventListener('focus', () => {
        const end = control.value.length;
        try {
          control.setSelectionRange(end, end);
        } catch {
          // Email and number inputs have no selection API; focus alone is enough there.
        }
      }, { once: true });
      jumpToEditorElement(control);
    };
    frameDocument.addEventListener('pointerover', handleOver);
    frameDocument.addEventListener('click', handleClick, true);
    frameDocument.documentElement.addEventListener('pointerleave', clear);
    frameDocument.defaultView?.addEventListener('scroll', clear, { passive: true });
    return () => {
      clear();
      frameDocument.removeEventListener('pointerover', handleOver);
      frameDocument.removeEventListener('click', handleClick, true);
      frameDocument.documentElement.removeEventListener('pointerleave', clear);
      frameDocument.defaultView?.removeEventListener('scroll', clear);
    };
  }, [editorRef, frameDocument, isZh, previewIsZh]);
  return hint;
}

type LocateOutcome = 'found' | 'missing' | 'elsewhere';

/**
 * Scrolls the preview to a field's text and flashes it. When the current page does not show the
 * field, reports `elsewhere` so the caller can try the document's next page.
 */
function useEditorToPreviewLocate(
  frameDocument: Document | null,
  locate: PreviewLocateRequest | null | undefined,
  content: unknown,
  onOutcome: (outcome: LocateOutcome) => void,
) {
  const onOutcomeRef = useRef(onOutcome);
  onOutcomeRef.current = onOutcome;
  useEffect(() => {
    if (frameDocument === null || locate === null || locate === undefined) return undefined;
    const elements = previewElementsFor(locate.control, frameDocument.body);
    if (elements.length === 0) {
      onOutcomeRef.current('elsewhere');
      return undefined;
    }
    onOutcomeRef.current('found');
    const first = elements[0]!;
    const scroller = frameDocument.scrollingElement;
    if (scroller !== null) {
      const rect = first.getBoundingClientRect();
      const viewport = frameDocument.documentElement.clientHeight;
      if (rect.top < 0 || rect.bottom > viewport) scroller.scrollTop += rect.top - viewport / 3;
    }
    elements.forEach((element) => element.setAttribute(LOCATED_ATTRIBUTE, ''));
    const timer = window.setTimeout(() => elements.forEach((element) => element.removeAttribute(LOCATED_ATTRIBUTE)), LOCATED_MS);
    return () => {
      window.clearTimeout(timer);
      elements.forEach((element) => element.removeAttribute(LOCATED_ATTRIBUTE));
    };
    // Re-run when the preview re-renders (new text, another page) so the field stays highlighted.
  }, [content, frameDocument, locate]);
}

/** The language a field is written in, or `null` for fields shared by both languages. */
function fieldLanguage(control: Element): Lang | null {
  const marked = control.closest('[lang]');
  if (marked === null || marked === control.ownerDocument.documentElement) return null;
  const lang = marked.getAttribute('lang') ?? '';
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('en')) return 'en';
  return null;
}

/** The current editor text rendered by the live public components, before saving or publishing. */
export function DocumentPreview({ kind, workspace, editorRef, locate }: DocumentPreviewProps) {
  const { isZh, lang: siteLang } = useSite();
  // The preview follows the language of the field being edited; the switch overrides it until the
  // next field in the other language. Derived during render so the page never flashes the wrong one.
  const [previewLanguage, setPreviewLanguage] = useState<{ readonly lang: Lang; readonly nonce: number }>({ lang: siteLang, nonce: -1 });
  if (locate !== null && locate !== undefined && locate.nonce !== previewLanguage.nonce) {
    setPreviewLanguage({ lang: fieldLanguage(locate.control) ?? previewLanguage.lang, nonce: locate.nonce });
  }
  const previewLang = previewLanguage.lang;
  const surfaces = PREVIEW_SURFACES[kind] ?? [];
  const [surfaceIndex, setSurfaceIndex] = useState(0);
  const current = surfaces[Math.min(surfaceIndex, surfaces.length - 1)];
  const result = useMemo(() => previewContent(kind, workspace), [kind, workspace]);
  // While a field is briefly invalid mid-edit, keep showing the last content that passed.
  const lastGood = useRef<PublishedContent | null>(null);
  if (result.ok) lastGood.current = result.content;
  const shown = result.ok ? result.content : lastGood.current;
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  const hint = usePreviewToEditorLinks(frameDocument, editorRef, isZh, previewLang === 'zh');
  // A located field not on this page moves through the document's other pages once each.
  const search = useRef<{ nonce: number; remaining: number } | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (locate === null || locate === undefined) return;
    search.current = { nonce: locate.nonce, remaining: surfaces.length - 1 };
  }, [locate, surfaces.length]);
  useEffect(() => {
    if (!missing) return undefined;
    const timer = window.setTimeout(() => setMissing(false), 2400);
    return () => window.clearTimeout(timer);
  }, [missing]);
  // Declared before the locate effect so a new page starts at its top before a field is scrolled to.
  useEffect(() => {
    frameDocument?.scrollingElement?.scrollTo({ top: 0 });
  }, [frameDocument, surfaceIndex]);
  const rendered = useMemo(() => ({ surfaceIndex, shown, previewLang }), [surfaceIndex, shown, previewLang]);
  useEditorToPreviewLocate(frameDocument, locate, rendered, (outcome) => {
    if (outcome === 'found') {
      search.current = null;
      setMissing(false);
      return;
    }
    const pending = search.current;
    // Only a search still in progress moves pages; browsing pages by hand never reports a miss.
    if (pending === null || pending.nonce !== locate?.nonce) return;
    if (pending.remaining > 0) {
      search.current = { ...pending, remaining: pending.remaining - 1 };
      setSurfaceIndex((index) => (index + 1) % surfaces.length);
      return;
    }
    search.current = null;
    setMissing(true);
  });
  if (current === undefined) return null;
  const Section = current.Component;
  const devices: readonly { id: PreviewDevice; label: string }[] = [
    { id: 'desktop', label: isZh ? '桌面' : 'Desktop' },
    { id: 'mobile', label: isZh ? '手機' : 'Mobile' },
  ];
  return (
    <div className="admin-preview">
      <div className="admin-preview-toolbar">
        <p className="admin-preview-note">
          {isZh
            ? '網站元件即時呈現未發佈內容。游標移到文字上可找到對應欄位，點擊即可編輯。'
            : 'Unpublished content in the live site’s components. Hover text to find its field; click to edit it.'}
        </p>
        {surfaces.length > 1 ? (
          <select className="admin-preview-surface" aria-label={isZh ? '預覽頁面' : 'Preview page'} value={current.id} onChange={(event) => setSurfaceIndex(Math.max(0, surfaces.findIndex((option) => option.id === event.target.value)))}>
            {surfaces.map((option) => <option key={option.id} value={option.id}>{isZh ? option.zh : option.en}</option>)}
          </select>
        ) : null}
        <div className="admin-preview-devices" role="group" aria-label={isZh ? '預覽語言' : 'Preview language'}>
          {(['zh', 'en'] as const).map((option) => (
            <button key={option} type="button" lang={option === 'zh' ? 'zh-Hant' : 'en'} aria-pressed={previewLang === option} onClick={() => setPreviewLanguage((current) => ({ ...current, lang: option }))}>{option === 'zh' ? '中' : 'EN'}</button>
          ))}
        </div>
        <div className="admin-preview-devices" role="group" aria-label={isZh ? '預覽裝置寬度' : 'Preview device width'}>
          {devices.map((option) => (
            <button key={option.id} type="button" aria-pressed={device === option.id} title={`${option.label} · ${PREVIEW_DEVICE_WIDTH[option.id]}px`} onClick={() => setDevice(option.id)}>{option.label}</button>
          ))}
        </div>
      </div>
      {result.ok ? null : (
        <InlineNotice status="warning" title={isZh ? '目前無法預覽' : 'Preview unavailable'} lang={isZh ? 'zh-Hant' : 'en'}>
          {isZh ? '內容尚未通過發佈檢查。修正編輯器中標示的欄位後，預覽會自動更新' : 'The content does not pass the publication check yet. Fix the fields flagged in the editor and the preview updates'}
          {shown === null ? (isZh ? '。' : '.') : (isZh ? '；以下為最後一次有效的內容。' : '; below is the last valid version.')}
        </InlineNotice>
      )}
      {missing ? <p className="admin-preview-missing" role="status">{isZh ? '這個欄位目前沒有顯示在任何預覽頁面中。' : 'This field is not shown on any preview page right now.'}</p> : null}
      {shown !== null ? (
        <SiteLanguage lang={previewLang}>
        <PreviewFrame device={device} title={isZh ? '網站預覽' : 'Site preview'} onDocument={setFrameDocument}>
          {/* Scroll-triggered reveals watch the admin window, not this frame, so motion stays still. */}
          <KeepPageTitle>
            <StillMotion>
              <ContentPreviewProvider override={shown}>
                <main className="admin-preview-page"><Section /></main>
              </ContentPreviewProvider>
            </StillMotion>
          </KeepPageTitle>
        </PreviewFrame>
        </SiteLanguage>
      ) : null}
      {hint === null ? null : (
        <div className="admin-preview-hint" role="presentation" style={{ left: hint.left, top: hint.top }}>{hint.label}</div>
      )}
    </div>
  );
}
