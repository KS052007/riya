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
| Build in Public projects | Upstash Redis project records | Super Admin project editor; public page reads published projects | Public title, summary, tags, and contribution guidelines; draft and archived records are private |
| Build in Public contribution requests | Upstash Redis records and optional PDF/Word attachment chunks | Public application form; Super Admin review | Private application data; admin can accept or reject; each request stores its project ID and title snapshot |
| Ideathon submissions | External Google Apps Script endpoint | External system | Needs external access; separate from Build in Public |
| Branding/social links | Defaults and public Vite build variables | Source/deployment config | Verified |

## Data integrity

- **Verified:** `problem.txt` duplicates the event-specific JSON source.
- **Verified:** `events.js` contains dates in August 2026 and a placeholder example.com resource. Event UI now derives “Completed” from an elapsed end date, but verified replacement dates/links still require an organizer.
- **Verified:** `resultsData.js` contains comments identifying records as placeholders. Those records are no longer displayed publicly; results require an explicitly published Sanity record.
- **Needs external access:** Sanity schemas, production data, and whether existing documents have suitable publication state.

## Admin publishing workflow

The Sanity portal supports `publicationStatus` values `draft`, `review`, `published`, and `archived` for events, results, and announcements. Build in Public project records are stored in Upstash and can be created, edited, published, archived, or deleted only by a Super Admin. The public endpoint returns published projects only; contribution submissions must reference a currently published project. Requests enter a private pending queue; only a Super Admin can accept or reject a request. Applicant names, student emails, profiles, answers, and attachments are not published on the public page. Only a Super Admin can add/remove portal accounts. Minds remain in Sanity Studio and are not editable in this portal.

**Current limitation:** Sanity-managed events, results, and announcements still use a JSON editor. Contribution attachments are held in Upstash for 90 days; there is no automated applicant notification or password reset. Existing Sanity document schemas must be checked before writing production documents.

## Submission policy and retained legacy data

**Verified:** Ideathon submission field/file/deadline checks in React remain UX checks only. The receiving Apps Script source is unavailable, so server-side enforcement, storage privacy, and retention are unknown. Build in Public applications are a separate server-validated queue with Upstash storage and private attachment downloads.

**Verified:** The former Blitz route redirects to Build in Public, and challenge records are no longer available through the admin content API. Existing Sanity records and unused source files are retained; delete or archive them only through a separately planned data cleanup.

## Recommendations

1. Configure the portal and test in preview/non-production before production use.
2. Back up Sanity data and confirm schemas/permissions before migration or edits.
3. Reconcile historical event dates and resource links with an authorized organizer.
4. Inspect the Apps Script and define reviewer access, file privacy, and retention for Ideathon submissions.
5. Review Upstash application and attachment retention before expanding the Build in Public application flow.
