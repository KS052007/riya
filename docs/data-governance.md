# Data Governance

**Status labels:** Verified = visible in this repository; Needs external access = cannot be confirmed without the connected service/account; Recommendation = proposed direction.

## Current data inventory

| Data | Canonical source | Update path | Status |
|---|---|---|---|
| Minds/articles | Sanity `mind` documents | Sanity Studio | Sanity remains canonical; removed from this portal |
| Legacy Blitz challenges/questions | Existing Sanity `challenge` documents | No public route or portal editing | Records retained; feature retired from the current site |
| Events | Published Sanity `siteEvent` records | Portal; public event page reads published projection | Implemented; legacy local fallback remains until at least one managed record exists |
| Problem statements/resources | `problemStatements` and details on `siteEvent` | Portal event JSON | Implemented for managed events; legacy JSON fallback remains |
| Results | Published Sanity `siteResult` records | Portal; public view only shows published records | Implemented; placeholder local results hidden |
| Announcements | Published Sanity `siteAnnouncement` records | Portal; public banner | Implemented |
| Build in Public submissions | Upstash Redis records | Public request form; Super Admin review and approval | Implemented; approved records appear publicly; files remain linked from GitHub/Drive |
| Ideathon submissions | External Google Apps Script endpoint | External system | Needs external access; separate from Build in Public |
| Branding/social links | Defaults and public Vite build variables | Source/deployment config | Verified |

## Data integrity

- **Verified:** `problem.txt` duplicates the event-specific JSON source.
- **Verified:** `events.js` contains dates in August 2026 and a placeholder example.com resource. Event UI now derives “Completed” from an elapsed end date, but verified replacement dates/links still require an organizer.
- **Verified:** `resultsData.js` contains comments identifying records as placeholders. Those records are no longer displayed publicly; results require an explicitly published Sanity record.
- **Needs external access:** Sanity schemas, production data, and whether existing documents have suitable publication state.

## Admin publishing workflow

The Sanity portal supports `publicationStatus` values `draft`, `review`, `published`, and `archived` for events, results, and announcements. Build in Public has a separate flow: public submissions enter a pending queue; only a Super Admin can approve or reject a request, and only approved entries appear publicly. Only a Super Admin can add/remove portal accounts. Minds remain in Sanity Studio and are not editable in this portal.

**Current limitation:** Sanity-managed events, results, and announcements still use a JSON editor. Build in Public currently accepts links to externally hosted images/projects; it does not upload to Google Drive or GitHub. Existing Sanity document schemas must be checked before writing production documents.

## Submission policy and retained legacy data

**Verified:** Ideathon submission field/file/deadline checks in React remain UX checks only. The receiving Apps Script source is unavailable, so server-side enforcement, storage privacy, and retention are unknown. Build in Public is a separate server-validated queue with Upstash storage.

**Verified:** The former Blitz route redirects to Build in Public, and challenge records are no longer available through the admin content API. Existing Sanity records and unused source files are retained; delete or archive them only through a separately planned data cleanup.

## Recommendations

1. Configure the portal and test in preview/non-production before production use.
2. Back up Sanity data and confirm schemas/permissions before migration or edits.
3. Reconcile historical event dates and resource links with an authorized organizer.
4. Inspect the Apps Script and define reviewer access, file privacy, and retention before adding submission review.
5. Set a launch date and decide whether Build in Public updates should become admin-managed content before publishing updates.
