/*
 * The z-depth escalator engine.
 *
 * Ported from the Nexus System template and generalised so it can carry a
 * content-heavy site rather than four viewport-sized slides.
 *
 * In the template every card is exactly one viewport tall, so the timeline is
 * simply `card index x viewport height`. Here a card may be far taller than the
 * viewport (a 200-paper list, an awards table, an org chart). Each card is
 * therefore pinned for a *dwell* equal to its overflow: while the page scroll
 * is inside that dwell the card stays put and its content is scrubbed upward
 * inside it. Only after the dwell is exhausted does the next card slide up over
 * it. Nothing has to be paginated or cut — every card is as long as it needs.
 *
 * Timeline for card `i`, in page-scroll pixels:
 *
 *   anchor(0) = 0
 *   anchor(i) = anchor(i-1) + dwell(i-1) + vh      <- one vh per hand-off
 *   dwell(i)  = max(0, contentHeight(i) - vh)
 *
 *   entry  = (y - (anchor(i) - vh)) / vh           <- slides in from below
 *   scrub  = clamp(y - anchor(i), 0, dwell(i))     <- content moves inside
 *   recede = (y - (anchor(i) + dwell(i))) / vh     <- shrinks and dims away
 *
 * The engine is a module singleton rather than React state: it runs on
 * `requestAnimationFrame` and writes styles imperatively, so re-rendering
 * React on every scroll frame would be both wasteful and too slow.
 */

export interface CardEntry {
  /** The fixed, viewport-sized `.zcard` element. */
  el: HTMLElement;
  /** The auto-height content wrapper that gets scrubbed inside the card. */
  inner: HTMLElement;
  /** Short label for the HUD's section readout. */
  label: string;
  anchor: number;
  dwell: number;
}

type Listener = (state: EngineState) => void;

export interface EngineState {
  /** 0-1 progress through the whole stack. */
  progress: number;
  /** Index of the card currently occupying the viewport. */
  index: number;
  count: number;
  labels: string[];
  /** True when the engine has collapsed to a plain scrolling document. */
  isStatic: boolean;
}

const cards = new Set<CardEntry>();
const listeners = new Set<Listener>();

