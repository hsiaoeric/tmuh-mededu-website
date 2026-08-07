# Living Tissue main promotion

## Decision

- Keep the GitHub default branch named `main`; fast-forward it to the Living Tissue history.
- Keep `gh-pages` because GitHub Pages still deploys from that branch.
- Preserve every superseded design with an annotated archive tag before deleting any branch.
- Retain the old branches through 2026-08-14 so the Vercel production deployments can be checked before cleanup.

## State before promotion

- `origin/main`: `850e919`.
- Local legacy `main`: `02af8ee`; archived as `archive/legacy-main-2026-08-07`.
- Living Tissue content head before this log: `46943ed`; already backed up as `origin/worktree-living-tissue`.
- The promotion is a normal fast-forward. `850e919` is an ancestor of `46943ed`; no force push is needed.
- The root worktree contains untracked audio, environment, metadata, `AGENTS.md`, and `.claude/` files. They are user-owned and must not be staged or deleted as part of branch cleanup.
- `theme/clinical-paper` has one intentionally uncommitted generated file: `tsconfig.app.tsbuildinfo`. Its source changes are backed up in `d634622`.

## GitHub backups

| Archive tag | Restored commit |
| --- | --- |
| `archive/legacy-main-2026-08-07` | `02af8ee` |
| `archive/holistic-reorder-legacy-design-2026-08-07` | `945ab1b` |
| `archive/nexus-redesign-2026-08-07` | `e23702e` |
| `archive/responsive-header-navigation-2026-08-07` | `11f7374` |
| `archive/swiss-grotesque-2026-08-07` | `10e6fa5` |
| `archive/theme-clinical-paper-wip-2026-08-07` | `d634622` |
| `archive/wellness-redesign-2026-08-07` | `afd453b` |

The corresponding branches were also pushed to `origin` for the seven-day retention window. To restore an archived design later, create a new branch from its tag; do not move `main` backward.

## Verification already completed

- `npm run predeploy`, TypeScript checking, the production build, and `git diff --check` passed on Living Tissue.
- Chrome mobile Lighthouse: Accessibility 100, Best Practices 100, SEO 100, Agentic Browsing 100; 53 checks passed and none failed.
- The only build warning is the existing `TissueField` chunk exceeding 500 kB.
- Pushing `main` may trigger both Vercel projects documented as using `main` for production. It does not change the GitHub Pages deployment from `gh-pages`.

## Promotion completed

- On 2026-08-07, an SSH `git push --atomic` fast-forwarded both `origin/main` and `origin/worktree-living-tissue` to the Living Tissue promotion history.
- Local `main` was then fast-forwarded to the same history; the root worktree's untracked files remained untouched.
- GitHub's symbolic `HEAD` still points to `refs/heads/main`.
- `gh-pages` remained at `2ad175f`. The checked-in Pages workflow is manual-dispatch only, so the `main` push did not run it.
- An attempted HTTPS atomic push failed before changing any ref because its saved credential was unavailable. The configured GitHub SSH key succeeded and was used for the completed push.

## Remaining cleanup after 2026-08-14

1. Confirm both Vercel production URLs are serving the expected Living Tissue build.
2. Confirm `origin/main` and local `main` point to the promoted Living Tissue head.
3. Keep `main`, `gh-pages`, and all `archive/*` tags.
4. Only then remove the superseded remote branches and their clean local worktrees/branches. Use `git worktree remove` for registered worktrees; never recursively delete `.claude/`.

`gh auth status` reported an expired GitHub CLI token during this operation, but normal authenticated HTTPS Git pushes worked. Re-authenticate `gh` before relying on GitHub CLI API commands.
