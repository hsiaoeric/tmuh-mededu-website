# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Public website for the Department of Medical Education at Taipei Medical University Hospital (臺北醫學大學附設醫院 教學部) and its five centers. React 18 + Vite 5 + TypeScript SPA backed by Supabase Auth, Postgres/RLS/RPC, Storage, and the `cms-publish` Edge Function. Bilingual (zh-Hant / en) and light/dark themed; both are runtime toggles, not build variants.

The UI language of the product is Traditional Chinese; user-facing strings, comments in data files, and README are in Chinese.

The visual system is called **Living Tissue**: an editorial serif/grotesque type pairing over a slow organic WebGL field, with GSAP-driven scroll choreography.

## Commands

```bash
npm run dev        # Vite dev server, http://localhost:5173
npm run build      # tsc -b (typecheck) then vite build -> dist/
npm run preview    # serve the built dist/
npm test           # Vitest suite
npm run typecheck  # tsc -b --noEmit
npm run content:generate    # bootstrap/local-source snapshot and seed generation
npm run content:check       # verify generated snapshot and seed
npm run content:checkpoint  # authenticated Supabase-authoritative snapshot export
```

There is no linter configured. The current offline gate is `npm test`, `npm run content:check`, `npm run typecheck`, `npm run build`, and `VITE_BASE=/tmuh-mededu-website/ npm run build`. The verified baseline is 213 test files and 1677 tests. `tsconfig.app.json` enables `strict`, `noUnusedLocals`, and `noUnusedParameters`, so a leftover import or parameter fails the build.

Automated tests do not replace browser checks for visual or workflow changes. Check both themes and languages, relevant breakpoints, reduced motion, keyboard use, and the root and Pages base paths.

Node 18+.

### Deployment targets

The build serves two hosts, and `vite.config.ts` keeps them compatible:

