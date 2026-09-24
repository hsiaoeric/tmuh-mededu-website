# TMUH Medical Education Living Tissue Design System

This document is the visual source of truth for the public website and the planned administrator CMS. It extracts the system already implemented in `src/design/tokens.css`, `src/design/base.css`, `src/design/components.css`, and the shared UI and motion components. It preserves the existing Living Tissue direction; it does not authorize a rebrand or imply that the planned admin primitives have been implemented or visually verified.

## 1. Atmosphere & Identity

Living Tissue is an editorial hospital-education environment: warm, humane, precise, and quietly alive rather than clinical or corporate. Warm bone-paper surfaces and near-black tissue surfaces carry a restrained bioluminescent jade signal, while serif headlines, grotesque reading text, mono metadata, fine borders, and a slow organic field make the experience recognizable. The signature is **living depth**: translucent and tonal layers appear to sit over a biological field, with motion that reveals relationships without competing with medical-education content. The admin CMS is the operational expression of the same identity: denser and calmer, but never a generic SaaS dashboard and never a new brand.

### Design principles

1. **Content is the authority.** Hierarchy, legibility, bilingual accuracy, and task completion outrank decoration.
2. **Warmth with rigor.** Paper, tissue, jade, and editorial type humanize the surface; grids, mono metadata, and explicit states keep it dependable.
3. **One identity, two densities.** Public pages are expressive and scroll-led. Admin pages are compact and task-led, using the same tokens, typography roles, radii, and depth strategy.
4. **Motion explains.** Animation indicates entry, continuity, progress, or state change. Content remains visible and usable when motion or WebGL is unavailable.
5. **No color-only meaning.** Jade and amber always pair with text, iconography, shape, or position when they carry status.

### Initial persona

**Primary administrator - trusted hospital education staff member**

- Maintains announcements, activities, people, center information, awards, papers, and bilingual public copy through a full-site Supabase CMS.
- Works mainly on a hospital desktop or laptop, often while cross-checking source documents, names, dates, phone extensions, and English translations.
- Is domain-expert but not expected to know React, Git, Markdown, database terminology, or deployment mechanics.
- Needs predictable navigation, explicit save/publish feedback, side-by-side Traditional Chinese and English fields, safe recovery from errors, and confidence about what the public site will show.
- May work under time pressure, at 200% browser zoom, with keyboard-only input, reduced motion, or a narrow tablet/mobile viewport. The interface must reduce memory load through persistent context, plain labels, visible status, and reversible actions.

## 2. Color

### Core palette

Every theme token is declared in both `:root` and `[data-theme='dark']`. Adding or changing a theme-dependent token in only one block is a bug.

| Role | Token | Light | Dark | Usage |
|---|---|---:|---:|---|
| Canvas | `--bg` | `#f2efe8` | `#0b100e` | Page and admin-shell ground |
| Deep canvas | `--bg-deep` | `#e8e4db` | `#070b0a` | Curtains and deepest layer |
| Primary surface | `--surface` | `#fbfaf6` | `#121917` | Panels, menus, primary work surfaces |
| Secondary surface | `--surface-2` | `#f6f3ec` | `#16211d` | Nested cards and grouped controls |
| Sunk surface | `--surface-sunk` | `#ebe7de` | `#0e1412` | Wells, media frames, inactive regions |
| Border | `--line` | `#ded8cb` | `#24302b` | Control outlines and strong dividers |
| Soft border | `--line-soft` | `#e9e4d9` | `#1b2521` | Rows, cards, quiet separation |
| Primary ink | `--ink` | `#16211d` | `#eef1ec` | Headlines, labels, selected values |
| Body ink | `--body` | `#46504a` | `#b6bfb8` | Reading text and controls |
| Muted ink | `--muted` | `#59625c` | `#808b84` | Supporting text and descriptions |
| Faint ink | `--faint` | `#5f6862` | `#78837c` | Metadata and inactive indicators |
| Jade action | `--accent` | `#286f5d` | `#58c9a6` | Primary action, link, selected state, focus family |
| Jade hover | `--accent-bright` | `#3d9b81` | `#7ee0c0` | Hover and focus outline |
| Jade deep | `--accent-deep` | `#1d5647` | `#2b8a71` | Progress gradients and darker jade detail |
| Jade wash | `--accent-wash` | `#e3ece7` | `#10201b` | Stronger selected or informational surface |
| Jade veil | `--accent-veil` | `rgba(47, 125, 104, 0.1)` | `rgba(88, 201, 166, 0.12)` | Quiet hover and selected background |
| Warm counterpoint | `--amber` | `#a9752f` | `#d9a463` | Caution, attention, and destructive-warning emphasis |
| Warm wash | `--amber-wash` | `#f3ead9` | `#211a10` | Caution and error message ground |
| On accent | `--on-accent` | `#f7fbf9` | `#05100c` | Text and icons on solid jade |
| Admin control boundary | `--admin-control-line` | Derived from 60% `--body` + `--line` | Derived from 60% `--body` + `--line` | New admin inputs, buttons, and checks requiring a 3:1 boundary |
| Admin warning ink | `--admin-warning-ink` | Derived from 70% `--amber` + `--ink` | Derived from 70% `--amber` + `--ink` | Small warning/error text on `--amber-wash` requiring 4.5:1 |

