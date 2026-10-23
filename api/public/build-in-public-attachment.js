import { randomUUID } from 'node:crypto'
import { checkPublicSubmissionLimit, json, readStoredJson, requireSameOrigin, setSecurityHeaders, writeStoredJson } from '../../server/security.js'

const CHUNK_BYTES = 512 * 1024
const MAX_FILE_BYTES = 5 * 1024 * 1024
const FILE_TYPES = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

function bodyOf(req) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {}
}

export default async function handler(req, res) {
  setSecurityHeaders(res)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { error: 'Method not allowed' })
  }
  if (!requireSameOrigin(req, res)) return
  try {
    const body = bodyOf(req)
    if (body.action === 'init') {
      if (!(await checkPublicSubmissionLimit(req))) return json(res, 429, { error: 'Too many applications. Please try again later.' })
      const fileName = String(body.fileName || '').trim().slice(0, 180)
      const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
      const mimeType = FILE_TYPES[extension]
      const size = Number(body.size)
      if (!mimeType || !Number.isInteger(size) || size < 1 || size > MAX_FILE_BYTES) {
        return json(res, 400, { error: 'Attach a PDF, DOC, or DOCX file up to 5 MB.' })
      }
      const uploadId = randomUUID()
      const totalChunks = Math.ceil(size / CHUNK_BYTES)
      await writeStoredJson(`bm-bip:upload:${uploadId}:meta`, { fileName, mimeType, size, totalChunks }, 3600)
      return json(res, 201, { uploadId, chunkBytes: CHUNK_BYTES, totalChunks })
    }

    if (body.action !== 'chunk') return json(res, 400, { error: 'Invalid upload action.' })
    const uploadId = String(body.uploadId || '')
    const index = Number(body.index)
    const data = String(body.data || '')
    if (!/^[\da-f-]{36}$/i.test(uploadId)) return json(res, 400, { error: 'Invalid upload session.' })
    const metadata = await readStoredJson(`bm-bip:upload:${uploadId}:meta`, null)
    if (!metadata || !Number.isInteger(index) || index < 0 || index >= metadata.totalChunks) {
      return json(res, 400, { error: 'Upload session expired. Choose the file again.' })
    }
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) {
      return json(res, 400, { error: 'Invalid file data.' })
    }
    const expectedBytes = Math.min(CHUNK_BYTES, metadata.size - index * CHUNK_BYTES)
    if (Buffer.from(data, 'base64').length !== expectedBytes) return json(res, 400, { error: 'File chunk size did not match.' })
    await writeStoredJson(`bm-bip:upload:${uploadId}:chunk:${index}`, data, 3600)
    return json(res, 200, { ok: true })
  } catch {
    return json(res, 503, { error: 'Attachment upload is temporarily unavailable.' })
  }
}
