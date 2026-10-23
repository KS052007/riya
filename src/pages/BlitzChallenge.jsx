import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CodePlayground from '../components/CodePlayground'
import {
  RiRadioButtonLine, RiCheckboxMultipleLine, RiCodeSSlashLine,
  RiLockLine, RiLockUnlockLine, RiCheckLine, RiCloseLine,
  RiLightbulbLine, RiTrophyLine, RiThumbUpLine, RiFlashlightLine,
  RiSearchEyeLine, RiArrowLeftLine, RiFileList3Line
} from 'react-icons/ri'
import PageTransition from '../components/PageTransition'
import { client } from '../lib/sanity'

const DIFF_META = {
  easy:   { label: 'Easy',   color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  hard:   { label: 'Hard',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlitzChallenge() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})     
  const [submitted, setSubmitted] = useState({})  
  const [revealUnlocked, setRevealUnlocked] = useState(false)
  const [revealCountdown, setRevealCountdown] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    async function fetchChallenge() {
      try {
        const query = `*[_type == "challenge" && slug.current == $slug && (!defined(publicationStatus) || publicationStatus == "published")][0]{
          _id, title, slug, publishedAt, difficulty, revealAfterHours,
          "categoryTitle": category->title,
          questions
        }`
        const data = await client.fetch(query, { slug })
        setChallenge(data)
      } catch (err) {
        console.error('Failed to fetch challenge:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchChallenge()
  }, [slug])

  useEffect(() => {
    if (!challenge) return
    const publishTime = new Date(challenge.publishedAt).getTime()
    const hours = challenge.revealAfterHours ?? 14
    const revealTime = publishTime + hours * 60 * 60 * 1000

    function tick() {
      const now = Date.now()
      if (now >= revealTime) {
        setRevealUnlocked(true)
        setRevealCountdown('')
        return
      }
      setRevealUnlocked(false)
      const diff = revealTime - now
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRevealCountdown(`${h}h ${m}m ${s}s`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [challenge])

  const handleSelectMCQ = useCallback((qIdx, optIdx) => {
    if (submitted[qIdx]) return
    setAnswers(prev => ({ ...prev, [qIdx]: [optIdx] }))
  }, [submitted])

  const handleToggleMSQ = useCallback((qIdx, optIdx) => {
    if (submitted[qIdx]) return
    setAnswers(prev => {
      const current = prev[qIdx] || []
      const next = current.includes(optIdx)
        ? current.filter(i => i !== optIdx)
        : [...current, optIdx]
      return { ...prev, [qIdx]: next }
    })
  }, [submitted])

  const handleSubmit = useCallback((qIdx) => {
    setSubmitted(prev => ({ ...prev, [qIdx]: true }))
  }, [])

  if (loading) {
    return (
      <PageTransition className="page blitz-fs-page">
        <div className="blitz-detail-loading" style={{ margin: 'auto' }}>
          <div className="blitz-skeleton-card" style={{ height: 120, width: 400 }} />
        </div>
      </PageTransition>
    )
  }

  if (!challenge) {
    return (
      <PageTransition className="page blitz-fs-page">
        <div className="blitz-empty" style={{ margin: 'auto' }}>
          <div className="blitz-empty-icon"><RiSearchEyeLine size={48} /></div>
          <h3>Challenge not found</h3>
          <p>This challenge might have been removed or the link is incorrect.</p>
          <button onClick={() => navigate('/blitz')} className="blitz-back-link"><RiArrowLeftLine size={14} /> Back to Blitz</button>
        </div>
      </PageTransition>
    )
  }

  const questions = challenge.questions || []
  const totalQuestions = questions.length
  
  // Calculate completion state
  const mcqMsqQuestions = questions.filter(q => q._type === 'mcq' || q._type === 'msq')
  const totalAnswerable = mcqMsqQuestions.length
  const totalSubmitted = mcqMsqQuestions.filter(q => submitted[questions.indexOf(q)]).length
  const totalCorrect = mcqMsqQuestions.filter(q => {
    const realIdx = questions.indexOf(q)
    if (!submitted[realIdx]) return false
    const selected = answers[realIdx] || []
    const correctIndices = q.options.map((o, oi) => (o.isCorrect ? oi : -1)).filter(x => x !== -1)
    return selected.length === correctIndices.length && selected.every(s => correctIndices.includes(s))
  }).length
  
  const allDone = totalSubmitted === totalAnswerable && totalAnswerable > 0
  const activeQuestion = questions[activeIdx]

  return (
    <PageTransition className="page blitz-fs-page">
      {/* Ambient Background */}
      <div className="blitz-ambient-bg">
        <div className="blitz-ambient-orb" />
      </div>

      {/* Top Application Header */}
      <div className="blitz-fs-header">
        <div className="blitz-fs-left-actions">
          <button onClick={() => navigate('/blitz')} className="blitz-fs-nav-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent' }}>
            <RiArrowLeftLine /> Back
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{challenge.title}</span>
        </div>

        <div className="blitz-fs-center-actions">
          <button 
            className="blitz-fs-nav-btn"
            disabled={activeIdx === 0}
            onClick={() => setActiveIdx(prev => Math.max(0, prev - 1))}
          >
            &lt; Prev
          </button>
          <span style={{ fontSize: '0.85rem', color: '#a0a0a0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RiFileList3Line /> {activeIdx + 1} / {totalQuestions}
          </span>
          <button 
            className="blitz-fs-nav-btn"
            disabled={activeIdx === totalQuestions - 1}
            onClick={() => setActiveIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
          >
            Next &gt;
          </button>
        </div>

        <div className="blitz-fs-right-actions">
          {allDone && (
            <span style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
              <RiTrophyLine /> {totalCorrect}/{totalAnswerable} Score
            </span>
          )}
        </div>
      </div>

      {/* Main Split Workspace */}
      {activeQuestion ? (
        <div className="blitz-fs-workspace">
          
          {/* ── Left Pane ── */}
          <div className="blitz-pane-left">
            <QuestionLeftPane 
              question={activeQuestion} 
              index={activeIdx} 
              revealUnlocked={revealUnlocked}
              revealCountdown={revealCountdown}
            />
          </div>

          {/* ── Right Pane ── */}
          <div className="blitz-pane-right">
            <QuestionRightPane 
              question={activeQuestion}
              index={activeIdx}
              selected={answers[activeIdx] || []}
              isSubmitted={!!submitted[activeIdx]}
              onSelectMCQ={handleSelectMCQ}
              onToggleMSQ={handleToggleMSQ}
              onSubmit={handleSubmit}
            />
          </div>

        </div>
      ) : (
        <div style={{ margin: 'auto', color: '#666' }}>No questions available.</div>
      )}
    </PageTransition>
  )
}

/* ──────────── Left Pane Component ──────────── */
function QuestionLeftPane({ question, index, revealUnlocked, revealCountdown }) {
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const q = question
  const isMCQ = q._type === 'mcq'
  const isMSQ = q._type === 'msq'
  const isCoding = q._type === 'coding'

  const typeLabel = isMCQ ? 'MCQ' : isMSQ ? 'MSQ' : 'Coding'
  const typeIcon = isMCQ ? <RiRadioButtonLine size={14} /> : isMSQ ? <RiCheckboxMultipleLine size={14} /> : <RiCodeSSlashLine size={14} />

  // Reset hints when question changes
  useEffect(() => setHintsRevealed(0), [index])

  return (
    <>
      {/* Question header */}
      <div className="blitz-q-header">
        <span className="blitz-q-num" style={{ fontSize: '1.25rem' }}>{index + 1}.</span>
        <span className="blitz-q-type" style={{ marginLeft: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
          {typeIcon} {typeLabel}
        </span>
        {isMSQ && <span className="blitz-q-hint-text" style={{ marginLeft: '1rem' }}>Select all that apply</span>}
      </div>

      {/* Question text */}
      <div className="blitz-q-text" style={{ fontSize: '1.05rem', lineHeight: 1.6, marginTop: '1rem' }}>
        {q.questionText}
      </div>

      {/* Hints */}
      {isCoding && q.hints?.length > 0 && (
        <div className="blitz-hints" style={{ marginTop: '2rem' }}>
          <button
            className="blitz-hint-toggle cursor-target"
            onClick={() => setHintsRevealed(prev => Math.min(prev + 1, q.hints.length))}
            disabled={hintsRevealed >= q.hints.length}
          >
            <RiLightbulbLine style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {hintsRevealed < q.hints.length
              ? `Show Hint ${hintsRevealed + 1} of ${q.hints.length}`
              : 'All hints revealed'}
          </button>
          <AnimatePresence>
            {q.hints.slice(0, hintsRevealed).map((hint, hi) => (
              <motion.div
                key={hi}
                className="blitz-hint-item"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <span className="blitz-hint-label">Hint {hi + 1}:</span> {hint}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Explanation (time-locked) */}
      {q.explanation && (
        <div className="blitz-explanation-wrap" style={{ marginTop: '3rem' }}>
          {revealUnlocked ? (
            <motion.div
              className="blitz-explanation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="blitz-explanation-label"><RiLightbulbLine style={{ verticalAlign: 'middle', marginRight: 4 }} /> Explanation</div>
              <p>{q.explanation}</p>
            </motion.div>
          ) : (
            <div className="blitz-explanation-locked" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 8 }}>
              <RiLockLine style={{ verticalAlign: 'middle', marginRight: 4, color: '#fbbf24' }} /> 
              Explanations unlock in <strong style={{ color: '#fbbf24' }}>{revealCountdown}</strong>
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* ──────────── Right Pane Component ──────────── */
function QuestionRightPane({ question, index, selected, isSubmitted, onSelectMCQ, onToggleMSQ, onSubmit }) {
  const q = question
  const isMCQ = q._type === 'mcq'
  const isMSQ = q._type === 'msq'
  const isCoding = q._type === 'coding'

  // Check correctness
  let isCorrect = false
  if (isSubmitted && (isMCQ || isMSQ)) {
    const correctIndices = q.options.map((o, oi) => (o.isCorrect ? oi : -1)).filter(x => x !== -1)
    isCorrect = selected.length === correctIndices.length && selected.every(s => correctIndices.includes(s))
  }

  if (isCoding) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
        {q.codeSnippet ? (
          <CodePlayground 
            key={`cp-${index}`} // Force remount if question changes
            initialCode={q.codeSnippet.code || ''} 
            language={q.codeSnippet.language || 'javascript'} 
          />
        ) : (
          <div style={{ margin: 'auto', color: '#666' }}>No code editor required.</div>
        )}
      </div>
    )
  }

  // MCQ / MSQ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <motion.div 
        className="blitz-q-options"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {q.options?.map((opt, oi) => {
          const isSelected = selected.includes(oi)
          const optCorrect = opt.isCorrect
          let optClass = 'blitz-q-opt'
          if (isSelected) optClass += ' selected'
          if (isSubmitted) {
            if (optCorrect) optClass += ' correct-opt'
            else if (isSelected && !optCorrect) optClass += ' wrong-opt'
          }

          return (
            <motion.button
              key={oi}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className={`${optClass} cursor-target`}
              onClick={() => isMCQ ? onSelectMCQ(index, oi) : onToggleMSQ(index, oi)}
              disabled={isSubmitted}
            >
              <span className="blitz-q-opt-marker">
                {isMCQ ? (
                  <span className={`blitz-radio ${isSelected ? 'filled' : ''}`} />
                ) : (
                  <span className={`blitz-checkbox ${isSelected ? 'checked' : ''}`}>{isSelected && '✓'}</span>
                )}
              </span>
              <span className="blitz-q-opt-text">{opt.text}</span>
              {isSubmitted && optCorrect && <span className="blitz-q-opt-mark">✓</span>}
              {isSubmitted && isSelected && !optCorrect && <span className="blitz-q-opt-mark wrong">✗</span>}
            </motion.button>
          )
        })}
      </motion.div>

      {!isSubmitted && (
        <button
          className="blitz-q-submit cursor-target"
          disabled={selected.length === 0}
          onClick={() => onSubmit(index)}
        >
          Submit Answer
        </button>
      )}

      {isSubmitted && (
        <motion.div
          className={`blitz-q-feedback ${isCorrect ? 'correct' : 'incorrect'}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          {isCorrect ? <><RiCheckLine style={{ verticalAlign: 'middle', marginRight: 4 }} /> Correct!</> : <><RiCloseLine style={{ verticalAlign: 'middle', marginRight: 4 }} /> Incorrect</>}
        </motion.div>
      )}
    </div>
  )
}