### Field palette

The public WebGL field reads these comma-free RGB triplets directly. It remains a quiet atmospheric layer, not a content surface.

| Token | Light | Dark | Rule |
|---|---|---|---|
| `--field-a` | `0.949 0.937 0.910` | `0.043 0.063 0.055` | Primary tissue ground |
| `--field-b` | `0.921 0.929 0.906` | `0.059 0.086 0.075` | Secondary tissue variation |
| `--field-c` | `0.184 0.490 0.408` | `0.345 0.788 0.651` | Jade trace |
| `--field-strength` | `0.55` | `1` | Theme-specific field visibility |

### Semantic use

- **Success / saved / published:** `--accent` plus an explicit success label and icon. Jade may never be the sole signal.
- **Information / selected / active:** `--accent`, `--accent-wash`, or `--accent-veil`, with text or `aria-current` / `aria-pressed` as appropriate.
- **Warning / validation / destructive confirmation:** `--amber` and `--amber-wash`, with a clear text message and warning icon. The current system has no separate red error ramp; do not invent one during admin implementation without extending this document and both themes first.
- **Disabled / unavailable:** `--surface-sunk`, `--line-soft`, and `--faint`, with a disabled attribute and unchanged legibility. Do not communicate disabled state through opacity alone.
- **Center identity:** public center colors flow through `--tone` from center data. They may color tags, rails, dots, bars, portraits, and links within that center's scope. The admin shell remains jade-led; center tones appear only where the edited record has a center context.
- Never introduce generic SaaS purple, a blue-purple gradient, or a raw visual color outside this palette. A new semantic need extends the token table before implementation.

## 3. Typography

The root size is `125%`, so all rem-based text respects the visitor's browser default and starts from an approximately 20px body. Traditional Chinese is the product's primary language. Display text and measures must use their `:lang(zh-Hant)` variants because Han glyphs are optically larger and `ch` is a Latin measurement.

### Font roles

| Role | Stack | Use |
|---|---|---|
| Editorial serif | `'Instrument Serif', 'Noto Serif TC', Georgia, serif` | Display headings, large numbers, quotes, editorial row titles |
| Grotesque | `'Inter', 'Noto Sans TC', system-ui, sans-serif` | Body copy, controls, navigation, dense admin content |
| Mono | `'IBM Plex Mono', 'Noto Sans TC', ui-monospace, monospace` | Dates, indexes, metadata, status codes, extensions, compact labels |

Three families are intentional: serif gives the public identity, grotesque carries bilingual reading and admin tasks, and mono distinguishes operational metadata. Do not add a fourth family.

### Display scale

| Level | Latin size | `zh-Hant` size | Weight / line / tracking | Usage |
|---|---|---|---|---|
| `.d1` | `clamp(3rem, 9vw, 8rem)` | `clamp(2.1rem, 5.4vw, 4.6rem)` | Latin 400 / 0.98 / -0.02em; Chinese 700 / 1.1 / 0.005em | Public hero only |
| `.d2` | `clamp(2.2rem, 5.6vw, 4.4rem)` | `clamp(1.65rem, 3.4vw, 2.9rem)` | Display defaults | Page and section title |
| `.d3` | `clamp(1.75rem, 3.2vw, 2.7rem)` | `clamp(1.35rem, 2.2vw, 1.95rem)` | Display defaults | Subsection title |
| `.d4` | `clamp(1.3rem, 2vw, 1.75rem)` | `clamp(1.05rem, 1.5vw, 1.3rem)` | 1.25 line height, otherwise display defaults | Card or group title |

### Reading and utility scale

| Pattern | Size | Line height | Weight / tracking | Usage |
|---|---|---|---|---|
| Body | `1rem` | `1.75` | 400 | Default public and admin reading text |
| `.prose` | `1rem` | `1.85` | 400 | Long-form content |
| `.lede` | `clamp(1.05rem, 1.5vw, 1.3rem)` | `1.7` | 300 | Introductory public copy, not dense forms |
| `.tiny` | `0.82rem` | `1.62` | 400 | Secondary information |
| `.eyebrow` | `0.74rem` | inherited | 500 / 0.24em / uppercase | Section taxonomy |
| `.index` | `0.72rem` | inherited | mono / 0.2em | Ordered section metadata |
| Admin label | existing body/tiny range | at least `1.5` | 500-700 | Persistent form and table labels |
| Admin metadata | existing `0.7rem`-`0.82rem` range | at least `1.4` | mono where machine-like | Dates, IDs, save status |

