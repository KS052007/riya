import { json, readStoredJson, recordAudit, requireSameOrigin, requireSession, setSecurityHeaders, writeStoredJson } from '../../server/security.js'

const KEY = 'bm-bip:submissions:v1'
const STATUSES = new Set(['pending', 'accepted', 'rejected'])

export default async function handler(req, res) {
  setSecurityHeaders(res)
  const actor = await requireSession(req, res, ['super_admin'])
  if (!actor) return
  try {
    const submissions = await readStoredJson(KEY, [])
    if (!Array.isArray(submissions)) throw new Error('Submission storage is invalid')
    if (req.method === 'GET') return json(res, 200, { submissions })
    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'GET, PATCH')
      return json(res, 405, { error: 'Method not allowed' })
    }
    if (!requireSameOrigin(req, res)) return
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const id = String(body.id || '')
    const status = String(body.status || '')
    const index = submissions.findIndex(item => item.id === id)
    if (index < 0) return json(res, 404, { error: 'Submission not found.' })
    if (!STATUSES.has(status)) return json(res, 400, { error: 'Choose pending, accepted, or rejected.' })
    submissions[index] = { ...submissions[index], status, reviewedBy: actor.username, reviewedAt: new Date().toISOString() }
    await writeStoredJson(KEY, submissions)
    await recordAudit({ actor: actor.username, role: actor.role, action: `build_in_public.application.${status}`, contentType: 'contributionApplication', documentId: id })
    return json(res, 200, { submission: submissions[index] })
  } catch {
    return json(res, 503, { error: 'Build in Public review is temporarily unavailable.' })
  }
}
