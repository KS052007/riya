# Binary Minds Project Architecture and Diagnosis

**Reviewed:** 23 October 2026  
**Scope:** Initial static inspection followed by an implementation status update.

**Implementation update:** The repository has since gained the `/kazi_binary_admins` portal, serverless auth/content APIs, and governance docs. See `docs/` for the current setup and security status. The original baseline notes below are updated where relevant.

## Executive summary

Binary Minds is a single-page React 19 website built with Vite. It serves a public-facing technical society site with a landing page, a Sanity-backed article archive, event information/results, and an upcoming Build in Public page. The former Blitz routes redirect to Build in Public. Most shared UI is implemented in `src/components`; route views are in `src/pages`; Sanity setup and some event/results content live in `src/lib`.

The repository now has a protected admin portal and serverless API handlers. The portal can manage Sanity events, results, announcements, and Minds with role checks and a Redis-backed login throttle/audit log. Blitz is retired from public routing and portal management; existing records are retained. Portal use requires Vercel, Upstash, and Sanity server-side configuration:

- Minds are read from Sanity with a browser-side, read-only client. Sanity Studio may be managed separately, but its project/configuration is not included here.
- Event content, problem statements, and results are checked into frontend source files and require a code change and redeployment to update.
- Ideathon submissions are still sent from the browser to a Google Apps Script URL (overridable with a Vite environment variable). There is no admin submission review interface because the external storage implementation is unavailable here.
- The deadline check exists in frontend UI logic. It is not a server-enforced rule and can be bypassed by a modified client/request.

The public site is a Vite SPA with Vercel rewrites and serverless functions under `api/`. Admin access fails closed until the server secrets and connected services are configured. Participant submissions, account administration, and account recovery remain incomplete.

## Architecture at a glance

```text
Browser
  └── React SPA (src/main.jsx, src/App.jsx)
       ├── Shared visual shell (Navbar, Footer, scrolling/animation/canvas components)
       ├── Public route pages
       │    ├── Home                 → Sanity: recent minds
       │    ├── Minds / detail       → Sanity: mind documents
       │    ├── Events/results       → published Sanity documents + legacy event fallback
       │    └── Build in Public     → Static upcoming page
       └── Static assets (public/)

External services referenced by the client:
  ├── Sanity Content Lake (public read queries; project ID in source)
  ├── Google Apps Script (Ideathon submission POST; review not integrated)
  ├── Upstash Redis (login throttling and admin audit entries)
  ├── Pyodide CDN (Python code playground)
  └── External links (registration, rulebook, social profiles, etc.)

Hosting:
  └── Vite build output with Vercel rewrite of all paths to index.html
```

## Folder architecture

| Path | Purpose |
|---|---|
| `public/` | Static files served directly at the site root; images, logos, and SVG assets. |
| `src/` | React application source and global stylesheet. |
| `src/components/` | Shared UI, visual effects, article rendering, submission UI, and event-result widgets. Components are not divided into domain/data/service subfolders. |
| `src/lib/` | Shared integrations and local data/configuration: Sanity client, GSAP registration, event definitions, event problem statements, and results. |
| `src/pages/` | Route-level views for home, minds, events, Build in Public, and not-found. Retired Blitz components remain unused. |
| repository root | npm/Vite configuration, SPA hosting rewrite, HTML entry, lockfile, and a plain-text problem-statement source. |

## File-by-file inventory

### Repository root

| File | What it is for |
|---|---|
| `package.json` | Project metadata, dependencies, build/dev scripts, admin password/session-secret helpers, and Node test command. |
| `package-lock.json` | npm dependency lockfile. |
| `index.html` | Vite HTML shell and React mount element. It currently points the favicon to `/vite.svg`, which is not present in the listed `public/` files. |
| `vite.config.js` | Enables the Vite React plugin. No server proxy, aliases, or environment validation are configured. |
| `vercel.json` | Rewrites all incoming paths to `/index.html` so React Router handles SPA routes. |
| `.gitignore` | Ignores dependencies/build artifacts, local environment files, logs, and common editor files. It also ignores `.env.example`, so a shareable environment template would not be tracked by default. |
| `.gitattributes` | Git text/binary handling metadata. |
| `problem.txt` | Plain text source containing the Ideathon problem statements, overlapping substantially with `src/lib/eventSpecificData.json`. |

### `src/`

| File | What it is for |
|---|---|
| `main.jsx` | React bootstrap: mounts `<App />`, enables Strict Mode, wraps the app in BrowserRouter, and loads global CSS. |
| `App.jsx` | Route table, page transitions, scroll-to-top behavior, shared navigation/footer visibility, smooth scrolling and cursor shell. `ParticleCanvas` is imported but not used in the rendered tree. |
| `index.css` | Global styles and the bulk of the site-wide visual system. At roughly 90 KB it is a large mixed stylesheet rather than styles grouped by feature. |

