import { randomUUID } from 'node:crypto'
import { checkPublicSubmissionLimit, json, readStoredJson, requireMethod, requireSameOrigin, setSecurityHeaders, writeStoredJson } from '../../server/security.js'

const KEY = 'bm-bip:submissions:v1'
const TYPES = new Set(['github', 'drive', 'other'])
const URL_PATTERN = /^https:\/\//i

function bodyOf(req) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {}
}

export default async function handler(req, res) {
  setSecurityHeaders(res)
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return json(res, 405, { error: 'Method not allowed' })
  }
  try {
    const submissions = await readStoredJson(KEY, [])
    if (!Array.isArray(submissions)) throw new Error('Submission storage is invalid')
    if (req.method === 'GET') {
      return json(res, 200, {
        submissions: submissions.filter(item => item.status === 'approved').map(({ email, ...item }) => item),
      })
    }
    if (!requireSameOrigin(req, res)) return
    const body = bodyOf(req)
    if (body.website) return json(res, 200, { ok: true })
    if (!(await checkPublicSubmissionLimit(req))) return json(res, 429, { error: 'Too many submissions. Please try again later.' })
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim()
    const title = String(body.title || '').trim()
    const summary = String(body.summary || '').trim()
    const sourceType = String(body.sourceType || '')
    const sourceUrl = String(body.sourceUrl || '').trim()
    const imageUrl = String(body.imageUrl || '').trim()
    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      return json(res, 400, { error: 'Enter your name and a valid email address.' })
    }
    if (title.length < 4 || title.length > 120 || summary.length < 20 || summary.length > 1200) {
      return json(res, 400, { error: 'Add a title and a short project summary (20–1200 characters).' })
    }
    if (!TYPES.has(sourceType) || !URL_PATTERN.test(sourceUrl) || sourceUrl.length > 1000) {
      return json(res, 400, { error: 'Add a valid HTTPS link to your GitHub repo, Drive folder, or project.' })
    }
    if (imageUrl && (!URL_PATTERN.test(imageUrl) || imageUrl.length > 1000)) {
      return json(res, 400, { error: 'The image link must be a valid HTTPS URL.' })
    }
    const entry = {
      id: randomUUID(), name, email, title, summary, sourceType, sourceUrl,
      imageUrl, status: 'pending', createdAt: new Date().toISOString(),
    }
    submissions.unshift(entry)
    await writeStoredJson(KEY, submissions.slice(0, 500))
    return json(res, 201, { ok: true, message: 'Thanks. Your project is in the review queue.' })
  } catch {
    return json(res, 503, { error: 'Build in Public submissions are temporarily unavailable.' })
  }
}
