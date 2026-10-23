import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createPasswordHash, createSession, readSession, verifyPassword } from '../server/security.js'

const originalEnvironment = {
  SESSION_SECRET: process.env.SESSION_SECRET,
  ADMIN_USERS_JSON: process.env.ADMIN_USERS_JSON,
}

let passwordHash
let adminUser

before(async () => {
  process.env.SESSION_SECRET = 'test-only-session-secret-with-at-least-32-characters'
  passwordHash = await createPasswordHash('correct horse battery staple 42')
  adminUser = { username: 'test-admin', role: 'super_admin', passwordHash }
  process.env.ADMIN_USERS_JSON = JSON.stringify([adminUser])
})

after(() => {
  if (originalEnvironment.SESSION_SECRET === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = originalEnvironment.SESSION_SECRET
  if (originalEnvironment.ADMIN_USERS_JSON === undefined) delete process.env.ADMIN_USERS_JSON
  else process.env.ADMIN_USERS_JSON = originalEnvironment.ADMIN_USERS_JSON
})

test('password hashes verify only the matching password', async () => {
  assert.match(passwordHash, /^scrypt\$[a-f\d]{64}\$[a-f\d]{128}$/)
  assert.equal(await verifyPassword('correct horse battery staple 42', passwordHash), true)
  assert.equal(await verifyPassword('incorrect password', passwordHash), false)
  assert.equal(await verifyPassword('anything', 'not-a-hash'), false)
})

test('session cookies are signed and resolve to the configured role', () => {
  const token = createSession(adminUser)
  assert.deepEqual(readSession({ headers: { cookie: `__Host-bm_admin=${token}` } }), {
    username: 'test-admin', role: 'super_admin',
  })
})

test('tampering with a session invalidates it', () => {
  const token = createSession(adminUser)
  const [payload, signature] = token.split('.')
  const alteredSignature = `${signature.slice(0, -1)}${signature.endsWith('a') ? 'b' : 'a'}`
  const changed = `${payload}.${alteredSignature}`
  assert.equal(readSession({ headers: { cookie: `__Host-bm_admin=${changed}` } }), null)
})

test('credential or role changes revoke existing sessions', () => {
  const token = createSession(adminUser)
  process.env.ADMIN_USERS_JSON = JSON.stringify([{ ...adminUser, role: 'content_editor' }])
  assert.equal(readSession({ headers: { cookie: `__Host-bm_admin=${token}` } }), null)
})

test('password hashing rejects weak passwords', async () => {
  await assert.rejects(() => createPasswordHash('short'), /between 14 and 1024 characters/)
})