### `src/pages/`

| File | What it is for |
|---|---|
| `Hero.jsx` | Home page: animated landing experience, technology logo loop, and recent Sanity minds content. |
| `Minds.jsx` | Article archive page: fetches mind summaries from Sanity and supports client-side title/author/category search. |
| `MindDetail.jsx` | Fetches a single Sanity mind by slug and composes the article viewer with its minimap. |
| `Events.jsx` | Event listing and event details UI; displays event sections, problem statements, submission modal, deadline meter, and results using local data. |
| `Events.css` | Event page-specific styling. |
| `BuildInPublic.jsx` | Upcoming public page describing planned project updates and linking to Minds and Events. |
| `NotFound.jsx` | Animated catch-all route view. |

### `src/lib/`

| File | What it is for |
|---|---|
| `sanity.js` | Creates the public-read Sanity client and image URL builder. Project/dataset can be overridden by public Vite settings; write credentials are server-only. |
| `gsap.js` | Imports GSAP and registers shared plugins (`ScrollTrigger`, `ScrollToPlugin`, `MotionPathPlugin`, `Flip`, `Draggable`, `Observer`, `TextPlugin`). |
| `events.js` | Hard-coded event metadata: name/type/status, dates, registration and rulebook links, image, and event detail sections. |
| `eventSpecificData.json` | Hard-coded Ideathon problem statement strings/optional URLs, consumed by the Events view. |
| `resultsData.js` | Hard-coded Ideathon winners and honorable mentions. Comments mark several entries as placeholders. |

### `src/components/`

| File | What it is for |
|---|---|
| `Antigravity.jsx` | Three.js / React Three Fiber animated 3D particle/field visual used as a decorative effect. |
| `CodePlayground.jsx` | CodeMirror editor and in-browser JavaScript/Python execution UI; Python runtime is fetched from the Pyodide CDN. JavaScript execution uses `new Function` in the page context and temporarily replaces global console/prompt functions. |
| `DeadlineMeter.jsx` | Event countdown/urgency pill calculated from supplied client-side dates. |
| `DeadlineMeter.css` | Deadline meter appearance. |
| `Footer.jsx` | Site footer, social links, and brand/house labels. Some values can come from Vite build-time environment variables. |
| `FuzzyText.jsx` | Canvas-based distorted/fuzzy text effect used by the not-found design. |
| `IdeathonSubmissionModal.jsx` | Submission form, client-side validation and file-to-base64 conversion, then POST to Google Apps Script. The endpoint has a hard-coded fallback. |
| `IdeathonSubmissionModal.css` | Submission modal styles. |
| `InteractiveGridPattern.jsx` | Interactive decorative grid background. |
| `LogoLoop.jsx` | Animated/looping row of logos or arbitrary supplied React nodes. |
| `LogoLoop.css` | Logo loop styles. |
| `MagicRings.jsx` | Three.js based animated rings visual for event UI. |
| `MagicRings.css` | Magic rings styles. |
| `MindCard.jsx` | Compact article card linking to a mind detail route; uses Sanity image URLs. |
| `MindMinimap.jsx` | Article navigation/minimap derived from the article body. |
| `MindViewer.jsx` | Full article renderer using Portable Text, image support, code blocks/editor integrations, and article metadata. |
| `MindViewer.css` | Article viewer styles. |
| `Navbar.jsx` | Responsive site navigation for Home, Minds, Events, and Build in Public. Branding can be customized through Vite environment variables. |
| `PageTransition.jsx` | Reusable motion wrapper for route/page entrances and exits. |
| `ParticleCanvas.jsx` | Canvas particle visual effect. Currently imported but unused by `App.jsx`. |
| `ResultsSection.jsx` | Renders event winners and honorable mentions from `resultsData.js`. |
| `ResultsSection.css` | Results section styles. |
| `SmoothScroll.jsx` | Initializes Lenis smooth scrolling and connects it with GSAP ScrollTrigger. |
| `TargetCursor.jsx` | Custom cursor interaction/animation behavior for elements marked as cursor targets. |

### `public/`

