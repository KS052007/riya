# Data Governance

**Status labels:** Verified = visible in this repository; Needs external access = cannot be confirmed without the connected service/account; Recommendation = proposed direction.

## Current data inventory

| Data | Canonical source | Update path | Status |
|---|---|---|---|
| Minds/articles | Sanity `mind` documents | Protected portal; role-limited JSON editing | Implemented; schema and permissions need external verification |
| Legacy Blitz challenges/questions | Existing Sanity `challenge` documents | No public route or portal editing | Records retained; feature retired from the current site |
| Events | Published Sanity `siteEvent` records | Portal; public event page reads published projection | Implemented; legacy local fallback remains until at least one managed record exists |
| Problem statements/resources | `problemStatements` and details on `siteEvent` | Portal event JSON | Implemented for managed events; legacy JSON fallback remains |
| Results | Published Sanity `siteResult` records | Portal; public view only shows published records | Implemented; placeholder local results hidden |
| Announcements | Published Sanity `siteAnnouncement` records | Portal; public banner | Implemented |
| Ideathon submissions | External Google Apps Script endpoint | External system | Needs external access; no portal review surface yet |
| Branding/social links | Defaults and public Vite build variables | Source/deployment config | Verified |

## Data integrity

- **Verified:** `problem.txt` duplicates the event-specific JSON source.
- **Verified:** `events.js` contains dates in August 2026 and a placeholder example.com resource. Event UI now derives “Completed” from an elapsed end date, but verified replacement dates/links still require an organizer.
- **Verified:** `resultsData.js` contains comments identifying records as placeholders. Those records are no longer displayed publicly; results require an explicitly published Sanity record.
- **Needs external access:** Sanity schemas, production data, and whether existing documents have suitable publication state.

## Admin publishing workflow

The portal supports `publicationStatus` values `draft`, `review`, `published`, and `archived`. New event/result/announcement/mind documents begin as drafts. Public projections expose only published event, result, and announcement records. Super Admin can publish all supported types; Event Organizer can publish event/results/announcements; Content Editor can save Minds and announcements but cannot publish Minds. These checks run on the server. Build in Public is an upcoming static page and is not yet a managed content collection.

**Current limitation:** This first version uses a JSON editor. It does not yet provide field-specific forms, preview, review assignments, change history, or user management. Existing Sanity document schemas must be checked before writing production documents.

## Submission policy and retained legacy data

**Verified:** Submission field/file/deadline checks in React remain UX checks only. The receiving Apps Script source is unavailable, so server-side enforcement, storage privacy, and retention are unknown. The admin portal does not expose submissions.

**Verified:** The former Blitz route redirects to Build in Public, and challenge records are no longer available through the admin content API. Existing Sanity records and unused source files are retained; delete or archive them only through a separately planned data cleanup.

## Recommendations

1. Configure the portal and test in preview/non-production before production use.
2. Back up Sanity data and confirm schemas/permissions before migration or edits.
3. Reconcile historical event dates and resource links with an authorized organizer.
4. Inspect the Apps Script and define reviewer access, file privacy, and retention before adding submission review.
5. Set a launch date and decide whether Build in Public updates should become admin-managed content before publishing updates.
