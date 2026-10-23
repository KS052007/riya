export async function sendAcceptanceEmail(submission) {
  const endpoint = process.env.GOOGLE_APPS_SCRIPT_EMAIL_URL
  const secret = process.env.GOOGLE_APPS_SCRIPT_EMAIL_SECRET
  if (!endpoint || !secret) {
    throw new Error('Acceptance email is not configured. Add the Google Apps Script email URL and secret in Vercel.')
  }
  if (!submission.studentEmail || !/^\S+@\S+\.\S+$/.test(submission.studentEmail)) {
    throw new Error('The applicant email address is missing or invalid.')
  }

  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        applicationId: submission.id,
        studentEmail: submission.studentEmail,
        fullName: submission.fullName || 'Contributor',
        project: submission.project || 'Binary Minds Open AI Agent Framework',
      }),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new Error('Google Apps Script could not be reached. Check its deployment URL and try again.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('Google Apps Script returned an unreadable response. Check the web app deployment and try again.')
  }
  if (!response.ok || result.ok !== true) {
    throw new Error(typeof result.error === 'string' ? result.error : 'Google Apps Script could not send the email.')
  }
}
