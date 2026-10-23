import { createClient } from '@sanity/client'
import { json, requireMethod, setSecurityHeaders } from '../../server/security.js'

const COLLECTIONS = {
  siteEvent: `*[_type == "siteEvent" && publicationStatus == "published"] | order(startDate desc) {
    _id, title, type, status, startDate, endDate, registrationLink, ruleBookLink,
    "image": coalesce(image.asset->url, image), footerText,
    "details": details[]{sectionTitle, tag, ruleBookLink, submissionLink, documentLink, content, isSubmissionSection},
    "problemStatements": problemStatements[]{text, url},
    "id": coalesce(eventId, slug.current, _id)
  }[0...100]`,
  siteResult: `*[_type == "siteResult" && publicationStatus == "published"] | order(_updatedAt desc) {
    _id, eventId, eyebrow, title, subtitle,
    "top3": top3[]{rank, rankTitle, badgeIcon, teamName, projectTitle, description, score},
    "honorableMentions": honorableMentions[]{id, rankNumber, teamName, projectTitle, tag}
  }[0...100]`,
  siteAnnouncement: `*[_type == "siteAnnouncement" && publicationStatus == "published"] | order(startsAt desc) {
    _id, title, body, startsAt, endsAt
  }[0...100]`,
}

function publicClient() {
  return createClient({
    projectId: process.env.SANITY_PROJECT_ID || '94wv2qdl',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-01-01',
    useCdn: true,
  })
}

export default async function handler(req, res) {
  setSecurityHeaders(res)
  if (!requireMethod(req, res, 'GET')) return
  const type = Array.isArray(req.query?.type) ? req.query.type[0] : req.query?.type
  if (!Object.hasOwn(COLLECTIONS, type)) return json(res, 400, { error: 'Unsupported public collection' })
  try {
    const client = publicClient()
    const [documents, count] = await Promise.all([
      client.fetch(COLLECTIONS[type]),
      client.fetch(`count(*[_type == $type])`, { type }),
    ])
    return json(res, 200, { managed: count > 0, documents })
  } catch {
    return json(res, 503, { error: 'Public content is temporarily unavailable' })
  }
}
