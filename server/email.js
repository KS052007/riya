function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

export async function sendAcceptanceEmail(submission) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    throw new Error('Acceptance email is not configured. Add RESEND_API_KEY and EMAIL_FROM in Vercel.')
  }
  if (!submission.studentEmail || !/^\S+@\S+\.\S+$/.test(submission.studentEmail)) {
    throw new Error('The applicant email address is missing or invalid.')
  }

  const project = String(submission.project || 'Binary Minds Open AI Agent Framework').replace(/[\r\n]+/g, ' ').trim()
  const name = escapeHtml(submission.fullName || 'Contributor')
  const safeProject = escapeHtml(project)
  const text = `Hi ${submission.fullName || 'Contributor'},\n\nYour contribution request for ${project} has been accepted. The Binary Minds team will follow up with next steps.\n\nBinary Minds`
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [submission.studentEmail],
      subject: `Your contribution request for ${project} was accepted`,
      text,
      html: `<p>Hi ${name},</p><p>Your contribution request for <strong>${safeProject}</strong> has been accepted.</p><p>The Binary Minds team will follow up with next steps.</p><p>Binary Minds</p>`,
    }),
  })

  if (!response.ok) {
    throw new Error('The email provider could not send the message. Check the Resend API key, verified sender, and recipient address.')
  }
}