let ordered: CardEntry[] = [];
let spacer: HTMLElement | null = null;
let vh = 0;
let lastWidth = 0;
let total = 0;
let ticking = false;
let isStatic = false;
let state: EngineState = {
  progress: 0,
  index: 0,
  count: 0,
  labels: [],
  isStatic: false,
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function scrollY(): number {
  return window.scrollY || window.pageYOffset || 0;
}

/** Document order, not registration order — StrictMode remounts shuffle the latter. */
function byDocumentOrder(a: CardEntry, b: CardEntry): number {
  const rel = a.el.compareDocumentPosition(b.el);
  if (rel & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (rel & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

function readViewportHeight(): number {
  // `innerHeight` shifts as mobile browsers collapse their URL bar, which would
  // re-measure the whole timeline mid-scroll and make the page jump. Only the
  // width and large height changes (orientation, desktop resize) count.
  return window.innerHeight || document.documentElement.clientHeight || 800;
}

/** Recompute dwells, anchors and the scroll-track height. */
export function measure(): void {
  ordered = Array.from(cards).sort(byDocumentOrder);
  vh = readViewportHeight();
  lastWidth = window.innerWidth;

  let anchor = 0;
  ordered.forEach((card, i) => {
    card.anchor = anchor;
    card.dwell = isStatic ? 0 : Math.max(0, card.inner.scrollHeight - vh);
    anchor += card.dwell + vh;
    // Later cards must paint over earlier ones as they slide up. The stack is
    // authored in DOM order, so the index supplies the layering.
    card.el.style.zIndex = String(10 + i);
  });

  // The final card needs no hand-off, so the track stops at the end of its dwell.
  const last = ordered[ordered.length - 1];
  total = last ? last.anchor + last.dwell : 0;

  if (spacer) spacer.style.height = isStatic ? '0px' : `${total + vh}px`;

  render();
}

/**
 * Push a new state to subscribers, but only when something they render has
 * actually changed. `render` runs on every scroll frame; without this the HUD
 * would re-render 60 times a second.
 */
function publish(progress: number, index: number): void {
  const labels = ordered.map((c) => c.label);
  const labelsChanged =
    labels.length !== state.labels.length ||
    labels.some((l, i) => l !== state.labels[i]);
  // The progress bar is a 2px rule, so tenths of a percent are invisible.
  const rounded = Math.round(progress * 1000) / 1000;

  if (
    !labelsChanged &&
    rounded === state.progress &&
    index === state.index &&
    isStatic === state.isStatic
  ) {
    return;
  }

  state = {
    progress: rounded,
    index,
    count: labels.length,
    labels: labelsChanged ? labels : state.labels,
    isStatic,
  };
  listeners.forEach((fn) => fn(state));
}

function render(): void {
  if (!ordered.length) return;

  if (isStatic) {
    const max = Math.max(1, document.documentElement.scrollHeight - readViewportHeight());
    const y = scrollY();
    // Without a pinned card, "current section" is whichever one the top of the
    // viewport is inside.
    let index = 0;
    ordered.forEach((card, i) => {
      if (card.el.getBoundingClientRect().top <= readViewportHeight() * 0.4) index = i;
    });
    publish(clamp01(y / max), index);
    return;
  }

  const y = scrollY();
  const lastIndex = ordered.length - 1;
  let index = 0;

  for (let i = 0; i < ordered.length; i++) {
    const card = ordered[i];
    const entry = i === 0 ? 1 : clamp01((y - (card.anchor - vh)) / vh);
    const recede =
      i === lastIndex ? 0 : clamp01((y - (card.anchor + card.dwell)) / vh);
    const scrub = Math.max(0, Math.min(card.dwell, y - card.anchor));

    const translate = (1 - entry) * 100;
    const scale = 1 - 0.1 * recede;

    card.el.style.transform = `translate3d(0,${translate}%,0) scale(${scale})`;
    card.el.style.opacity = String(1 - 0.6 * recede);
    card.inner.style.transform = `translate3d(0,${-scrub}px,0)`;

    // A card that has fully receded is completely covered by the one above it,
    // and one that has not entered sits off-screen; neither should be reachable
    // by the pointer or the tab key.
    const live = entry > 0.001 && recede < 0.999;
    card.el.style.visibility = live ? 'visible' : 'hidden';
    card.el.setAttribute('aria-hidden', live ? 'false' : 'true');
    card.el.dataset.zLive = live ? '1' : '0';

    if (entry >= 1 && recede < 1) index = i;
  }

  publish(total > 0 ? clamp01(y / total) : 0, index);
}

function requestRender(): void {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    ticking = false;
    render();
  });
}

/** Add a card to the stack. Returns the matching unregister function. */
export function registerCard(entry: Omit<CardEntry, 'anchor' | 'dwell'>): () => void {
  const card: CardEntry = { ...entry, anchor: 0, dwell: 0 };
  cards.add(card);
  scheduleMeasure();
  return () => {
    cards.delete(card);
    scheduleMeasure();
  };
}

let measureTimer = 0;
/** Coalesce the burst of registrations that a view switch produces. */
export function scheduleMeasure(): void {
  window.clearTimeout(measureTimer);
  measureTimer = window.setTimeout(measure, 0);
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  fn(state);
  return () => {
    listeners.delete(fn);
  };
}

export function getState(): EngineState {
  return state;
}

export function setSpacer(el: HTMLElement | null): void {
  spacer = el;
}

export function setStatic(next: boolean): void {
  if (isStatic === next) return;
  isStatic = next;
  if (isStatic) {
    // Hand every card back to normal document flow.
    for (const card of cards) {
      card.el.style.transform = '';
      card.el.style.opacity = '';
      card.el.style.visibility = '';
      card.inner.style.transform = '';
      card.el.setAttribute('aria-hidden', 'false');
    }
  }
  measure();
}

/** Page-scroll position at which card `i` becomes the pinned card. */
export function cardAnchor(i: number): number {
  const card = ordered[Math.max(0, Math.min(ordered.length - 1, i))];
  return card ? card.anchor : 0;
}

export function scrollToCard(i: number, behavior: ScrollBehavior = 'smooth'): void {
  if (!ordered.length) return;
  const clamped = Math.max(0, Math.min(ordered.length - 1, i));
  if (isStatic) {
    const el = ordered[clamped].el;
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY(), behavior });
    return;
  }
  window.scrollTo({ top: cardAnchor(clamped), behavior });
}

/**
 * Page-scroll position that brings `el` into view, wherever it lives in the
 * stack: the anchor of its card, plus however far down that card's content the
 * element sits (never past the card's dwell, where it would be clipped).
 */
export function scrollOffsetForElement(el: HTMLElement, headroom: number): number | null {
  const cardEl = el.closest<HTMLElement>('.zcard');
  if (!cardEl) return null;
  const card = ordered.find((c) => c.el === cardEl);
  if (!card) return null;
  if (isStatic) return null;

  const innerRect = card.inner.getBoundingClientRect();
  // Undo the receding scale so the measured offset is in layout pixels.
  const scale = card.inner.offsetHeight
    ? innerRect.height / card.inner.offsetHeight
    : 1;
  const relative =
    scale > 0 ? (el.getBoundingClientRect().top - innerRect.top) / scale : 0;

  return card.anchor + Math.max(0, Math.min(card.dwell, relative - headroom));
}

let started = false;

/** Wire the engine to the window. Safe to call more than once. */
export function startEngine(): () => void {
  if (started) return () => {};
  started = true;

  const onScroll = () => requestRender();
  const onResize = () => {
    const widthChanged = window.innerWidth !== lastWidth;
    const heightDelta = Math.abs(readViewportHeight() - vh);
    if (widthChanged || heightDelta > 120) measure();
    else requestRender();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  // Web fonts land after first paint and change every content height.
  document.fonts?.ready.then(() => measure());

  measure();

  return () => {
    started = false;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
  };
}
