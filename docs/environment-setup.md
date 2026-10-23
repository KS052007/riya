# Environment Setup

This documents the configuration currently consumed by the app and serverless functions. No secret values are included.

## Local setup

1. Install a Node.js/npm version compatible with Vite 8.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set the values below.
4. Use `npx vercel dev` to run the Vite frontend and API functions together. `npm run dev` serves only the frontend, so admin API requests will not work there.
5. Run `npm run build` for the production build and `npm run preview` to preview the built frontend.

## Public browser variables

| Variable | Purpose | Sensitivity |
|---|---|---|
| `VITE_SITE_NAME` | Site label | Public |
| `VITE_SITE_HOUSE` | Footer label | Public |
| `VITE_SITE_LOGO` | Logo path | Public |
| `VITE_SOCIALS` | Public social link JSON | Public |
| `VITE_IDEATHON_SUBMISSION_API_URL` | Public submission endpoint URL | Public URL, not a secret |
| `VITE_SANITY_PROJECT_ID` | Sanity browser read client project ID | Public |
| `VITE_SANITY_DATASET` | Sanity browser read dataset | Public |

## Server-only admin variables

Set these in local `.env.local` for `vercel dev` and in the Vercel secret manager for deployments. Never prefix them with `VITE_`.

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | HMAC key for session signing; generate with `npm run admin:session-secret` |
| `ADMIN_USERS_JSON` | JSON array with username, role, and scrypt password hash |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL used for distributed login throttling and audit records |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only Upstash token |
| `SANITY_PROJECT_ID` | Sanity server project ID; defaults to the current project ID |
| `SANITY_DATASET` | Sanity server dataset; defaults to `production` |
| `SANITY_API_WRITE_TOKEN` | Server-only Sanity token with minimum required write permissions |

Supported roles are `super_admin`, `content_editor`, `event_organizer`, `evaluator`, and `read_only`. Current portal capabilities: Super Admin manages all supported types and deletes; Content Editor manages Minds and announcements; Event Organizer manages events/results/announcements; evaluator/read-only have no content write permissions. Blitz challenges are no longer a supported type. A Super Admin can view auth/content action audit entries. Submission evaluation is not connected yet. Manage accounts and roles by updating the server-side `ADMIN_USERS_JSON` value; there is no in-portal user manager yet.

## Bootstrap the first Super Admin

1. Run `npm run admin:hash-password` in an interactive terminal. Password input is masked and must be at least 14 characters.
2. Store the resulting `scrypt$...` hash in an `ADMIN_USERS_JSON` entry, for example the JSON shape `[{"username":"owner","role":"super_admin","passwordHash":"<generated hash>"}]`.
3. Generate a random session secret with `npm run admin:session-secret`.
4. Create an Upstash Redis database and configure its REST URL/token.
5. Create a Sanity API token with the minimum required write access.
6. Save all values in `.env.local` or the deployment secret manager. Never commit them.

The login API fails closed if the session secret, user record, or rate-limit service is missing. Content reads/writes fail when the Sanity write token is missing.

## External setup requiring an account owner

- Vercel project deployment and secret configuration.
- Upstash Redis account/database.
- Sanity schema/Studio, dataset permissions, write token, and backups.
- Google Apps Script source and submission storage configuration.