### Measure and language rules

- Public prose uses `.measure`: `62ch` in Latin and `42em` in Traditional Chinese.
- Public titles use `.title-measure`: `18ch` in Latin and `13em` in Traditional Chinese.
- Public heroes use `.hero-measure`: `14ch` in Latin and `9.5em` in Traditional Chinese.
- Announcement titles use `.news-measure`: `22ch` in Latin and `15em` in Traditional Chinese.
- Admin form labels and values are not set in display type. Serif is reserved for page or group headings; dense working content uses the grotesque.
- Every new display-sized string requires an explicit `:lang(zh-Hant)` size, line-height, and measure decision before implementation.
- At 200% zoom, text must reflow without clipping, overlap, or horizontal scrolling of the primary task area.

## 4. Spacing & Layout

### Existing rhythm

The implicit working unit is 4px, but this is an extraction, not a cleanup. Existing shared classes and fluid mechanics remain authoritative, including the inherited 26px step.

| Existing pattern | Value | Usage |
|---|---:|---|
| `.gap-1` | `8px` | Tight inline or stacked relationship |
| `.gap-2` | `16px` | Default related-control or label gap |
| `.gap-3` | `26px` | Existing comfortable content gap |
| `.gap-4` | `40px` | Group separation |
| `.gap-5` | `64px` | Page-level separation |
| Grid gap | `clamp(18px, 2.4vw, 34px)` | Responsive grid rhythm |
| `--gap-block` | `clamp(40px, 6vw, 76px)` | Section block and pinned-stage rhythm |
| Section | `clamp(64px, 9vh, 118px)` | Public section padding |
| Tight section | `clamp(48px, 7vh, 90px)` | Compact public section padding |
| `--edge` | `clamp(20px, 5vw, 76px)` | Public shell gutter |
| `--measure` | `1320px` | Public maximum content width |
| `--nav-h` | `74px`; `64px` below 780px | Public fixed navigation height |

Fluid `clamp()`, intrinsic `minmax()`, percentages, `auto`, and viewport/container units are layout mechanics, not spacing-token violations.

### Public layout primitives

- `.shell` centers content at `--measure` and applies `--edge` inline padding.
- `.section` and `.section-tight` own vertical page rhythm; nested content composes with `.stack`, `.row`, `.wrap`, and gap classes.
- `.grid` supports `.g2`, `.g3`, `.g4`, `.g-editorial` (5:7), `.g-aside` (1:2.1), intrinsic `auto-fit` variants, and capped `.grid-people` cards.
- Long reading columns use language-aware measure classes. Sticky editorial asides use `.sticky-col` and become static below 1080px.
- Horizontal content uses a named reel model: pinned only when the overflow earns the stage, otherwise a swipeable scroll-snap strip.

### Admin app-shell contract

The admin is an application shell, not a scroll-the-document marketing page.

- The shell is bounded by `100dvb`, with a fixed/persistent sidenav region and a fixed/persistent header region.
- **The main work body is the single vertical scroll owner.** The document, sidenav, and header do not independently scroll. An overlay, combobox list, or data-table horizontal scroller may own a narrowly named secondary axis, but unassigned nested vertical scrollbars are defects.
- The main body uses `min-block-size: 0` and `overflow: auto` inside a bounded grid/flex ancestor. This contract is mandatory so long content scrolls instead of pushing shell chrome away.
- Sidenav and header remain visible while records scroll. The header carries current area, theme/language controls, and save/session context; the sidenav carries stable information architecture and current-route state.
- At wide layouts, content uses a fixed-sidenav shell with a fluid main column. Work surfaces use the public surface, line, radius, and spacing vocabulary at a denser rhythm; they do not reuse the public WebGL field as a competing foreground effect.
- Bilingual fields appear as a side-by-side pair when their container can preserve readable labels and controls. Traditional Chinese is first/left in LTR layout and English second/right. The pair is one semantic group with language headings, shared field purpose, and independent validation.
- When space is insufficient, bilingual fields stack Chinese first, then English. They never become a horizontally scrolling form.
- Forms use a readable content limiter. Full-width is reserved for long text, media, and tables; short values such as dates, extensions, and status controls do not stretch without purpose.
- Use logical properties for shell and field layout. Content stress must cover empty values, long labels, long prose, and unbroken URLs/emails.

### Admin implementation tokens

