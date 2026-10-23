# Security Review

**Status labels:** Verified = visible in this repository; Needs external access = cannot be confirmed without the connected service/account; Recommendation = proposed direction.

## Authentication and administration

- `/kazi_binary_admins` is a real UI backed by serverless API handlers under `api/`.
- API sessions use an HMAC-signed cookie with HttpOnly, Secure, SameSite=Strict flags and an eight-hour expiry. Password hashes use Node scrypt. Password/role changes invalidate the session.
- Content operations enforce role allowlists in the server. Editors cannot delete. Publishing rights are role-limited. Same-origin checks protect mutations.
- Login throttling uses Upstash Redis and fails closed when Redis is unavailable. The IP/username pair is limited to eight tries per 15 minutes.
- A Super Admin can add/remove non-super-admin accounts through a server-checked endpoint. Password hashes and account records are stored in Upstash Redis; bootstrap Super Admin accounts remain in `ADMIN_USERS_JSON`. Account recovery is not implemented. A Super Admin can read recent auth/content action records stored in Upstash Redis (one-year TTL, capped history); this is an operational audit log, not a tamper-proof compliance ledger.
- Public Build in Public submissions are stored in Upstash as pending records. Only a Super Admin can approve or reject them; only approved records are exposed publicly. Submission rate limiting uses hashed client addresses. Source and image URLs are links to external services and are not copied into this app.

## Credentials and content boundary

- Sanity project ID/dataset are public client configuration. The admin write token is only read by server code and must be configured as a server secret.
- No real password, session secret, Redis token, or Sanity write token is committed. `.env.example` contains names/placeholders only.
- Public event/result/announcement endpoints return explicit published-field projections. Admin endpoints require a valid session and role.
- Sanity schema validation, token scope, dataset permissions, and live production responses need external verification.

## Remaining security risks

- Legacy Blitz source files and Sanity records remain, but public Blitz routes redirect to Build in Public and the admin content API rejects `challenge` as an unsupported type. The old challenge source is not imported by the active app.
- Ideathon deadline and file checks are client-side. Apps Script validation and private storage are outside this repository.
- JavaScript examples run through `new Function` in the public page context. The code runner is not isolated from the page.
- Python uses Pyodide from a third-party CDN; resource/isolation limits are not configured here.
- Account recovery is not implemented. Super Admin bootstrap accounts still require server-side environment configuration.

## External checks required before production

- Deploy preview functions and verify HTTPS/session behavior, secret configuration, and role restrictions.
- Confirm Upstash rate limit behavior and account recovery process.
- Inspect Sanity schemas and grant the write token minimum needed access.
- Inspect Google Apps Script, uploaded file ACLs, retention, and server validation.
- Verify that no private value appears in built client assets.

## Release blockers

1. Do not enable the portal until `SESSION_SECRET`, at least one Super Admin, Upstash REST access, and a least-privilege Sanity write token are configured.
2. Treat retained Blitz Sanity records as legacy data; the former public feature is retired.
3. Do not describe submission deadlines/file rules as enforced until the receiving endpoint validates them.
4. Do not display placeholder results as confirmed winners; local placeholders are currently hidden.
