import { randomUUID } from 'node:crypto'
import { getBuildInPublicProjects } from '../../server/build-in-public-projects.js'
import { checkPublicSubmissionLimit, json, readStoredJson, requireMethod, requireSameOrigin, setSecurityHeaders, writeStoredJson } from '../../server/security.js'

const KEY = 'bm-bip:submissions:v1'
const PROFILE_LINKS = {
  github: value => /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+\/?$/i.test(value),
  linkedin: value => /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?$/i.test(value),
}

function bodyOf(req) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {}
}

function text(value, max) {
  return String(value || '').trim().slice(0, max)
}

export default async function handler(req, res) {
  setSecurityHeaders(res)
  try {
    if (req.method === 'GET') {
      const projects = await getBuildInPublicProjects()
      return json(res, 200, { projects: projects.filter(project => project.status === 'published') })
    }
    if (!requireMethod(req, res, 'POST') || !requireSameOrigin(req, res)) return
    const body = bodyOf(req)
    if (body.website) return json(res, 200, { ok: true })
    if (!(await checkPublicSubmissionLimit(req))) return json(res, 429, { error: 'Too many applications. Please try again later.' })

    const fullName = text(body.fullName, 100)
    const studentEmail = text(body.studentEmail, 160).toLowerCase()
    const githubProfile = text(body.githubProfile, 300)
    const linkedinProfile = text(body.linkedinProfile, 300)
    const motivation = text(body.motivation, 2000)
    const contributionIdea = text(body.contributionIdea, 2000)
    const projectId = text(body.projectId, 64)
    const project = (await getBuildInPublicProjects()).find(item => item.id === projectId && item.status === 'published')
    if (!project) return json(res, 400, { error: 'This project is no longer accepting contribution requests. Refresh the page and choose an open project.' })
    if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      return json(res, 400, { error: 'Enter your full name and a valid student email.' })
    }
    if (!PROFILE_LINKS.github(githubProfile) || !PROFILE_LINKS.linkedin(linkedinProfile)) {
      return json(res, 400, { error: 'Enter a valid GitHub profile and LinkedIn profile URL.' })
    }
    if (motivation.length < 20 || contributionIdea.length < 20) {
      return json(res, 400, { error: 'Please provide at least 20 characters for both written responses.' })
    }

    let attachment = null
    const uploadId = text(body.uploadId, 40)
    if (uploadId) {
      if (!/^[\da-f-]{36}$/i.test(uploadId)) return json(res, 400, { error: 'The attachment upload is invalid.' })
      const uploadKey = `bm-bip:upload:${uploadId}:meta`
      const metadata = await readStoredJson(uploadKey, null)
      if (!metadata || metadata.submitted || !metadata.fileName || !metadata.totalChunks) {
        return json(res, 400, { error: 'The attachment upload expired. Please select the file again.' })
      }
      for (let index = 0; index < metadata.totalChunks; index += 1) {
        const chunkKey = `bm-bip:upload:${uploadId}:chunk:${index}`
        const chunk = await readStoredJson(chunkKey, null)
        if (!chunk) return json(res, 400, { error: 'The attachment is incomplete. Please select the file again.' })
        await writeStoredJson(chunkKey, chunk, 60 * 60 * 24 * 90)
      }
      attachment = { uploadId, fileName: metadata.fileName, mimeType: metadata.mimeType, size: metadata.size, totalChunks: metadata.totalChunks }
      await writeStoredJson(uploadKey, { ...metadata, submitted: true }, 60 * 60 * 24 * 90)
    }

    const submissions = await readStoredJson(KEY, [])
    if (!Array.isArray(submissions)) throw new Error('Application storage is invalid')
    const application = {
      id: randomUUID(), projectId: project.id, project: project.title, fullName, studentEmail, githubProfile,
      linkedinProfile, motivation, contributionIdea, attachment,
      status: 'pending', createdAt: new Date().toISOString(),
    }
    submissions.unshift(application)
    await writeStoredJson(KEY, submissions.slice(0, 500))
    return json(res, 201, { ok: true, message: 'Your contribution request has been sent for review.' })
  } catch {
    return json(res, 503, { error: 'Contribution requests are temporarily unavailable.' })
  }
}
