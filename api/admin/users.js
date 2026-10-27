import {
  assertAuthConfig,
  createPasswordHash,
  json,
  readStoredJson,
  recordAudit,
  requireMethod,
  requireSameOrigin,
  requireSession,
  setSecurityHeaders,
  writeStoredJson,
} from '../../server/security.js'

const USERS_KEY = 'bm-admin:users:v1'
const ROLES = new Set(['super_admin', 'content_editor', 'event_organizer', 'evaluator', 'read_only'])
const USERNAME = /^[A-Za-z0-9._@-]{1,64}$/

export default async function handler(req, res) {
  setSecurityHeaders(res)
  const actor = await requireSession(req, res, ['super_admin'])
  if (!actor) return

  try {
    await assertAuthConfig()
    if (req.method === 'GET') {
      const envUsers = JSON.parse(process.env.ADMIN_USERS_JSON || '[]')
      const managedUsers = await readStoredJson(USERS_KEY, [])
      const users = [...new Map([...envUsers, ...managedUsers]
        .filter(user => user && user.active !== false)
        .map(user => [user.username.toLowerCase(), { username: user.username, role: user.role, managed: managedUsers.includes(user) }])).values()]
      return json(res, 200, { users })
    }
    if (!['POST', 'DELETE'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST, DELETE')
      return json(res, 405, { error: 'Method not allowed' })
    }
    if (!requireSameOrigin(req, res)) return
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const username = String(body.username || '').trim()
    const managedUsers = await readStoredJson(USERS_KEY, [])
    if (!Array.isArray(managedUsers)) return json(res, 503, { error: 'Account storage is invalid' })

    if (req.method === 'POST') {
      const role = String(body.role || '')
      const password = String(body.password || '')
      if (!USERNAME.test(username)) return json(res, 400, { error: 'Enter a valid email or username (1–64 letters, numbers, dots, underscores, or hyphens).' })
      if (!ROLES.has(role)) return json(res, 400, { error: 'Choose a supported admin role.' })
      if (password.length < 14 || password.length > 1024) return json(res, 400, { error: 'Set an initial passphrase of at least 14 characters (a few memorable words work well).' })
      const allUsers = JSON.parse(process.env.ADMIN_USERS_JSON || '[]')
      if ([...allUsers, ...managedUsers].some(user => user.username?.toLowerCase() === username.toLowerCase() && user.active !== false)) {
        return json(res, 409, { error: 'That account already exists.' })
      }
      managedUsers.push({ username, role, passwordHash: await createPasswordHash(password), active: true, createdAt: new Date().toISOString() })
      await writeStoredJson(USERS_KEY, managedUsers)
      await recordAudit({ actor: actor.username, role: actor.role, action: 'admin.user_created', contentType: 'adminUser', documentId: username })
      return json(res, 201, { user: { username, role } })
    }

    const envUsers = JSON.parse(process.env.ADMIN_USERS_JSON || '[]')
    const index = managedUsers.findIndex(user => user.username?.toLowerCase() === username.toLowerCase())
    if (index < 0 || envUsers.some(user => user.username?.toLowerCase() === username.toLowerCase())) {
      return json(res, 404, { error: 'Managed account not found.' })
    }
    if (username.toLowerCase() === actor.username.toLowerCase()) return json(res, 400, { error: 'You cannot remove your own account.' })
    if (managedUsers[index].role === 'super_admin') {
      const remainingSuperAdmins = [
        ...envUsers.filter(user => user.active !== false),
        ...managedUsers.filter((user, managedIndex) => managedIndex !== index && user.active !== false),
      ].filter(user => user.role === 'super_admin')
      if (remainingSuperAdmins.length === 0) {
        return json(res, 400, { error: 'You cannot remove the last Super Admin account.' })
      }
    }
    managedUsers.splice(index, 1)
    await writeStoredJson(USERS_KEY, managedUsers)
    await recordAudit({ actor: actor.username, role: actor.role, action: 'admin.user_removed', contentType: 'adminUser', documentId: username })
    return json(res, 200, { ok: true })
  } catch (error) {
    const message = error?.message === 'Upstash storage is not configured' ? error.message : 'Account request failed. Check server configuration and try again.'
    return json(res, 503, { error: message })
  }
}