- **Vercel** — auto-deploy on push to `main`; `vercel.json` supplies the SPA rewrite.
- **GitHub Pages** — served from the `gh-pages` branch, published with `npm run deploy` (https://hsiaoeric.github.io/tmuh-mededu-website/). This deliberately does not require merging to `main`, so this branch can be previewed on its own. `.github/workflows/deploy.yml` is an Actions-based alternative, but it only works once Settings → Pages → Source is switched to "GitHub Actions", so it is manual-dispatch only.

`base` comes from `process.env.VITE_BASE`, defaulting to `/`. Only the Pages routes set it (to the repo sub-path), so **never hardcode `base`** — that silently breaks Vercel. Pages cannot rewrite, so a build plugin copies `index.html` to `dist/404.html` for deep links.

**Anything pointing at `public/` must go through `assetUrl()` (`src/utils/asset.ts`).** Vite rewrites asset URLs in index.html and in bundled imports, but not strings assembled at runtime — a literal `/assets/…` builds and looks fine locally, then 404s on Pages. Portraits fail *silently* there, falling back to initials, so this does not announce itself.

Browser deployments that connect to CMS require both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Browser code and checkpointing must never receive a service-role or secret key. See [docs/cms-operations.md](docs/cms-operations.md) for provisioning, release, recovery, and the current hosted-integration blocker.

## Architecture

### Supabase CMS and committed fallback

- Supabase is authoritative after bootstrap. There are exactly 12 canonical `(kind, stable_key)` document identities defined by `CMS_DOCUMENT_KINDS` and `CMS_DOCUMENT_STABLE_KEYS`; contracts, admin routes, public adapters, seed, and checkpoints must remain exhaustive over that set.
- `ContentProvider` renders `src/content/generated/cms-snapshot.json` immediately, then anonymously requests published Supabase rows. `mergePublishedContent` validates and merges each identity independently. Missing, invalid, or older remote documents keep only their matching snapshot while valid siblings refresh.
- Public reads use a non-persistent anonymous Supabase client. Admin auth uses a separate persistent, auto-refreshing client. UI route guards are UX only; `cms_admins`, RLS, security-definer RPCs, and Edge Function checks are the authorization boundary.
- Each CMS editor gets their own manually provisioned email/password Auth user, allowlisted by exact `auth.users.id` in `public.cms_admins`. Accounts are never shared, so revision actor columns identify who did what. Hosted signup and anonymous sign-in stay disabled.
- Admin edits use one active draft, optimistic `edit_version` checks, explicit publish/archive confirmations, and dirty-navigation guards. Publication goes through `cms-publish`, not a direct lifecycle update.
- `draft-media` is private and owner-scoped. The Edge Function validates and promotes referenced JPEG/PNG/WebP files up to 10 MiB into immutable SHA-256-addressed `public-media` objects before finalizing publication. Cleanup is allowed only when no editor in the current admin page session claims the object and no saved draft claims it; unsaved references in another tab, browser, or session are outside this guard.
- `content:generate` is for deterministic bootstrap/local-source artifacts. `content:checkpoint` authenticates with the publishable key and CMS admin credentials, requires exactly 12 valid identities, and atomically replaces the snapshot from Supabase. Never hand-edit the generated snapshot or `supabase/seed.sql`.
- Current release status is exactly: `offline implementation verified; production Supabase integration blocked`. Do not claim hosted migration, Auth, Storage, Edge Function, or checkpoint success without a fresh approved live gate.

### Routing is ordinary react-router

`src/app/App.tsx` holds a real `<Routes>` table. `src/app/routes.ts` is the single source of truth for the center URL slugs (`CENTER_SLUG` / `SLUG_TO_CENTER` / `centerPath`), the in-page section ids (`HOME_SECTIONS`, `HOLISTIC_SECTIONS`), and `LEGACY_REDIRECTS` for the previous site's paths (`/holistic`, `/ebm`, `/facdev`, `/center/:id`) — those must keep resolving.

The slugs are **not** the center ids, which trips up hand-typed URLs:

| Center id | URL |
|---|---|
| `faculty_dev` | `/centers/faculty-development` |
| `clinical_skills` | `/centers/clinical-skills` |
| `ebm` | `/centers/evidence-based-medicine` |
| `holistic` | `/centers/holistic-care` |
| `med_edu_research` | `/centers/medical-education-research` |

`CenterBranch.pageSection` in `data/centers.ts` looks like it deep-links to these anchors, but **nothing reads it** — several values (`h-contact`, `ebm-contact`) do not match any rendered id. It is dead data, not a broken anchor to fix.

`src/pages/CenterPage.tsx` dispatches one `/centers/:slug` route to four components: three bespoke pages (holistic, EBM, faculty development) and `GenericCenterPage`, which renders any center purely from its `centers.ts` record. **Giving a center a bespoke page is the only change that needs new routing** — a new generic center just needs data.

`src/app/site.tsx` owns language and theme only (both persisted to `localStorage`, theme seeded from `prefers-color-scheme`). `usePageTitle` sets `document.title` per page.

Cross-page anchors go through `src/app/navigation.ts`: `useGoToSection` scrolls when already on `/`, otherwise stashes the anchor and navigates home, where `useConsumePendingSection` picks it up.

### Motion is centralised in `src/motion/`

- `smoothScroll.ts` — Lenis instance, wired into GSAP's ticker and `ScrollTrigger.update`. Also exports `scrollToId` / `scrollToTop` / `setScrollLocked`; **never call `window.scrollTo` or `scrollIntoView` directly**, they fight Lenis.
- `Reveal.tsx`, `SplitLines.tsx`, `Counter.tsx`, `Parallax.tsx`, `HorizontalScroll.tsx` — the entire animation vocabulary. Prefer composing these over writing new GSAP by hand.

`HorizontalScroll` **decides at runtime whether to pin at all**, and does it silently. It falls back to a plain swipeable strip under `minWidth`, under reduced motion, and — the surprising one — whenever less than one full card's width overflows the viewport, because pinning costs a whole stage of vertical scroll and has to buy something back. So adding or removing a card, or widening `.hscroll-card`, can flip a section between pinned and unpinned with no other change. While pinned the stage is `min(100vh, 560px)` **as a floor**, so taller cards still grow it.

Two rules everything here follows, and new motion must too:

1. **Content is visible by default.** Animations hide elements from inside a `useLayoutEffect` and animate them back, so a JS failure or a disabled effect never leaves a blank page.
2. **Reduced motion short-circuits every effect.** Components read `useReducedMotion()` (`src/motion/MotionPreference.tsx`), which is `prefersReducedMotion()` (`src/motion/gsap.ts`) or an enclosing `<StillMotion>`. Under reduced motion Lenis is not installed, ScrollTriggers are not created, counters print their final value, and the WebGL field renders one static frame. `StillMotion` exists for embedding public sections where the window does not scroll, such as the admin preview; new motion components must use the hook, not the bare function.

### The WebGL field

`src/webgl/TissueField.tsx` renders one fullscreen fragment shader (`tissueShader.ts`) fixed behind the whole site, lazy-loaded so three.js stays out of the initial bundle. It reads its palette from the `--field-a/-b/-c/-strength` CSS tokens, so a theme switch cross-fades the field. It renders at 0.62× resolution with DPR capped at 1.5, pauses when the tab is hidden, and no-ops entirely if WebGL is unavailable.

**The accent mix in the shader is deliberately tiny.** Against the near-black dark background even a 10% mix toward the bright jade doubles the luminance and starts competing with body copy — if the field ever looks like marble or an oil slick, that value is too high.

### Styling: three global stylesheets, then inline `style` for one-offs

No CSS-in-JS, no Tailwind.

- `design/tokens.css` — every colour and shadow as a custom property, declared twice: `:root` (light) and `[data-theme='dark']`. **A token added to only one block is a bug.** The theme attribute lives on `<html>`.
- `design/base.css` — reset, type scale, layout primitives (`shell`, `section`, `stack`, `grid` + modifiers, `measure`), motion primitives, and **all responsive breakpoints**.
- `design/components.css` — component surfaces (nav, cards, tables, org constellation, horizontal scroll, section rail…).

Component-level one-offs are inline `style={{}}` referencing `var(--…)`.

#### CJK type sizing is not optional

Han glyphs are full-width and read much larger than Latin at the same point size, and the `ch` unit is derived from the Latin `0`, so it badly under-measures Chinese. Every display step therefore has a `:lang(zh-Hant)` twin (`.d1`–`.d4`), and headline widths use `.hero-measure` / `.title-measure` rather than a raw `ch` value. **Any new display-sized text needs both variants**, or Chinese will overflow while English looks fine.

#### Per-center colour

`Center.color` from `data/centers.ts` is passed down as the `--tone` custom property. Cards, tags, dots, bars and portraits all read `var(--tone, var(--accent))`, so setting `--tone` on a container re-colours everything inside it.

### People bootstrap data

`person(zh, en, role, dZh, dEn, slug, hubId, dutyZh, dutyEn)` in `data/people.ts` builds bootstrap and local fallback data; public rendering receives equivalent validated CMS data through adapters. Notes:

- `role` must be a key of `ROLES` (typed).
- `slug` resolves to `<base>assets/<slug>.jpg` via `assetUrl`. **Roughly half the slugs in the data have no matching file**, so `PersonCard` / `Avatar` in `ui/Person.tsx` fall back to initials both when the slug is empty *and* when the image fails to load. Never render a portrait `<img>` without that fallback.
- `hubId` builds the TMU Hub academic-profile URL.
- Off-center portrait crops are overrides in the `FULL_BODY_POSITION` map, keyed by slug.

Phone extensions are stored bare in data and formatted at display time by `formatPhoneExt` (`utils/phone.ts`).

### Nested SVG icons

`ui/Icon.tsx` sets `width`/`height` as **attributes**, not CSS. Inside another `<svg>` (the org constellation) a CSS-sized nested SVG inherits the outer viewport instead and renders enormous.

### i18n: `zh.ts` is the schema

`i18n/zh.ts` exports `Strings = typeof zh`; `en.ts` is annotated `: Strings`, so a key added to `zh` without an `en` counterpart is a build error. This defines the source schema for **chrome/shared strings**, which is included in the `site_copy` CMS document for public rendering. Bootstrap page copy still uses `{ zh, en }` / `xxxZh` + `xxxEn` pairs in `src/data/*` or inline source extractors. Match the surrounding contract rather than migrating patterns casually.

`pick(lang, zhVal, enVal)` from `@/i18n` is the helper for the field-pair form.

### Content editing

Routine content updates go through the protected CMS at `/admin`, not direct edits to `src/data/`. The files under `src/data/`, `src/i18n/`, and `scripts/content/` remain bootstrap and local fallback inputs. After serializer or source-extraction changes, regenerate both artifacts and require `npm run content:check`; after approved live content changes, use authenticated `npm run content:checkpoint` to refresh the committed snapshot. Follow [docs/cms-operations.md](docs/cms-operations.md), and never edit generated snapshot or seed files directly.

## Conventions

- Imports use the `@/` alias for `src/`. It is declared **twice** — [vite.config.ts](vite.config.ts) and `tsconfig.app.json` `paths` — so both must change together.
- [TMUH-MedEdu-Website-source.md](TMUH-MedEdu-Website-source.md) is the original single-file HTML design component the first version of this app was ported from. It is historical reference for the content, not live code, and no longer reflects the current design; do not edit it to change the site.