The primitive showcase promotes the repeated operational measurements below to tokens. They are declared in both theme blocks even when their values are identical, so the theme contract remains mechanically auditable.

| Token | Value | Usage |
|---|---:|---|
| `--admin-space-1` | `4px` | Control internals and compact metadata |
| `--admin-space-2` | `8px` | Label/help rhythm and tight clusters |
| `--admin-space-3` | `16px` | Default control, toolbar, and panel rhythm |
| `--admin-space-4` | `26px` | Work-surface group separation |
| `--admin-space-5` | `40px` | Showcase section separation |
| `--admin-control-h` | `44px` | Minimum new admin control target |
| `--admin-header-h` | `72px` | Persistent shell header row |
| `--admin-nav-w` | `240px` | Expanded desktop sidenav column |

### Responsive contract and verification widths

| Width | Public behavior | Planned admin behavior |
|---:|---|---|
| `1280px` | Full navigation and wide grids where content permits; section rail may use its wide-screen form | Persistent fixed sidenav and header; one scrolling main body; bilingual fields side by side; tables may use their full column set |
| `768px` | Public grid rules are at or near their 780px collapse; navigation uses the sheet; section navigation uses the sticky strip | Header remains persistent; sidenav becomes a compact rail or keyboard-accessible drawer without creating a second page scroll; bilingual fields remain side by side only when their container supports it, otherwise stack |
| `375px` | One readable column; mobile navigation sheet owns its inner scroll; no primary-content horizontal overflow | Single-column main content; sidenav is an accessible drawer; actions wrap or become a clear overflow menu; bilingual fields stack; tables convert to a responsive row/card reading order or use a deliberately labeled horizontal scroller only when column comparison is essential |
| `200% zoom` | Reflow as a narrow layout, with no clipped navigation, headings, or controls | Reflow rather than shrink; fixed regions must not trap content; bilingual fields stack; all tasks and status messages remain reachable without two-dimensional primary scrolling |

Existing source breakpoints at 1199/1120/1080/860/780/720/520px remain valid. The 375/768/1280 widths are mandatory visual-QA evidence points, not replacement breakpoints.

## 5. Components

Public primitives below describe existing shared patterns. Admin primitives are contracts for the future CMS and must be implemented in a primitive showcase before any admin product screen is composed.

### Existing public primitives

#### Section, SectionTag, and SectionHeader

- **Structure:** semantic `section` -> `.shell`; optional index and mono eyebrow; display title; optional lede and right-side action.
- **Variants:** default/tight section; left/center header; optional index, description, and aside.
- **Spacing:** section rhythm, `--edge`, `.gap-2`, and the section-header fluid gap.
- **States:** static content; interactive aside inherits its own complete states.
- **Accessibility:** semantic heading order; language-aware title size and measure; content remains visible without motion.
- **Motion:** `Reveal` and `SplitLines` may stage entry; reduced motion renders final content immediately.
- **Layout:** public document scroll owner; `.shell` content limiter.

#### Button, text link, and pill control

- **Structure:** semantic `button` or link, visible label, optional SVG icon.
- **Variants:** `.btn-solid`, `.btn-ghost`, `.tlink`, and compact `.pill`.
- **Spacing:** existing button padding, icon gaps, and pill dimensions; pill radius is intentionally circular while surface radii remain small.
- **States:** existing default, hover, focus-visible, active/current or pressed where applicable. Disabled and loading are required before an admin reuse.
- **Accessibility:** native semantics; accessible name for icon-only controls; `aria-pressed`, `aria-expanded`, or `aria-current` only when the interaction requires it.
- **Motion:** icon translation and underline/tonal transitions; no motion is required to understand state.
- **Layout:** cluster/row; actions wrap before they overflow.

#### Card, panel, sunk well, rail card, tag, and dot

- **Structure:** bordered/tonal surface with content composed from stack, row, or grid primitives.
- **Variants:** translucent `.card`, hoverable `.card-hover`, solid `.panel`, `.sunk`, tone rail, capsule `.tag`, and tone `.dot`.
- **Spacing:** existing fluid card and panel padding; `--radius-lg`; shared gap classes.
- **States:** static, hoverable, selected/toned where applicable. A non-interactive card never receives decorative hover motion.
- **Accessibility:** selected/status use is paired with text or semantics; contrast must hold in both themes.
- **Motion:** border, background, shadow, and up to 4px transform for genuinely interactive cards only.
- **Layout:** stack/grid; cards do not become scroll owners.

#### Index row, stat, and table

