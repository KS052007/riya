function doPost(event) {
  try {
    const payload = JSON.parse(event?.postData?.contents || '{}')
    const configuredSecret = PropertiesService.getScriptProperties().getProperty('EMAIL_WEBHOOK_SECRET') || ''
    if (!constantTimeEquals_(String(payload.secret || ''), configuredSecret)) {
      return jsonResponse_({ ok: false, error: 'Request could not be authorized.' })
    }

    const applicationId = String(payload.applicationId || '')
    const studentEmail = String(payload.studentEmail || '').trim()
    const fullName = String(payload.fullName || 'Contributor').trim().slice(0, 120)
    const project = String(payload.project || 'Binary Minds Open AI Agent Framework').replace(/[\r\n]+/g, ' ').trim().slice(0, 140)
    if (!/^[\w-]{8,80}$/.test(applicationId)) {
      return jsonResponse_({ ok: false, error: 'The application reference is invalid.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail) || studentEmail.length > 160) {
      return jsonResponse_({ ok: false, error: 'The applicant email address is invalid.' })
    }

    const lock = LockService.getScriptLock()
    if (!lock.tryLock(5000)) {
      return jsonResponse_({ ok: false, error: 'Email service is busy. Please retry shortly.' })
    }
    try {
      const properties = PropertiesService.getScriptProperties()
      const sentKey = `ACCEPTANCE_EMAIL_SENT_${applicationId}`
      if (properties.getProperty(sentKey)) {
        return jsonResponse_({ ok: true, alreadySent: true })
      }
      if (MailApp.getRemainingDailyQuota() < 1) {
        return jsonResponse_({ ok: false, error: 'The Google email sending limit has been reached for today.' })
      }

      const safeName = escapeHtml_(fullName || 'Contributor')
      const safeProject = escapeHtml_(project)
      const subject = `Your contribution request for ${project} was accepted`
      const body = `Hi ${fullName || 'Contributor'},\n\nYour contribution request for ${project} has been accepted. The Binary Minds team will follow up with next steps.\n\nBinary Minds`
      MailApp.sendEmail({
        to: studentEmail,
        subject,
        body,
        htmlBody: `<p>Hi ${safeName},</p><p>Your contribution request for <strong>${safeProject}</strong> has been accepted.</p><p>The Binary Minds team will follow up with next steps.</p><p>Binary Minds</p>`,
        name: 'Binary Minds',
      })
      properties.setProperty(sentKey, new Date().toISOString())
      return jsonResponse_({ ok: true })
    } finally {
      lock.releaseLock()
    }
  } catch {
    return jsonResponse_({ ok: false, error: 'Google Apps Script could not send the email. Check its authorization and execution log.' })
  }
}

function doGet() {
  return jsonResponse_({ ok: true, service: 'Binary Minds acceptance email' })
}

function authorizeEmail() {
  MailApp.getRemainingDailyQuota()
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON)
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function constantTimeEquals_(provided, expected) {
  if (!provided || !expected) return false
  let difference = provided.length ^ expected.length
  const length = Math.max(provided.length, expected.length)
  for (let index = 0; index < length; index += 1) {
    difference |= (provided.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0)
  }
  return difference === 0
}
