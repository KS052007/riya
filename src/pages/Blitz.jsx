import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiFlashlightFill, RiRadioButtonLine, RiCheckboxMultipleLine, RiCodeSSlashLine, RiBrainLine } from 'react-icons/ri'
import PageTransition from '../components/PageTransition'
import { client } from '../lib/sanity'

const DIFFICULTY_META = {
  easy:   { label: 'Easy',   color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  hard:   { label: 'Hard',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const TYPE_ICON = {
  mcq: <RiRadioButtonLine size={12} />,
  msq: <RiCheckboxMultipleLine size={12} />,
  coding: <RiCodeSSlashLine size={12} />,
}

function getQuestionTypes(questions) {
  if (!questions?.length) return []
  const types = new Set()
  questions.forEach(q => { if (q._type) types.add(q._type) })
  return Array.from(types)
}

function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Blitz() {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const query = `*[_type == "challenge" && (!defined(publicationStatus) || publicationStatus == "published")] | order(publishedAt desc) {
          _id, title, slug, publishedAt, difficulty, revealAfterHours,
          "categoryTitle": category->title,
          "questionCount": count(questions),
          "questions": questions[]{ _type }
        }`
        const data = await client.fetch(query)
        setChallenges(data)
      } catch (err) {
        console.error('Failed to fetch challenges:', err)
        setChallenges([])
      } finally {
        setLoading(false)
      }
    }
    fetchChallenges()
  }, [])

  const todayChallenge = challenges.find(c => isToday(c.publishedAt))
  const pastChallenges = challenges.filter(c => !isToday(c.publishedAt))

  return (
    <PageTransition className="page blitz-page">
      <div className="blitz-container">
        {/* ── Hero ── */}
        <motion.div
          className="blitz-hero"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="blitz-hero-icon"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 140 }}
          >
            <RiFlashlightFill />
          </motion.div>
          <h1 className="blitz-hero-title">
            Daily <span className="blitz-gradient">Blitz</span>
          </h1>
          <p className="blitz-hero-sub">
            Sharpen your skills with daily challenges.
          </p>
        </motion.div>

        {/* ── Loading ── */}
        {loading && (
          <div className="blitz-loading">
            {[1, 2, 3].map(i => (
              <div key={i} className="blitz-skeleton-card" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}

        {/* ── Today's Challenge ── */}
        {!loading && todayChallenge && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="blitz-section-label">
              <span className="blitz-pulse" />
              Today's Challenge
            </div>
            <Link
              to={`/blitz/${todayChallenge.slug?.current}`}
              className="blitz-today-card cursor-target"
            >
              <div className="blitz-today-glow" />
              <div className="blitz-today-content">
                <div className="blitz-today-top">
                  <DifficultyBadge difficulty={todayChallenge.difficulty} />
                  {todayChallenge.categoryTitle && (
                    <span className="blitz-cat-tag">{todayChallenge.categoryTitle}</span>
                  )}
                </div>
                <h2 className="blitz-today-title">{todayChallenge.title}</h2>
                <div className="blitz-today-meta">
                  <span>{todayChallenge.questionCount || 0} questions</span>
                  <span className="blitz-today-types">
                    {getQuestionTypes(todayChallenge.questions).map(t => (
                      <span key={t} className="blitz-type-chip">
                        {TYPE_ICON[t] || ''} {t.toUpperCase()}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="blitz-today-cta">
                  Start Challenge
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── Past Challenges ── */}
        {!loading && pastChallenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="blitz-section-label" style={{ marginTop: '3rem' }}>
              Past Challenges
            </div>
            <div className="blitz-grid">
              {pastChallenges.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '40px' }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.3) }}
                >
                  <Link
                    to={`/blitz/${c.slug?.current}`}
                    className="blitz-card cursor-target"
                  >
                    <div className="blitz-card-top">
                      <DifficultyBadge difficulty={c.difficulty} size="sm" />
                      <span className="blitz-card-date">{formatDate(c.publishedAt)}</span>
                    </div>
                    <h3 className="blitz-card-title">{c.title}</h3>
                    <div className="blitz-card-footer">
                      {c.categoryTitle && (
                        <span className="blitz-cat-tag sm">{c.categoryTitle}</span>
                      )}
                      <span className="blitz-card-count">
                        {c.questionCount || 0} Q{(c.questionCount || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Empty State ── */}
        {!loading && challenges.length === 0 && (
          <motion.div
            className="blitz-empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="blitz-empty-icon"><RiBrainLine size={48} /></div>
            <h3>No challenges yet</h3>
            <p>The first Blitz challenge is being crafted. Check back soon!</p>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}

function DifficultyBadge({ difficulty, size }) {
  const meta = DIFFICULTY_META[difficulty] || DIFFICULTY_META.medium
  return (
    <span
      className={`blitz-diff-badge ${size === 'sm' ? 'sm' : ''}`}
      style={{ color: meta.color, background: meta.bg, borderColor: meta.color }}
    >
      {meta.label}
    </span>
  )
}