- **Structure:** mono index or metadata, editorial title/value, supporting text, and optional action; semantic table for tabular records.
- **Variants:** editorial list row, stat/stat-cell, standard table in `.scroll-x` when comparison requires it.
- **Spacing:** row dividers and existing responsive padding/gaps.
- **States:** row default/hover/focus/current; table row selected state must be added if used interactively.
- **Accessibility:** preserve semantic table headers and scope; row actions are real buttons/links; numeric text uses tabular figures.
- **Motion:** restrained transform/color for interactive editorial rows; no animated data reordering.
- **Layout:** grid/scroll-x; horizontal scrolling has a visible label and keyboard access when used.

#### Person card, avatar, and roster row

- **Structure:** full-color portrait or initials fallback, bilingual-resolved identity, role, department/duty, extension, email, and optional profile link.
- **Variants:** card, compact card, avatar, dense roster row, roster row with contact column.
- **Spacing:** capped people grid, mat padding, and row dividers.
- **States:** image success/fallback, default/hover/focus links, absent optional data.
- **Accessibility:** meaningful card portraits use the person's name; decorative inline avatars use empty alt; contact methods are semantic links; missing images never show a broken glyph.
- **Motion:** subtle portrait scale and surface lift on hover; reduced motion removes the transition.
- **Layout:** frame + stack/grid; roster reflows below 720px.

#### Public navigation and mobile sheet

- **Structure:** fixed header with brand, semantic navigation, language/theme tools, and a mobile sheet containing an inner native scroller.
- **Variants:** wide link row, centers menu, compact controls, mobile sheet.
- **States:** top/scrolled, default/hover/current/focus, menu closed/open, theme and language values.
- **Accessibility:** skip link, labeled navigation, expanded state, meaningful control names, keyboard reachability, and locked background while the sheet is open.
- **Motion:** background/border transition and transform-based sheet/route behavior; reduced motion preserves immediate access.
- **Layout:** fixed header; document owns public page scroll; only `.nav-sheet-scroller` owns sheet scroll.

#### Section rail/strip, horizontal scroll, and organization selector

- **Structure:** wide rail with grouped menu or narrow sticky chip strip; pinned/fallback horizontal reel; SVG organization control with list equivalent.
- **Variants:** wide/narrow, active/inactive, pinned/swipeable, diagram/list.
- **States:** default, hover, focus, active/current, grouped menu open, pressed organization node.
- **Accessibility:** buttons carry pressed/current semantics; Enter and Space activate SVG nodes; narrow list preserves the same choices; reels require keyboard reachability.
- **Motion:** pulse, ring, pinning, and scroll choreography are non-essential and stop under reduced motion.
- **Layout:** rail is fixed only where a gutter exists; strip is sticky below 1200px; reel owns only horizontal movement in fallback mode.

### Planned admin primitives

These primitives inherit the existing palette, type roles, radii, spacing rhythm, and mixed-depth strategy. No admin component may introduce a parallel theme.

#### AdminAppShell

- **Structure:** bounded shell -> persistent `AdminSideNav` + shell column -> persistent `AdminHeader` + `AdminMain`.
- **Variants:** expanded sidenav, compact rail, mobile drawer.
- **Spacing:** existing 8/16/26/40px rhythm and `--edge` where a fluid gutter is needed.
- **States:** boot/loading, authenticated, session-warning, offline/error, drawer open/closed.
- **Accessibility:** skip to admin main; landmarks; current route; logical tab order; focus returns to the drawer trigger when closed.
- **Motion:** transform/opacity only for rail/drawer transitions; no parallax, custom cursor, or scroll choreography in routine CMS work.
- **Layout:** fixed-sidenav-shell plus scroll-body-shell; `AdminMain` is the one vertical scroll owner and has `min-block-size: 0`.

#### AdminSideNav, AdminHeader, PageHeader, and Toolbar

- **Structure:** semantic nav/header; route groups; current location; page title/description; status and action cluster.
- **Variants:** expanded/compact/drawer; title with save status; toolbar with filters or bulk actions.
- **States:** default, hover, focus, current, expanded/collapsed, disabled action, saving/saved/error.
- **Accessibility:** `aria-current="page"`; text labels remain available in compact mode through accessible names; toolbar follows reading order; status updates use an appropriate live region without stealing focus.
- **Motion:** short transform/opacity state transitions; saving indicators respect reduced motion.
- **Layout:** shell chrome never becomes the main scroll owner; actions wrap before overflow.

#### AdminButton and IconButton

- **Structure:** native button, visible action label unless the icon is universally understood and has an accessible name, optional SVG icon and progress indicator.
- **Variants:** primary jade, secondary/ghost, quiet text, destructive-warning amber, icon-only.
- **States:** default, hover, active, focus-visible, disabled, loading, success acknowledgement, destructive confirmation.
- **Accessibility:** disabled and loading semantics prevent duplicate submission; loading preserves button width and accessible name; minimum target is 44 by 44 CSS px for new admin controls.
- **Motion:** micro feedback through transform/opacity; no layout shift or endlessly looping spinner under reduced motion.
- **Layout:** cluster; labels wrap only when the action remains understandable.

