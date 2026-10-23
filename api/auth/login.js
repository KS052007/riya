import { authenticate, createSession, enforceLoginLimit, json, recordAudit, requireMethod, requireSameOrigin, setSecurityHeaders, writeSessionCookie, assertAuthConfig } from '../../server/security.js'

export default async function handler(req, res) {
  setSecurityHeaders(res)
  if (!requireMethod(req, res, 'POST') || !requireSameOrigin(req, res)) return
  try {
    assertAuthConfig()
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const username = String(body?.username || '').trim()
    const password = String(body?.password || '')
    if (!username || username.length > 128 || password.length > 1024) {
      return json(res, 400, { error: 'Enter valid sign-in details' })
    }
    if (!(await enforceLoginLimit(req, res, username))) return
    const user = await authenticate(username, password)
    if (!user) return json(res, 401, { error: 'Sign-in failed' })
    await recordAudit({ actor: user.username, role: user.role, action: 'auth.login' })
    writeSessionCookie(res, createSession(user))
    return json(res, 200, { user: { username: user.username, role: user.role } })
  } catch {
    return json(res, 503, { error: 'Admin sign-in is not configured' })
  }
}
