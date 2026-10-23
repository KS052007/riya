import { json, readStoredJson, requireMethod, requireSession, setSecurityHeaders } from '../../server/security.js'

function param(req, name) {
  const value = req.query?.[name]
  return Array.isArray(value) ? value[0] : value
}

export default async function handler(req, res) {
  setSecurityHeaders(res)
  if (!requireMethod(req, res, 'GET')) return
  if (!await requireSession(req, res, ['super_admin'])) return
  try {
    const id = String(param(req, 'id') || '')
    const index = Number(param(req, 'chunk'))
    if (!id || !Number.isInteger(index) || index < 0) return json(res, 400, { error: 'Invalid attachment request.' })
    const submissions = await readStoredJson('bm-bip:submissions:v1', [])
    const application = Array.isArray(submissions) ? submissions.find(item => item.id === id) : null
    if (!application?.attachment || index >= application.attachment.totalChunks) return json(res, 404, { error: 'Attachment not found.' })
    const data = await readStoredJson(`bm-bip:upload:${application.attachment.uploadId}:chunk:${index}`, null)
    if (!data) return json(res, 404, { error: 'Attachment is no longer available.' })
    return json(res, 200, { data, fileName: application.attachment.fileName, mimeType: application.attachment.mimeType, totalChunks: application.attachment.totalChunks })
  } catch {
    return json(res, 503, { error: 'Attachment download is temporarily unavailable.' })
  }
}