#### Field, BilingualFieldPair, Select, Textarea, Checkbox, and Switch

- **Structure:** persistent label -> optional instruction -> native control -> validation/help message. `BilingualFieldPair` wraps matching zh-Hant and English fields in one named group.
- **Variants:** text, date, email, URL, number/extension, select, multiline, boolean; required/optional; read-only.
- **States:** empty, filled, hover, focus, disabled, read-only, loading options, valid, warning, error.
- **Accessibility:** explicit label association; required and error semantics; error text identifies the problem and recovery; no placeholder-only labels; keyboard-native controls; Chinese/English language headings and `lang` attributes.
- **Motion:** focus and validation transitions only; no floating-label motion.
- **Layout:** side-by-side language fields when readable, otherwise stacked Chinese first; fields never create horizontal page scroll.

#### AdminDataTable and RecordList

- **Structure:** caption/label, toolbar, semantic headers, rows, row status, row actions, pagination; responsive record list when a table no longer preserves a readable order.
- **Variants:** standard, selectable, sortable, filterable, compact; mobile record cards; deliberate horizontal comparison scroller.
- **States:** loading skeleton, empty, filtered-empty, error with retry, selected row, disabled bulk action, stale/refreshing.
- **Accessibility:** caption and scoped headers; sort state; checkbox labels; keyboard-operable row actions; selection never depends on color; pagination names destination and current page.
- **Motion:** opacity for refresh and state replacement; no animated row reordering.
- **Layout:** main body owns vertical scroll. A table may own horizontal scroll only when comparison is essential and must not create a nested vertical scrollbar.

#### StatusBadge, InlineNotice, and StatePanel

- **Structure:** icon + explicit status title/label + optional explanation and recovery action.
- **Variants:** draft/info, published/success, warning, error, disabled; page loading, empty, filtered-empty, permission/session error.
- **States:** visible state is the component's purpose; loading announces once, errors persist until resolved, success acknowledgement does not block work.
- **Accessibility:** never color-only; concise live announcements; errors receive focus only when needed for recovery; empty state explains the next valid action.
- **Motion:** brief opacity/transform entry when useful; static under reduced motion.
- **Layout:** inline for local status, bounded panel for page/region state; no full-page blank spinner.

#### Dialog, ConfirmDialog, Toast, and MediaPicker

- **Structure:** labeled modal surface with description/actions; non-modal status toast; media input with preview, metadata, and fallback.
- **Variants:** confirmation, destructive warning, unsaved-changes guard, session expiry; success/error toast; image choose/replace/remove.
- **States:** opening/open/closing, initial/loading/error/disabled action, upload progress, upload success/failure, missing-media fallback.
- **Accessibility:** modal focus trap and return; Escape closes when safe; destructive action is explicit; toast does not steal focus; media has accessible name, alt-text guidance, and keyboard operation.
- **Motion:** transform/opacity only; reduced motion is immediate; upload progress remains text-readable.
- **Layout:** overlays are independent focus regions, not alternate page scroll owners; long dialog content has one named internal body scroller while header/actions remain visible.

### Primitive showcase contract

**No admin product screen may be composed until a component showcase or equivalent state harness exists and passes fresh visual QA.** The showcase must:

1. Render every planned admin primitive above using real Traditional Chinese and English task copy, not placeholders.
2. Exercise default, hover, active/current, focus-visible, disabled, loading, empty, filtered-empty where applicable, error, warning, success/saved, and read-only states.
3. Show light and dark themes, zh-Hant and English, reduced-motion mode, and the 375px, 768px, and 1280px widths.
4. Include a 200% zoom pass, keyboard-only traversal, visible focus, drawer/dialog focus return, and live-region behavior.
5. Stress long bilingual labels, long prose, missing media, no records, unbroken URLs/emails, validation errors in one or both languages, and long tables.
6. Prove app-shell scroll ownership: fixed/persistent sidenav and header, one scrolling main body, no accidental document scroll, and no unnamed nested vertical scrollbar.
7. Verify both themes against WCAG 2.2 AA contrast targets and verify touch targets for new admin controls.
8. Record objective browser screenshots and interaction evidence. This document establishes the gate; it does not claim the gate has passed.

## 6. Motion & Interaction

### Existing timing language

