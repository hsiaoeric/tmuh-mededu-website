# Full-Site Supabase CMS

## Objective

Complete the existing full-site Supabase CMS implementation for the TMUH Medical Education website. Preserve the Living Tissue public design, bilingual behavior, themes, routes, legacy redirects, motion, GitHub Pages base-path behavior, and committed snapshot fallback. Use a manually provisioned, allowlisted single administrator. Browser code may use only the Supabase project URL and publishable key.

## Fixed Decisions

- Email/password authentication for one manually provisioned Supabase Auth user allowlisted in `cms_admins`; signup remains disabled.
- `/admin/login` is public. All other `/admin` routes, including the design-system showcase, are protected.
- Public reads use an anonymous non-persistent client; admin auth uses a distinct persistent auto-refreshing client.
- Database RLS and security-definer RPC authorization remain authoritative; client guards provide UX only.
- Draft media is private. Publication promotes referenced media to immutable, content-addressed public paths before publishing.
- Public pages render committed snapshots immediately and replace documents independently only after validated remote responses.
- Supabase is authoritative after bootstrap; generated snapshots are deterministic checkpoints and fallbacks.
- Live Supabase verification remains explicitly blocked until Docker registry access or approved project credentials are available.
- Do not commit, deploy, revert unrelated changes, or introduce privileged keys.

## TODOs

### Wave 0 - Primitive Showcase Gate

- [x] Record the dirty-worktree baseline and run all available offline verification gates.
- [x] Capture a complete fresh `/admin/design-system` matrix at 375/768/1280, both languages/themes, 200% zoom, reduced motion, keyboard, drawer/dialog, and all showcase regions.
- [x] Obtain independent design-system/functional and visual/CJK PASS verdicts against the same fresh capture manifest; loop on blockers.

### Wave 1 - Typed Content and Database Contracts

- [x] Add an exhaustive 12-kind CMS payload registry with Zod schemas, stable keys, metadata, adapters, fixtures, and unsafe-input rejection.
- [x] Add kind-specific PostgreSQL publication validation and pgTAP denial/lifecycle coverage without weakening RLS.

### Wave 2 - Authentication and Protected Routing

- [x] Separate anonymous public and persistent administrator Supabase clients with strict configuration tests.
- [x] Implement the allowlist-backed administrator auth state machine and lifecycle tests.
- [x] Build the bilingual login/error/recovery-state UI and protected admin route topology.

### Wave 3 - Document Workflow

- [x] Add one-active-draft and optimistic-save database RPCs with conflict and authorization tests.
- [x] Implement the typed admin document repository and route-based document workspace for all 12 domains.
- [x] Implement dirty/save/conflict/publish/archive/unsaved-navigation workflows.

### Wave 4 - Media

- [x] Harden Storage policies for private draft images and immutable public images.
- [x] Implement typed media references, upload/preview/replace/remove UI, and failure-safe publication promotion.

### Wave 5 - Structured Domain Editors

- [x] Implement structured bilingual editors for global directories and operational collections: site copy, centers, people, news, activities, KPIs, and honors.
- [x] Implement structured bilingual editors for digital materials, faculty development, EBM, holistic care, and holistic research.

### Wave 6 - Public CMS Adapters

- [x] Make remote validation, provenance, freshness, and fallback document-specific.
- [x] Migrate every public static-data consumer to typed CMS adapters without visual, routing, motion, or base-path regressions.
- [x] Add deterministic Supabase-authoritative snapshot export/checkpointing that refuses partial or invalid content.

### Wave 7 - Documentation and QA

- [x] Document provisioning, environment variables, Auth settings, security, draft/publish/media recovery, snapshots, deployment, and blocked live verification.
- [x] Run complete offline tests, content check, typecheck, root build, Pages-base build, generated-artifact check, and secret scan.
- [ ] Run full public/admin browser regression QA across all routes, states, breakpoints, themes, languages, reduced motion, zoom, keyboard, and base paths.
- [x] Run the deferred live Supabase migration/Auth/RLS/RPC/Storage/export integration gate when prerequisites exist; otherwise record an explicit blocker.

## Final Verification Wave

