import { clearSessionCookie, json, recordAudit, requireMethod, requireSameOrigin, requireSession, setSecurityHeaders } from '../../server/security.js'

export default async function handler(req, res) {
  setSecurityHeaders(res)
  if (!requireMethod(req, res, 'POST') || !requireSameOrigin(req, res)) return
  const user = requireSession(req, res)
  if (!user) return
  await recordAudit({ actor: user.username, role: user.role, action: 'auth.logout' }).catch(() => {})
  clearSessionCookie(res)
  return json(res, 200, { ok: true })
}