| Type | Existing range / easing | Use |
|---|---|---|
| Micro | `0.2s`-`0.3s`, ease | Focus-adjacent feedback, color, underline, compact state change |
| Standard | `0.3s`-`0.45s`, ease or `cubic-bezier(0.16, 1, 0.3, 1)` | Menus, active indicators, card response |
| Emphasis | `0.5s`-`0.9s`, `cubic-bezier(0.16, 1, 0.3, 1)` | Public reveal, card lift, portrait movement, route curtain |
| Ambient | multi-second linear/ease cycles | Public organization pulse, field, and marquee only |
| Scroll-driven | tied to scroll | Public progress, reveal, parallax, horizontal stage |

### Rules

- Public motion uses the centralized primitives in `src/motion/`: smooth scrolling, `Reveal`, `SplitLines`, `Counter`, `Parallax`, and `HorizontalScroll`. New public effects compose from these rather than adding isolated GSAP logic.
- Content is visible by default. Effects may hide content only inside the effect lifecycle immediately before animating it back.
- Animate only composited `transform`, `opacity`, and carefully bounded `filter`. Existing color, border, and shadow transitions may remain; do not introduce layout-property animation.
- Motion must communicate affordance, state change, progress, continuity, or spatial relationship. Non-interactive decoration does not receive hover motion.
- The admin CMS is intentionally quieter than the public site. It uses micro/standard transitions for drawers, dialogs, focus, validation, save status, and state replacement. It does not use parallax, pinned storytelling, a custom cursor, ambient marquee, or decorative pulses in routine workflows.
- Loading feedback is local to the operation where possible and includes text. Saving prevents duplicate submission without freezing unrelated navigation.
- Focus is never moved merely to announce success. Errors move or link focus only when that helps the administrator recover.
- `prefers-reduced-motion: reduce` short-circuits every non-essential effect: Lenis is absent, reveals are visible, counters show final values, WebGL renders a static frame, and transitions collapse to near-instant timing. Admin progress remains understandable through text and static state.

## 7. Depth & Surface

### Strategy: mixed border, tonal shift, and restrained shadow

Living Tissue intentionally mixes three depth cues. This is not glassmorphism and not a shadow-only card system.

1. **Tonal hierarchy:** `--bg` -> `--surface-sunk` -> `--surface` / `--surface-2` establishes material layers in both themes.
2. **Hairline structure:** `--line-soft` separates repeated rows and quiet surfaces; `--line` defines controls, menus, and stronger boundaries.
3. **Restrained elevation:** shadows appear where an object lifts, floats, or overlays. They are not applied uniformly.

| Level | Token | Light | Dark | Usage |
|---|---|---|---|---|
| Subtle | `--shadow-sm` | `0 1px 2px rgba(30, 42, 36, 0.06)` | `0 1px 2px rgba(0, 0, 0, 0.5)` | Resting portrait/person card or quiet raised detail |
| Default | `--shadow-md` | `0 10px 30px -12px rgba(30, 42, 36, 0.22)` | `0 10px 30px -12px rgba(0, 0, 0, 0.6)` | Hovered interactive card, floating label |
| Prominent | `--shadow-lg` | `0 34px 70px -28px rgba(24, 38, 32, 0.35)` | `0 34px 70px -28px rgba(0, 0, 0, 0.8)` | Menu, dialog, or popover |
| Jade glow | `--glow` | `0 0 60px -12px rgba(47, 125, 104, 0.35)` | `0 0 70px -10px rgba(88, 201, 166, 0.32)` | Rare public accent atmosphere, not routine admin controls |

### Material rules

