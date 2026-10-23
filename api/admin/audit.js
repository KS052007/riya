import { json, readAudit, requireMethod, requireSession, setSecurityHeaders } from '../../server/security.js'

export default async function handler(req, res) {
  setSecurityHeaders(res)
  if (!requireMethod(req, res, 'GET')) return
  if (!requireSession(req, res, ['super_admin'])) return
  try {
    return json(res, 200, { entries: await readAudit() })
  } catch {
    return json(res, 503, { error: 'Audit history is unavailable' })
  }
}
