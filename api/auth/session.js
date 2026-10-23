import { json, requireMethod, requireSession, setSecurityHeaders } from '../../server/security.js'

export default async function handler(req, res) {
  setSecurityHeaders(res)
  if (!requireMethod(req, res, 'GET')) return
  const user = await requireSession(req, res)
  if (!user) return
  return json(res, 200, { user })
}
