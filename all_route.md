# Binary Minds — `all_route.md`
## Complete implementation route for a dynamic admin portal, content governance, security, and redesign

**Prepared:** 23 October 2026  
**Purpose:** This document is the master implementation contract for rebuilding Binary Minds into a maintainable technical-community platform. Follow it in phases. Inspect the repository and existing external services before changing code. Do not blindly replace the current app.

---

# 0. Non-negotiable instructions for the coding agent

1. **Inspect before editing.** Read `package.json`, routes, components, `src/lib`, environment-variable usage, Vercel configuration, Sanity queries, submission flow, and existing styles. Run the current build and record its baseline.
2. **Do not assume the repository audit is perfectly current.** Verify each finding against the current files. Distinguish verified facts, likely risks, and items that require access to external systems.
3. **Do not expose, invent, or commit credentials.** Never put passwords, API tokens, service-role keys, private Sanity tokens, or Apps Script secrets in source code, client-side `VITE_*` variables, documentation, screenshots, or Git history.
4. **Do not implement authentication as a frontend-only password check.** A route guard in React is only a UX measure. Every privileged read/write must be protected by a trusted server-side authorization check.
5. **Do not use an obscure URL as security.** The requested admin path is `/kazi_binary_admins`, not `/admin`, but the custom path is not a substitute for authentication.
6. **Keep the public site working.** Preserve current routes, visual effects, article links, event links, challenge workflows, mobile layout, and existing content unless an intentional change is documented.
7. **Do not invent event facts.** Confirm event dates, winners, links, and status with an authorized organizer. Mark unverified content as draft, not published.
8. **Use Sanity deliberately.** Inspect the actual project ID, dataset, schemas, permissions, API version, existing documents, and query behavior. Do not assume Studio or schemas exist in this repository. Do not overwrite or migrate production content without a backup and explicit approval.
9. **No destructive action without approval.** Do not delete production data, change permissions, rotate external credentials, deploy, or alter DNS/hosting settings without explicit authorization.
10. **Make changes incrementally.** After each phase, run the build and relevant tests, report changed files, remaining risks, and commands needed for deployment.

---

# 1. Product goal

Turn Binary Minds from a mostly frontend-driven society website into a **dynamic, secure, content-managed technical community platform**.

The public site should present the community. Authorized organizers should be able to manage its content and operations without editing frontend source files or redeploying for every content change.

The admin portal must be reachable at:

- `/kazi_binary_admins`

It must not rely on `/admin` as the primary route. Unknown routes should still show the existing or improved not-found experience.

## Core outcomes

- Manage events, dates, status, registration links, resources, problem statements, results, and announcements.
- Manage Minds/articles and Blitz challenges through a coherent Sanity workflow wherever appropriate.
- Review Ideathon/project submissions, see their status, and record review decisions.
- Support draft → review → publish workflows where content needs approval.
- Separate administrator, editor/content manager, event organizer, evaluator, and read-only access where justified.
- Keep secret answers and privileged operations off the public client.
- Preserve the public website while progressively modernizing its architecture and visual design.
- Provide documentation for local setup, environment variables, data models, permissions, deployment, backups, and recovery.

---

# 2. First phase: repository and external-service discovery

Before designing the backend, inspect and document:

## Repository
- All React routes and shared components.
- Existing Sanity client, project ID, dataset, API version, queries, schemas (if any), and image handling.
- Current event data, problem statements, results, and duplicate `problem.txt`.
- Ideathon submission component and exact Apps Script request format.
- Blitz question data and whether correct answers are returned to the browser.
- JavaScript and Python playground execution behavior.
- Environment variables and whether any secret is incorrectly exposed through `VITE_*`.
- Vercel SPA rewrites and any serverless/function support.
- Existing dependencies, build warnings, unused imports, assets, and CSS ownership.