- [ ] Independently audit plan compliance and evidence completeness.
- [ ] Independently review code quality, strict typing, architecture, and generated-artifact determinism.
- [ ] Independently review security and exploitability of Auth, RLS, RPCs, Storage, media promotion, and return-path handling.
- [ ] Independently review every rendered public/admin route and state on a complete fresh capture set.
- [ ] Resolve the live Supabase release gate or report `offline implementation verified; production Supabase integration blocked`.

## Verification

Wave 3 offline implementation status (2026-08-22): PASS after independent goal,
security, context, hands-on QA, and code-quality review. The code-quality review
identified one pending-mutation editor data-loss race; the fix now preserves
post-submit edits across save, publish, and archive while advancing the server
baseline, edit token, and revision state. The regression suite passes 519/519
tests, content check, strict typecheck, root build, and Pages-base build. Visual
evidence remains 35/35 captures with 12/12 canonical document routes.

Wave 3 database runtime status (2026-08-24): PASS. Manual GitHub Actions run
[`32685536654`](https://github.com/hsiaoeric/tmuh-mededu-website/actions/runs/32685536654)
on commit `06c7db722050b6efcc86911d4dfff3e20c9247bd` rebuilt an isolated x86 local
database from every migration, reported no schema lint errors, passed all 155
pgTAP assertions across three files, and removed the ephemeral stack. This
verifies the migration, RPC grants, RLS behavior, and database workflow contract
without weakening the production safety boundary.

An isolated hosted verification attempt is also blocked. Branch inventory
returned zero development branches, while branch creation requires a billable
resource cost-confirmation ID that the available tooling cannot generate. No
branch or production write was performed. See
`.omo/evidence/cms/wave3-isolated-supabase/blocked-no-branch/README.md`.

A free x86 fallback is implemented as the manual-only, secret-free
`.github/workflows/supabase-database.yml`. It starts local Postgres, rebuilds
from migrations, runs lint and all 155 pgTAP assertions, captures failure
diagnostics, and always removes the ephemeral database. Static and runtime
checks pass. The production project remains pre-`20260822030000`; no hosted
database write or production deployment was performed. See
`.omo/evidence/cms/wave3-github-actions/README.md`.

## Execution Map

Each checkbox above is implemented from the following concrete seam. Every TypeScript task begins with a failing Vitest test at the named seam. SQL tasks begin with a failing pgTAP assertion. Workers must inspect callers with Codegraph before editing and must not create files above 250 pure LOC.

### Wave 5 Size Exceptions

The following path-specific historical SQL exceptions are accepted under the independent final-review size gate; no other Wave 5 source or SQL file is waived.

- `supabase/migrations/20260829000100_harden_wave5_global_validation.sql`: historical forward-only validation migration whose helper replacements, dispatcher, and save enforcement must replay atomically; modifying its migration boundaries would invalidate history.
- `supabase/tests/database/008_wave5_global_validation.test.sql`: one rollback-wrapped pgTAP mutation corpus sharing fixtures, temporary tables, and role transitions across direct save, dispatcher, finalization, and lifecycle assertions; splitting duplicates state and weakens correspondence.

| Task | Starting files and symbols | Task-level verification |
|---|---|---|
| Offline baseline | `package.json`, `scripts/content/extract.test.ts`, `src/content/*.test.*`, `src/admin/AdminPrimitives.test.tsx` | Save exact stdout/stderr and exit codes for `npm test`, `npm run content:check`, `npm run typecheck`, both builds, `dist/index.html`, and `dist/404.html` under `.omo/evidence/cms/01-baseline/`. |
| Showcase capture | `src/pages/AdminDesignSystemPage.tsx`, `src/admin/showcase/*`, `src/admin/AdminShell.tsx`, `src/design/admin.css` | Build and serve with `npm run preview -- --host 127.0.0.1 --port 4173`. Drive `http://127.0.0.1:4173/admin/design-system` through Playwright MCP. Capture five regions (`foundation`, `controls`, `states`, `records`, `overlays`) for each width 375/768/1280 x language zh-Hant/en x theme light/dark, plus open drawer, open dialog, reduced motion, and 200% zoom states. Manifest records dimensions, source mtimes, page state, and file signature. PASS only if all entries exist, are newer than rendered source, match requested dimensions, and show no document scroll, clipping, unnamed nested vertical scroll, or lost focus. |
| Showcase reviews | Same source and `.omo/evidence/cms/02-showcase/manifest.json` | Dispatch two fresh read-only Oracle reviewers in parallel: design-system/functional integrity and visual/CJK precision. Both must directly inspect every manifest capture and return `PASS` with empty blockers on the same source revision. Any `REVISE` loops through regression test, minimal fix, recapture, and two new reviewers. |
| Payload registry | `src/content/domain.ts`, `src/content/parsers.ts`, `src/content/generated/cms-snapshot.json`, new `src/content/contracts/` | `npm test -- src/content/contracts`; test all 12 kinds, missing languages, duplicate IDs, unsafe URLs, malformed dates/media, and generated fixtures; then `npm run content:check && npm run typecheck`. |
| Publication validation | `supabase/migrations/20260814000100_create_cms_core.sql`, `supabase/migrations/20260814000200_secure_cms_api_and_storage.sql`, `supabase/tests/database/001_cms_foundation.test.sql`, new forward-only migration | Add failing pgTAP cases first. When local Supabase is available run `supabase db reset --local`, `supabase db lint --local --fail-on error`, `supabase test db`; otherwise record the exact registry blocker and perform independent static SQL/security review. |
| Client split | `src/content/supabaseClient.ts`, `src/content/env.ts`, `src/content/ContentProvider.tsx` | Test separate singleton options, disabled/partial config, public non-persistence, admin persistence/refresh, dynamic loading, and production bundle scan excluding `service_role`/`sb_secret_`. |
| Auth state | New `src/admin/auth/` rooted at an `AdminAuthProvider` and typed state union; use `is_cms_admin()` from generated database types | Test booting, anonymous, authenticating, verifying, authorized, denied, expired, config-error, retry, logout, auth subscription cleanup, and stale response suppression. |
| Login/routes | New `src/pages/AdminLoginPage.tsx`, route guard under `src/admin/auth/`, `src/app/App.tsx` | Testing Library route matrix for anonymous/denied/authorized/expired and safe internal return paths. Playwright direct navigation/reload/back/forward at `/admin/login`, `/admin`, `/admin/content/news`, `/admin/design-system`, and `/admin/unknown`; external return paths must resolve to `/admin`. |
| Draft RPCs | New forward-only migration and `supabase/tests/database/001_cms_foundation.test.sql` | pgTAP active-draft race, stale save, successful save, non-admin denial, immutable audit fields, missing document, and publication archiving. |
| Document repository/workspace | New `src/admin/repository/`, `src/admin/documents/`, `src/pages/AdminDashboardPage.tsx`, `src/app/App.tsx` | Narrow injected-client tests for list/read/clone/save/publish/archive; route all 12 `CmsDocumentKind` values; verify loading, empty, missing initialization, draft, published, conflict, permission, retry, and invalid-kind states. |
| Editorial workflow | New `src/admin/workflows/` and workspace integration | Test duplicate save prevention, failed-save edit retention, optimistic conflict, invalid bilingual publish, publish confirmation, archive confirmation, unsaved route/browser navigation, and overlay focus return. |
| Storage hardening | Existing storage migration plus a new forward-only migration and pgTAP matrix | Permit JPEG/PNG/WebP <=10 MiB; reject SVG/HTML/oversize/path traversal; anonymous reads public only; browser roles cannot overwrite/delete public objects; non-admin cannot write/copy. |
| Media flow | `src/admin/AdminMedia.tsx`, new `src/admin/media/`, new `src/content/media/`, publication workflow | Test discriminated local/Supabase references, `assetUrl()` only for local assets, deterministic content-hash paths, signed private preview, progress, replace/remove, copy failure, optimistic conflict, idempotent retry, and rejection of residual draft references. Playwright verifies keyboard and screen-reader states at 375 and 200% zoom. |
| Global editors | New `src/admin/editors/global/`; contracts for `site_copy`, `centers`, `people`, `news`, `activities`, `kpis`, `honors` | Per-kind fixtures and component tests for add/edit/delete/reorder, duplicate IDs, missing English, dates/URLs, pinned ordering, nested award members, portrait fallback, empty collections, and lossless schema round-trip. |
| Page editors | New `src/admin/editors/pages/`; contracts for `digital_materials`, `facdev`, `ebm`, `holistic`, `holistic_research` | Test nested CRUD, lead references, color/URL validation, ALGEEs, yearly totals, papers/authors, ordering, bilingual omissions, and lossless round-trip. |
| Per-document fallback | `src/content/ContentProvider.tsx`, `src/content/order.ts`, `src/content/parsers.ts`, `src/content/supabaseRepository.ts` | Test mixed valid/invalid rows, missing kind, duplicate identity, older remote version, request failure, and abort. One malformed document must preserve only its snapshot while valid siblings refresh. |
| Public adapters | New `src/content/adapters/`; consumers in `src/pages/`, `src/pages/home/`, `src/pages/centers/`, and shared `src/ui/` located by Codegraph | Add pure adapter tests for every kind. Run root and Pages-base builds. Playwright compares snapshot-only pre/post captures of all public routes and checks legacy redirects, center tones, anchors, portraits, motion/reduced motion, and asset URLs. |
| Snapshot export | `scripts/generate-content.ts`, `scripts/content/`, `src/content/supabaseRepository.ts` | Inject repository fixtures; verify deterministic bytes/order, all 12 required, and refusal to overwrite on partial/invalid responses. Live export remains blocked without approved URL/key. |
| Documentation | `README.md`, `CLAUDE.md`, optional `docs/cms-operations.md` | Review for manual Auth user/cms_admins provisioning, hosted Auth settings, revocation/recovery, env variables, media orphan recovery, snapshot export, local/live checks, Vercel/Pages, and explicit blocked status. Scan docs/source for secret-shaped values. |

## Browser Regression Matrix

Use the Playwright MCP against production previews, never the dev server. Run both root-base and `VITE_BASE=/tmuh-mededu-website/` builds.

- Public routes: `/`, `/announcements`, `/honors`, `/digital-materials`, all five `/centers/*` routes, and representative holistic detail routes.
- Legacy routes: `/holistic`, `/ebm`, `/facdev`, and every supported `/center/:id`; expected result is the canonical route with equivalent visible content.
- Admin routes: `/admin/login`, `/admin`, every `/admin/content/:kind`, `/admin/design-system`, and `/admin/unknown`.
- Required dimensions/states: 375/768/1280, zh-Hant/en, light/dark, reduced motion, 200% zoom, keyboard traversal, missing image, empty collection, long CJK/English copy, unbroken URL, malformed remote fallback, denied/expired session, failed save, stale conflict, failed upload, and failed publish.
- Binary PASS: zero unexpected console errors, zero horizontal document overflow at 375/200% zoom, one named vertical scroll owner in admin shell, every route has reachable main content and visible focus, all redirects resolve correctly, public snapshot captures remain visually equivalent, root/Pages assets return 2xx, and every expected state is represented in the manifest.

## Independent Final Reviews

- Plan/evidence reviewer reads this full plan, every ledger receipt, and every evidence manifest; PASS requires no unchecked task claimed complete and no stale/self-certified artifact.
- Code-quality reviewer reads the full diff and changed files; PASS requires strict types, exhaustive kinds, no forbidden escape hatches, <=250 pure LOC per touched source file unless justified, no direct static-data consumer left, and deterministic generated output.
- Security reviewer probes anonymous/non-admin CRUD, direct lifecycle mutation, stale save, unsafe URLs/files, draft disclosure, public overwrite/delete, external return paths, and privileged-key discovery; PASS requires concrete denials or an explicit external integration blocker.
- Visual reviewer opens every fresh capture in the browser/image tool; PASS requires no skipped route/state/viewport, no CJK orphan/clipping, no layout/scroll/focus defect, and no regression from Living Tissue.

## Verification

```bash
npm test
npm run content:check
npm run typecheck
npm run build
VITE_BASE=/tmuh-mededu-website/ npm run build
test -f dist/index.html
test -f dist/404.html
```

Live Supabase gate when prerequisites are available:

```bash
supabase start
supabase db reset --local
supabase db lint --local --fail-on error
supabase test db
supabase gen types typescript --local
```

## Completion Criteria

- Fresh dual-review showcase PASS.
- Only the allowlisted administrator can mount protected UI or mutate CMS data.
- All 12 domains support structured bilingual draft/save/publish workflows.
- Draft saves are conflict-safe; publication is validated and atomic at the lifecycle boundary.
- Draft media stays private and published media is immutable.
- All public content uses validated CMS adapters with independent snapshot fallback.
- Root and GitHub Pages builds preserve routes, redirects, and assets.
- Offline automated and browser gates pass.
- Live Supabase status is either verified or explicitly blocked with exact prerequisites.
