# Free acceptance email setup with Google Apps Script

This sends acceptance notifications from the Google account that owns the script. It does not require a purchased domain. Google's current Apps Script quota lists 100 email recipients per day for consumer accounts; quotas may change. See [Google Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).

## 1. Create the mail sender script

1. Sign in to the Gmail/Google account that should send the messages.
2. Open [script.google.com](https://script.google.com) and select **New project**.
3. Open the default `Code.gs`, replace its contents with all the code from [`../google-apps-script/acceptance-email.gs`](../google-apps-script/acceptance-email.gs), then save the project.
4. Select `authorizeEmail` in the function picker and click **Run**. Approve Google's email-sending permission for your account.

## 2. Create a shared secret

Generate a random 32-byte secret in PowerShell (Node.js must be installed):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep the output private. Do not put it in the source code, a `VITE_` variable, a public document, or a chat.

In Apps Script, open **Project Settings** (gear icon) → **Script Properties** → **Add script property**. Set:

- Property: `EMAIL_WEBHOOK_SECRET`
- Value: the generated secret

Save the property.

## 3. Deploy the script as a web app

1. Click **Deploy** → **New deployment**.
2. Choose **Web app** as the deployment type.
3. Set **Execute as** to **Me** (the Google account that should send the email).
4. Set access to **Anyone** so Vercel can call it. The endpoint checks the shared secret on every POST. If your account does not offer this access option, its organization may block public web apps.
5. Click **Deploy**, complete any authorization prompts, and copy the web app URL ending in `/exec`.
6. Open the `/exec` URL in a browser. It should display a small JSON response saying the email service is healthy.

Do not use the `/dev` test URL; Vercel needs the deployed `/exec` URL.

## 4. Add the two values in Vercel

Open the Vercel project → **Settings** → **Environment Variables**. Add these separately, selecting **Production** (and Preview too if you want to test previews):

| Name | Value |
|---|---|
| `GOOGLE_APPS_SCRIPT_EMAIL_URL` | The deployed `/exec` URL copied above |
| `GOOGLE_APPS_SCRIPT_EMAIL_SECRET` | The exact generated secret saved in Apps Script Script Properties |

Paste values without surrounding quotes. Save the variables and redeploy the Vercel project so the serverless functions receive them.

## 5. Deploy this project update and try an acceptance

The application code must also be deployed. Commit and push the project changes to the connected Git branch, or trigger a deployment from the Vercel dashboard. In the admin portal, accept a contribution request. The email status appears on that request. If sending fails, the request remains accepted and **Retry acceptance email** can be used after fixing the setup.

The Apps Script stores sent application IDs to avoid sending a duplicate when the same request is retried. The public web-app URL is not a password; the shared secret is the credential and must stay server-side in Vercel and in Apps Script Script Properties.