## External systems — must be verified separately
- Sanity project/dataset, Studio availability, schema source, roles, API tokens, and published documents.
- Google Apps Script source, deployment permissions, validation, storage destination, rate limiting, and data-retention policy.
- Hosting account capabilities for server-side functions and environment secrets.
- Any existing registration or submission storage outside this repository.

## Discovery deliverables
Create or update:
- `docs/architecture.md`
- `docs/data-governance.md`
- `docs/security-review.md`
- `docs/environment-setup.md`

Each report must label findings as **Verified**, **Needs external access**, or **Recommendation**. Do not claim external systems are secure merely because their source is unavailable.

---

# 3. Target architecture

Prefer the simplest architecture that safely supports the required workflows. Avoid adding infrastructure merely for fashion.

```text
Public browser
  └── React + Vite SPA
       ├── Public pages: Home, Minds, Events, Blitz, Challenge
       ├── Public read-only content
       └── Calls trusted server endpoints for privileged operations

Admin browser: /kazi_binary_admins
  └── Admin React experience
       ├── Login / session
       ├── Dashboard
       ├── Events and resources
       ├── Submissions and evaluations
       ├── Minds/articles
       ├── Blitz challenges and question authoring
       ├── Results and announcements
       ├── Users / roles (administrator only)
       └── Audit history and settings

Trusted server-side layer
  ├── Authentication and session validation
  ├── Role-based authorization on every privileged endpoint
  ├── Input validation and rate limiting
  ├── Server-enforced deadlines and submission rules
  ├── Challenge scoring and protected answer keys
  ├── Sanity write operations using server-only credentials
  ├── Submission storage / file metadata
  └── Audit events and operational logs

Content and storage
  ├── Sanity: editorial content and published public content
  ├── Submission storage: chosen after inspecting current Apps Script
  └── Private file storage: only if submissions require file uploads
```

## Technology decision rules

- **Frontend:** Keep React, Vite, and React Router unless the audit shows a concrete reason to migrate.
- **Content management:** Prefer Sanity for Minds/articles, events, results, announcements, and challenge authoring if the existing project and permissions support the required workflows. Use a separate database only when there is a clear need for transactional submissions, user accounts, evaluation records, or relational reporting.
- **Server endpoints:** Use hosting-compatible serverless functions or a small backend service. Verify what the current deployment platform supports before selecting the implementation.
- **Authentication:** Prefer a maintained authentication/session approach compatible with the hosting environment. Do not invent password encryption, session signing, or token handling.
- **Validation:** Use a shared schema-validation library on the server. Client validation may improve UX but must not be trusted.
- **File uploads:** Store files in controlled object storage or an approved existing storage system. Avoid sending large base64 files through a fragile endpoint without documented size limits.
- **Avoid duplicate sources of truth.** Do not keep event records simultaneously maintained in JSON, text files, and Sanity.

A proposed default is **Sanity for editorial content + trusted server endpoints for privileged actions + an approved submission store**. Confirm this against the actual deployment, data requirements, costs, and existing Apps Script behavior before implementation.

---

# 4. Admin route, login, and environment secrets

## Route
- Implement the admin entry at `/kazi_binary_admins`.
- Unauthenticated visitors must see a login screen, not dashboard data.
- Authenticated but unauthorized users must receive an access-denied response.
- Direct navigation to a protected admin sub-route must still enforce authentication.
- Public routes must not accidentally render privileged data.
- Do not expose whether a password or username was the incorrect field in a way that helps guessing.

## Credentials and local configuration