- Default radius is small: `--radius: 4px` and `--radius-lg: 8px`. Pills, dots, avatars, and circular controls are explicit shape exceptions, not a license for rounded-everything UI.
- Public cards may use a 72% surface mix, 8px blur, a soft border, and optional shadow on interaction. Panels use an opaque primary surface.
- Fixed public navigation and narrow section strips use a theme surface mixed with transparency, blur, and a hairline border.
- Admin work surfaces are calmer: opaque or near-opaque `--surface` / `--surface-2`, hairline borders, and shadows only for overlays or true elevation. The WebGL field may remain a distant shell atmosphere only if it does not reduce contrast or task focus.
- Nested surfaces must change tone before adding another shadow. Avoid stacking card inside card inside card.
- The grain overlay belongs to the public atmospheric frame. It must not lower text or form-control clarity in the admin work body.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- **Target:** WCAG 2.2 AA. Required contrast floors are 4.5:1 for normal text, 3:1 for large text, and 3:1 for meaningful non-text UI boundaries and focus indicators. These values must be measured in both themes before implementation is accepted.
- **Language:** `<html lang>` reflects `zh-Hant` or English. Bilingual admin fields carry language-specific labels and content language. Traditional Chinese remains first in paired editing order.
- **Keyboard:** every route, menu, field, table action, drawer, dialog, media control, and recovery action is reachable and operable without a pointer. Enter/Space behavior follows native semantics. No positive `tabindex`.
- **Focus:** the existing global focus-visible treatment is a 2px `--accent-bright` outline with 3px offset. New admin controls preserve an equally visible token-based focus indicator in both themes. Overlays trap and return focus; route changes place focus predictably at the new task heading when needed.
- **Zoom and reflow:** all public and admin tasks work at 200% zoom. At a 375px CSS viewport, primary content forms one readable column without horizontal scrolling. Essential tables may use one clearly named horizontal scroller, never two-dimensional page scrolling.
- **Touch:** new admin interactive targets are at least 44 by 44 CSS px or provide equivalent target spacing. Existing smaller public controls are recorded as debt below.
- **Motion:** `prefers-reduced-motion` is respected across CSS, GSAP/Lenis, counters, reels, and WebGL. Reduced motion never hides content or removes feedback.
- **Themes:** light/dark preference is supported and persisted. Theme is not used to alter information hierarchy or remove a state.
- **States:** loading, empty, filtered-empty, error, warning, success, disabled, and read-only states use text and semantics as well as color. Errors identify what happened and how to recover. Disabled controls remain legible.
- **Cognitive access:** stable navigation and headings, plain Traditional Chinese labels, visible save/publish status, grouped bilingual fields, reversible actions, and confirmation only for consequential changes reduce memory and error burden.
- **Content:** no placeholder-only labels, ambiguous links, unexplained icons, or generic error copy. Long labels and translations wrap by design; unbroken strings use an overflow-safe treatment.
- **Media:** portraits preserve meaningful alt text or decorative empty alt as appropriate and retain initials fallback. Admin media workflows require alt-text guidance and a non-image fallback.
- **Performance and fallback:** the public WebGL field is decorative, lazy, pointer-inert, and optional. A missing WebGL context or JS effect must leave a readable token-colored surface and visible content.

### Accepted debt

These are existing inconsistencies or deliberately deferred consolidations. They are documented without changing current source.

| Item | Location | Why accepted now | Owner / exit condition |
|---|---|---|---|
| Spacing is an implicit scale rather than a complete token set; repeated values include an off-grid 26px step and many component-local fluid values. | `src/design/base.css`, `src/design/components.css` | Extraction must describe the shipped public system, not rewrite it during documentation. | Design-system consolidation only when approved alongside implementation; preserve visual rhythm and regression-test public pages. |
| Component CSS and JSX contain one-off visual dimensions and inline styles in addition to shared classes. | `src/design/components.css`, shared UI components | These values encode tuned public compositions, SVG geometry, portraits, and responsive exceptions. | Audit when a pattern is reused by admin; promote only repeated intent to a token or primitive. |
| Public components do not uniformly define disabled, loading, empty, and error states because many are static presentation patterns. | Existing public buttons, rows, cards, tables | The public site does not currently exercise every operational state. | Admin primitive showcase must define all applicable states before public/admin reuse. |
| The palette has jade, amber, and neutrals but no separate destructive/error hue ramp. | `src/design/tokens.css` | The request requires preserving the current brand and current tokens; inventing red now would be a redesign. | Validate amber-based warning/error communication in the admin showcase. Add a paired light/dark semantic ramp only if measured usability requires it and this document is updated first. |
| Some existing compact public controls are below the new 44px admin touch-target requirement, including 34px pills and 42px row-go controls. | `src/design/components.css` | They are shipped public patterns and are outside this documentation-only scope. | Public accessibility pass; all new admin controls meet the 44px contract from first implementation. |
| Some public decorative and nested SVG styles use raw RGBA values, pixel geometry, and per-center data colors outside the core theme table. | Portrait overlays, organization diagram, center `--tone` values | They are content/art direction and geometry rather than a second general-purpose palette. | Keep scoped to existing primitives; audit contrast before any value is reused in admin UI. |
| Hidden scrollbars are used on public mobile navigation, reels, and section strips. Keyboard discoverability is not proven by this document. | `src/design/components.css` | This task does not alter or visually test the public surface. | Verify keyboard and assistive access in a future public visual/accessibility QA pass; expose affordance if testing finds a barrier. |
| The admin CMS primitives and shell are implemented and have focused remediation evidence, but the complete primitive-showcase approval round remains pending. | Section 5 and `.omo/evidence/cms/03-showcase-fixes/` | Focused regression QA must not be represented as the final cross-matrix approval. | Exit only after an independent reviewer approves the fresh 76-capture matrix at 375/768/1280, 200% zoom, both themes/languages, reduced motion, and keyboard traversal. |

No final primitive-showcase approval is claimed by this document; focused remediation evidence does not replace the pending independent 76-capture round.