| File | What it is for |
|---|---|
| `logo.png` | Main brand logo used by the navigation fallback/config. |
| `Ideathone.jpeg` | Event card image (filename spelling is `Ideathone`). |
| `retro-computer.png` | Decorative image asset; exact usage depends on runtime references. |
| `icons.svg` | SVG icon asset/sprite. |
| `favicon.svg` | Available favicon asset, but `index.html` currently references `/vite.svg` instead. |
| `download.svg` | SVG asset; no import/reference was found during the source scan. |
| `computer.svg` | SVG asset; no import/reference was found during the source scan. |
| `7587df77ef521cf98057d0028ee983f1.gif` | Animated GIF asset; its use was not established from the source scan. |

## Data and governance map

| Data/function | Current source of truth | How it is changed now | Admin portal present? |
|---|---|---|---|
| Mind/article content | Sanity dataset `production` | Protected portal editor; schema still needs verification | Yes, after configuration |
| Legacy Blitz challenges/questions | Sanity dataset `production` | Retained records; no public route or admin editing | No |
| Events and dates | Published Sanity `siteEvent` records; legacy JS fallback | Protected portal editor | Yes, after configuration |
| Problem statements | Managed event document; legacy JSON fallback and duplicate `problem.txt` remain | Protected portal for managed events | Partial |
| Winners/results | Published Sanity `siteResult` records | Protected portal; local placeholder results are hidden | Yes, after configuration |
| Ideathon submissions | External Google Apps Script endpoint | External implementation/storage | No; needs external review |
| Site branding/social links | Defaults in `Navbar.jsx`/`Footer.jsx`; some build-time `VITE_*` overrides | Edit code or deployment environment, then rebuild/redeploy | No |

## Diagnosis and risks

### Admin/governance gap

1. **Admin is configured through deployment secrets.** The UI and role-checked server APIs exist, but user accounts are managed through `ADMIN_USERS_JSON`; no in-portal account manager or recovery workflow exists.
2. **Legacy content remains during migration.** Events can fall back to local content until a managed event exists; `problem.txt` and the old JSON duplicate remain.
3. **Client-side configuration is not a secret boundary.** Anything prefixed `VITE_` is compiled for browser use. The Sanity project ID is public configuration; private credentials must never go there.
4. **Submission rules are not enforced by trusted code here.** Browser validation can be bypassed. The Apps Script implementation is absent, so server-side validation, storage permissions, and retention cannot be verified.
5. **Legacy challenge code remains on disk.** It is not imported by the active app; the old public paths redirect and the admin API does not allow challenge documents.

### Content and configuration inconsistencies

- Event data says the Ideathon runs **1–9 August 2026**, but this repository is dated October 2026; that content is now stale unless intentionally historical. `status: "Ongoing"` and the hard-coded deadline do not agree with the current date.
- The event file uses the external link `https://example.com/problem-statements-doc`, which is a placeholder.
- Results include comments explicitly marking entries as placeholders; the displayed data should be confirmed before presenting it as final.
- `problem.txt` and the JSON problem list duplicate content, creating two sources that can diverge.
- The HTML references `/vite.svg` although the listed assets include `/favicon.svg` and no `vite.svg`.
- Several assets appear unreferenced by source scan, which may be intentional or leftover files.
- `src/lib/sanity.js` describes the API version as based on the “current date,” but it is a fixed version string (`2023-05-03`).

### Maintainability and code quality signals

- There is no ESLint, formatter, test, typecheck, or CI configuration visible in this repository; `package.json` only exposes Vite commands.
- Naming, semicolon use, quoting, comments, and formatting vary between files. There are comments such as “We will create this file” where the CSS file already exists, an unused import, and placeholder comments. These indicate cleanup opportunities but do **not** prove whether code was written by a human or AI; authorship cannot be reliably inferred from a static code review.
- `src/index.css` contains a large portion of styling in one file, while component styles are mixed between separate CSS files and inline styles. This makes ownership and change impact harder to track.
- Sanity fetching is repeated directly in route components without a shared query/data layer, cancellation, or common error presentation.
- The code runner executes user code in the same browser page context for JavaScript. That is a browser isolation/security concern for a public interactive feature and should be treated separately from any future admin privileges.

## Suggested target direction for the next phase

The first admin/content vertical slice is implemented on Sanity plus Vercel functions. Finish account management/recovery, controlled submission review, remaining static configuration, broader visual redesign, and production deployment verification before treating the requirements as complete.

A later implementation plan should begin with an inventory of the actual Sanity schemas and Google Apps Script behavior, decide whether they remain or are consolidated, and specify admin roles before changing application code.

## Limits of this review

This is a repository-level static review. It does not inspect the deployed site, Sanity Studio/schema, Sanity permissions, Google Apps Script source or deployment settings, production environment variables, or hosting account configuration. Therefore, an external admin or security control may exist, but it is not present or verifiable in this project.