**Do not create a credential `.txt` file.** Use `.env.local` (or the platform's secret manager for deployed environments). Add `.env.local`, `.env.*.local`, and any private credential files to `.gitignore`.

Create a tracked `.env.example` containing variable names and safe placeholders only. Check `.gitignore`: if it ignores `.env.example`, change that so the example template can be committed safely.

Example template — placeholders only:

```dotenv
# Public browser configuration only; never put private keys in VITE_ variables.
VITE_SANITY_PROJECT_ID=replace_with_public_project_id
VITE_SANITY_DATASET=production

# Server-side only. Names depend on the chosen auth/backend implementation.
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
SANITY_API_WRITE_TOKEN=
SUBMISSION_STORAGE_URL=
SUBMISSION_STORAGE_SECRET=
```

Important:
- These are illustrative names, not a claim that the application already supports them. Define and validate the final set after choosing the backend.
- Never use a `VITE_` prefix for a private token, password, session secret, or privileged API key.
- Never commit `.env.local`.
- Do not place an actual password in `all_route.md`, `README.md`, source code, seed data, or a generated credential file.
- Prefer an established identity provider or secure password-based auth with a modern password hash (Argon2id or a suitable maintained equivalent), secure server-managed sessions, login throttling, and session expiry.
- Do not store a raw admin password in environment variables if a password hash can meet the design. If the chosen provider needs a bootstrap credential, configure it through the provider's secure setup flow.
- Use secure, HttpOnly, SameSite cookies where cookie sessions are appropriate; use `Secure` in production. Add CSRF protection where required by the chosen session and request design.
- Do not store privileged session tokens in localStorage.
- Add a startup check that fails safely if required server secrets are missing. Never print secret values in logs.
- Rotate any credential that has been shared or committed. Removing a file later does not erase Git history.

## Authentication acceptance criteria
- Direct API calls without a valid session cannot perform privileged operations.
- Changing React state or editing browser JavaScript cannot grant admin access.
- Sessions expire and can be revoked/logged out.
- Repeated failed login attempts are throttled.
- Password reset or recovery has a documented secure procedure.
- No private credential appears in built frontend assets, source maps, network responses, or logs.

---

# 5. Roles and permissions

Start with least privilege. The final role set must be confirmed with organizers.

| Capability | Super Admin | Content Editor | Event Organizer | Evaluator | Read-only |
|---|---:|---:|---:|---:|---:|
| Manage admin accounts and roles | Yes | No | No | No | No |
| Manage global settings | Yes | No | No | No | No |
| Create/edit Minds and announcements | Yes | Yes | No | No | View published only |
| Create/edit events and resources | Yes | Optional | Yes | No | View published only |
| Review submissions | Yes | No by default | Optional | Assigned submissions | No |
| Publish results | Yes | Optional | Yes, if authorized | No | View published only |
| Create/edit Blitz questions | Yes | Yes, if authorized | No | No | Published only |
| View answer keys | Authorized only | Only if explicitly needed | No | No by default | No |
| View audit log | Yes | No by default | Limited if needed | No | No |

Enforce this matrix in server code, not just by hiding buttons. Prevent a user from changing their own role or elevating privileges through a crafted request. Keep access to participant personal data narrower than general content access.

---

# 6. Sanity: make it a real content-management workflow

The public site already uses Sanity for Minds and Blitz content according to the repository audit. Inspect its existing schemas and documents before creating anything.

## Recommended Sanity content types

Reuse existing document types if they are already suitable. Avoid duplicate schemas for the same concept.

### Event
- Stable document ID and slug
- Title, summary, description
- Event type/category
- Start date, end date, timezone
- Registration open/close dates
- Status: draft, scheduled, open, closed, completed, archived
- Registration URL and rules/resource links
- Cover image and accessible alt text
- Problem statements/resources
- Submission instructions
- Publication state
- Created/updated timestamps and editor identity where available

### Problem statement / resource
- Title, event reference, description
- Resource URL or attached reference
- Eligibility/instructions where applicable
- Draft/published state

### Result / award
- Event reference
- Award/category
- Team or participant display name
- Placement/recognition
- Approved public description
- Verified-by field or review status
- Publish status

Do not publish placeholder winners or unverified claims.

### Mind / article
- Reuse the existing schema and Portable Text support
- Title, slug, author, category/tags, cover image
- Body, summary, publication date, draft/published state
- SEO/social metadata if needed

### Blitz challenge
- Title, slug, description, difficulty/category
- Schedule and availability rules
- Public question prompt and options
- Hints/reveal policy
- Scoring and attempt rules
- Draft/published state
- Private answer key and evaluation metadata protected from public queries

**Important:** If answer keys live in Sanity, do not assume a hidden field is secure. A browser-side Sanity query must never return secret fields. Prefer a trusted server endpoint with a server-only token and separate public/private projections or documents. Verify dataset access rules and the exact query response.

### Announcement
- Title, summary/body, start/end display dates
- Optional related event
- Draft/published state and priority

## Content workflow
- Draft → review (where appropriate) → publish → archive.
- Validate slugs, required fields, dates, and URL formats.
- Preview drafts only for authorized users.
- Public pages query published content only.
- Use pagination for growing lists and meaningful loading, empty, and error states.
- Use a shared Sanity query/data layer rather than repeating raw fetch logic across every route.
- Revalidate/refetch public data after publish so updates appear without redeploying the frontend.
- Keep the Sanity project ID and dataset public configuration separate from write tokens.
- Keep private write credentials server-side.
- Document backup/export and recovery before any migration.

## Events migration
1. Export/back up existing event JSON, results, and problem statements.
2. Compare `events.js`, `eventSpecificData.json`, and `problem.txt`; reconcile duplicates with an authorized organizer.
3. Create or adapt Sanity schemas and test in a non-production dataset where possible.
4. Import verified records with stable IDs/slugs.
5. Test public rendering, links, dates, images, and mobile layouts.
6. Switch public pages to Sanity reads.
7. Retain a rollback path until verified.
8. Only then remove duplicate static sources. Do not silently discard historical data.

---

# 7. Admin dashboard: essential screens

## 7.1 Overview
- Counts of published/upcoming events, draft content, pending submissions, and recent activity.
- Quick links to common actions.
- Clear empty/error/loading states.
- Do not display invented analytics or pretend counts are live when they are not.

## 7.2 Events
- Search, filter, sort, paginate.
- Create/edit draft, preview, publish/unpublish, archive.
- Manage dates, timezone, status, registration links, resources, and event instructions.
- Warn about inconsistent dates/status and missing required links.
- Require confirmation for destructive actions.
- Show who last updated a record when reliable audit metadata is available.

## 7.3 Problem statements and resources
- Associate resources with an event.
- Support safe URLs and clear labels.
- Show published/draft state.
- Prevent duplicate or conflicting resource records.

## 7.4 Submissions
- List submissions with ID, event, timestamp, status, and authorized participant/team details.
- Search/filter/sort and paginate.
- Review permitted metadata and download files through authorized, expiring access links where supported.
- Status workflow: received → under review → shortlisted/rejected/needs changes → final decision.
- Reviewer notes, score/rubric, and reviewer identity where required.
- Prevent unauthorized reviewers from seeing unassigned submissions.
- Keep a change history for decisions.
- Do not expose submissions or private file URLs publicly.
- Document retention and deletion rules.
- Verify the existing Apps Script's storage and data format before migrating it. Do not assume submissions are available in Sanity.

## 7.5 Results
- Create/edit draft results.
- Associate winners with an event.
- Validate rank/category and required display fields.
- Require an explicit publish action.
- Show a warning for placeholder/unverified records.
- Preserve an audit trail for changes after publication.

## 7.6 Minds/articles
- List, search, filter, create/edit, preview, publish/unpublish, archive.
- Use existing Portable Text/image functionality where possible.
- Validate slug uniqueness and required metadata.
- Restrict publishing permission by role.

## 7.7 Blitz challenge management
- Create/edit challenge metadata, prompts, options, hints, schedule, and scoring rules.
- Separate authoring from publishing.
- Keep answer keys out of public queries and public API responses.
- Test the challenge as a participant before publishing.
- Add attempt limits and anti-abuse controls only as supported and required; do not claim they prevent all cheating.
- Do not expose private answers in logs, analytics, error messages, HTML, or client bundles.

## 7.8 Users and roles
- Super Admin only.
- Invite/deactivate users using the selected auth provider.
- Assign least-privilege roles.
- Prevent removal/downgrade of the last active Super Admin without a recovery path.
- Record role changes in the audit log.

## 7.9 Audit log
Record security-relevant actions: sign-in failures/successes (without secrets), role changes, content publish/unpublish, submission decisions, result edits, and sensitive settings changes. Do not log passwords, session cookies, tokens, private submission content, or answer keys.

---

# 8. Trusted API and validation requirements

Define and document server endpoints based on actual implementation. A possible resource-oriented shape is:

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

GET    /api/admin/dashboard
GET    /api/admin/events
POST   /api/admin/events
PATCH  /api/admin/events/:id
POST   /api/admin/events/:id/publish

GET    /api/admin/submissions
GET    /api/admin/submissions/:id
PATCH  /api/admin/submissions/:id/status

GET    /api/admin/results
POST   /api/admin/results
PATCH  /api/admin/results/:id

GET    /api/admin/challenges
POST   /api/admin/challenges
PATCH  /api/admin/challenges/:id
POST   /api/challenges/:id/submit
```

This is a conceptual contract, not a requirement to create every endpoint exactly as written. Match routes to the selected framework and avoid unnecessary endpoint proliferation.

Every privileged endpoint must:
- Authenticate the session.
- Authorize the specific action and resource.
- Validate and normalize input server-side.
- Enforce length, type, range, and allowed-value constraints.
- Return consistent errors without leaking internal secrets.
- Apply rate limiting to login, submission, and abuse-prone actions.
- Handle duplicate requests safely where applicable.
- Use parameterized/SDK-supported queries; do not build unsafe query strings from untrusted input.
- Record relevant audit events.
- Avoid exposing stack traces or private records in production.
- Set appropriate CORS and cookie policies for the actual deployment.
- Use CSRF defenses where the chosen authentication mechanism requires them.

Do not ship a fake API that simply checks a password in React and writes directly to Sanity with a browser-visible token.

---

# 9. Submission workflow and deadline enforcement

The current submission integration points to Google Apps Script, but its implementation is outside the repository. Audit it before deciding to retain or replace it.

## Required behavior
- The server uses one canonical event deadline and timezone.
- The server rejects late submissions even if a participant edits browser code or calls the endpoint directly.
- The server validates required fields, allowed file types, file size, and expected payload shape.
- Apply rate limits and abuse controls.
- Store a server-generated submission ID and trustworthy received timestamp.
- Return a clear success/failure response; do not show success before the endpoint confirms it.
- Prevent accidental duplicate submissions where appropriate.
- Keep private files inaccessible to the public.
- Provide organizers a way to inspect/review submissions.
- Document data retention, access, and deletion.
- Keep client-side validation for convenience, but never as the security boundary.

If Apps Script is retained, verify its deployment identity, access permissions, server-side checks, storage permissions, quota behavior, and logs. If it cannot satisfy the requirements, migrate carefully and preserve existing records.

---

# 10. Frontend architecture and maintainability

Refactor gradually rather than rewriting everything at once.

## Recommended structure (adapt to the existing project)
```text
src/
  app/
    router/
    providers/
  components/
    ui/
    layout/
    feedback/
  features/
    auth/
    admin-dashboard/
    events/
    submissions/
    results/
    minds/
    blitz/
  lib/
    sanity/
      client.js
      queries.js
      images.js
    api/
    validation/
    config/
  pages/
  styles/
  test/
server/                  # only if supported by selected hosting/runtime
  auth/
  routes/
  middleware/
  services/
  validation/
  audit/
docs/
```

Do not force a folder move solely to match this example. Make ownership clearer while avoiding huge, risky diffs.

## Shared patterns
- Centralize API calls and Sanity queries.
- Use shared loading, error, empty, confirmation, and success states.
- Use accessible forms with labels and keyboard navigation.
- Use consistent date/time formatting with an explicit timezone.
- Add pagination to potentially large lists.
- Avoid duplicated business logic in multiple components.
- Keep configuration validation in one place.
- Add cancellation or stale-request handling where needed.
- Remove unused imports/components only after verifying references.
- Split `src/index.css` by design system, layout, and feature as part of the redesign phase, not as an unreviewed mass replacement.
- Correct the favicon path to the existing asset after verifying it.
- Remove placeholder URLs and stale copy only after the correct content is confirmed.

---

# 11. Security review checklist

Treat the following as release blockers when relevant:

- [ ] No private credential in Git-tracked files or frontend bundles.
- [ ] Admin route protected by real server-validated authentication.
- [ ] Authorization enforced on every privileged endpoint.
- [ ] Session expiration, logout, throttling, and recovery documented.
- [ ] Sanity write token never reaches the browser.
- [ ] Public Sanity queries return only public fields.
- [ ] Blitz answer keys are not delivered to participants before submission.
- [ ] JavaScript playground execution cannot access the main app's privileged context.
- [ ] Python playground has documented resource and isolation limits.
- [ ] Server enforces deadlines and submission validation.
- [ ] Submission files and personal information have access controls.
- [ ] Errors do not reveal tokens, private answers, or stack traces.
- [ ] Audit logs do not contain secrets.
- [ ] Dependencies are checked for known vulnerabilities.
- [ ] CORS, cookies, CSRF, and rate limits match the chosen deployment architecture.
- [ ] Backup and rollback procedures exist before production migrations.

Do not claim the platform is “fully secure.” Document tested controls, residual risks, and limitations.

---

# 12. Testing and quality gates

Add tooling compatible with the current stack, selecting maintained packages and pinning dependencies through the lockfile.

## Minimum quality gates
- Production build succeeds.
- Lint command runs and passes.
- Unit tests cover validation, permissions, date/deadline logic, and scoring.
- Integration tests cover protected endpoints and role restrictions.
- Route tests cover public routes and admin login/denial behavior.
- Sanity query tests verify public projections do not contain private fields.
- Submission tests cover valid, malformed, oversized, unsupported-file, duplicate, and late requests.
- Challenge tests verify answers are evaluated server-side.
- Smoke tests verify home, Minds list/detail, Events, Blitz list/challenge, and not-found routes.
- Responsive checks cover mobile, tablet, and desktop.
- Accessibility checks cover keyboard use, focus states, labels, contrast, and dialog behavior.
- Production build inspection confirms no secret values in client assets.

## Required adversarial tests
- Call an admin endpoint without a session.
- Use an editor session to attempt a Super Admin operation.
- Attempt to publish an invalid event.
- Submit after the deadline by calling the endpoint directly.
- Inspect public challenge responses for correct-answer fields.
- Attempt to access another team's submission.
- Attempt an oversized upload and unsupported file type.
- Try repeated login failures.
- Verify logout invalidates the session.
- Verify a private token cannot be found in the built `dist` directory.

---

# 13. Content cleanup and data integrity

From the initial audit, verify these items rather than assuming they remain unchanged:

- Event dates listed as 1–9 August 2026 may be historical as of this document's date. Confirm whether to archive the event or correct its dates.
- Resolve the placeholder `example.com` resource URL.
- Verify results currently marked as placeholders.
- Reconcile `problem.txt` with `src/lib/eventSpecificData.json`.
- Fix the favicon reference if it still points to a missing `/vite.svg`.
- Confirm whether unused image/SVG/GIF assets are actually unused.
- Verify the Sanity API version policy and project configuration.
- Confirm all public registration, rulebook, social, and submission links.
- Use an explicit timezone for event deadlines.
- Distinguish historical/completed events from currently open events.
- Preserve published article slugs and public URLs where possible to avoid broken links.

Never make unverified winners, event dates, or registration links appear official.

---

# 14. Visual redesign — deliberately separate from the backend/security work

The site will eventually be redesigned, but do not mix a wholesale visual rewrite with high-risk data/auth migrations in one uncontrolled change.

## Design goals
- Keep Binary Minds recognizable as a technical community, not a generic SaaS dashboard.
- Establish a consistent design system: color tokens, type scale, spacing, borders, focus rings, motion rules, and responsive breakpoints.
- Keep the public website expressive and distinctive while making the admin interface calm, dense, readable, and efficient.
- Preserve useful existing animations, but reduce effects that interfere with accessibility, mobile performance, or content readability.
- Respect `prefers-reduced-motion`.
- Ensure keyboard navigation and visible focus.
- Keep contrast and text sizes usable.
- Avoid loading heavy 3D/canvas effects on admin pages unless there is a strong reason.
- Design empty, loading, error, success, disabled, and permission-denied states, not just the happy path.

## Public-site redesign scope
- Navigation and mobile menu.
- Landing-page hierarchy and call to action.
- Minds cards, article typography, and article detail.
- Event listing, event detail, registration and resource links.
- Blitz challenge cards and challenge workspace.
- Footer, favicon, and consistent imagery.
- Page transitions, reduced motion, loading performance, and responsive behavior.

## Admin redesign scope
- Persistent navigation/sidebar and responsive layout.
- Dashboard summary with real data.
- Tables with search, filters, sorting, pagination, and clear status labels.
- Edit forms with field-level errors and unsaved-change warnings.
- Preview and publish confirmation.
- Submission review layout with protected file access.
- Role-aware navigation and access-denied states.
- Confirmation dialogs for destructive or irreversible actions.

## Redesign process
1. Capture screenshots and record current routes and interactions.
2. Inventory current design tokens and reusable UI.
3. Agree on visual direction before replacing the design.
4. Build reusable primitives and page templates.
5. Implement one representative page first and review it at mobile/desktop widths.
6. Apply the system to the remaining public pages.
7. Build the admin experience using the same brand system but task-focused layouts.
8. Compare before/after screenshots and test interactions.
9. Remove obsolete CSS/assets only after checking references.

Do not replace the current visual identity with a generic admin template without reviewing it with the project owner.

---

# 15. Recommended implementation phases

## Phase 0 — Baseline and discovery
- Inspect repository and external integration boundaries.
- Run build and record baseline.
- Produce architecture, data-governance, security, and environment docs.
- Confirm current Sanity schemas and Apps Script behavior with an authorized operator.
- Output a list of verified risks and unresolved decisions.

**Exit criteria:** No implementation assumptions remain hidden; data sources and deployment constraints are documented.

## Phase 1 — Immediate correctness and containment
- Verify stale event content and placeholder links/results.
- Correct favicon if needed.
- Inspect challenge response for answer-key leakage.
- Remove unsafe JavaScript execution from the main application context or implement an explicitly reviewed isolation design.
- Confirm no private secrets are embedded in the client.
- Add tests for the highest-risk logic.

**Exit criteria:** Known critical exposures are fixed or clearly blocked from production pending an external dependency.

## Phase 2 — Backend/auth foundation
- Choose and document the server runtime supported by the current host.
- Implement authentication/session handling.
- Implement role checks and server-side validation.
- Configure local `.env.local`, tracked `.env.example`, and deployed secret storage.
- Add a protected health/configuration check that reveals no secret values.
- Add tests for unauthenticated and unauthorized requests.

**Exit criteria:** Every privileged action is server-protected; no admin write depends on frontend-only checks.

## Phase 3 — Sanity governance
- Back up current content.
- Inspect/adapt schemas for events, resources, results, announcements, articles, and challenges.
- Protect answer keys and draft content.
- Migrate verified static event data.
- Switch public pages to dynamic published Sanity content.
- Verify publishing changes appear without frontend redeployment.

**Exit criteria:** Approved editorial changes can be managed without editing and redeploying the frontend; public reads expose only intended fields.

## Phase 4 — Admin portal MVP
- Build `/kazi_binary_admins` login and protected shell.
- Add dashboard, events, resources, results, Minds, and challenge management.
- Add role-aware navigation and server authorization.
- Add draft/publish flow and audit logging.
- Add submission review only after the real storage path is confirmed.

**Exit criteria:** Authorized staff can perform the agreed core operations, and unauthorized users cannot.

## Phase 5 — Submission and challenge integrity
- Verify/migrate Apps Script submission workflow.
- Add server-side deadlines and validation.
- Implement secure file handling and review states.
- Evaluate challenge answers server-side.
- Add abuse controls, test coverage, and data-retention documentation.

**Exit criteria:** Critical submission and challenge rules cannot be bypassed merely by modifying frontend code.

## Phase 6 — Visual redesign
- Agree on design direction and reusable tokens.
- Redesign public routes and admin workflows.
- Test responsive layout, accessibility, and motion.
- Preserve links, content, and route behavior.

**Exit criteria:** All primary workflows work and the new design passes desktop/mobile and accessibility review.

## Phase 7 — Release and operations
- Test production-like environment with non-production credentials/data.
- Verify backups and rollback.
- Run build, lint, unit, integration, security, and smoke tests.
- Configure monitoring and error reporting without sensitive payloads.
- Document deployment, secret rotation, admin recovery, content rollback, and incident response.
- Deploy only after explicit approval.

**Exit criteria:** Release checklist is complete and operational ownership is clear.

---

# 16. Decisions that require the project owner

Do not silently guess these decisions:

1. Who should be Super Admin, and who needs editor/organizer/evaluator access?
2. Does the current Sanity project include a Studio and editable schemas, and who controls it?
3. Where does Google Apps Script currently store submissions and uploaded files?
4. Should submissions remain in the existing storage system or move to a database/object store?
5. Is there a preferred hosting-compatible backend/auth provider, or should the agent recommend options after inspection?
6. What are the verified event dates, results, and official resource links?
7. Should all public editorial content live in Sanity, or should some content remain static for a documented reason?
8. What is the approved retention policy for participant data and files?
9. What is the desired visual direction for the public redesign?
10. What is the expected traffic, number of organizers, and submission volume?

If a decision blocks safe progress, ask one focused question or produce a decision memo with options, trade-offs, cost/complexity, and a recommendation. Continue independent, reversible work where possible.

---

# 17. Final delivery requirements

At completion, provide:

- Summary of architecture and key decisions.
- List of files created, modified, and removed.
- Environment-variable list with descriptions but **no values of secrets**.
- Local setup instructions.
- How to create the first Super Admin safely.
- How to configure Sanity schemas, permissions, and tokens.
- How to configure submission storage and migrate existing submissions.
- How to publish events, results, articles, and challenges.
- Test commands and results, including any failures.
- Deployment steps and rollback instructions.
- Remaining risks and external actions the agent could not perform.
- Screenshots of the redesigned public and admin pages if the environment supports them.
- Confirmation that no real credential was committed or placed in the frontend bundle.

## Definition of done

Binary Minds is ready for release only when:
- The public site remains functional.
- `/kazi_binary_admins` is protected by server-validated authentication and authorization.
- Events and approved editorial content are dynamically managed without frontend redeployments.
- Sanity schemas, permissions, and public/private query boundaries are verified.
- Submissions have trusted validation, controlled storage, and a usable review workflow.
- Challenge answer keys remain private until the correct point in the evaluation flow.
- The code playground has a reviewed isolation model.
- Build, tests, and responsive checks pass.
- The redesign preserves accessibility and essential existing functionality.
- Deployment, backup, recovery, and secret-management instructions are documented.

---

**Final instruction:** Implement in small, reviewable steps. Security and data correctness come before dashboard polish; reliable dynamic content comes before a full visual redesign. Never claim a feature is complete until its actual behavior and relevant tests have been verified.
